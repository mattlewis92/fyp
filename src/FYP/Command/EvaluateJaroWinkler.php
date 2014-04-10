<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;


class EvaluateJaroWinkler extends Command {

    protected function configure() {
        $this
            ->setName('evaluate:jaro-winkler')
            ->setDescription('Evaluates how well Jaro-Winkler works')
            ->addArgument(
                'threshold',
                InputArgument::REQUIRED,
                'The threshold to use to decide if the two strings are the same'
            )
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $threshold = (float) $input->getArgument('threshold');

        $dm = $this->getHelperSet()->get('dm')->getDocumentManager();

        $users = $dm
            ->createQueryBuilder('\FYP\Database\Documents\User')
            ->field('group_name')
            ->equals('Tech Wednesday')
            ->getQuery()
            ->execute();

        $tableHelper = $this
            ->getHelperSet()
            ->get('table');

        //twitter

        $twitterTable = $tableHelper
            ->setLayout($tableHelper::LAYOUT_COMPACT)
            ->setHeaders(array('Given name', 'Profile name', 'Jaro-Winkler', 'Given location', 'Profile location', 'Jaro-Winkler', 'Is profile actually correct', 'Is deemed to be correct', 'Pass?'));
        $twitterRows = array();

        $twitterCorrect = 0;

        foreach($users as $user) {

            foreach($user->getTwitterProfiles() as $profile) {

                $givenName = $user->getName() . ' ' . $user->getSurname();

                $nameScore = JaroWinkler($givenName, $profile['profile']['name']);

                $locationScore = '';

                if (empty($user->getLocation()) || empty($profile['profile']['location'])) {
                    $shouldBeSelected = $nameScore > $threshold;
                } else {

                    $locationScore = JaroWinkler($user->getLocation(), $profile['profile']['location']);
                    $shouldBeSelected = $nameScore > $threshold && $locationScore > $threshold;
                }

                $isActuallySelected = $profile['isSelected'];

                $twitterRows[] = array(
                    $givenName,
                    $profile['profile']['name'],
                    $nameScore,
                    $user->getLocation(),
                    $profile['profile']['location'],
                    $locationScore,
                    $isActuallySelected ? 'yes' : 'no',
                    $shouldBeSelected ? 'yes' : 'no',
                    $isActuallySelected == $shouldBeSelected ? 'yes' : 'no'
                );

                if ($isActuallySelected == $shouldBeSelected) $twitterCorrect++;

            }

        }

        $twitterTable->setRows($twitterRows);
        //$twitterTable->render($output);

        $output->writeln('<info>Twitter percentage correct: ' . round(($twitterCorrect / count($twitterRows)) * 100, 2) . '</info>');

        file_put_contents('files/jarowinkler/twitter_' . $threshold . '.csv', generateCsv($twitterRows));

        //linkedin


        $linkedinTable = $tableHelper
            ->setLayout($tableHelper::LAYOUT_COMPACT)
            ->setHeaders(array('Given name', 'Profile name', 'Jaro-Winkler', 'Given location', 'Profile location', 'Jaro-Winkler', 'Is profile actually correct', 'Is deemed to be correct', 'Pass?'));
        $linkedinRows = array();

        $linkedinCorrect = 0;

        foreach($users as $user) {

            foreach($user->getLinkedInProfiles() as $profile) {

                $givenName = $user->getName() . ' ' . $user->getSurname();

                $profile['profile']['name'] = $profile['profile']['firstName'] . ' ' . $profile['profile']['lastName'];

                $nameScore = JaroWinkler($givenName, $profile['profile']['name']);

                $locationScore = '';

                if (empty($user->getLocation()) || empty($profile['profile']['location']['name'])) {
                    $shouldBeSelected = $nameScore > $threshold;
                } else {

                    $locationScore = JaroWinkler($user->getLocation(), $profile['profile']['location']['name']);
                    $shouldBeSelected = $nameScore > $threshold && $locationScore > $threshold;
                }

                $isActuallySelected = $profile['isSelected'];

                $linkedinRows[] = array(
                    $givenName,
                    $profile['profile']['name'],
                    $nameScore,
                    $user->getLocation(),
                    empty($profile['profile']['location']['name']) ? '' : $profile['profile']['location']['name'],
                    $locationScore,
                    $isActuallySelected ? 'yes' : 'no',
                    $shouldBeSelected ? 'yes' : 'no',
                    $isActuallySelected == $shouldBeSelected ? 'yes' : 'no'
                );

                if ($isActuallySelected == $shouldBeSelected) $linkedinCorrect++;

            }

        }

        $linkedinTable->setRows($linkedinRows);
        //$linkedinTable->render($output);

        $output->writeln('<info>Linkedin percentage correct: ' . round(($linkedinCorrect / count($linkedinRows)) * 100, 2) . '</info>');

        file_put_contents('files/jarowinkler/linkedin_' . $threshold . '.csv', generateCsv($linkedinRows));

        $output->writeLn('<info>Total percentage correct:' . round((($linkedinCorrect + $twitterCorrect) / (count($linkedinRows) + count($twitterRows))) * 100, 2) . '</info>');
    }

}

/*
  version 1.3

  Copyright (c) 2005-2013  Ivo Ugrina <ivo@iugrina.com>

  A PHP library implementing Jaro and Jaro-Winkler
  distance, measuring similarity between strings.

  Theoretical stuff can be found in:
  Winkler, W. E. (1999). "The state of record linkage and current
  research problems". Statistics of Income Division, Internal Revenue
  Service Publication R99/04. http://www.census.gov/srd/papers/pdf/rr99-04.pdf.


  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 3 of the License, or (at
  your option) any later version.

  This program is distributed in the hope that it will be useful, but
  WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.

  ===

  A big thanks goes out to Pierre Senellart <pierre@senellart.com>
  for finding a small bug in the code. Also, thanks goes out to
  Debabrata Kar <debakjr@gmail.com> for help in transition to
  PHP 5.4+.

*/


function getCommonCharacters( $string1, $string2, $allowedDistance ){

    $str1_len = strlen($string1);
    $str2_len = strlen($string2);
    $temp_string2 = $string2;

    $commonCharacters='';

    for( $i=0; $i < $str1_len; $i++){

        $noMatch = True;

        // compare if char does match inside given allowedDistance
        // and if it does add it to commonCharacters
        for( $j= max( 0, $i-$allowedDistance ); $noMatch && $j < min( $i + $allowedDistance + 1, $str2_len ); $j++){
            if( $temp_string2[$j] == $string1[$i] ){
                $noMatch = False;

                $commonCharacters .= $string1[$i];

                $temp_string2[$j] = '';
            }
        }
    }

    return $commonCharacters;
}

function Jaro( $string1, $string2 ){

    $str1_len = strlen( $string1 );
    $str2_len = strlen( $string2 );

    // theoretical distance
    $distance = (int) floor(min( $str1_len, $str2_len ) / 2.0);

    // get common characters
    $commons1 = getCommonCharacters( $string1, $string2, $distance );
    $commons2 = getCommonCharacters( $string2, $string1, $distance );

    if( ($commons1_len = strlen( $commons1 )) == 0) return 0;
    if( ($commons2_len = strlen( $commons2 )) == 0) return 0;

    // calculate transpositions
    $transpositions = 0;
    $upperBound = min( $commons1_len, $commons2_len );
    for( $i = 0; $i < $upperBound; $i++){
        if( $commons1[$i] != $commons2[$i] ) $transpositions++;
    }
    $transpositions /= 2.0;

    // return the Jaro distance
    return ($commons1_len/($str1_len) + $commons2_len/($str2_len) + ($commons1_len - $transpositions)/($commons1_len)) / 3.0;

}

function getPrefixLength( $string1, $string2, $MINPREFIXLENGTH = 4 ){

    $n = min( array( $MINPREFIXLENGTH, strlen($string1), strlen($string2) ) );

    for($i = 0; $i < $n; $i++){
        if( $string1[$i] != $string2[$i] ){
            // return index of first occurrence of different characters
            return $i;
        }
    }

    // first n characters are the same
    return $n;
}

function JaroWinkler($string1, $string2, $PREFIXSCALE = 0.1 ){

    $JaroDistance = Jaro( $string1, $string2 );

    $prefixLength = getPrefixLength( $string1, $string2 );

    return $JaroDistance + $prefixLength * $PREFIXSCALE * (1.0 - $JaroDistance);
}

function generateCsv($data, $delimiter = ',', $enclosure = '"') {
    $handle = fopen('php://temp', 'r+');
    foreach ($data as $line) {
        fputcsv($handle, $line, $delimiter, $enclosure);
    }
    rewind($handle);
    $contents = '';
    while (!feof($handle)) {
        $contents .= fread($handle, 8192);
    }
    fclose($handle);
    return $contents;
}