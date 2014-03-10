<?php

namespace FYP\API\Controller;

use \FYP\Utility\BaseController;

class Social extends BaseController {

    public function getTwitterProfileAction() {
        $config = \FYP\APP::getDI()['config'];

        $twitter = new \TwitterAPIExchange($config->get('twitter'));
        $user = json_decode($twitter
            ->setGetfield('?screen_name=' . urlencode($this->request()->params('screen_name')) . '&count=200')
            ->buildOauth('https://api.twitter.com/1.1/users/show.json', 'GET')
            ->performRequest(), true);

        if (isset($user['errors'])) {
            $this->app->response->setStatus(400);
            $result = array('error' => $user['errors'][0]['message']);
        } else {
            $tweets = json_decode(file_get_contents('https://api.peerindex.com/1/actor/topic?api_key=' . $config->get('peerindex')['api_key'] . '&twitter_screen_name=' . urlencode($this->request()->params('screen_name'))), true);

            $result = array(
                'user' => $user,
                'peerindex' => $tweets
            );
        }

        $this->sendResponse($result);
    }

    public function getLinkedInProfileAction() {
        session_cache_limiter(false);
        session_start();

        $config = \FYP\APP::getDI()['config'];

        $linkedInConfig = $config->get('linkedin');
        $linkedInConfig['callback_url'] = 'http://' . $this->request()->getHost() . '/api/' . 'social/linkedin';

        $linkedin = new \LinkedIn\LinkedIn($linkedInConfig);

        if ($this->request()->params('code') == NULL && empty($_SESSION['linkedin_token'])) {

            $loginURL = $linkedin->getLoginUrl(array('r_fullprofile', 'r_emailaddress', 'r_network', 'r_contactinfo'));
            $this->redirect($loginURL);

        } elseif ($this->request()->params('code') != NULL) {

            $token = $linkedin->getAccessToken($this->request()->params('code'));
            $_SESSION['linkedin_token'] = $token;
            $this->redirect('/?linkedin=authenticated');

        } else if (isset($_SESSION['linkedin_token'])) {

            $token = $_SESSION['linkedin_token'];
            $linkedin->setAccessToken($token);
            try {
                $result = $linkedin->get('/people/url=' . urlencode($this->request()->params('profile_url')) . ':(first-name,last-name,headline,location:(name),industry,summary,specialties,positions,picture-url,interests,skills,three-current-positions,three-past-positions)');
            } catch (\Exception $e) {
                $this->app->response->setStatus(400);
                $result = array('error' => $e->getMessage());
            }

            $this->sendResponse($result);

        } else {
            throw new \Exception('Could not obtain linkedin access token');
        }

    }

} 