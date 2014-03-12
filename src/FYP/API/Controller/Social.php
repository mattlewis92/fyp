<?php

namespace FYP\API\Controller;

use \FYP\Utility\BaseController;

class Social extends BaseController {

    public function getTwitterProfileAction() {

        $config = \FYP\APP::getDI()['config'];

        try {
            $baseRequest = '?screen_name=' . urlencode($this->request()->params('screen_name'));
            $user = $this->makeTwitterRequest('users/show', $baseRequest);
            //$latestTweets = $this->makeTwitterRequest('statuses/user_timeline', $baseRequest . '&count=200&trim_user=1&include_rts=0');

            $tweets = json_decode(file_get_contents('https://api.peerindex.com/1/actor/topic?api_key=' . $config->get('peerindex')['api_key'] . '&twitter_screen_name=' . urlencode($this->request()->params('screen_name'))), true);

            $result = array(
                'user' => $user,
                'peerindex' => $tweets,
                //'latest_tweets' => $lsatestTweets
            );

        } catch (\Exception $e) {
            $this->app->response->setStatus(400);
            $result = array('error' => $e->getMessage());
        }

        $this->sendResponse($result);
    }

    private function makeTwitterRequest($path, $getField) {
        $config = \FYP\APP::getDI()['config'];
        $twitter = new \TwitterAPIExchange($config->get('twitter'));
        $result = json_decode($twitter
            ->setGetfield($getField)
            ->buildOauth('https://api.twitter.com/1.1/' . $path . '.json', 'GET')
            ->performRequest(), true);

        if (isset($result['errors'])) {
            throw new \Exception($result['errors'][0]['message']);
        }

        return $result;
    }

    public function getLinkedInProfileAction() {

        $config = \FYP\APP::getDI()['config'];

        $linkedInConfig = $config->get('linkedin');
        $linkedInConfig['callback_url'] = 'http://' . $this->request()->getHost() . '/api/' . 'social/linkedin';

        $linkedin = new \LinkedIn\LinkedIn($linkedInConfig);

        $linkedin->setAccessToken($linkedInConfig['access_token']);
        try {
            $result = $linkedin->get('/people/url=' . urlencode($this->request()->params('profile_url')) . ':(first-name,last-name,headline,location:(name),industry,summary,specialties,positions,picture-url,interests,skills,three-current-positions,three-past-positions)');
        } catch (\Exception $e) {
            $this->app->response->setStatus(400);
            $result = array('error' => $e->getMessage());
        }

        $this->sendResponse($result);

    }

} 