<?php

namespace FYP\Utility\NLP;

use \FYP\Database\Documents\Lexicon;


class POSTagger {

    const DEFAULT_TAG = 'NN';

    private $dm;

    public function __construct() {
        $this->dm = \FYP\APP::getDI()['doctrineManager'];
    }

    public function tag(array $words) {

        $tagged = array();

        //populate the words array
        foreach($words as $word) {
            $tagged[] = array(
                'word'  => $word,
                'tag'   => $this->lookup($word)
            );
        }

        foreach($tagged as $index => $item) {

            //  rule 1: DT, {VBD | VBP} --> DT, NN
            if ($index > 0 && $tagged[$index-1]['tag'] == 'DT') {
                if ($item['tag'] == 'VBD' || $item['tag'] == 'VBP' || $item['tag'] == 'VB') {
                    $tagged[$index]['tag'] = 'NN';
                }
            }

            // rule 2: convert a noun to a number (CD) if "." appears in the word
            if ($this->startsWith($item['tag'], 'N')) {
                if (strpos($item['word'], '.') !== false) {
                    // url if there are two contiguous alpha characters
                    if (preg_match("/[a-zA-Z]{2}/", $item['word']) > 0) {
                        $tagged[$index]['tag'] = 'URL';
                    } else {
                        $tagged[$index]['tag'] = 'CD';
                    }
                }

                // Attempt to convert into a number
                if (floatval($item['word']) !== 0.0) {
                    $tagged[$index]['tag'] = 'CD';
                }

            }

            // rule 3: convert a noun to a past participle if words[i] ends with "ed"
            if ($this->startsWith($tagged[$index]['tag'], 'N') && $this->endsWith($tagged[$index]['tag'], 'ed')) {
                $tagged[$index]['tag'] = 'VBN';
            }

            // rule 4: convert any type to adverb if it ends in "ly";
            if ($this->endsWith($item['word'], 'ly')) {
                $tagged[$index]['tag'] = 'RB';
            }

            // rule 5: convert a common noun (NN or NNS) to a adjective if it ends with "al"
            if ($this->startsWith($tagged[$index]['tag'], 'NN') && $this->endsWith($item['word'], 'al')) {
                $tagged[$index]['tag'] = 'JJ';
            }

            // rule 6: convert a noun to a verb if the preceding work is "would"
            if ($index > 0 && $this->startsWith($item['tag'], 'NN') && strtolower($tagged[$index-1]['word']) == 'would') {
                $tagged[$index]['tag'] = 'VB';
            }

            // rule 7: if a word has been categorized as a common noun and it ends with "s", then set its type to plural common noun (NNS)
            if ($item['tag'] == 'NN' && $this->endsWith($item['word'], 's')) {
                $tagged[$index]['tag'] = 'NNS';
            }

            // rule 8: convert a common noun to a present participle verb (i.e., a gerund)
            if ($this->startsWith($item['tag'], 'NN') && $this->endsWith($item['word'], 'ing')) {
                $tagged[$index]['tag'] = 'VBG';
            }

        }

        return $tagged;
    }

    private function lookup($word) {

        $query = $this->dm->getRepository('\FYP\Database\Documents\Lexicon');
        $result = $query->findOneBy(array('phrase' => $word));
        if (empty($result)) {
            $result = $query->findOneBy(array('phrase' => strtolower($word)));
        }

        if (empty($result)) {
            return self::DEFAULT_TAG;
        } else {
            return $result->getTags()[0];
        }

    }

    public function startsWith($string, $substring) {
        if (empty($string) || empty($substring)) return false;
        return strpos($string, $substring) === 0;
    }

    public function endsWith($string, $substring) {
        if (empty($string) || empty($substring) || strlen($substring) > strlen($string)) return false;

        return strpos($string, $substring) !== false && strpos($string, $substring) == strlen($string) - strlen($substring);
    }

} 