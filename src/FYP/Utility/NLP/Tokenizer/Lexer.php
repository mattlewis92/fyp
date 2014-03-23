<?php

namespace FYP\Utility\NLP\Tokenizer;

/**
 * A simple class to tokenize a string
 *
 * Class Lexer
 * @package FYP\Utility\NLP\Tokenizer
 */
class Lexer {

    private $regexes = array(
        "/\b(?:(?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))/i",
        "/[0-9]*\.[0-9]+|[0-9]+/i",
        "/\s+/i",
        "/[\/\.\,\?\!\"\']/i"
    );

    public function lex($string) {

        $firstRegex = $this->regexes[0];
        array_shift($this->regexes);
        $node = new LexerNode($string, $firstRegex, $this->regexes);
        $tokens = $node->fillArray(array());
        return $tokens;

    }

} 