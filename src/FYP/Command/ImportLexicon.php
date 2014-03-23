<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Given the brill tagger lexicon in JSON format, save it into the database
 *
 * Class ImportLexicon
 * @package FYP\Command
 */
class ImportLexicon extends Command {

    protected function configure() {
        $this
            ->setName('import:lexicon')
            ->setDescription('Imports the lexicon file into mongodb')
            ->addArgument(
                'file',
                InputArgument::REQUIRED,
                'The filename of the lexicon (must be a JSON file)'
            )
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $lexiconFile = $input->getArgument('file');

        $lexicon = json_decode(file_get_contents($lexiconFile), true);

        $progress = $this->getHelperSet()->get('progress');

        $progress->setRedrawFrequency(100);

        $progress->start($output, count($lexicon));

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $dm->createQueryBuilder('\FYP\Database\Documents\Lexicon')
            ->remove()
            ->getQuery()
            ->execute();

        foreach($lexicon as $phrase => $tags) {

            $document = new \FYP\Database\Documents\Lexicon();
            $document->setPhrase($phrase)->setTags($tags);
            $dm->persist($document);

            if (strtolower($phrase) != $phrase) { //add the lower case version as well as mongo indexes can't be queries by case
                $document = new \FYP\Database\Documents\Lexicon();
                $document->setPhrase($phrase)->setTags($tags);
                $dm->persist($document);
            }

            $progress->advance();

            $dm->flush();
            $dm->clear();

        }

        $output->writeln("<info>Import completed</info>");
    }

} 