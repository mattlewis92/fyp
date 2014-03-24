<?php

namespace FYP\Utility;

use \SlimController\SlimController;

/**
 * Base controller
 *
 * Class BaseController
 * @package FYP\Utility
 */
abstract class BaseController extends SlimController {

    /**
     * Helper function to send data as json
     *
     * @param $result
     */
    protected function sendResponse($result) {
        $this->app->response->header('Content-Type', 'application/json');
        echo json_encode($result);
    }

} 