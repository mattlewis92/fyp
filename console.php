<?php

require 'vendor/autoload.php';

$doctrineManager = \FYP\App::getDI()['doctrineManager'];

$helpers = array(
    'dm' => new Doctrine\ODM\MongoDB\Tools\Console\Helper\DocumentManagerHelper($doctrineManager),
    'progress' => new Symfony\Component\Console\Helper\ProgressHelper()
);

$helperSet = isset($helperSet) ? $helperSet : new \Symfony\Component\Console\Helper\HelperSet();
foreach ($helpers as $name => $helper) {
    $helperSet->set($helper, $name);
}

$cli = new \Symfony\Component\Console\Application('FYP Command Line Interface', Doctrine\ODM\MongoDB\Version::VERSION);
$cli->setCatchExceptions(true);
$cli->setHelperSet($helperSet);
$cli->addCommands(array(
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\QueryCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\GenerateDocumentsCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\GenerateRepositoriesCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\GenerateProxiesCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\GenerateHydratorsCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\ClearCache\MetadataCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\Schema\CreateCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\Schema\UpdateCommand(),
    new \Doctrine\ODM\MongoDB\Tools\Console\Command\Schema\DropCommand(),
));

foreach(array('Command', 'Worker') as $directory) {
    if ($handle = opendir(__DIR__ . '/src/FYP/' . $directory)) {

        while (false !== ($entry = readdir($handle))) {
            if (!in_array($entry, array('.', '..'))) {
                $class = '\FYP\\' . $directory . '\\' . str_ireplace('.php', '', $entry);
                $cli->add(new $class);
            }
        }

        closedir($handle);
    } else {
        exit('Could not read ' . $directory . ' directory');
    }
}



$cli->run();