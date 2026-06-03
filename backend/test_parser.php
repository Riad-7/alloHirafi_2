<?php
require __DIR__.'/vendor/autoload.php';
$parser = new Illuminate\Support\ConfigurationUrlParser;
print_r($parser->parseConfiguration(["url" => "postgres://user:p%40ss@host/db"]));
