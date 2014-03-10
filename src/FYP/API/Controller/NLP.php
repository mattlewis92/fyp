<?php

namespace FYP\API\Controller;

use FYP\Utility\NLP\KeywordExtractor;
use \FYP\Utility\BaseController;

class NLP extends BaseController {

    public function extractKeywordsAction() {

        $extractor = new KeywordExtractor();
        $text = $this->request()->post('text');
        $extracted = $extractor->extract($text);
        $this->sendResponse($extracted);

    }

} 