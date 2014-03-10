<?php

namespace FYP\API\Controller;

use \FYP\Utility\BaseController;

class Index extends BaseController {

    public function indexAction() {

        $config = \FYP\APP::getDI()['config'];
        echo file_get_contents($config->get('publicDir') . 'index.html');
    }

} 