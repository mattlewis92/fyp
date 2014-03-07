<?php

namespace FYP\API;

use Doctrine\MongoDB\Connection;
use Doctrine\ODM\MongoDB\Configuration;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Mapping\Driver\AnnotationDriver;

class App {

    private $slim = null;

    private $callbackPrefix;

    private $publicDirectory;

    private $dm;

    public function __construct($publicDirectory = null) {

        if ($publicDirectory) {
            session_cache_limiter(false);
            session_start();
            $this->slim = new \Slim\Slim();
            $this->callbackPrefix = 'http://' . $this->slim->request->getHost() . '/api/';
            $this->publicDirectory = $publicDirectory;
        }

        $this->initDatabase();
    }

    private function addRoutes() {

        $app = $this;

        $this->slim->get('/api/social/linkedin', function() use($app) {

            $callback = $app->callbackPrefix . 'social/linkedin';

            $config = array(
                'api_key'       => '774ad8zngowivw',
                'api_secret'    => '0buDs7MCjvmOe6ue',
                'callback_url' => $callback
            );

            $linkedin = new \LinkedIn\LinkedIn($config);

            if ($app->slim->request->params('code') == NULL && empty($_SESSION['linkedin_token'])) {

                $loginURL = $linkedin->getLoginUrl(array('r_fullprofile', 'r_emailaddress', 'r_network', 'r_contactinfo'));
                $app->slim->redirect($loginURL);

            } elseif ($app->slim->request->params('code') != NULL) {

                $token = $linkedin->getAccessToken($app->slim->request->params('code'));
                $_SESSION['linkedin_token'] = $token;
                $app->slim->redirect('/?linkedin=authenticated');

            } else if (isset($_SESSION['linkedin_token'])) {

                $token = $_SESSION['linkedin_token'];
                $linkedin->setAccessToken($token);
                try {
                    $result = $linkedin->get('/people/url=' . urlencode($app->slim->request->params('profile_url')) . ':(first-name,last-name,headline,location:(name),industry,summary,specialties,positions,picture-url,interests,skills,three-current-positions,three-past-positions)');
                } catch (\Exception $e) {
                    $app->slim->response->setStatus(400);
                    $result = array('error' => $e->getMessage());
                }

                echo json_encode($result);

            } else {
                throw new \Exception('Could not obtain linkedin access token');
            }

        });

        $this->slim->get('/api/social/twitter', function() use($app) {
            $config = array(
                'consumer_key'       => '7qpUo15t8QY2J39nYEGjGw',
                'consumer_secret'    => 'GYcByPjEznXPsB2uc1jiULaWo88IjgraYF92RGEpiN4',
                'oauth_access_token'        => '130212096-rtTfHV2k1F2WMbkx3VkZUYvGfK160zSzv4JB2gyi',
                'oauth_access_token_secret'       => 'ggxhrO4AGzMBRbMQkaa0N7oz1D5XByvJTMrIytdyMtwgn'
            );

            $twitter = new \TwitterAPIExchange($config);
            $user = json_decode($twitter
                ->setGetfield('?screen_name=' . urlencode($app->slim->request->params('screen_name')) . '&count=200')
                ->buildOauth('https://api.twitter.com/1.1/users/show.json', 'GET')
                ->performRequest(), true);

            if (isset($user['errors'])) {
                $app->slim->response->setStatus(400);
                $result = array('error' => $user['errors'][0]['message']);
            } else {
                $tweets = json_decode(file_get_contents('https://api.peerindex.com/1/actor/topic?api_key=ped3jb34yw7mc3bucn8jfyjx&twitter_screen_name=' . urlencode($this->slim->request->params('screen_name'))), true);

                $result = array(
                    'user' => $user,
                    'peerindex' => $tweets
                );
            }

            echo json_encode($result);

        });

        $this->slim->get('.+', function() use($app) {
            echo file_get_contents($app->publicDirectory . "/views/index.html");
        });
    }

    private function initDatabase() {
        $connection = new Connection();

        $config = new Configuration();
        $config->setProxyDir(__DIR__ . '/../Database/Proxies');
        $config->setProxyNamespace('FYP\Database\Proxies');
        $config->setHydratorDir(__DIR__ . '/../Database/Hydrators');
        $config->setHydratorNamespace('FYP\Database\Hydrators');
        $config->setDefaultDB('fyp');
        $config->setMetadataDriverImpl(AnnotationDriver::create(__DIR__ . '/../Database/Documents'));

        AnnotationDriver::registerAnnotationClasses();

        $this->dm = DocumentManager::create($connection, $config);
    }

    public function getDoctrineManager() {
        return $this->dm;
    }

    public function run() {
        $this->addRoutes();
        $this->slim->run();
    }


}