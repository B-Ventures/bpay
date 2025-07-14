<?php
header("Content-Type: application/xml; charset=utf-8");
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"; ?>
<rss version="2.0">
    <channel>
        <title><?php echo $HERNYO['site']['site_title']; ?></title>
        <link><?php echo $HERNYO['site']['url']; ?></link>
        <description><?php echo $HERNYO['site']['site_description']; ?></description>
        <?php
            foreach ($HERNYO['pages'] as $page) {
                echo "<item>";
                    echo "<title>".$page['title'] ."</title>";
                    echo "<link>".$HERNYO['site']['url'].$page['slug'].'.cms'. "</link>";
                    echo "<description>".$page['description'] ."</description>";
                echo "</item>";
            }
        ?>
    </channel>
</rss>
