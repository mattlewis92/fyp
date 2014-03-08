<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ProduceWordnetJobs extends Command {

    private $mysql;

    private $queue;

    protected function configure() {
        $this
            ->setName('produce:wordnet-jobs')
            ->setDescription('Creates jobs for the import workers to process in chunks.')
        ;

        $config = new \Doctrine\DBAL\Configuration();
        $connectionParams = \FYP\APP::getDI()['config']->get('wordnet_db');
        $this->mysql = \Doctrine\DBAL\DriverManager::getConnection($connectionParams, $config);

        $this->queue = new \FYP\Utility\Queue();
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $totalWords = $this->mysql->executeQuery('SELECT COUNT(*) AS total FROM words')->fetch()['total'];

        $chunkSize = 1000;

        for ($i = 0; $i < $totalWords; $i += $chunkSize) {

            $job = array('maxResults' => $chunkSize, 'firstResult' => $i);

            $output->writeln('Adding job');
            $this->queue->addJob('import:wordnet', $job);

        }

    }

} 