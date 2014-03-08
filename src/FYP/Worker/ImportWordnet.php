<?php

namespace FYP\Worker;

use \Doctrine\DBAL\Configuration as DoctrineConfig;
use \Doctrine\DBAL\DriverManager as DoctrineDriverManager;
use \FYP\Utility\BaseWorker;


class ImportWordnet extends BaseWorker {

    protected function configure() {
        $this
            ->setName('import:wordnet')
            ->setDescription('Imports the entire wordnet database and plots all synonyms in a graph database.')
        ;

        $config = new DoctrineConfig();
        $connectionParams = \FYP\APP::getDI()['config']->get('wordnet_db');
        $this->mysql = DoctrineDriverManager::getConnection($connectionParams, $config);

        $this->neo4j = \FYP\APP::getDI()['neo4j'];
    }

    protected function doJob(array $data = array()) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $words = $this->mysql
            ->createQueryBuilder()
            ->select('w.lemma, s2.pos')
            ->from('words', 'w')
            ->innerJoin('w', 'senses', 's1', 'w.wordid = s1.wordid')
            ->innerJoin('s1', 'synsets', 's2', 's1.synsetid = s2.synsetid')
            ->orderBy('w.wordid')
            ->setFirstResult($data['firstResult'])
            ->setMaxResults($data['maxResults'])
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

        }

        return count($words) . ' processed';

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