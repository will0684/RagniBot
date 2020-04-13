<?php

function parse_news_to_array($context)
{
    $context = str_replace('src="', 'src="' . IMG_ROOT_URL, $context);
    // echo $context;

    $context =  preg_replace('/\r|\n{2,}/smU', '', $context);
    $context = preg_replace('/<div class="box-text">(.*)<\/div>/smU', '```$1```', $context);
    $context = preg_replace('/<font size="(.*)">(.*)<\/font>/smU', '$2', $context);
    $context = preg_replace('/<i>(.*)<\/i>/smU', '$1', $context);
    $context = preg_replace('/<div class="text-title">(.*)<\/div>/smU', '__**$1**__', $context);
    $context = preg_replace('/<span class="text-yellow">(.*)<\/span>/smU', '**$1**', $context);
    $context = preg_replace('/<div class="line--silver"><\/div>/smU', '', $context);
    $context = preg_replace('/<br>/smU', '
', $context);
    $context = preg_replace('/<p>(.*)<\/p>/smU', '$1', $context); //\n
    $context = preg_replace('/<span>â—<\/span>(.*)<br>/smU', '●$1
', $context);
    $context = preg_replace('/(.*)<div class="article_body">(.*)<\/div>(.*)/smU', '$2', $context);
    preg_match_all('/<img src="(.*)"/mU', $context, $pregImageArr);
    $splitImage = $pregImageArr[1];
    $splitContext = preg_split('/<img(.*)">/mU', $context);
    //echo $context;

    $jsonContext = [];
    $i = 0;
    $stop = false;
    do {
        if (isset($splitContext[$i])) {
            $jsonContext[$i]["text"] = $splitContext[$i];
        }
        if (isset($splitImage[$i])) {
            $jsonContext[$i]["image"] = $splitImage[$i];
        }
        if ((!isset($splitContext[$i])) && (!isset($splitImage[$i]))) {
            $stop = true;
        }
        $i++;
    } while ($stop === false);
    return $jsonContext;
    /* 
    $dom = new DOMDocument();
    $o_doc = @$dom->loadHTML($context);
    $xpath = new DOMXPath($dom);

    # get article date
    $dateNode = $xpath->query("//span[@id='article_date'][1]/text()[1]");
    //echo $dateNode->item(0)->nodeValue;

    $tags = $dom->getElementsByTagName('*');
    foreach ($tags as $tag) {
        echo $tag->textContent;
    } */
}


/* 
$articleNode = $xpath->query("//div[@class='article_body']");
// echo $articleNode->item(0)->nodeValue;
foreach($articleNode as $node){
    $test = $node->getElementsByTagName('*');
    foreach($test as $a){
        echo $a->saveHTML();
    }
} */
