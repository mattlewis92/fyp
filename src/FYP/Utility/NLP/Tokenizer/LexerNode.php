<?php

namespace FYP\Utility\NLP\Tokenizer;

/**
 * Does most of the work for the tokenizing strings, used like this for recusion
 *
 * Class LexerNode
 * @package FYP\Utility\NLP\Tokenizer
 */
class LexerNode {

    private $string;
    private $children = array();
    private $matches = array();

    /**
     * Pass in the string, the first regex to try and the rest of the regexes
     *
     * @param $string
     * @param $regex
     * @param $regexes
     */
    public function __construct($string, $regex, $regexes) {

        $this->string = $string;
        $childElements = array();

        if (!empty($string)) {
            $numberOfMatches = preg_match_all($regex, $string, $this->matches);
            $this->matches = $this->matches[0];
            $childElements = preg_split($regex, $string, null, PREG_SPLIT_NO_EMPTY);
        }

        if (empty($numberOfMatches)) {
            $childElements = array($string);
        }

        if (empty($regexes)) {
            $this->children = $childElements;
        } else {
            $nextRegex = $regexes[0];
            array_shift($regexes);

            foreach($childElements as $childString) {
                $this->children[] = new LexerNode($childString, $nextRegex, $regexes);
            }
        }

    }

    /**
     * Fill array
     *
     * @param $array
     * @return array
     */
    public function fillArray($array) {

        foreach($this->children as $index => $child) {
            if (is_object($child)) {
                $array = $array + $child->fillArray($array);
            } elseif ($this->isNotBlank($child)) {
                $array[] = $child;
            }

            if ($index < count($this->matches)) {
                $match = $this->matches[$index];

                if ($this->isNotBlank($match)) {
                    $array[] = $match;
                }
            }

        }

        return $array;
    }

    /**
     * Is a string not blank i.e. contains characters that aren't whitespace
     *
     * @param $string
     * @return bool
     */
    private function isNotBlank($string) {
        return preg_match("/\S/", $string) > 0;
    }

} 