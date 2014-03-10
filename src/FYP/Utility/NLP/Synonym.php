<?php

namespace FYP\Utility\NLP;

use FYP\App;

class Synonym {

    const MAX_DEPTH = 3;

    public function getSimilarityScore($lemma1, $lemma2) {
        $neo4j = App::getDI()['neo4j'];

        $lemma1 = strtolower($lemma1);
        $lemma2 = strtolower($lemma2);

        if ($lemma1 == $lemma2) { //save some computation
            return 1.0;
        }

        $word1 = $this->getWord($lemma1);
        $word2 = $this->getWord($lemma2);

        if (empty($word1) || empty($word2)) return -1.0; //unknown words

        $word1Node = $neo4j->getNode($word1->getNeo4jId());
        $word2Node = $neo4j->getNode($word2->getNeo4jId());

        $pathNodes = $word1Node->findPathsTo($word2Node, 'IS_SYNONYM_OF', \Everyman\Neo4j\Relationship::DirectionOut)->setMaxDepth(self::MAX_DEPTH)->getSinglePath();

        if (count($pathNodes) == 0) { //There is no path between these 2 words
            return 0.0;
        }

        $traversalAmount = count($pathNodes) - 1;

        $score = log((self::MAX_DEPTH + 2) - $traversalAmount) / log(self::MAX_DEPTH + 2);

        return round($score, 2);

    }

    private function getWord($lemma) {
        return App::getDI()['doctrineManager']
            ->getRepository('\FYP\Database\Documents\Word')
            ->findOneBy(array('lemma' => $lemma));
    }

} 