<?php

namespace FYP\Database\Documents;

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

    /** @ODM\String(name="is_thesaurus") */
    private $isThesaurus;

    /** @ODM\String(name="is_wikipedia") */
    private $isWikipedia;

    /** @ODM\Int(name="neo4j_id") */
    private $neo4jId;

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
        $this->lemma = strtolower($lemma);
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
     * Set isThesaurus
     *
     * @param string $isThesaurus
     * @return self
     */
    public function setIsThesaurus($isThesaurus)
    {
        $this->isThesaurus = $isThesaurus;
        return $this;
    }

    /**
     * Get isThesaurus
     *
     * @return string $isThesaurus
     */
    public function getIsThesaurus()
    {
        return $this->isThesaurus;
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

    /**
     * Set neo4jId
     *
     * @param int $neo4jId
     * @return self
     */
    public function setNeo4jId($neo4jId)
    {
        $this->neo4jId = $neo4jId;
        return $this;
    }

    /**
     * Get neo4jId
     *
     * @return int $neo4jId
     */
    public function getNeo4jId()
    {
        return $this->neo4jId;
    }
}
