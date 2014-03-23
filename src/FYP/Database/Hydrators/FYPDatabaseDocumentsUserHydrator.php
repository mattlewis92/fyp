<?php

namespace FYP\Database\Hydrators;

use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Mapping\ClassMetadata;
use Doctrine\ODM\MongoDB\Hydrator\HydratorInterface;
use Doctrine\ODM\MongoDB\UnitOfWork;

/**
 * THIS CLASS WAS GENERATED BY THE DOCTRINE ODM. DO NOT EDIT THIS FILE.
 */
class FYPDatabaseDocumentsUserHydrator implements HydratorInterface
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

        /** @Field(type="string") */
        if (isset($data['name'])) {
            $value = $data['name'];
            $return = (string) $value;
            $this->class->reflFields['name']->setValue($document, $return);
            $hydratedData['name'] = $return;
        }

        /** @Field(type="string") */
        if (isset($data['surname'])) {
            $value = $data['surname'];
            $return = (string) $value;
            $this->class->reflFields['surname']->setValue($document, $return);
            $hydratedData['surname'] = $return;
        }

        /** @Field(type="string") */
        if (isset($data['company'])) {
            $value = $data['company'];
            $return = (string) $value;
            $this->class->reflFields['company']->setValue($document, $return);
            $hydratedData['company'] = $return;
        }

        /** @Field(type="string") */
        if (isset($data['location'])) {
            $value = $data['location'];
            $return = (string) $value;
            $this->class->reflFields['location']->setValue($document, $return);
            $hydratedData['location'] = $return;
        }

        /** @Field(type="string") */
        if (isset($data['group_name'])) {
            $value = $data['group_name'];
            $return = (string) $value;
            $this->class->reflFields['groupName']->setValue($document, $return);
            $hydratedData['groupName'] = $return;
        }

        /** @Field(type="collection") */
        if (isset($data['keywords'])) {
            $value = $data['keywords'];
            $return = $value;
            $this->class->reflFields['keywords']->setValue($document, $return);
            $hydratedData['keywords'] = $return;
        }

        /** @Field(type="collection") */
        if (isset($data['twitter_profiles'])) {
            $value = $data['twitter_profiles'];
            $return = $value;
            $this->class->reflFields['twitterProfiles']->setValue($document, $return);
            $hydratedData['twitterProfiles'] = $return;
        }

        /** @Field(type="collection") */
        if (isset($data['linked_in_profiles'])) {
            $value = $data['linked_in_profiles'];
            $return = $value;
            $this->class->reflFields['linkedInProfiles']->setValue($document, $return);
            $hydratedData['linkedInProfiles'] = $return;
        }

        /** @Field(type="collection") */
        if (isset($data['other_links'])) {
            $value = $data['other_links'];
            $return = $value;
            $this->class->reflFields['otherLinks']->setValue($document, $return);
            $hydratedData['otherLinks'] = $return;
        }
        return $hydratedData;
    }
}