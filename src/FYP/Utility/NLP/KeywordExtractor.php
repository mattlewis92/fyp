<?php

namespace FYP\Utility\NLP;

use FYP\Utility\NLP\Tokenizer\Lexer;
use Doctrine\Common\Inflector\Inflector;

/**
 * Used to extract keywords from a block of text
 * Original idea came from: https://github.com/harthur/glossary but has since been adapted heavily
 *
 * Class KeywordExtractor
 * @package FYP\Utility\NLP
 */
class KeywordExtractor {

    private $lexer;

    private $tagger;

    public function __construct() {
        $this->dm = \FYP\APP::getDI()['doctrineManager'];
        $this->lexer = new Lexer();
        $this->tagger = new POSTagger();
    }

    /**
     * Function which does the extraction
     *
     * @param $string
     * @return array
     */
    public function extract($string) {

        //Clean string of weird characters
        $string = preg_replace('/[^(\x20-\x7F)]*/','', $string);

        //Tokenize the string
        $tokens = $this->lexer->lex($string);

        //Tag the string
        $tagged = $this->tagger->tag($tokens);

        $concatWithPrevious = false;
        $buildFullNoun = array();

        $result = array();

        foreach($tagged as $item) {

            $isNoun = $this->tagger->startsWith($item['tag'], 'N');
            $isAdjective = $item['tag'] == 'JJ';

            //If it's a noun or an adjective that starts with a capital letter
            if (!$concatWithPrevious && ($isNoun || ($isAdjective && preg_match("/[A-Z]/", substr($item['word'], 0, 1)) > 0))) {

                $concatWithPrevious = true;
                $buildFullNoun[] = $item['word'];

            //If previous was a noun or adjective that starts with a capital letter and this word is a noun or the word and then concat it
            } elseif ($concatWithPrevious && ($isNoun || strtolower($item['word']) == 'and')) {

                $buildFullNoun[] = $item['word'];

            //If it's a noun then concat it with the previous string that's being built (if any)
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

    /**
     * After all keywords have been extracted, post process them.
     *
     * @param $phrases
     * @return array
     */
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

    /**
     * Join the words together into a phrase and add to the count
     *
     * @param $result
     * @param $words
     * @return mixed
     */
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

    /**
     * Transform the phrase
     *
     * @param $phrase
     * @return string
     */
    private function transformPhrase($phrase) {
        $phrase = trim($phrase); //trim it

        $phrase = Inflector::singularize($phrase); //singularize it

        $phrase = strtoupper($phrase) === $phrase ? $phrase : ucwords(strtolower($phrase)); //convert to lower case

        return $phrase;
    }

    /**
     * Check if the phrase is ok to keep
     *
     * @param $phrase
     * @return bool
     */
    private function isPhraseAllowed($phrase) {
        if (strlen($phrase) == 1) return false; //remove stuff like I.

        if (preg_match("/^\w/i", $phrase) === 0) return false; //remove anything that doesn't start with a letter or a number

        return true;
    }

} 