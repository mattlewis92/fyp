<?php

namespace FYP\Utility;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

abstract class BaseWorker extends Command {

    private $queue;

    private $currentJob;

    public function __construct($name = null) {
        $this->queue = new \FYP\Utility\Queue();
        parent::__construct($name);
    }

    public function setName($name) {
        return parent::setName('worker:' . $name);
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $tube = str_replace(array('worker:', ':'), array('', '-'), $this->getName());

        $output->writeln('Worker started. Listening on tube: ' . $tube);

        while (true) {
            $job = $this->queue
                ->watch($tube)
                ->reserve();

            $this->currentJob = $job;

            $output->writeln('Received job: ' . $job->getId());

            $result = $this->doJob(json_decode($job->getData(), true));

            $this->queue->delete($job);

            $this->currentJob = null;

            $output->writeln('Job: ' . $job->getId() . ' completed. Message: ' . $result);
        }

    }

    protected function touchCurrentJob() {
        $this->queue->touch($this->currentJob);
    }

    abstract protected function doJob(array $data = array());

} 