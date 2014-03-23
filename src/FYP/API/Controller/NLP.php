<?php

namespace FYP\API\Controller;

use FYP\Utility\NLP\KeywordExtractor;
use FYP\Utility\NLP\Synonym;
use FYP\Utility\BaseController;

class NLP extends BaseController {

    /**
     * Given some text extract the keywords
     */
    public function extractKeywordsAction() {

        $extractor = new KeywordExtractor();
        $text = $this->request()->post('text');
        $extracted = $extractor->extract($text);
        $this->sendResponse($extracted);

    }

    /**
     * Given a list of pairs of words, tell if they're synonyms
     */
    public function synonymCheckAction() {

        $synonym = new Synonym();

        $phrases = $this->request()->post('phrases');

        $result = array();

        foreach($phrases as $phrase) {
            $lemma1 = $phrase['lemma1'];
            $lemma2 = $phrase['lemma2'];

            $result[] = array(
                'words' => array(
                    $lemma1,
                    $lemma2
                ),
                'are_synonyms' => $synonym->areSynonyms($lemma1, $lemma2)
            );
        }

        $this->sendResponse($result);

    }

} 