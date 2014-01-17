<?php

require '../vendor/autoload.php';

$app = new \Slim\Slim();

$app->get('/api/social/linkedin', function() {
        echo json_encode(array("method" => "Linked in"));
});

$app->get('/api/social/twitter', function() {
        echo json_encode(array("method" => "Twitter"));
});

$app->get('.+', function() {
	echo file_get_contents("views/index.html");
});

$app->run();
