<?php

namespace FYP\API\Controller;

use \FYP\Utility\BaseController;

class Index extends BaseController {

    public function indexAction() {

        session_cache_limiter(false);
        session_start();

        $config = \FYP\APP::getDI()['config'];

        if (isset($_SESSION['linkedin_token']) && !$this->request()->get('linkedin')) {
            $this->redirect('/?linkedin=authenticated');
        } else {
            echo file_get_contents($config->get('publicDir') . 'index.html');
        }
    }

} 