<?php

namespace Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

use API\Utility\NLP\KeywordExtractor;
use API\Database\Documents\Word;

class ImportWordnet extends Command {

    const CHUNK_SIZE = 10000;

    private $mysql;

    protected function configure() {
        $this
            ->setName('import:wordnet')
            ->setDescription('Imports the entire wordnet database and plots all synonyms in a graph database.')
        ;

        $config = new \Doctrine\DBAL\Configuration();
        $connectionParams = array(
            'dbname' => 'wordnet',
            'user' => 'root',
            'host' => 'localhost',
            'driver' => 'pdo_mysql'
        );
        $this->mysql = \Doctrine\DBAL\DriverManager::getConnection($connectionParams, $config);
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $totalWords = $this->mysql->executeQuery('SELECT COUNT(*) AS total FROM words')->fetch()['total'];

        for ($i = 0; $i < $totalWords; $i += self::CHUNK_SIZE) {

            $words = $this->mysql
                ->createQueryBuilder()
                ->select('w.lemma, s2.pos')
                ->from('words', 'w')
                ->innerJoin('w', 'senses', 's1', 'w.wordid = s1.wordid')
                ->innerJoin('s1', 'synsets', 's2', 's1.synsetid = s2.synsetid')
                ->orderBy('w.wordid')
                ->setFirstResult($i)
                ->setMaxResults(self::CHUNK_SIZE)
                ->execute()
                ->fetchAll();

            foreach($words as $word) {
                $mongoId = $this->getMongoWordId($word['lemma'], $word['pos']);
                $synonymIds = $this->getSynonymWordIds($word['lemma'], $word['pos']);
                print_r($synonymIds);
            }
        }


    }

    private function getMongoWordId($lemma, $pos) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $result = $dm
            ->getRepository('\API\Database\Documents\Word')
            ->findOneBy(array('lemma' => $lemma, 'pos' => $pos));

        if (empty($result)) {
            $word = new \API\Database\Documents\Word();
            $word = $word->setLemma($lemma)->setPos($pos)->setIsWordnet(true)->setIsWikipedia(false);
            $dm->persist($word);
            $dm->flush();
            $dm->clear();
            return $word->getId();
        }

        return $result->getId();

    }

    private function getSynonymWordIds($lemma, $pos) {

        $words = $this->mysql
            ->createQueryBuilder()
            ->select('DISTINCT w2.lemma, sy1.pos')
            ->from('words', 'w1')
            ->innerJoin('w1', 'senses', 's1', 's1.wordid = w1.wordid')
            ->innerJoin('s1', 'senses', 's2', 's1.synsetid = s2.synsetid')
            ->innerJoin('s2', 'words', 'w2', 'w2.wordid = s2.wordid AND w2.wordid != w1.wordid')
            ->innerJoin('s2', 'synsets', 'sy1', 'sy1.synsetid = s2.synsetid')
            ->innerJoin('s1', 'synsets', 'sy2', 'sy2.synsetid = s1.synsetid')
            ->where('w1.lemma = :lemma AND sy2.pos = :pos')
            ->setParameter('lemma', $lemma)
            ->setParameter('pos', $pos)
            ->execute()
            ->fetchAll();

        $wordIds = array();

        foreach($words as $word) {
            $wordIds[] = $this->getMongoWordId($word['lemma'], $word['pos']);
        }

        return $wordIds;

    }

} 