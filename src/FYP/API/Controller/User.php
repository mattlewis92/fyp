<?php

namespace FYP\API\Controller;

use \FYP\Utility\BaseController;

class User extends BaseController
{

    /**
     * Save a new or existing user to the database
     */
    public function saveAction()
    {

        $dm = \FYP\APP::getDI()['doctrineManager'];

        $data = $this->request()->post('user');

        //if the user already exists
        if ($data['id']) {
            $user = $dm
                ->getRepository('\FYP\Database\Documents\User')
                ->find($data['id']);
        } else { //otherwise make a new user
            $user = new \FYP\Database\Documents\User();
        }

        if (empty($data['company'])) $data['company'] = null;
        if (empty($data['location'])) $data['location'] = null;
        if (empty($data['keywords'])) $data['keywords'] = array();
        if (empty($data['twitter_profiles'])) $data['twitter_profiles'] = array();
        if (empty($data['linked_in_profiles'])) $data['linked_in_profiles'] = array();
        if (empty($data['other_links'])) $data['other_links'] = array();

        $newKeywords = array();
        foreach ($data['keywords'] as $word => $count) {
            $newKeywords[] = array(
                'word' => $word,
                'count' => $count
            );
        }

        $user
            ->setName($data['name'])
            ->setSurname($data['surname'])
            ->setCompany($data['company'])
            ->setLocation($data['location'])
            ->setGroupName($data['group_name'])
            ->setKeywords($newKeywords)
            ->setTwitterProfiles($data['twitter_profiles'])
            ->setLinkedInProfiles($data['linked_in_profiles'])
            ->setOtherLinks($data['other_links']);

        $dm->persist($user);
        $dm->flush();
        $dm->clear();

        $this->sendResponse(array('saved' => true, 'id' => $user->getId()));

    }

    /**
     * Delete a saved user from the database
     */
    public function deleteAction()
    {
        \FYP\APP::getDI()['doctrineManager']
            ->createQueryBuilder('\FYP\Database\Documents\User')
            ->remove()
            ->field('_id')
            ->equals($this->request()->post('id'))
            ->getQuery()
            ->execute();

        $this->sendResponse(array('deleted' => true));
    }

    /**
     * Find all users in a given group
     */
    public function findByGroupNameAction()
    {
        $users = \FYP\APP::getDI()['doctrineManager']
            ->createQueryBuilder('\FYP\Database\Documents\User')
            ->hydrate(false)
            ->field('group_name')
            ->equals($this->request()->get('group_name'))
            //->limit(10)
            ->getQuery()
            ->execute()
            ->toArray();

        foreach($users as $key => $user) {
            $keywords = array();
            foreach($user['keywords'] as $keyword) {
                $keywords[$keyword['word']] = $keyword['count'];
            }
            $users[$key]['keywords'] = $keywords;
        }

        $this->sendResponse($users);
    }

    /**
     * Get all group names
     */
    public function getGroupNamesAction()
    {

        $user = new \FYP\Database\Documents\User();
        $user->setName('hello')->setGroupName('test');


        $groups = \FYP\APP::getDI()['doctrineManager']->createQueryBuilder('\FYP\Database\Documents\User')
            ->distinct('group_name')
            ->hydrate(false)
            ->getQuery()
            ->execute();

        $this->sendResponse(array('groups' => $groups->toArray()));
    }

    /**
     * Method for storing evaluation results
     */
    public function storeEvaluationAction() {

        $data = $this->request()->post('result');

        $result = new \FYP\Database\Documents\EvaluationResult();
        $result->setUser(array($data['user']))->setResult($data['results']);

        $dm = \FYP\APP::getDI()['doctrineManager'];
        $dm->persist($result);
        $dm->flush();

        $this->sendResponse(array('success' => true));

    }

} 