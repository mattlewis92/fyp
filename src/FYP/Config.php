<?php

namespace FYP;


class Config {

    private $config = array();

    public function __construct() {
        $this->config['rootDir'] = __DIR__ . '/../../';
        $this->config['publicDir'] = $this->config['rootDir'] . 'public/';
        $this->config['commandDir'] = $this->config['rootDir'] . 'src/FYP/Command';
        $this->config['workerDir'] = $this->config['rootDir'] . 'src/FYP/Worker';

        $this->config['doctrine'] = array(
            'proxyDir'          => 'src/FYP/Database/Proxies',
            'proxyNamespace'    => 'FYP\Database\Proxies',
            'hydratorDir'       => 'src/FYP/Database/Hydrators',
            'hydratorNamespace' => 'FYP\Database\Hydrators',
            'documentDir'       => 'src/FYP/Database/Documents',
            'dbname'            => 'fyp'
        );

        $defaultConfig = parse_ini_file($this->config['rootDir'] . 'config/default.ini', true);

        foreach($defaultConfig as $key => $value) {
            $this->config[$key] = $value;
        }

        $environment = getenv('FYP_ENV');
        if (empty($environment)) $environment = 'development';
        $environmentConfig = parse_ini_file($this->config['rootDir'] . 'config/' . $environment . '.ini', true);

        foreach($environmentConfig as $key => $value) {
            $this->config[$key] = $value;
        }
    }

    public function get($key) {
        if (empty($this->config[$key])) throw new \Exception('This config value doesn\'t exist!');
        return $this->config[$key];
    }

} 