<?php

namespace FYP\Database\Documents;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

/**
 * @ODM\Document(collection="lexicon")
 */
class Lexicon
{
    /** @ODM\Id */
    private $id;

    /** @ODM\String(name="phrase") @ODM\Index */
    private $phrase;

    /** @ODM\Collection */
    private $tags = array();


    /**
     * Get id
     *
     * @return id $id
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set phrase
     *
     * @param string $phrase
     * @return self
     */
    public function setPhrase($phrase)
    {
        $this->phrase = $phrase;
        return $this;
    }

    /**
     * Get phrase
     *
     * @return string $phrase
     */
    public function getPhrase()
    {
        return $this->phrase;
    }

    /**
     * Set tags
     *
     * @param collection $tags
     * @return self
     */
    public function setTags($tags)
    {
        $this->tags = $tags;
        return $this;
    }

    /**
     * Get tags
     *
     * @return collection $tags
     */
    public function getTags()
    {
        return $this->tags;
    }
}
