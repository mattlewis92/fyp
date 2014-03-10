<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

use FYP\Utility\NLP\KeywordExtractor;
use FYP\Utility\NLP\Synonym;

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

        $synonym = new Synonym();
        $result = $synonym->getSimilarityScore('foot', 'ceiling');
        var_dump($result);

    }

} 