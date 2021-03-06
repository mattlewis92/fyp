<?php

namespace FYP\Utility;

/**
 * Wraps around pheanstalk
 *
 * Class Queue
 * @package FYP\Utility
 */
class Queue extends \Pheanstalk_Pheanstalk {

    public function __construct($host = 'localhost') {
        parent::__construct($host);
    }

    /**
     * Helper function to add a job to the queue
     *
     * @param $tube
     * @param $data
     */
    public function addJob($tube, $data) {
        parent::useTube(str_replace(':', '-', $tube))->put(json_encode($data), parent::DEFAULT_PRIORITY, parent::DEFAULT_DELAY, 3600);
    }

} 