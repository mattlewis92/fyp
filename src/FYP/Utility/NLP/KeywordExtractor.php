<?php

namespace FYP\Utility\NLP;

use FYP\Utility\NLP\Tokenizer\Lexer;
use Doctrine\Common\Inflector\Inflector;

class KeywordExtractor {

    private $lexer;

    private $tagger;

    public function __construct() {
        $this->dm = \FYP\APP::getDI()['doctrineManager'];
        $this->lexer = new Lexer();
        $this->tagger = new POSTagger();
    }

    public function extract($string) {

        //Clean string of weird characters
        $string = preg_replace('/[^(\x20-\x7F)]*/','', $string);

        $tokens = $this->lexer->lex($string);
        $tagged = $this->tagger->tag($tokens);

        $concatWithPrevious = false;
        $buildFullNoun = array();

        $result = array();

        foreach($tagged as $item) {

            $isNoun = $this->tagger->startsWith($item['tag'], 'N');
            $isAdjective = $item['tag'] == 'JJ';

            if (!$concatWithPrevious && ($isNoun || ($isAdjective && preg_match("/[A-Z]/", substr($item['word'], 0, 1)) > 0))) {

                $concatWithPrevious = true;
                $buildFullNoun[] = $item['word'];

            } elseif ($concatWithPrevious && ($isNoun || strtolower($item['word']) == 'and')) {

                $buildFullNoun[] = $item['word'];

            } else if ($concatWithPrevious && !$isNoun) {

                $concatWithPrevious = false;

                if (strtolower($buildFullNoun[count($buildFullNoun) - 1]) == 'and') {
                    unset($buildFullNoun[count($buildFullNoun) - 1]);
                }

                $result = $this->buildFullPhraseAndAddToResult($result, $buildFullNoun);

                $buildFullNoun = array();

            }

        }

        //If there are any nouns left at the end of the sentence then add them in as well
        if (count($buildFullNoun) > 0) {
            $result = $this->buildFullPhraseAndAddToResult($result, $buildFullNoun);
        }

        return $this->postProcess($result);
    }

    private function postProcess($phrases) {

        $result = array();
        foreach($phrases as $phrase => $count) {

            if (strtoupper($phrase) === $phrase) { //if the phrase is all in upper case then add it to the build
                $result[$phrase] = $count;
            } elseif (isset($phrases[strtoupper($phrase)])) { //if the same phrase was added in lowercase and uppercase, then merge them
                if (isset($result[strtoupper($phrase)])) {
                    $result[strtoupper($phrase)] += $count;
                } else {
                    $phrases[strtoupper($phrase)] += $count;
                }
            } else {
                $result[$phrase] = $count;
            }

        }

        return $result;

    }

    private function buildFullPhraseAndAddToResult($result, $words) {
        $fullPhrase = $this->transformPhrase(implode(' ', $words));

        if ($this->isPhraseAllowed($fullPhrase)) {
            if (isset($result[$fullPhrase])) {
                $result[$fullPhrase]++;
            } else {
                $result[$fullPhrase] = 1;
            }
        }

        return $result;
    }

    private function transformPhrase($phrase) {
        $phrase = trim($phrase); //trim it

        $phrase = Inflector::singularize($phrase); //singularize it

        $phrase = strtoupper($phrase) === $phrase ? $phrase : ucwords(strtolower($phrase)); //convert to lower case

        return $phrase;
    }

    private function isPhraseAllowed($phrase) {
        if (strlen($phrase) == 1) return false; //remove stuff like I.

        if (preg_match("/^\w/i", $phrase) === 0) return false; //remove anything that doesn't start with a letter or a number

        return true;
    }

} 