<?php

namespace FYP;

use Doctrine\MongoDB\Connection;
use Doctrine\ODM\MongoDB\Configuration;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Mapping\Driver\AnnotationDriver;
use SlimController\Slim;

class App extends Slim {

    private static $di = null;

    public function __construct() {

        //hydrate post data with the json string that angular sends.
        $postdata = file_get_contents("php://input");
        if (!empty($postdata)) {
            $request = json_decode($postdata, true);
            foreach($request as $key => $value) {
                $_POST[$key] = $value;
            }
        }


        parent::__construct(array(
            'controller.class_prefix'    => '\\FYP\\API\\Controller',
            'controller.method_suffix'   => 'Action',
        ));
    }

    public static function getDI() {
        if (empty(self::$di)) {
            self::setupDependencyInjection();
        }
        return self::$di;
    }

    private static function setupDependencyInjection() {
        $di = new \Pimple();

        $di['config'] = function($c) {
            return new Config();
        };

        $di['doctrineManager'] = function($c) {
            $config = $c['config']->get('doctrine');

            $connection = new Connection();

            $doctrineConfig = new Configuration();
            $doctrineConfig->setProxyDir($config['proxyDir']);
            $doctrineConfig->setProxyNamespace($config['proxyNamespace']);
            $doctrineConfig->setHydratorDir($config['hydratorDir']);
            $doctrineConfig->setHydratorNamespace($config['hydratorNamespace']);
            $doctrineConfig->setDefaultDB($config['dbname']);
            $doctrineConfig->setMetadataDriverImpl(AnnotationDriver::create($config['documentDir']));

            AnnotationDriver::registerAnnotationClasses();

            return DocumentManager::create($connection, $doctrineConfig);
        };

        $di['neo4j'] = function($c) {
            $config = $c['config']->get('neo4j');
            return new \Everyman\Neo4j\Client($config['host']);
        };

        self::$di = $di;
    }

    public function initRoutes() {

        $this->addRoutes(array(
            '/api/social/linkedin'          => 'Social:getLinkedInProfile',
            '/api/social/twitter'           => 'Social:getTwitterProfile',
            '/api/nlp/extract_keywords'     => 'NLP:extractKeywords',
            '/api/nlp/synonym_check'        => 'NLP:synonymCheck',
            '/api/user/get_group_names'     => 'User:getGroupNames',
            '/api/user/find_by_group_name'  => 'User:findByGroupName',
            '/api/user/delete'              => 'User:delete',
            '/api/user/save'                => 'User:save',
            '.+'                            => 'Index:index'
        ));

    }

    public function run() {
        $this->initRoutes();
        return parent::run();
    }



} 