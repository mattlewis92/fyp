<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class EvaluateMatches extends Command {

    protected function configure() {
        $this
            ->setName('evaluate:matches')
            ->setDescription('Evaluates the matching system between users')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $results = $dm
            ->createQueryBuilder('\FYP\Database\Documents\EvaluationResult')
            ->getQuery()
            ->execute();

        $recalls = array();
        $precisions = array();
        $fscores = array();

        $table = $this
            ->getHelperSet()
            ->get('table')
            ->setHeaders(array('number Of Matches Found', 'number Of Actual Matches', 'number Of Matches Correctly Identified', 'precision', 'recall', 'fscore'));

        $rows = array();

        foreach($results as $item) {

            $result = $item->getResult();

            $numberOfMatchesFound = count(array_filter($result, function($item) {
                return $item['calculatedScore'] > 0;
            }));

            $numberOfActualMatches = count(array_filter($result, function($item) {
                return $item['userSaidGoodMatch'];
            }));

            $numberOfMatchesCorrectlyIdentified = count(array_filter($result, function($item) {
                return $item['calculatedScore'] > 0 && $item['userSaidGoodMatch'];
            }));

            $precision = $numberOfMatchesCorrectlyIdentified / $numberOfMatchesFound;

            $recall = $numberOfMatchesCorrectlyIdentified / $numberOfActualMatches;

            if ($precision == 0 && $recall == 0) {
                $fscore = 0;
            } else {
                $fscore = (2 * $precision * $recall) / ($precision + $recall);
            }

            $rows[] = array(
                '$numberOfMatchesFound' => $numberOfMatchesFound,
                '$numberOfActualMatches' => $numberOfActualMatches,
                '$numberOfMatchesCorrectlyIdentified'   => $numberOfMatchesCorrectlyIdentified,
                '$precision'    => $precision,
                '$recall'   => $recall,
                '$fscore'   => $fscore
            );

            $recalls[] = $recall;
            $precisions[] = $precision;
            $fscores[] = $fscore;

        }

        $table->setRows($rows);
        $table->render($output);



        print_r(array(
           'precision' => array(
               'median' => $this->median($precisions),
               'mean'   => $this->mean($precisions),
               'standardDeviation'  => $this->standardDeviation($precisions)
           ),
           'recall' => array(
                'median' => $this->median($recalls),
                'mean'   => $this->mean($recalls),
                'standardDeviation'  => $this->standardDeviation($recalls)
           ),
           'fscore' => array(
                'median' => $this->median($fscores),
                'mean'   => $this->mean($fscores),
                'standardDeviation'  => $this->standardDeviation($fscores)
           )
        ));



    }

    private function median($array)  {
        rsort($array);
        $middle = round(count($array) / 2);
        return $array[$middle-1];
    }

    private function mean($array) {
        $count = count($array);
        $sum = array_sum($array);
        return $sum / $count;
    }

    private function standardDeviation($array, $sample = false) {
        $n = count($array);
        if ($n === 0) {
            trigger_error("The array has zero elements", E_USER_WARNING);
            return false;
        }
        if ($sample && $n === 1) {
            trigger_error("The array has only 1 element", E_USER_WARNING);
            return false;
        }
        $mean = array_sum($array) / $n;
        $carry = 0.0;
        foreach ($array as $val) {
            $d = ((double) $val) - $mean;
            $carry += $d * $d;
        };
        if ($sample) {
            --$n;
        }
        return sqrt($carry / $n);
    }


} 