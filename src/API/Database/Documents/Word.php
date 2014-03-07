<?php

namespace API\Database\Documents;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

/**
 * @ODM\Document(collection="word")
 */
class Word
{
    /** @ODM\Id */
    private $id;

    /** @ODM\String @ODM\Index */
    private $lemma;

    /** @ODM\String @ODM\Index */
    private $pos;

    /** @ODM\String(name="is_wordnet") */
    private $isWordnet;

    /** @ODM\String(name="is_wikipedia") */
    private $isWikipedia;

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
     * Set lemma
     *
     * @param string $lemma
     * @return self
     */
    public function setLemma($lemma)
    {
        $this->lemma = $lemma;
        return $this;
    }

    /**
     * Get lemma
     *
     * @return string $lemma
     */
    public function getLemma()
    {
        return $this->lemma;
    }

    /**
     * Set pos
     *
     * @param string $pos
     * @return self
     */
    public function setPos($pos)
    {
        $this->pos = $pos;
        return $this;
    }

    /**
     * Get pos
     *
     * @return string $pos
     */
    public function getPos()
    {
        return $this->pos;
    }

    /**
     * Set isWordnet
     *
     * @param string $isWordnet
     * @return self
     */
    public function setIsWordnet($isWordnet)
    {
        $this->isWordnet = $isWordnet;
        return $this;
    }

    /**
     * Get isWordnet
     *
     * @return string $isWordnet
     */
    public function getIsWordnet()
    {
        return $this->isWordnet;
    }

    /**
     * Set isWikipedia
     *
     * @param string $isWikipedia
     * @return self
     */
    public function setIsWikipedia($isWikipedia)
    {
        $this->isWikipedia = $isWikipedia;
        return $this;
    }

    /**
     * Get isWikipedia
     *
     * @return string $isWikipedia
     */
    public function getIsWikipedia()
    {
        return $this->isWikipedia;
    }
}
