<?php

namespace FYP\API;

class App {

    private $slim;

    private $callbackPrefix;

    public function __construct() {
        session_cache_limiter(false);
        session_start();
        $this->slim = new \Slim\Slim();
        $this->callbackPrefix = 'http://' . $this->slim->request->getHost() . '/api/';
    }

    private function addRoutes() {

        $app = $this;
        $config = \FYP\APP::getDI()['config'];

        $this->slim->get('/api/social/linkedin', function() use($app, $config) {

            $linkedInConfig = $config->get('linkedin');
            $linkedInConfig['callback_url'] = $app->callbackPrefix . 'social/linkedin';

            $linkedin = new \LinkedIn\LinkedIn($linkedInConfig);

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

        $this->slim->get('/api/social/twitter', function() use($app, $config) {

            $twitter = new \TwitterAPIExchange($config->get('twitter'));
            $user = json_decode($twitter
                ->setGetfield('?screen_name=' . urlencode($app->slim->request->params('screen_name')) . '&count=200')
                ->buildOauth('https://api.twitter.com/1.1/users/show.json', 'GET')
                ->performRequest(), true);

            if (isset($user['errors'])) {
                $app->slim->response->setStatus(400);
                $result = array('error' => $user['errors'][0]['message']);
            } else {
                $tweets = json_decode(file_get_contents('https://api.peerindex.com/1/actor/topic?api_key=' . $config->get('peerindex')['api_key'] . '&twitter_screen_name=' . urlencode($this->slim->request->params('screen_name'))), true);

                $result = array(
                    'user' => $user,
                    'peerindex' => $tweets
                );
            }

            echo json_encode($result);

        });

        $this->slim->get('.+', function() use($app, $config) {
            if (isset($_SESSION['linkedin_token']) && !$app->slim->request->get('linkedin')) {
                $app->slim->redirect('/?linkedin=authenticated');
            } else {
                echo file_get_contents($config->get('publicDir') . 'index.html');
            }

        });
    }

    public function run() {
        $this->addRoutes();
        $this->slim->run();
    }


}