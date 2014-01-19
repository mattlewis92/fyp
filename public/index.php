<?php

require '../vendor/autoload.php';

session_cache_limiter(false);
session_start();

$app = new \Slim\Slim();

define('CALLBACK_PREFIX', 'http://' . $app->request->getHost() . '/api/');

$app->get('/api/social/linkedin', function() use($app) {

    $callback = CALLBACK_PREFIX . 'social/linkedin';

    $config = array(
        'api_key'       => '774ad8zngowivw',
        'api_secret'    => '0buDs7MCjvmOe6ue',
        'callback_url' => $callback
    );

    $linkedin = new \LinkedIn\LinkedIn($config);

    if ($app->request->params('code') == NULL && empty($_SESSION['linkedin_token'])) {

        $loginURL = $linkedin->getLoginUrl(array('r_fullprofile', 'r_emailaddress', 'r_network', 'r_contactinfo'));
        $app->redirect($loginURL);

    } elseif ($app->request->params('code') != NULL) {

        $token = $linkedin->getAccessToken($app->request->params('code'));
        $_SESSION['linkedin_token'] = $token;
        $app->redirect('/?linkedin=authenticated');

    } else if (isset($_SESSION['linkedin_token'])) {

        $token = $_SESSION['linkedin_token'];
        $linkedin->setAccessToken($token);
        try {
            $result = $linkedin->get('/people/url=' . urlencode($app->request->params('profile_url')) . ':(first-name,last-name,headline,location:(name),industry,summary,specialties,positions,picture-url,interests,skills,three-current-positions,three-past-positions)');
        } catch (\Exception $e) {
            $app->response->setStatus(400);
            $result = array('error' => $e->getMessage());
        }

        echo json_encode($result);

    } else {
        throw new \Exception('Could not obtain linkedin access token');
    }

});

$app->get('/api/social/twitter', function() use($app) {
    $config = array(
        'consumer_key'       => '7qpUo15t8QY2J39nYEGjGw',
        'consumer_secret'    => 'GYcByPjEznXPsB2uc1jiULaWo88IjgraYF92RGEpiN4',
        'oauth_access_token'        => '130212096-rtTfHV2k1F2WMbkx3VkZUYvGfK160zSzv4JB2gyi',
        'oauth_access_token_secret'       => 'ggxhrO4AGzMBRbMQkaa0N7oz1D5XByvJTMrIytdyMtwgn'
    );

    $twitter = new TwitterAPIExchange($config);
    $user = json_decode($twitter
        ->setGetfield('?screen_name=' . urlencode($app->request->params('screen_name')) . '&count=200')
        ->buildOauth('https://api.twitter.com/1.1/users/show.json', 'GET')
        ->performRequest(), true);

    if (isset($user['errors'])) {
        $app->response->setStatus(400);
        $result = array('error' => $user['errors'][0]['message']);
    } else {
        $tweets = json_decode(file_get_contents('https://api.peerindex.com/1/actor/topic?api_key=ped3jb34yw7mc3bucn8jfyjx&twitter_screen_name=' . urlencode($app->request->params('screen_name'))), true);

        $result = array(
            'user' => $user,
            'peerindex' => $tweets
        );
    }

    echo json_encode($result);

});

$app->get('.+', function() {
    echo file_get_contents("views/index.html");
});

$app->run();
