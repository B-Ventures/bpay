# HernyoCMS

### Project Website: [http://hernyo.com](https://demo.hernyo.com)

## Hernyo. Lightweight flat file CMS written in PHP

![Hernyo CMS](http://hernyo.com/admin/logo.png "logo")

Hernyo CMS is a flat file system (No database) and the size of an image.  You just have to upload it to the server and uzip.   
Just add contents and start building your site.

Hernyo CMS is a very flexible CMS that can be easily used as a skeleton to build up a project from.

- **Very Simple** : No clutter and confusion, just a simple site editor and UI.
- **Mobile Friendly** : Hernyo is built with the latest bootstrap to work nicely on all devices.
- **No Database** : Hernyo is a Flat file CMS, which means no database is behind it.
- **Lightweight** : Hernyo CMS is not larger then the size of a JPG image.
- **Easy Setup** : Straight forward as 123, just upload and use it. No complicated configuration.
- **Markdown ready** : Easily edit your page using Markdown.
- **Custom theming** : Very easy to create new themes or modify the existing template.
- **Languages** : Multilingual support.


## Docs

### Requirements
To run Hernyo CMS you need `PHP >= 5.6` running on your server.
Apache `mod_rewrite` module enabled is recommended but not required.

### Installation
1. Download the latest version of **Hernyo CMS** from our website
2. Upload the files to your PHP Server
3. May have to give write permissions to the following files / folders: `config.php`, `db.dat`, `/files`.
4. That's all, start using Hernyo CMS.

Default username/password is :
- 	username : hernyo
- 	password : password
	
You can change the above login details in the `config.php` file.   
**Note:**  The password has a 21 bit `bycript()` encription that uses PHP 5.5 and higher.


--


### Theming

Themes are located in the `/theme` folder and the main template file is the `ìndex.html` file.
Variables are placed using the double curly bracket syntax `{{ $variable_name }}` i.e: in order to print the page title you'll use the `{{ $HERNYO['page']['title'] }}` code in the template.

#### Variables

The elements to be used when theming your website using Hernyo CMS are encapsulated in an array called `$HERNYO`, and has the following variables :

- `$HERNYO['site']` :
	- `['site_language']` ISO 639-1 Language Code has the two letter identifier like: *EN*, *ES*, *FR* ...
	- `['site_title']` : Returns the **Site Title**.
    - `['site_description']` : mainly for seo purposes
    - `['site_keywords']` : same as above.
	- `['path]` : base directory ( `dirname($_SERVER['PHP_SELF'])` )
	- `['url]` : url where the website resides ( `HTTP_HOST + path` )

- `$HERNYO['pages']` : Variable contains all the data of every page in case you want to loop over it. Each page contains the following properties described below in the `$_PAGE` variable.

- `$HERNYO['page']` :
	- `['title']` The page title
    - `['description']` Short description of the page
    - `['content']` This is stored as Markdown but it returns the parsed HTML code of the page content
	- `['tags']` Comma separated tag values
	- `['datetime']` human-readable date/time in the form : `1914-12-20 08:30:45`
	- `['timedate']` Verbose time-date returned by default in the form (i.e) : *Thursday 12th of February 2009 @ 04:25 AM* `( Date: l jS \of F Y @ h:i A )`
	- `['link']` Returns the full url friendly link of the page in case `mod_rewite` exists on the Apache modules or the link with a url get variable in case it doesn't `?p=url-slug`
	- `['slug']` the slug defined on the admin area.

- `$HERNYO['is_page']` : Boolean returns if it is a page or not ( *Useful to filter the index/home page* )
- `$HERNYO['menu']` : Retuns an HTML unordered list with all the active pages linked to it. With an active class on the current element ( `class="active"` )
- `$HERNYO['prev_page']` full url friendly link to the previous page if exists, otherwise will return a link to the site url.
- `$HERNYO['next_page']` full url friendly link to the next page if exists, otherwise will return a link to the site url.
- `$HERNYO['is_404']` : Boolean returning if the page is a 404 not found file.

#### Adding extra variables

On the `config.php` file, you can add more `'key' => 'value'` items to the returned array to access them later on. 
 They will be encapsulated in the parent array `$HERNYO['site']`

For example, adding the following to the config array : `'my_var' => 'my_value'`

    <?php return array (
      'user' => 'username',
      'pass' => 'password' //"password" is replaced with the hash,
      'db' => 'data.dat',
      'site_language' => 'en',
      ...
      'files_folder' => '../files',
      'my_var' => 'my_value',
    );


You can later call it by using the bracket syntax : `{{ $HERNYO['site']['my_var'] }}`

---

### Hernyo XML Data

A basic *sitemap* and *rss feed* files are provided by default with Hernyo CMS and they are both accessible through the root of the site:

- http://YOURSITEURL/**sitemap.xml**
- http://YOURSITEURL/**rss.xml**

---

### Libraries used in Hernyo CMS

- [PageDown Markdown Editor](http://www.codingdrama.com/bootstrap-markdown) Bootstrap Markdown & Praser.
- [IcoMoon Icons](https://icomoon.io/#icons) Custom IcoMoon Icons
- [Themify Icons](https://themify.me/themify-icons) Themify Icons
- [Bootstrap](http://getbootstrap.com/) Bootstrap 4.0.0-beta
- [PHP File Upload Class](https://github.com/aivis/PHP-file-upload-class) Simple php upload class with file validation

---