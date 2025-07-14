<?php
/*
Hernyo CMS
Very simple and lightweight flat file CMS
by Attila Gothard 
http://hernyo.com
https://demo.hernyo.com
https://client.hernyo.com

Copyright 2017 hernyo.com
*/

session_start();
header('Content-Type: text/html; charset=utf-8');

// ------------------
// Utils:
// -- Slugify (https://gist.github.com/craiga/2716157)
function slugify($s) {
	$s = iconv(mb_detect_encoding($s), "ascii//TRANSLIT//IGNORE", $s); // transliterate to ASCII
	$s = preg_replace("/['^]/", "", $s); // remove accents
	$s = preg_replace("/[^a-zA-Z0-9]/", "-", $s); // replace non-word characters
	$s = preg_replace("/\-+/", "-", $s); // remove double-hyphens
	$s = trim($s, "-"); // remove start and end hyphens
	$s = strtolower($s); // lowercase
	return $s;
}

// -- Simple Flash Message
function set_message($str, $warning = false) {
	$_SESSION['message'] = array(
		  'string' => $str,
		  'warning' => $warning
	);
}
function get_message() {
	$output = false;
	if ( isset($_SESSION['message']) ) {
		$output = $_SESSION['message'];
	}
	unset( $_SESSION['message'] );
	return $output;
}
// ------------------


// Get the config file.
$config = include 'config.php';
include '../languages/'.$config['language'].'/'.$config['language'].'.php';

// Get all the existing data on the db file.
$db_data = file($config['db'], FILE_IGNORE_NEW_LINES);
$db = array();
foreach ($db_data as $data_line) {
	$db[] = json_decode($data_line, true);
}

// Order db by datetime descending and extract the slugs.
$db_slugs = array();
$items_datetime = array();
foreach ($db as $key => $row) {
    $items_datetime[$key] = $row['timedate'];
	$db_slugs[] = $row['slug'];
}
array_multisort($items_datetime, SORT_DESC, $db);


// Initialize and get the url variables.
$allowed_blocks = array('pages', 'files', 'password', 'hash');
$allowed_actions = array('new', 'edit', 'logout', 'remove'); // actions on GET
$allowed_pages = $db_slugs;

$var['block'] 	= ( isset($_GET['b']) && in_array($_GET['b'], $allowed_blocks) ) ? $_GET['b'] : false; 		// url for 'b' : pages | files | password | false
$var['action'] 	= ( isset($_GET['a']) && in_array($_GET['a'], $allowed_actions) ) ? $_GET['a'] : false; 	// url for 'a' : new | edit | logout | remove | false
$var['page'] 	= ( isset($_GET['p']) && in_array($_GET['p'], $allowed_pages) ) ? $_GET['p'] : false; 		// url for 'p' : slug | false
$var['logged'] 	= ( isset($_SESSION['logged']) && $_SESSION['logged'] == true ) ? true : false;

// Auth check. Post login
if ( empty($_SESSION['logged']) ) {
        $p = isset ($_POST['login-pass']) ? $_POST['login-pass'] : '';
	if (
		(isset($_POST['login-user']) && $_POST['login-user'] == $config['user']) &&
		(isset($_POST['login-pass']) && $_POST['login-pass'] == password_verify($p, $config['pass']))
	) {
		$_SESSION['logged'] = true;
		header( 'Location: ' . $_SERVER['PHP_SELF'] );

	} elseif(isset($_POST['login-user']) || isset($_POST['login-pass'])) {

		set_message('Wrong username or password provided', true);
	}
}

// Logout check.
if ( $var['action'] == 'logout' ) {

	if ( isset($_SESSION['logged']) && $_SESSION['logged'] == true ) {

		$_SESSION['logged'] = false;
		unset($_SESSION['logged']);

		set_message('Logged out successfully');
		header( 'Location: ' . $_SERVER['PHP_SELF'] );
		exit();
	}
}

// Check for hashed Password.
if ( $var['block'] == 'files' && $var['action'] == 'remove' && isset($_GET['file']) ) {
	$the_file = realpath(dirname(__FILE__) . DIRECTORY_SEPARATOR . $config['files_folder']) . DIRECTORY_SEPARATOR . $_GET['file'];
	if ( file_exists($the_file) ) {
		unlink($the_file);
	}

	set_message('File removed successfully');
	header( 'Location: '.$_SERVER['PHP_SELF'].'?b=files' );
	exit();
}


// -----------------
// POST
if ( $_SERVER['REQUEST_METHOD'] == 'POST' ) {

	// -- Check for changes on the Settings.
	if ( isset($_POST['settings-submit']) ) {

                $config['site_title'] = $_POST["site-title"];
		$config['site_description'] = $_POST["site-description"];
		$config['site_keywords'] = $_POST["site-keywords"];
		$config['theme'] = $_POST["site-theme"];
		$config['language'] = $_POST["site-language"];
		file_put_contents('config.php', '<?php return ' . var_export($config, true) . ';');

		set_message('Settings saved successfully');
		header( 'Location: '.$_SERVER['PHP_SELF'] );
		exit();

	} // --

	// -- Check for new page creation
	if ( isset($_POST['page-action']) && $_POST['page-action'] == 'create' ) {

		$error = array();
		$data = array();

		$data['title'] = $_POST['page-title'];
		$data['content'] = $_POST['page-content'];

		$data['timestamp'] = time();
		$data['timedate'] = strtotime( $_POST['page-date'].' '.$_POST['page-time']);
		$data['order'] = count($db);
		$data['slug'] = slugify($_POST['page-slug']);
		$data['description'] = $_POST['page-description'];

		$tags = $_POST['page-tags'];
		$tags = explode(',', $tags);
		$tags = array_map('trim', $tags);

		$data['tags'] = $tags;
		$data['active'] = ( !empty($_POST['page-active']) ) ? true : false;

		// Error Check : check if slug already exists before storing the data.
		if ( in_array($data['slug'], $db_slugs) ) { $error[] = 'Slug already exists'; }

		// Error check : check if slug is empty
		if ( empty($data['slug']) ) { $error[] = 'Empty slug'; }

		// -----------------
		// No error found?
		if ( empty($error) ) {

			$data = json_encode( $data );
			file_put_contents($config['db'], $data . PHP_EOL , FILE_APPEND);

			set_message('Page Created');
			header( 'Location: ' . $_SERVER['PHP_SELF'] );
			exit();

		} else {

			// Notify error
			set_message('ERROR: Page NOT CREATED, '.implode(', ', $error), true);
			header( 'Location: ' . $_SERVER['PHP_SELF'] );
			exit();
		}
	} // --

	// -- Check for edit page
	if ( isset($_POST['page-action']) && $_POST['page-action'] == 'edit' ) {

		$db_buffer = array();
		$db_buffer_slugs = array();
		foreach ($db as $db_item) {
			if ( $db_item['timestamp'] != $_POST['page-timestamp'] ) {
				$db_buffer[] = $db_item;
				$db_buffer_slugs[] = $db_item['slug'];
			} else {
				$editable_item = $db_item;
			}
		}

		$error = array();
		$data = array();

		$data['title'] = $_POST['page-title'];
		$data['content'] = $_POST['page-content'];
		$data['timestamp'] = $_POST['page-timestamp'];
		$data['timedate'] = strtotime( $_POST['page-date'].' '.$_POST['page-time']);
		$data['order'] = count($db);
		$data['slug'] = slugify($_POST['page-slug']);
		$data['description'] = $_POST['page-description'];

		$tags = $_POST['page-tags'];
		$tags = explode(',', $tags);
		$tags = array_map('trim', $tags);

		$data['tags'] = $tags;
		$data['active'] = ( !empty($_POST['page-active']) ) ? true : false;

		// Error Check : check if slug already exists before storing the data.
		if ( in_array($data['slug'], $db_buffer_slugs) ) { $error[] = 'Slug already exists'; }

		// check if slug is empty
		if ( empty($data['slug']) ) { $error[] = 'Empty slug'; }

		// -----------------
		// No error?
		if ( empty($error) ) {

			$output = '';
			foreach ($db_buffer as $db_buffer_item) {
				$output .= json_encode( $db_buffer_item ) . PHP_EOL;
			}
			$output .= json_encode( $data ) . PHP_EOL;
			file_put_contents($config['db'], $output , LOCK_EX);

			set_message('Page edited successfully');
			header( 'Location: '.$_SERVER['PHP_SELF']);
			exit();

		} else {

			// Notify error
			set_message('ERROR: Page NOT EDITED, '.implode(', ', $error), true);
			header( 'Location: '.$_SERVER['PHP_SELF']);
			exit();
		}
	} // --

	// -- Check for remove page
	if ( isset($_POST['page-action']) && $_POST['page-action'] == 'remove' ) {

		$output = '';
		foreach ($db as $db_item) {
			if ( $db_item['timestamp'] != $_POST['page-timestamp'] ) {
				$output.= json_encode( $db_item ) . PHP_EOL;
			}
		}
		file_put_contents($config['db'], $output , LOCK_EX);

		set_message('Page Removed');
		header( 'Location: '.$_SERVER['PHP_SELF']);
		exit();
	} // --

	// -- Check for new fileupload.
	if ( isset($_POST['fileupload-submit'])
			&& isset($_FILES['fileupload-file'])
			&& $_FILES['fileupload-file']['error'] == 0
		) {

		require_once 'lib/upload.php';
		$root_folder = realpath(dirname(__FILE__) . DIRECTORY_SEPARATOR . $config['files_folder']);
		$upload = Upload::factory( '', $root_folder );
		$upload->file($_FILES['fileupload-file']);
		$upload->set_max_file_size(2);
		$upload->set_allowed_mime_types(array("image/jpeg", "image/png", "image/gif"));
		$upload->set_filename($_FILES['fileupload-file']['name']);
		$upload_output = $upload->upload();
		$upload_error = $upload->get_errors();

		if ( empty($upload_error) ) {
			set_message('File uploaded');
		} else {
			set_message('Error uploading file: <br /> &bull; '.implode('<br /> &bull; ', $upload_error), true);
		}
		header( 'Location: '.$_SERVER['PHP_SELF'].'?b=files' );
		exit();

	} // --
//&#10083;
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Hernyo CMS</title>
    <meta name="author" content="Hernyo" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous">
    <link rel="stylesheet" href="css/bootstrap-markdown.min.css">
    <link rel="stylesheet" href="css/hernyo-cms.css">
    <link rel="icon" href="logo.png">
</head>
<body>

	<?php if ( $var['logged'] ) : ?>
	<nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
	     <a class="navbar-brand" href="<?php echo $_SERVER['PHP_SELF']; ?>"><span class="icon-logo blue"></span> <?php echo $config['site_title']; ?> Admin</a>
	     <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarHernyo" aria-controls="navbarHernyo" aria-expanded="false" aria-label="Toggle navigation">
                     <span class="navbar-toggler-icon"></span>
             </button>
             <div class="collapse navbar-collapse" id="navbarHernyo">
		<ul class="navbar-nav mr-auto">
			<li class="nav-item float-right"><a class="nav-link" href="<?php echo $_SERVER['PHP_SELF']; ?>?b=pages&amp;a=new"><span class="ti-plus"></span> <?php echo $lang['nav_page']; ?></a></li>
			<li class="nav-item"><a class="nav-link" href="<?php echo $_SERVER['PHP_SELF']; ?>?b=files"><span class="ti-files"></span> <?php echo $lang['nav_file']; ?></a></li>
			<li class="nav-item"><a class="nav-link" href="<?php echo $_SERVER['PHP_SELF']; ?>?b=password"><span class="ti-key"></span> <?php echo $lang['nav_user']; ?></a></li>
			<li class="nav-item"><a class="nav-link" href="?a=logout"><span class="ti-power-off"></span> <?php echo $lang['nav_logout']; ?></a></li>
		</ul>
	     </div>
	</nav>
	<?php endif; ?>

<div class="container">
<?php $msg = get_message(); if ( !empty($msg) ) : ?>
        <div id="message" class="<?php echo ($msg['warning']) ? 'alert alert-danger' : 'alert alert-success' ?>" role="alert">
		<?php echo ($msg['warning']) ? '<span class="ti-alert"></span>' : '<span class="ti-check-box"></span>' ?>
		<?php echo $msg['string']; ?>
	</div>
<?php endif; ?>

<?php if ( !$var['logged'] ) : // LOGIN -------------- ?>

	<form method="POST" action="<?php echo $_SERVER['PHP_SELF']; ?>" class="row justify-content-md-center" id="needs-validation" novalidate>
		<div class="col-sm-8 col-md-4">
		     <div id="login" class="card">
                        <h3><span class="icon-logo"></span> <?php echo $lang['login_welcome']; ?></h3>
				<label for="login-user">
					<span><span class="ti-user"></span> <?php echo $lang['login_username']; ?></span></label>
					<input class="form-control" type="text" name="login-user" id="login-user" placeholder="<?php echo $lang['login_username']; ?>" required/>
				
				<label for="login-pass">
					<span><span class="ti-key"></span> <?php echo $lang['login_password']; ?></span></label>
					<input class="form-control" type="password" name="login-pass" id="login-pass" placeholder="<?php echo $lang['login_password']; ?>" required/>
				
                        <br /><div class="mx-auto"><button class="btn btn-primary" type="submit" name="login-submit"><?php echo $lang['login_login']; ?> <i class="ti-check-box"></i></button></div><br />
		    </div>
                </div>
	</form>

<?php else :
// CMS ----------------

if ( ($var['block']) == 'pages' ) :
// PAGES -------------------------
		// Default values when creating a new page.
		$the_action = 'create';
		$the_title = '';
		$the_content = '';
		$the_date = date("Y-m-d");
		$the_time = date("H:i");
		$the_slug = '';
		$the_tags = '';
		$the_description = '';
		$the_status = 'checked="checked" ';
		$the_timestamp = false;
		$the_label = $lang['btn_create'];


		// Get current item when editing
		if ( ($var['action'] == 'edit') && !empty($var['page']) ) {

			foreach ($db as $db_item) {
				if ( $db_item['slug'] == $var['page'] ) {
					$db_current = $db_item;
				}
			}

			$the_action = 'edit';
			$the_title = $db_current['title'];
			$the_content = $db_current['content'];
			$the_date = date("Y-m-d", $db_current['timedate']);
			$the_time = date("H:i", $db_current['timedate']);
			$the_slug = $db_current['slug'];
			$the_tags = implode(', ', $db_current['tags']);
			$the_description = $db_current['description'];
			$the_status = ($db_current['active']) ? 'checked="checked" ' : '';
			$the_timestamp = $db_current['timestamp'];
			$the_label = $lang['btn_save'];
		}
?>

                      <form method="POST" action="<?php echo $_SERVER['PHP_SELF']; ?>" class="row" id="needs-validation" novalidate>
			<div class="col-sm-4 col-md-4">
				<h3><span class="ti-panel"></span> <?php echo $lang['page_properties']; ?></h3>
					<label for="page-date"><span class="ti-calendar"></span> <?php echo $lang['page_date']; ?></label>
						<input class="form-control" type="date" name="page-date" id="page-date" value="<?php echo $the_date; ?>" required/>

					<label for="page-time"><span class="ti-timer"></span> <?php echo $lang['page_time']; ?></label>
						<input class="form-control" type="time" name="page-time" id="page-time" value="<?php echo $the_time; ?>" required/>

					<label for="page-slug"><span class="ti-notepad"></span> <?php echo $lang['page_slug']; ?></label>
						<input class="form-control" type="text" name="page-slug" id="page-slug" value="<?php echo $the_slug; ?>" placeholder="url-friendly-page-name" required/>

					<label for="page-tags"><span class="ti-tag"></span> <?php echo $lang['page_tags']; ?></label>
						<input class="form-control" type="text" name="page-tags" id="page-tags" value="<?php echo $the_tags; ?>" placeholder="tag-1, tag-2, tag-3" />

					<label for="page-description"><span class="ti-receipt"></span> <?php echo $lang['page_description']; ?></label>
						<textarea class="form-control" name="page-description" id="page-description" rows="10" cols="100%" placeholder="description of your page"><?php echo $the_description; ?></textarea>
			</div>

                        <div class="col-12 col-sm-8 col-md-8">
				<h3><span class="ti-pencil-alt"></span> <?php echo $lang['page_edit']; ?></h3>
				<input type="hidden" name="page-action" value="<?php echo $the_action; ?>" >
				<?php if (!empty($the_timestamp)) : ?>
				<input type="hidden" name="page-timestamp" value="<?php echo $the_timestamp ?>" />
				<?php endif; ?>
                                        <label for="page-title"><span class="ti-text"></span> <?php echo $lang['page_title']; ?></label>
						<input type="text" name="page-title" id="page-title" value="<?php echo $the_title; ?>" class="form-control" placeholder="page title" required>
					        <!--<div class="invalid-feedback">Please provide a valid title.</div>-->
                                <br />
				<div class="card">
				     <div class="card-header text-white bg-primary"><span class="ti-write"></span> <?php echo $lang['page_content']; ?></div>
				        <div class="card-body">
				        <textarea name="page-content" id="page-content" rows="15" data-provide="markdown" class="md-input"><?php echo $the_content; ?></textarea>
                                        </div>
				</div>

					<label class="custom-control custom-checkbox">
                                               <input type="checkbox" class="custom-control-input" name="page-active" id="page-active" <?php echo $the_status; ?>>
                                               <span class="custom-control-indicator"></span>
                                               <span class="custom-control-description"><?php echo $lang['page_status']; ?></span>
                                        </label>
                                <button class="btn btn-success" type="submit" name="page-submit"><i class="ti-check"></i> <?php echo $the_label; ?></button>
			</div>
		     </form>

                <?php if (!empty($the_timestamp)) : ?>
			<p><form method="POST" action="<?php echo $_SERVER['PHP_SELF']; ?>" id="page-remove-form">
				<input type="hidden" name="page-action" value="remove" />
				<input type="hidden" name="page-timestamp" value="<?php echo $the_timestamp ?>" />
				<button class="btn btn-danger" type="submit" name="page-remove" id="page-remove"><i class="ti-close"></i> <?php echo $lang['btn_remove']; ?></button>
			</form></p>
		<?php endif; ?>


<?php elseif ( ($var['block']) == 'password' ) :
// PASSWORD ----------------
	$hashed = '';
        $unhashed = $_POST['hash'];

//check if the form has been submitted
if(isset($_POST['hash'])) {
	//HASH encode the submitted content
        $hashed = password_hash($_POST['hash'], PASSWORD_BCRYPT, ['cost' => 15]);
	$config['user'] = $_POST['user'];
        $config['pass'] = $hashed;

        file_put_contents('config.php', '<?php return ' . var_export($config, true) . ';');
}
?>
		<div class="row">
			<div class="col-sm-4 col-md-4">
				<h3><span class="ti-lock"></span> <?php echo $lang['page_password']; ?></h3>
				<?php echo $lang['page_password_info']; ?>
                                <form action="#" method="post" name="site-password" id="needs-validation" novalidate>
                                      <label for="user"><span class="ti-user"></span> <?php echo $lang['new_username']; ?></label>
                                             <input class="form-control" name="user" id="user" type="text" value="<?php echo $config['user']; ?>" required/>

                                      <label for="hash"><span class="ti-key"></span> <?php echo $lang['new_password']; ?></label>
                                             <input class="form-control" name="hash" id="hash" type="text" required/>
                                      <br />
                                      <button class="btn btn-primary" type="submit" name="site-password" id="site-password"><i class="ti-check"></i> <?php echo $lang['btn_save']; ?></button>
				</form>
			</div>

			<div class="col-12 col-sm-8 col-md-8">
				<h3><span class="ti-shield"></span> <?php echo $lang['page_hashword']; ?></h3>
				<p><?php echo $lang['page_password_extrainfo']; ?></p>
                                        <table class="table table-bordered table-hover table-responsive">
						<thead class="thead-inverse">
							<tr>
								<th><span class="ti-help"></span> <?php echo $lang['page_newhash']; ?></th>
								<th><span class="ti-key"></span> <?php echo $lang['page_newpassword']; ?></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><?php echo $hashed;?></td>
								<td><?php echo $unhashed;?></td>
							</tr>
						</tbody>
					</table>
			</div>
		</div>


<?php elseif ( ($var['block']) == 'files' ) :
// FILES ------------------------- 

	$uploaded_files = glob($config['files_folder'] . '/*');
	usort($uploaded_files, function($a, $b) {
	    return filemtime($a) < filemtime($b);
            });
	$files_dir = $uploaded_files;
	//$files_dir = array_diff(scandir($config['files_folder']), array('..', '.', '.DS_Store'));
?>

		<div class="row">
			<div class="col-sm-4 col-md-4">
				<h3><span class="ti-cloud-up"></span> <?php echo $lang['page_upload']; ?></h3>
				<form method="POST" action="<?php echo $_SERVER['PHP_SELF']; ?>" enctype="multipart/form-data" id="needs-validation" novalidate>
					<div class="input-group">
                                             <input class="form-control" type="file" name="fileupload-file" required>
                                             <span class="input-group-btn">
                                                   <button class="btn btn-secondary" type="submit" name="fileupload-submit"><?php echo $lang['btn_upload']; ?></button>
                                             </span>
                                        </div>
				</form>
				<?php echo $lang['page_ulpoad_info']; ?>
			</div>

			<div class="col-12 col-sm-8 col-md-8">
				<h3><span class="ti-gallery"></span> <?php echo $lang['page_uploaded']; ?></h3>
				<?php if(empty($files_dir)) : ?>
					<div class="alert alert-danger" role="alert"><span class="ti-alert"></span> <?php echo $lang['page_upload_nofile']; ?></div>
				<?php else : ?>
					<table class="table table-bordered table-hover table-responsive">
						<thead class="thead-inverse">
							<tr>
								<th><?php echo $lang['page_filetitle']; ?></th>
								<th><?php echo $lang['page_datetime']; ?></th>
								<th><?php echo $lang['page_action']; ?></th>
							</tr>
						</thead>
						<tbody>
							<?php foreach($files_dir as $file) : ?>
							<tr>
								<td><span class="ti-image"></span> <a href="<?php echo $config['files_folder'] . DIRECTORY_SEPARATOR . $file; ?>"><?php echo basename($file); ?></td>
								<td><small><span class="ti-calendar"></span> <?php echo date ("d/m/y @H:i:s", filemtime($config['files_folder'] . DIRECTORY_SEPARATOR . $file)); ?></small></td>
								<td><a href="<?php echo $_SERVER['PHP_SELF'] . '?b=files&a=remove&file=' . basename($file); ?>"><span class="ti-trash red"></span> <?php echo $lang['btn_delete']; ?></a></td>
							</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				<?php endif; ?>
			</div>
		</div>


<?php else :// SETTINGS & DASHBOARD ---------- ?>

		<div class="row">
			<div class="col-sm-4 col-md-4">
				<h3><span class="ti-settings"></span> <?php echo $lang['page_settings']; ?></h3>
				<form method="POST" action="<?php echo $_SERVER['PHP_SELF']; ?>" id="needs-validation" novalidate>

						<label for="site-title"><span class="ti-text"></span> <?php echo $lang['site_title']; ?></label>
                                                        <input class="form-control" type="text" name="site-title" id="site-title" value="<?php echo $config['site_title']; ?>" required/>

						<label for="site-description"><span class="ti-receipt"></span> <?php echo $lang['site_description']; ?></label>
							<textarea class="form-control" rows="4" cols="100%" name="site-description" id="site-description" value="<?php echo $config['site_description']; ?>" ><?php echo $config['site_description']; ?></textarea>

						<label for="site-keywords"><span class="ti-tag"></span> <?php echo $lang['site_keywords']; ?></label>
							<input class="form-control" type="text" name="site-keywords" id="site-keywords" value="<?php echo $config['site_keywords']; ?>" />

						<label for="site-theme"><span class="ti-palette"></span> <?php echo $lang['site_theme']; ?></label>
                                                        <select class="custom-select" name="site-theme" id="site-theme">
		 						<?php
									$themes = scandir('../theme');
									foreach ($themes as $theme) {
										if ( (substr($theme, 0, 1) != '.') && is_dir('../theme/' . $theme) ) {
											echo '<option value="'.$theme.'"' . (($config['theme'] == $theme) ? " selected=selected" : "") . '>'.$theme.'</option>';
										}
									}
							 	?>
						 	</select>

						<label for="site-language"><span class="ti-flag"></span> <?php echo $lang['site_language']; ?></label>
                                                        <select class="custom-select" name="site-language" id="site-language">
                                                               <?php
									$languages = scandir('../languages');
									foreach ($languages as $language) {
										if ( (substr($language, 0, 1) != '.') && is_dir('../languages/' . $language) ) {
											echo '<option value="'.$language.'"' . (($config['language'] == $language) ? " selected=selected" : "") . '>'.$language.'</option>';
										}
									}
							 	?>
						 	</select>
						<p><button class="btn btn-success" type="submit" name="settings-submit" id="settings-submit"><i class="ti-check"></i> <?php echo $lang['btn_save_settings']; ?></button></p>
				</form>
			</div>

			<div class="col-12 col-sm-8 col-md-8">
				<h3><span class="ti-file"></span> <?php echo $lang['page_list']; ?></h3>
				<table class="table table-bordered table-hover table-responsive">
					<thead class="thead-inverse">
						<tr>
							<th><?php echo $lang['page_pagename']; ?></th>
							<th><?php echo $lang['page_datetime']; ?></th>
							<th><?php echo $lang['page_status']; ?></th>
						</tr>
					</thead>
					<tbody>
					<?php foreach ($db as $item) : ?>
						<tr>
							<td>
								<span class="ti-pencil orange"></span> <a href="<?php echo $_SERVER['PHP_SELF']; ?>?b=pages&amp;a=edit&amp;p=<?php echo $item['slug'] ?>"><?php echo $item['title'] ?></a> <a href="/<?php echo $item['slug'] ?>.cms" target="_blank" class="float-right"><span class="ti-eye purple"></span></a>
							</td>
							<td>
								<small><span class="ti-calendar"></span> <?php echo date("Y.m.d", $item['timedate']); ?>&nbsp; <span class="ti-timer"></span> <?php echo date("H:i", $item['timedate']); ?></small>
							</td>
							<td><?php echo ($item['active']) ? '<i class="ti-check green float-right"></i>' : '<i class="ti-close red float-right"></i>'; ?></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
				<p><a class="btn btn-primary" href="<?php echo $_SERVER['PHP_SELF']; ?>?b=pages&amp;a=new"><i class="ti-plus"></i> <?php echo $lang['create_page']; ?></a></p>
			</div>
		</div>
	<?php endif; ?>

<?php endif; ?>
</div>

<footer class="footer">
      <div class="container">
        <i class="icon-logo gray"></i> <a href="http://hernyo.com" title="Hernyo CMS"><strong>Hernyo CMS</strong></a>
	&mdash; Simple & friendly Flat file CMS.
      </div>
</footer>

<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js" integrity="sha384-b/U6ypiBEHpOf/4+1nzFpr53nxSS+GLCkfwBdFNTxtclqqenISfwAzpKaMNFNmj4" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/js/bootstrap.min.js" integrity="sha384-h0AbiXch4ZDo7tp9hKZ4TsHbi047NrKGLO3SEJAg45jXxnGIfYzk4Si90RDIqNm1" crossorigin="anonymous"></script>
<script src="js/hernyo-markdown.js"></script>
<script src="js/bootstrap-markdown.js"></script>
<script src="js/hernyo-cms.js"></script>
<!--<script src="locale/bootstrap-markdown.fr.js"></script>-->
<script>$("#page-content").markdown({autofocus:true,language:'en'})</script>
</body>
</html>
