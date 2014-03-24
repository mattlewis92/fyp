<?php

namespace FYP\Worker;

use \Doctrine\DBAL\Configuration as DoctrineConfig;
use \Doctrine\DBAL\DriverManager as DoctrineDriverManager;
use \FYP\Utility\BaseWorker;

/**
 * Import the moby database of synonyms and plot them in a graph database
 *
 * Class ImportMoby
 * @package FYP\Worker
 */
class ImportMoby extends BaseWorker {

    /**
     * Setup the worker
     */
    protected function configure() {
        $this
            ->setName('import:moby')
            ->setDescription('Imports the entire moby database and plots all synonyms in a graph database.')
        ;

        $config = new DoctrineConfig();
        $connectionParams = \FYP\APP::getDI()['config']->get('moby_db');
        $this->mysql = DoctrineDriverManager::getConnection($connectionParams, $config);

        $this->neo4j = \FYP\APP::getDI()['neo4j'];
    }

    /**
     * Do the job
     *
     * @param array $data
     * @return mixed|string
     */
    protected function doJob(array $data = array()) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $words = $this->mysql
            ->createQueryBuilder()
            ->select('w.*')
            ->from('words', 'w')
            ->orderBy('w.word_id')
            ->setFirstResult($data['firstResult'])
            ->setMaxResults($data['maxResults'])
            ->execute()
            ->fetchAll();

        foreach($words as $word) {
            $wordObj = $this->getWord($word['word']);
            $synonymWords = $this->getSynonymWords($word['word_id']);
            $wordNode = $this->neo4j->getNode($wordObj->getNeo4jId());

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

            $this->touchCurrentJob();

        }

        return count($words) . ' processed';

    }

    //Lookup the word in mongo and add it if it doesnt aready exist
    private function getWord($lemma) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $result = $dm
            ->getRepository('\FYP\Database\Documents\Word')
            ->findOneBy(array('lemma' => strtolower($lemma)));

        if (empty($result)) {
            $node = $this
                ->neo4j
                ->makeNode()
                ->save();

            $word = new \FYP\Database\Documents\Word();
            $word = $word
                ->setLemma($lemma)
                ->setIsThesaurus(true)
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

    /**
     * Get all synonyms of a given word id
     *
     * @param $wordId
     * @return array
     */
    private function getSynonymWords($wordId) {

        $words = $this->mysql
            ->createQueryBuilder()
            ->select('DISTINCT s.synonym')
            ->from('synonyms', 's')
            ->where('s.word_id = :wordid')
            ->setParameter('wordid', $wordId)
            ->execute()
            ->fetchAll();

        $result = array();

        foreach($words as $word) {
            $result[] = $this->getWord($word['synonym']);
        }

        return $result;

    }

} 