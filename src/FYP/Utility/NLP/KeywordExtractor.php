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
            } elseif ($concatWithPrevious && $isNoun) {
                $buildFullNoun[] = $item['word'];
            } else if ($concatWithPrevious && !$isNoun) {
                $concatWithPrevious = false;

                $fullPhrase = Inflector::singularize(implode(' ', $buildFullNoun)); //convert it to array and singularize it

                if (isset($result[$fullPhrase])) {
                    $result[$fullPhrase]++;
                } else {
                    $result[$fullPhrase] = 1;
                }

                $buildFullNoun = array();
            }

        }

        if (count($buildFullNoun) > 0) {
            $fullPhrase = implode(' ', $buildFullNoun);

            if (isset($result[$fullPhrase])) {
                $result[$fullPhrase]++;
            } else {
                $result[$fullPhrase] = 1;
            }
        }

        return $result;
    }

} 