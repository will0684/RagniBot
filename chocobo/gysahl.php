<?php

/**
 * required PHP >= 5.5
 */

# setup crawler settings
define('NEWS_FILE_REL_PATH', "news_data.json");
define('NEWS_LIST_URL', 'https://site.na.wotvffbe.com/whatsnew/list?lang=en&category=');
define('NEWS_ITEM_URL', 'https://site.na.wotvffbe.com/whatsnew/detail?&lang=en&group_id=');
define('IMG_ROOT_URL', 'https://site.na.wotvffbe.com');
define('TIMEZONE', 'America/New_York');
$r_newsCategories = [
    'info',
    'event',
    'update',
    'important'
];

date_default_timezone_set(TIMEZONE);

# get news data from the file or create if it's not exists
if (is_file(NEWS_FILE_REL_PATH)) {
    $p_string = file_get_contents(NEWS_FILE_REL_PATH);
    $p_fileData = $p_string;
    if ($p_fileData != '') {
        $r_currentNews = json_decode($p_string);
    } else {
        $r_currentNews = [];
    }
} else {
    $p_string = file_put_contents(NEWS_FILE_REL_PATH, '');
    $r_currentNews = [];
}

# set context header
$r_opts = array(
    'http' => array(
        'method' => "GET",
        'header' => "Accept-language: en\r\n"
    )
);
$o_context = stream_context_create($r_opts);
libxml_set_streams_context($o_context);

$r_newNews = [];
# fetch news lists each category
foreach ($r_newsCategories as &$p_category) {

    # get object list from target
    $o_doc = new DOMDocument();
    @$o_doc->loadHTMLFile(NEWS_LIST_URL . $p_category);
    $o_tags = $o_doc->getElementsByTagName('li');
    $o_xpath = new DOMXPath($o_doc);

    //foreach ($o_tags as $o_tag) {

    # get only new items
    //$p_newsId = $o_tag->getAttribute('data-tab');
    $o_nodes = $o_xpath->query("//li[@class='postList_item']");
    foreach ($o_nodes as $r_lis) {
        $o_newsItem = $o_xpath->query("@data-tab", $r_lis);
        $p_newsId = $o_newsItem->item(0)->nodeValue;
        $o_newsTitle = $o_xpath->query("div[@class='postList_item_txt']", $r_lis);
        $p_newsTitle = trim($o_newsTitle->item(0)->nodeValue);

        # get news if not already exists
        if (array_search($p_newsId, array_column($r_currentNews, 'id')) === false) {
            array_push($r_newNews, [
                'id' => $p_newsId,
                'title' => $p_newsTitle,
                'type' => $p_category,
                'url' => NEWS_ITEM_URL . $p_newsId,
                'timestamp' => intval(microtime(true) * 1000),
                'context' => '[working on it]'
            ]);
        }
    }
}

# fetch data from new items
foreach ($r_newNews as $k_key => $p_value) {

    # fetch html into the context
    $p_url = $p_value['url'];
    $o_news = @$o_doc->loadHTMLFile($p_url);
    $r_newNews[$k_key]['context'] = $o_doc->saveHTML();
}

# put into the file if new news
if (count($r_newNews) > 0) {
    $r_allNews = array_merge($r_newNews, $r_currentNews);
    $p_json = json_encode($r_allNews, JSON_PRETTY_PRINT);
    file_put_contents(NEWS_FILE_REL_PATH, $p_json);
}
