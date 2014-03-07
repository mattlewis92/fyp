<?php

namespace FYP\Utility;

class Queue extends \Pheanstalk_Pheanstalk {

    public function __construct($host = 'localhost') {
        parent::__construct($host);
    }

    public function addJob($tube, $data) {
        parent::useTube(str_replace(':', '-', $tube))->put(json_encode($data));
    }

} 