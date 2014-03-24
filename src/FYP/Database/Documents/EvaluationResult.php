<?php

namespace FYP\Database\Documents;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

/**
 * @ODM\Document(collection="evaluation_result")
 */
class EvaluationResult {

    /** @ODM\Id */
    private $id;

    /** @ODM\Collection */
    private $user = array();

    /** @ODM\Collection */
    private $result = array();


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
     * Set user
     *
     * @param collection $user
     * @return self
     */
    public function setUser($user)
    {
        $this->user = $user;
        return $this;
    }

    /**
     * Get user
     *
     * @return collection $user
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * Set result
     *
     * @param collection $result
     * @return self
     */
    public function setResult($result)
    {
        $this->result = $result;
        return $this;
    }

    /**
     * Get result
     *
     * @return collection $result
     */
    public function getResult()
    {
        return $this->result;
    }
}
