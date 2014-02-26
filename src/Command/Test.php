<?php

namespace Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

use API\Utility\NLP\KeywordExtractor;

class Test extends Command {

    protected function configure() {
        $this
            ->setName('test:test')
            ->setDescription('Test routine')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $extractor = new KeywordExtractor($dm);
        print_r($extractor->extract('There are 2 keywords.'));

    }

} 