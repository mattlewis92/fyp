<?php

namespace FYP\Utility;

use \SlimController\SlimController;

abstract class BaseController extends SlimController {

    protected function sendResponse($result) {
        $this->app->response->header('Content-Type', 'application/json');
        echo json_encode($result);
    }

} 