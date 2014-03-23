<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

use FYP\Utility\NLP\KeywordExtractor;
use FYP\Utility\NLP\Synonym;

/**
 * Test command
 *
 * Class Test
 * @package FYP\Command
 */
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

        $result = $extractor->extract('Information Technology and Services are the best and Communities is pretty good as well. I think Community is a pretty sweet database as well.');
        var_dump($result);

    }

} 