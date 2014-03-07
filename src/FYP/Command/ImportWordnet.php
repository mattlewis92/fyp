<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

use FYP\Utility\NLP\KeywordExtractor;
use FYP\Database\Documents\Word;

class ImportWordnet extends Command {

    const CHUNK_SIZE = 10000;

    private $mysql;

    private $neo4j;

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

        $this->neo4j = new \Everyman\Neo4j\Client('localhost', 7474);
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $progress = $this->getHelperSet()->get('progress');

        $progress->setRedrawFrequency(100);

        $totalWords = $this->mysql->executeQuery('SELECT COUNT(*) AS total FROM words')->fetch()['total'];

        $progress->start($output, $totalWords);

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
                $word = $this->getWord($word['lemma'], $word['pos']);
                $synonymWords = $this->getSynonymWords($word->getLemma(), $word->getPos());
                $wordNode = $this->neo4j->getNode($word->getNeo4jId());

                $batch = new \Everyman\Neo4j\Batch($this->neo4j);

                foreach($synonymWords as $synonymWord) {
                    $synonymWordNode = $this->neo4j->getNode($synonymWord->getNeo4jId());
                    $relationshipExists = false;
                    foreach($wordNode->getRelationships() as $relationship) {
                        if ($relationship->getEndNode()->getId() == $synonymWordNode->getId() || $relationship->getStartNode()->getId() == $synonymWordNode->getId()) {
                            $relationshipExists = true;
                            break;
                        }
                    }

                    if (!$relationshipExists) {
                        $batch->save($synonymWordNode->relateTo($wordNode, 'IS_SYNONYM_OF'));
                    }
                }

                if (count($batch->getOperations()) > 0) {
                    $batch->commit();
                }

                $progress->advance();

            }
        }


    }

    private function getWord($lemma, $pos) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $result = $dm
            ->getRepository('\FYP\Database\Documents\Word')
            ->findOneBy(array('lemma' => $lemma, 'pos' => $pos));

        if (empty($result)) {
            $node = $this
                ->neo4j
                ->makeNode()
                ->save();

            $word = new \FYP\Database\Documents\Word();
            $word = $word
                ->setLemma($lemma)
                ->setPos($pos)
                ->setIsWordnet(true)
                ->setIsWikipedia(false)
                ->setNeo4jId($node->getId());
            $dm->persist($word);
            $dm->flush();
            $node->setProperty('mongo_id', $word->getId())->save();
            $dm->clear();
            return $word;
        } else {
            $dm->clear();
        }

        return $result;

    }

    private function getSynonymWords($lemma, $pos) {

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

        $result = array();

        foreach($words as $word) {
            $result[] = $this->getWord($word['lemma'], $word['pos']);
        }

        return $result;

    }

} 