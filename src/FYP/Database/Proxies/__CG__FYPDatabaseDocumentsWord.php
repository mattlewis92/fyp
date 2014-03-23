<?php

namespace FYP\Database\Proxies\__CG__\FYP\Database\Documents;

use Doctrine\ODM\MongoDB\Persisters\DocumentPersister;

/**
 * THIS CLASS WAS GENERATED BY THE DOCTRINE ODM. DO NOT EDIT THIS FILE.
 */
class Word extends \FYP\Database\Documents\Word implements \Doctrine\ODM\MongoDB\Proxy\Proxy
{
    private $__documentPersister__;
    public $__identifier__;
    public $__isInitialized__ = false;
    public function __construct(DocumentPersister $documentPersister, $identifier)
    {
        $this->__documentPersister__ = $documentPersister;
        $this->__identifier__ = $identifier;
    }
    /** @private */
    public function __load()
    {
        if (!$this->__isInitialized__ && $this->__documentPersister__) {
            $this->__isInitialized__ = true;

            if (method_exists($this, "__wakeup")) {
                // call this after __isInitialized__to avoid infinite recursion
                // but before loading to emulate what ClassMetadata::newInstance()
                // provides.
                $this->__wakeup();
            }

            if ($this->__documentPersister__->load($this->__identifier__, $this) === null) {
                throw \Doctrine\ODM\MongoDB\DocumentNotFoundException::documentNotFound(get_class($this), $this->__identifier__);
            }
            unset($this->__documentPersister__, $this->__identifier__);
        }
    }

    /** @private */
    public function __isInitialized()
    {
        return $this->__isInitialized__;
    }

    
    public function getId()
    {
        if ($this->__isInitialized__ === false) {
            return $this->__identifier__;
        }
        $this->__load();
        return parent::getId();
    }

    public function setLemma($lemma)
    {
        $this->__load();
        return parent::setLemma($lemma);
    }

    public function getLemma()
    {
        $this->__load();
        return parent::getLemma();
    }

    public function setIsThesaurus($isThesaurus)
    {
        $this->__load();
        return parent::setIsThesaurus($isThesaurus);
    }

    public function getIsThesaurus()
    {
        $this->__load();
        return parent::getIsThesaurus();
    }

    public function setIsWikipedia($isWikipedia)
    {
        $this->__load();
        return parent::setIsWikipedia($isWikipedia);
    }

    public function getIsWikipedia()
    {
        $this->__load();
        return parent::getIsWikipedia();
    }

    public function setNeo4jId($neo4jId)
    {
        $this->__load();
        return parent::setNeo4jId($neo4jId);
    }

    public function getNeo4jId()
    {
        $this->__load();
        return parent::getNeo4jId();
    }


    public function __sleep()
    {
        return array('__isInitialized__', 'id', 'lemma', 'isThesaurus', 'isWikipedia', 'neo4jId');
    }

    public function __clone()
    {
        if (!$this->__isInitialized__ && $this->__documentPersister__) {
            $this->__isInitialized__ = true;
            $class = $this->__documentPersister__->getClassMetadata();
            $original = $this->__documentPersister__->load($this->__identifier__);
            if ($original === null) {
                throw \Doctrine\ODM\MongoDB\MongoDBException::documentNotFound(get_class($this), $this->__identifier__);
            }
            foreach ($class->reflFields AS $field => $reflProperty) {
                $reflProperty->setValue($this, $reflProperty->getValue($original));
            }
            unset($this->__documentPersister__, $this->__identifier__);
        }
        
    }
}