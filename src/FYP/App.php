<?php

namespace FYP;

use Doctrine\MongoDB\Connection;
use Doctrine\ODM\MongoDB\Configuration;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Mapping\Driver\AnnotationDriver;


class App {

    private static $di = null;

    public function __construct() {
        $this->setupDependencyInjection();
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

        self::$di = $di;
    }



} 