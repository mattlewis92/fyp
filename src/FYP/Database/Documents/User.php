<?php

namespace FYP\Database\Documents;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

/**
 * @ODM\Document(collection="user")
 */
class User {

    /** @ODM\Id */
    private $id;

    /** @ODM\String */
    private $name;

    /** @ODM\String */
    private $surname;

    /** @ODM\String */
    private $company;

    /** @ODM\String */
    private $location;

    /** @ODM\String(name="group_name") */
    private $groupName;

    /** @ODM\Collection */
    private $keywords = array();

    /** @ODM\Collection(name="twitter_profiles") */
    private $twitterProfiles = array();

    /** @ODM\Collection(name="linked_in_profiles") */
    private $linkedInProfiles = array();

    /** @ODM\Collection(name="other_links") */
    private $otherLinks = array();

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
     * Set name
     *
     * @param string $name
     * @return self
     */
    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }

    /**
     * Get name
     *
     * @return string $name
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set surname
     *
     * @param string $surname
     * @return self
     */
    public function setSurname($surname)
    {
        $this->surname = $surname;
        return $this;
    }

    /**
     * Get surname
     *
     * @return string $surname
     */
    public function getSurname()
    {
        return $this->surname;
    }

    /**
     * Set company
     *
     * @param string $company
     * @return self
     */
    public function setCompany($company)
    {
        $this->company = $company;
        return $this;
    }

    /**
     * Get company
     *
     * @return string $company
     */
    public function getCompany()
    {
        return $this->company;
    }

    /**
     * Set location
     *
     * @param string $location
     * @return self
     */
    public function setLocation($location)
    {
        $this->location = $location;
        return $this;
    }

    /**
     * Get location
     *
     * @return string $location
     */
    public function getLocation()
    {
        return $this->location;
    }

    /**
     * Set groupName
     *
     * @param string $groupName
     * @return self
     */
    public function setGroupName($groupName)
    {
        $this->groupName = $groupName;
        return $this;
    }

    /**
     * Get groupName
     *
     * @return string $groupName
     */
    public function getGroupName()
    {
        return $this->groupName;
    }

    /**
     * Set keywords
     *
     * @param collection $keywords
     * @return self
     */
    public function setKeywords($keywords)
    {
        $this->keywords = $keywords;
        return $this;
    }

    /**
     * Get keywords
     *
     * @return collection $keywords
     */
    public function getKeywords()
    {
        return $this->keywords;
    }

    /**
     * Set twitterProfiles
     *
     * @param collection $twitterProfiles
     * @return self
     */
    public function setTwitterProfiles($twitterProfiles)
    {
        $this->twitterProfiles = $twitterProfiles;
        return $this;
    }

    /**
     * Get twitterProfiles
     *
     * @return collection $twitterProfiles
     */
    public function getTwitterProfiles()
    {
        return $this->twitterProfiles;
    }

    /**
     * Set linkedInProfiles
     *
     * @param collection $linkedInProfiles
     * @return self
     */
    public function setLinkedInProfiles($linkedInProfiles)
    {
        $this->linkedInProfiles = $linkedInProfiles;
        return $this;
    }

    /**
     * Get linkedInProfiles
     *
     * @return collection $linkedInProfiles
     */
    public function getLinkedInProfiles()
    {
        return $this->linkedInProfiles;
    }

    /**
     * Set otherLinks
     *
     * @param collection $otherLinks
     * @return self
     */
    public function setOtherLinks($otherLinks)
    {
        $this->otherLinks = $otherLinks;
        return $this;
    }

    /**
     * Get otherLinks
     *
     * @return collection $otherLinks
     */
    public function getOtherLinks()
    {
        return $this->otherLinks;
    }
}
