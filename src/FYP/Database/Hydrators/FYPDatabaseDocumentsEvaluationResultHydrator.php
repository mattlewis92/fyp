<?php

namespace FYP\Database\Hydrators;

use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Mapping\ClassMetadata;
use Doctrine\ODM\MongoDB\Hydrator\HydratorInterface;
use Doctrine\ODM\MongoDB\UnitOfWork;

/**
 * THIS CLASS WAS GENERATED BY THE DOCTRINE ODM. DO NOT EDIT THIS FILE.
 */
class FYPDatabaseDocumentsEvaluationResultHydrator implements HydratorInterface
{
    private $dm;
    private $unitOfWork;
    private $class;

    public function __construct(DocumentManager $dm, UnitOfWork $uow, ClassMetadata $class)
    {
        $this->dm = $dm;
        $this->unitOfWork = $uow;
        $this->class = $class;
    }

    public function hydrate($document, $data, array $hints = array())
    {
        $hydratedData = array();

        /** @Field(type="id") */
        if (isset($data['_id'])) {
            $value = $data['_id'];
            $return = $value instanceof \MongoId ? (string) $value : $value;
            $this->class->reflFields['id']->setValue($document, $return);
            $hydratedData['id'] = $return;
        }

        /** @Field(type="collection") */
        if (isset($data['user'])) {
            $value = $data['user'];
            $return = $value;
            $this->class->reflFields['user']->setValue($document, $return);
            $hydratedData['user'] = $return;
        }

        /** @Field(type="collection") */
        if (isset($data['result'])) {
            $value = $data['result'];
            $return = $value;
            $this->class->reflFields['result']->setValue($document, $return);
            $hydratedData['result'] = $return;
        }
        return $hydratedData;
    }
}