<?php

namespace FYP\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Extracts member details from the tech wednesday meetup group
 *
 * Class ExtractTechWednesday
 * @package FYP\Command
 */
class ExtractTechWednesday extends Command {

    protected function configure() {
        $this
            ->setName('extract:tech-wednesday')
            ->setDescription('Crawls the tech wednesday group and extracts member names and info')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        ini_set("auto_detect_line_endings", true);

        error_reporting(E_ALL);

        //Work out how many members there are in total
        $baseUrl = 'http://www.meetup.com/tech-wednesday/members/?offset=%d&desc=1&sort=chapter_member.atime';

        $firstPage = file_get_contents(sprintf($baseUrl, 0));

        preg_match("/All members <span class=\"D_count\">\((\d+)\)<\/span>/", $firstPage, $match);

        $totalMembers = $match[1];

        $fp = fopen('files/techWednesday.csv', 'w');

        $progress = $this->getHelperSet()->get('progress');
        $progress->start($output, $totalMembers);

        //go through each page
        for ($i = 0; $i < $totalMembers; $i += 20) {
            $pageUrl = sprintf($baseUrl, $i);
            $page = file_get_contents($pageUrl);
            preg_match_all('/<a href=\"(http:\/\/www\.meetup\.com\/tech\-wednesday\/members\/\d+\/)\" class=\"memName\">\w+ \w+<\/a>/', $page, $matches);

            $memberUrls = $matches[1];

            //extract details
            foreach($memberUrls as $url) {
                $profile = file_get_contents($url);

                $extractedDetails = array(
                    '', '', '', '', ''
                );

                preg_match("/<span class=\"memName fn\" itemprop=\"name\">(\w+) (\w+)<\/span>/i", $profile, $match);
                $extractedDetails[0] = $match[1];
                $extractedDetails[1] = $match[2];

                preg_match("/<span class=\"displaynone\" itemprop=\"image\">(.+)<\/span>/", $profile, $match);
                if (!empty($match[1])) $extractedDetails[2] = $match[1];

                preg_match("/<h4>What&#039;s your Twitter ID\?<\/h4>[\r\n]+<p>(@|)([\w_.]+)<\/p>/", $profile, $match);
                if (!empty($match[2])) $extractedDetails[3] = $match[2];

                preg_match("/<span class=\"locality\" itemprop=\"addressLocality\">([\w -]+)<\/span><\/a>/", $profile, $match);
                if (!empty($match[1])) $extractedDetails[4] = $match[1];

                fputcsv($fp, $extractedDetails);

                $progress->advance();

            }
        }

        fclose($fp);

    }

} 