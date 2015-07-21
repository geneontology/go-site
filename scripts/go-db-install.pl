#!/usr/bin/perl -w
####
#### This will install the latest version of the GO database onto your
#### server and remove previous versions installed by this script. If
#### you are going to run this script on the same machine that hosts
#### the database, probably no flags or modifications are
#### necessary. However, if your setup is in any way interesting, you
#### can modify the behavior of this script either with command line
#### flags or by changing the values in the "%local" hash at the top
#### of the file.
####
####
#### NOTES:
####
#### Make sure that the prefix is unique--this script will try to delete
#### all databases that have that prefix.
####
#### Assumes that it is being run with the appropriate permissions to
#### access and modify the database.
####
#### Assumes that the GO mirror you are using has the same directory and
#### file namaing conventions as the main site at
#### "ftp.geneontology.org".
####
#### Assumes that 'gzip', 'mysql', 'mysqladmin', and 'mysqlshow' exist
#### on the system and behave in a fairly standard way.
####
#### Assumes you have Net::FTP installed.
####
#### Assumes that you can create temporary files.
####
#### 'show_databases' is not a great piece of work.
####

use strict;

use Getopt::Std;
use File::Temp;
use Net::FTP;
use File::Basename;
use Cwd 'realpath';
## TODO/BUG: $opt_F -F now returns an warning to not use it anymore

use vars qw(
	    $opt_h
	    $opt_v
	    $opt_i
	    $opt_j
	    $opt_x
	    $opt_n
	    $opt_g
	    $opt_m
	    $opt_a
	    $opt_s
	    $opt_f
	    $opt_l
	    $opt_d
	    $opt_u
	    $opt_p
	    $opt_P
	    $opt_t
	    $opt_e
	    $opt_z
	    $opt_D
	    $opt_M
	    $opt_F
	   );

## Sane and easy to modify defaults.
my %local = (
	     FTP_ARCHIVE => 'ftp.geneontology.org',
	     FTP_PATH => '/pub/go/godatabase/archive/latest-full',
	     FTP_PATH_LITE => '/pub/go/godatabase/archive/latest-lite',
	     FTP_LOGIN => 'anonymous',
	     FTP_PASSWORD => '',
	     FTP_USE_PASSIVE_MODE => 0,

	     DB_HOST => 'localhost',
	     DB_USER => '',
	     DB_PASS => '',
	     DB_PORT => '3306',

	     EXTENSION => 'go_latest',

	     GO_DB_ARCH_PREFIX => 'go_',
	     GO_DB_ARCH_SUFFIX => '-assocdb-data',
	     GO_DB_ARCH_SUFFIX_LITE => '-seqdb-data',
	     GO_DB_ARCH_EXTENSION => '.gz',

	     FS_DOWNLOAD_DIR => '/tmp',
	     FS_MYSQL_FULL => 'mysql',
	     FS_MYSQLADMIN_FULL => 'mysqladmin',
	     FS_MYSQLSHOW_FULL => 'mysqlshow',
	     FS_GZIP_FULL => 'gzip',

	     DATE => '98765432'
	    );

# Remove F after go-load-qfo-fresh.pl is default
#getopts('Fhvzijxng:m:a:s:f:l:d:u:p:P:t:e:D:M:');
getopts('hvzijxng:m:a:s:f:l:d:u:p:P:t:e:D:M:F');

## Hunt down the paths and let's try and get all of the likely
## libraries in. Trying "use lib" didn't work so well, so got hacky
## with PERL5LIB.
my($go_dev_path, $remainder) =
  split 'go-db-perl/scripts/go_db_install', realpath($0);
my @try_libs =
 (
  $go_dev_path . 'go-db-perl',
  $go_dev_path . 'go-perl',
  $go_dev_path . 'amigo/perl',
  $go_dev_path . '../gobo-dbic'
 );
if( defined $ENV{PERL5LIB} ){
  $ENV{PERL5LIB} = join(':', @try_libs) . ':' . $ENV{PERL5LIB};
}else{
  $ENV{PERL5LIB} = join(':', @try_libs);
}

## Print help through perldoc.
if ( $opt_h ) {
  system('perldoc', __FILE__);
  exit 1;
}

###
### Preparation from command line arguments.
###

## Check our options and set variables accordingly.
if ( $opt_v ) {
  ll("Will be verbose."); }
if ( $opt_i ) {
  $local{FTP_PATH} = $local{FTP_PATH_LITE};
  $local{GO_DB_ARCH_SUFFIX} = $local{GO_DB_ARCH_SUFFIX_LITE};
  ll("Will get lite (!IEA) database."); }
if ( $opt_n ) {
  ll("Will not attempt to add views and materialized views to database.");
}else{
  ll("Will attempt to add views and materialized views to database.");
}
if ( $opt_g ) {
  $local{FS_GZIP_FULL} = $opt_g;
  ll("\"gzip\" is: $opt_g."); }
if ( $opt_m ) {
  $local{FS_MYSQL_FULL} = $opt_m;
  ll("\"mysql\": $opt_m."); }
if ( $opt_a ) {
  $local{FS_MYSQLADMIN_FULL} = $opt_a;
  ll("\"mysqladmin\": $opt_a."); }
if ( $opt_s ) {
  $local{FS_MYSQLSHOW_FULL} = $opt_s;
  ll("\"mysqlshow\": $opt_s."); }
if ( $opt_f ) {
  $local{FTP_ARCHIVE} = $opt_f;
  ll("FTP server will be: $opt_f."); }
if ( $opt_l ) {
  $local{FTP_PATH} = $opt_l;
  ll("Path on the FTP server will be: $opt_l."); }
if ( $opt_z ) {
  $local{FTP_USE_PASSIVE_MODE} = 1;
  ll("Will use FTP passive mode."); }
if ( $opt_d ) {
  $local{DB_HOST} = $opt_d;
  ll("Database host will be: $opt_d."); }
## Get the username from somewhere--makes life easier.
if ( $opt_u ) {
  $local{DB_USER} = $opt_u;
  ll("Database user will be: $opt_u.");
}else{
  $local{DB_USER} = $ENV{'USERNAME'} if $ENV{'USERNAME'};
}
if ( $opt_p ) {
  $local{DB_PASS} = $opt_p;
  ll("Database password will be: $opt_p."); }
if ( $opt_P ) {
  $local{DB_PORT} = $opt_P;
  ll("Database port number will be: $opt_P."); }
if ( $opt_t ) {
  $local{FS_DOWNLOAD_DIR} = $opt_t;
  ll("Temporary directory will be: $opt_t."); }


## Running in old mode.
if ( $opt_D ) {

  if ( $opt_D =~ /^\d{8}$/ ){
    ll("Will look for archived GO database from: $local{DATE}");
  }else {
    die "Your date argument is not valid--it must be in YYYYMMDD format.";
  }

  $local{DATE} = $opt_D;

  $local{FTP_PATH} = '/pub/go/godatabase/archive/full';
  if ($opt_i) {
    $local{FTP_PATH} = '/pub/go/godatabase/archive/lite';
  }
  $local{EXTENSION} = 'go_old_' . $local{DATE};
  #$local{GO_DB_ARCH_SUFFIX} = '-seqdb-data';
  $local{GO_DB_ARCH_SUFFIX} = '-assocdb-data';

  ll("Date will be: $local{DATE}.");
  ll("Database extension will be: $local{EXTENSION}.");
}

## Get (local) database name
if ( $opt_e ) {
  $local{EXTENSION} = $opt_e;
  ll("Database extension will be: $opt_e."); }

###
### Get date from FTP site.
###

## Connection.
my $ftp = undef;
if ( $local{FTP_USE_PASSIVE_MODE} ) {
  $ftp = Net::FTP->new($local{FTP_ARCHIVE}, Passive => 1 )
    or die "[FTP] Cannot connect (PASV) to $local{FTP_ARCHIVE}: $!";
  ll("[FTP] Connected (PASV) to \"" . $local{FTP_ARCHIVE} . "\".");
}else {
  $ftp = Net::FTP->new($local{FTP_ARCHIVE})
    or die "[FTP] Cannot connect to $local{FTP_ARCHIVE}: $!";
  ll("[FTP] Connected to \"" . $local{FTP_ARCHIVE} . "\".");
}

## Login.
$ftp->login($local{FTP_LOGIN}, $local{FTP_PASSWORD})
  or die "[FTP] Cannot login as \"$local{FTP_LOGIN}\": $!";
ll("[FTP] Logged in as \"$local{FTP_LOGIN}\".");

## Change to binary.
$ftp->binary()
  or die "[FTP] Cannot change to binary mode: $!";
ll("[FTP] Changed to binary mode.");

## Descend.
$ftp->cwd("$local{FTP_PATH}")
  or die "[FTP] Cannot change working directory to $local{FTP_PATH}: $!";
ll("[FTP] Changed directory to \"" . $local{FTP_PATH} . "\".");

## Get a file listing.
my @listing = $ftp->ls()
  or die "[FTP] Cannot get a listing: $!";
ll("[FTP] Received file listing.");

###
### Toggle between "old" mode and "most recent" mode.
###

my $go_db_archive_name = '';
my $db_stamp_name = '';
if( $opt_D ){

  ## Match date and descend if possible.
  my $found_key_p = 0;
  my $key = '';
  foreach my $file (@listing) {

    my @columns = split /\s+/, $file;
    my $name = $columns[0];

    if ( $name =~ /(\d{4})\-(\d{2})\-(\d{2})/ ) {
      $key = $1 . $2 . $3;

      if ( $key eq $local{DATE} ) {

	$found_key_p = 1;

	## Descend again.
	$ftp->cwd($name)
	  or die "[FTP] Cannot change working directory to: $name";
	ll("[FTP] Changed directory to \"" . $name . "\".");

	last;
	}
    }
  }

  ## Continue on found key.
  if ( $found_key_p ) {

    ## Get a -AlF listing.
    @listing = $ftp->dir()
      or die "[FTP] Cannot get an inner listing: $!";
    ll("[FTP] Received inner file listing.");
    foreach my $file (@listing) {

      my @columns = split /\s+/, $file;
      my $perms = $columns[0];
      my $name = $columns[8];

      my $beg = $local{GO_DB_ARCH_PREFIX};
      my $end = $local{GO_DB_ARCH_SUFFIX} . $local{GO_DB_ARCH_EXTENSION};
      if ( $name =~ /^$beg[a-zA-Z0-9\-\_\:\=\+]+$end$/ ) {
	$go_db_archive_name = $name;
	last;
      }
    }
  }else{
    die "Could not find similar date: $! [available: @listing]";
  }

  die "Could not find appropriate tarchive: $!" if ! $go_db_archive_name;

  ## Date already included...
  $db_stamp_name = $local{EXTENSION} . '_STAMP';
  #$db_stamp_name = $go_db_archive_name;

}else{

  my $ftp_date = '_NO_FTP_DATE_';

  ## Find date of most recent database in archive.
  foreach my $file (@listing) {
    ## The check depends on how the DB names are structured.
    if( $opt_i ){
      if ( $file =~ /(\d{8})/ ) {
	$ftp_date = $1;
	last;
      }
    }else{
      if ( $file =~ /(\d{6})/ ) {
	$ftp_date = $1;
	last;
      }
    }
  }
  die "[FTP] Cannot find a date string: $!" if $ftp_date eq '_NO_FTP_DATE_';
  ll("[FTP] Archive date string is \"$ftp_date\".");

  ## Show what the full DB string we're searching for.
  $db_stamp_name = $local{EXTENSION} . $ftp_date;
  $go_db_archive_name =
    $local{GO_DB_ARCH_PREFIX} .
      $ftp_date .
	$local{GO_DB_ARCH_SUFFIX} .
	  $local{GO_DB_ARCH_EXTENSION};
}

## Check our progress.
ll("GO database name is \"$local{EXTENSION}\".");
ll("GO database stamp name is \"$db_stamp_name\".");
ll("FTP archive name is \"$go_db_archive_name\".");

###
### Since we can't assume the existance of the file, we'll try and
### download it (and hopefully doe on error) before we drop the
### database.
###

## Create temp file for the FTP download.
my $tmp_dl_file = new File::Temp(TEMPLATE => 'go_db_download_XXXXX',
				 DIR => $local{FS_DOWNLOAD_DIR},
				 SUFFIX => $local{GO_DB_ARCH_EXTENSION});
die "[FS] Could not create temporary download file: $!" if ! $tmp_dl_file;
ll("[FS] Created temporary download file.");

## Create temp file for the gunzipped database.
my $tmp_gunzip_file = new File::Temp(TEMPLATE => 'go_db_gunzipped_XXXXX',
				     DIR => $local{FS_DOWNLOAD_DIR},
				     SUFFIX => '');
die "[FS] Could not create temporary gunzip file: $!" if ! $tmp_gunzip_file;
ll("[FS] Created temporary gunzip file.");

## Attempt to download.
ll("[FTP] Starting GO database download (this may take some time)...");
#ll("<<<" . $tmp_dl_file . ">>>\n";

$ftp->get( $go_db_archive_name, $tmp_dl_file )
  or die "[FTP] Cannot download $go_db_archive_name: $!";
ll("[FTP] Downloaded \"" . $go_db_archive_name . "\".");

## Done FTP.
$ftp->quit;

###
### Check DB dates and look for db match.
###

## Get listings from database.
my @databases = show_databases($local{FS_MYSQLSHOW_FULL},
			       $local{DB_HOST},
			       $local{DB_USER},
			       $local{DB_PASS},
			       $local{DB_PORT});
ll("[DB] Got listing.");

my $db_exists = 0;
my $fresh_stamp = 0;
my @previous_stamps = ();

## Check database for things named like what we're looking for.
foreach my $database ( @databases ) {
  #ll("<<<" . $database . ">>>");
  if ( $database =~ /^$local{EXTENSION}$/ ) {
    #ll("\tDB MATCH: " . $database . ">>>");
    $db_exists = 1;
  } elsif ( $database =~ /^$db_stamp_name$/ ) {
    #ll("\tSTAMP MATCH: " . $database . ">>>");
    $fresh_stamp = 1;
  } elsif ( ($database =~ /^$local{EXTENSION}\d{6}$/ && !$opt_i && !$opt_D) ||
	    ($database =~ /^$local{EXTENSION}\d{8}$/ && $opt_i && !$opt_D) ){
    #ll("\tSTAMP SIMILAR: " . $database . ">>>");
    push @previous_stamps, $database;
  }
}

###
### Make sure that we have no database and no fresh stamp. Bail if
### we are up-to-date.
###

## The first case means that everything is normal and up-to-date, so
## we can just bail out here.
my $already_loaded_p = 0;
if ( $db_exists && $fresh_stamp ) {

  ll("[DB] You are already using the most current GO database.");
  $already_loaded_p = 1;

}else{

  ## We want to make it so no database or fresh stamp exists by the
  ## time we are done this if-else cascade.
  if ( ! $db_exists && $fresh_stamp ) {

    ## We lack a database, but not a fresh stamp--drop the stamp.
    ll("[DB] No database, but a fresh stamp exists. Will try to fix.");
    drop_database($local{FS_MYSQLADMIN_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $db_stamp_name);
    ll("[DB] Fixed (dropped) stamp.");

  }elsif ( $db_exists && ! $fresh_stamp ){

    ## We lack a fresh stamp, but have a database--drop the database.
    ll("[DB] You are not using the most current GO database.");
    drop_database($local{FS_MYSQLADMIN_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $local{EXTENSION});
    ll("[DB] Dropped old database.");
  }

  ###
  ### Generate database from local file.
  ###

  ## Database creation.
  create_database($local{FS_MYSQLADMIN_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $local{EXTENSION});
  ll("[DB] Created database.");

  ## Fresh stamp creation.
  create_database($local{FS_MYSQLADMIN_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $db_stamp_name);
  ll("[DB] Created database stamp.");

  ## Gunzip database.
  ll("[FS] Starting GO database unpacking (this may take some time)...");
  gunzip_file($local{FS_GZIP_FULL}, $tmp_dl_file, $tmp_gunzip_file);
  ll("[FS] Finished unpacking.");

  ## Install database.
  ll("[DB] Starting GO database install (this may take some time)...");
  add_to_database($local{FS_MYSQL_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $local{EXTENSION},
		  $tmp_gunzip_file);
  ll("[DB] Finished installing.");

  ## Remove other matching databases.
  foreach my $db_stamp (@previous_stamps) {
    drop_database($local{FS_MYSQLADMIN_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $db_stamp);
    ll("[DB] Removed stamp $db_stamp.");
  }
}

## Migration of schema forward.
if( $opt_M ){

  ## Make sure that we're in the environment that we want to be
  ## in. This is to make sure that we can add the changes in
  ## "go-deb/go-db-perl/sql/migrate".

  ## Test additional migrate path.
  my $migrate_dir_path = $go_dev_path . 'sql/migrate/';
  die "Migrates directory not accessible."
    if ! -d  $migrate_dir_path || ! -R $migrate_dir_path;
  ll("[SYSTEM] Found: \"" . $migrate_dir_path . "\".");

  my @change_files = split(/\n/,`ls $migrate_dir_path/changes-*.{sql,sh}`);
  ll("[DB] Change Files: @change_files ");

  ## Make sure that the migrates are in the DB.
  ll("[DB] Starting schema migration changes to DB.");
  foreach my $change_file (@change_files) {

    ll("[DB] testing: $change_file");

    # e.g. changes-2007-08-23.sql
    if ($change_file =~ /changes\-(\d+)\-(\d+)\-(\d+)\.(\w+)/) {
      my $change_applied_date = "$1$2$3";
      my $suffix = $4;
      if ($change_applied_date < $opt_M) {
	ll("[DB] skipping: $change_file");
      }

      if ($suffix eq 'sql') {
	my $short_name = basename($change_file);
	ll("[DB] Applying: \"" . $short_name . "\".");
	try_to_add_to_database($local{FS_MYSQL_FULL},
			       $local{DB_HOST},
			       $local{DB_USER},
			       $local{DB_PASS},
			       $local{DB_PORT},
			       $local{EXTENSION},
			       $change_file);
      } elsif ($suffix eq 'sh') {
	my $cmd = "sh $change_file -h $local{DB_HOST} -port $local{DB_PORT} -d $local{EXTENSION}";
	ll("[MIGRATE] cmd: $cmd");
	if( ! $opt_x ){
	  ! system($cmd)
	    or die "[DB] Cannot use : $!";
	}
      } else {
	ll("[DB] skipping: $change_file, format=$suffix. can only handle .sql or .sh so far");
	## TODO: ???
      }
    } else {
      ll("[DB] skipping: $change_file, doesn't look like a change file");
    }
  }
}

## Shall we add the views 'n stuff?
if( ! $opt_n && ! $already_loaded_p ){

  ## Make sure that we're in the environment that we want to be
  ## in. This is to make sure that we can add and materialize the
  ## views in "go-deb/go-db-perl/sql/view" with utils in
  ## "go-deb/go-db-perl/sql/utils".

  ## Test matview procedure path.
  my $util_exec_path = $go_dev_path . 'sql/util/materialized_views_proc.sql';
  die "Couldn\'t find materialized_views_proc.sql"
    if ! -f  $util_exec_path || ! -R $util_exec_path;
  my $short_name = basename($util_exec_path);
  ll("[SYSTEM] Found: " . $short_name . ".");

  ## Make sure that the procedure is in the DB.
  ll("[DB] Starting addition of procedure to DB.");
  add_to_database($local{FS_MYSQL_FULL},
		  $local{DB_HOST},
		  $local{DB_USER},
		  $local{DB_PASS},
		  $local{DB_PORT},
		  $local{EXTENSION},
		  $util_exec_path);
  ll("[DB] Finished addition.");

  ## Test additional view path.
  my $view_dir_path = $go_dev_path . 'sql/view/';
  die "Views directory not accessible."
    if ! -d  $view_dir_path || ! -R $view_dir_path;
  ll("[SYSTEM] Found: \"" . $view_dir_path . "\".");

  ## Make sure that the views are in the DB.
  ll("[DB] Starting addition of views to DB.");
  open(AUTOLOAD_VIEWS, "<" . $view_dir_path . "AUTOLOAD_VIEWS")
    or die "Couldn\'t find views directory.";
  while (<AUTOLOAD_VIEWS>) {

    ## Don't need commented lines.
    if( ! /^\#/ ){

      ## Check for extance.
      chomp;
      my $view_file = $view_dir_path . $_;
      if( ! -f  $view_file || ! -R $view_file ){
	die "View file not accessible: \"" . $view_file . "\".\n";
      }else{
	my $short_name = basename($view_file);
	ll("[DB] Adding view: \"" . $short_name . "\".");
	try_to_add_to_database($local{FS_MYSQL_FULL},
			       $local{DB_HOST},
			       $local{DB_USER},
			       $local{DB_PASS},
			       $local{DB_PORT},
			       $local{EXTENSION},
			       $view_file);
      }
    }
  }
  ll("[DB] Finished addition of views.");

  ## Make sure that the materialized views are in the DB.
  ll("[DB] Starting addition of materialized views to DB.");
  open(AUTOLOAD_MATVIEWS, "<" . $view_dir_path . "AUTOLOAD_MATVIEWS")
    or die "Couldn\'t find materialized views directory.";
  while (<AUTOLOAD_MATVIEWS>) {

    ## Don't need commented lines.
    if( ! /^\#/ ){

      ## Check for extance.
      chomp;
      my $matview_file = $view_dir_path . $_;
      if( ! -f  $matview_file || ! -R $matview_file ){
	die "Materialized view file not accessible: \"" .
	  $matview_file . "\".\n";
      }else{
	my $short_name = basename($matview_file);
	ll("[DB] Adding materialized view: \"" .
	   $short_name . "\".");
	try_to_add_to_database($local{FS_MYSQL_FULL},
			       $local{DB_HOST},
			       $local{DB_USER},
			       $local{DB_PASS},
			       $local{DB_PORT},
			       $local{EXTENSION},
			       $matview_file);
      }
    }
  }
  ll("[DB] Finished addition of materialized views.");
}

## Try at phylotree loading.
if( $opt_j ){

  #my $qfo_run_success = 1;
  my $qfo_run_success = load_qfo();
  if( ! $qfo_run_success ){
    ww("WARNING: loading QfO failed--not trying to run seq2pthr2phylotree.");
  }else{

    #my $phylo_run_success = 1;
    my $phylo_run_success = run_seq2pthr2phylotree();

    ## Add Newick blobs using phylotree properties.
    my $panther_newick_path = $ENV{PANTHER_NEWICK_PATH};
    ## BUG: this will be folded away once the CVS repo is moved to SVN.
    if( ! defined( $panther_newick_path ) ){
      ww("WARNING: PANTHER_NEWICK_PATH not defined--could not add blobs.");
    }elsif( ! $phylo_run_success ){
      ww("WARNING: seq2pthr2phylotree failed--could not add blobs.");
    }else{
      ll("Using PANTHER_NEWICK_PATH: " . $panther_newick_path);
      $ENV{GO_DBNAME} = $local{EXTENSION};
      $ENV{GO_DBHOST} = $local{DB_HOST} if defined $local{DB_HOST};
      $ENV{GO_DBUSER} = $local{DB_USER} if defined $local{DB_USER};
      $ENV{GO_DBAUTH} = $local{DB_PASS} if defined $local{DB_PASS};
      $ENV{GO_DBPORT} = $local{DB_PORT} if defined $local{DB_PORT};
      my $script = "go-db-perl/scripts/load-phylotree-properties.pl";
      my @args = ($go_dev_path . $script, $panther_newick_path);
      if( $ENV{GOBO_ROOT} ){ # add the path to gobo if it's there
	@args = ('perl', '-I', $ENV{GOBO_ROOT},
		 $go_dev_path . $script, $panther_newick_path);
      }
      my $argstr = join(' ', @args);
      ll("[SYSTEM] \"$argstr\"");
      eval {
	system(@args) == 0 || die "System \"$argstr\" failed: $?" if ! $opt_x;
      };
      if( $@ ){
	ww("WARNING: Could not add JS Newick tree blobs!");
      }
    }
  }

  ll("Done.");
}

###
### Subs.
###

## Creates a string of optional mysql-type cli arguments.
sub my_cli {
  my ($host, $user, $pass, $port) = @_;
  my $cli_vals = [];
  push @$cli_vals, "-h $host" if $host;
  push @$cli_vals, "-P $port" if $port;
  push @$cli_vals, "-u $user" if $user;
  push @$cli_vals, "-p$pass" if $pass;
  return join ' ', @$cli_vals;
}


## A simple wrapper to get an array of strings from the host that
## resemble database names (along with any other junk returned by
## mysqlshow).
## WARNING: This really is a nasty sub.
sub show_databases{

  my ($mysqlshow, $host, $user, $pass, $port) = @_;
  my @return_db = ();

  my $cli_str = my_cli($host, $user, $pass, $port);
  ll("[SHELL] $mysqlshow -u $cli_str");
  my @sdatabases = `$mysqlshow $cli_str`
    or die "[DB] Cannot show database: $!";

  foreach my $database ( @sdatabases ){
    $database =~ s/\s|\|//g;
    push @return_db, $database;
  }

  return @return_db;
}


## A simple wrapper to create a database.
sub create_database{

  my ($mysqladmin, $host, $user, $pass, $port, $name) = @_;

  my $cli_str = my_cli($host, $user, $pass, $port);
  ll("[SHELL] $mysqladmin $cli_str create $name");
  if( ! $opt_x ){
    ! system("$mysqladmin $cli_str create $name")
      or die "[DB] Cannot create database: $!";
  }
}


## A simple wrapper to drop a database.
sub drop_database{

  my ($mysqladmin, $host, $user, $pass, $port, $name) = @_;

  my $cli_str = my_cli($host, $user, $pass, $port);
  ll("[SHELL] $mysqladmin -f $cli_str drop $name");
  if( ! $opt_x ){
    ! system("$mysqladmin -f $cli_str drop $name")
      or die "[DB] Cannot create database: $!";
  }
}


## A simple wrapper to load stuff into database.
sub add_to_database{

  my ($mysql, $host, $user, $pass, $port, $name, $file) = @_;

  my $cli_str = my_cli($host, $user, $pass, $port);
  ll("[SHELL] $mysql $cli_str $name < $file");
  if( ! $opt_x ){
    ! system("$mysql $cli_str $name < $file")
      or die "WARNING: [DB] Cannot add $file to database: $!";
  }
}


## A simple wrapper to try and load stuff into database.
sub try_to_add_to_database{

  my ($mysql, $host, $user, $pass, $port, $name, $file) = @_;

  my $cli_str = my_cli($host, $user, $pass, $port);
  ll("[SHELL] $mysql $cli_str $name < $file");
  if( ! $opt_x ){
    my $short_name = basename($file);
    ! system("$mysql $cli_str $name < $file")
      or warn "WARNING: [DB] Cannot add file to database: $short_name";
  }
}


## A simple wrapper for gunzipping one file to another.
sub gunzip_file{

  my ($gzip, $zfile, $uzfile) = @_;
  ll("[SHELL] $gzip -c -d $zfile > $uzfile");
  if( ! $opt_x ){
    ! system("$gzip -c -d $zfile > $uzfile")
      or die "[FS] Cannot gunzip file $!";
  }
}


## Add/load QfO data.
sub load_qfo {

  ll("Load QfO...");

  if ($opt_F) {
      warn '-F option no longer required';
  }

  my $qfo_script = "go-db-perl/scripts/go-load-qfo-fresh.pl";

  my @args =
    (
     $go_dev_path . $qfo_script,
     '-dbname', $local{EXTENSION},
     '-dbhost', $local{DB_HOST}
    );
  push @args, ('-dbuser', $local{DB_USER}) if $local{DB_USER};
  push @args, ('-dbauth', $local{DB_PASS}) if $local{DB_PASS};
  push @args, ('-dbport', $local{DB_PORT}) if $local{DB_PORT};
  #push @args, '-noseq';
  #push @args, $tmp_dl_file;
  push @args, qw/--unannotated-report --fetch --panther --no-dry-run/;

  ll("[SYSTEM] \"@args\"");
  eval {
      system(@args) == 0 || die "System \"@args\" failed: $?" if ! $opt_x;
  };
  if( $@ ){
      ww("WARNING: Could not load properly.");
      return undef;
  }

  return 1;
}


## Add/load phylotree tables.
sub run_seq2pthr2phylotree {

  ll("Start run of seq2pthr2phylotree...");
  my $retval = 0;

  ###
  ### Setup environment.
  ###

  ## BUG/TODO: We'll have to have more here to work with Stanford's
  ## complicated setup. Hopefully these things will all be in the
  ## pipeline before reaching production.
  # $ENV{GO_DBNAME} = $env_conf{GO_DBNAME}{NEW_VALUE};
  # $ENV{DBI_DRIVER} = "DBI:mysql:database=" . $ENV{GO_DBNAME};
  my $s2p_tmp = $local{FS_DOWNLOAD_DIR};
  my $s2p2p_script = 'go-db-perl/scripts/seq2pthr2phylotree.pl';
  my $loadc_script = 'go-db-perl/scripts/load-phylotree-concurrent.pl';
  my $s2p_site = 'ftp.pantherdb.org';
  my $s2p_dir = '/genome/pthr7.0';
  my $s2p_file = 'seq2pthr.gz';

  ## Create temp files for the FTP download.
  my $tmp_dl_file = new File::Temp(TEMPLATE => 'panther_download_XXXXX',
				   DIR => $s2p_tmp, SUFFIX => '');
  die "Could not create temporary download file: $!" if ! $tmp_dl_file;
  my $tmp_gunzip_file = new File::Temp(TEMPLATE => 'panther_gunzipped_XXXXX',
				       DIR => $s2p_tmp, SUFFIX => '');
  die "Could not create temporary gunzip file: $!" if ! $tmp_gunzip_file;

  ###
  ### Download necessary file.
  ###

  #my $mech = AmiGO::External::Raw->new();
  #$mech->get_external_data($s2p_file);
  my $ftp = undef;
  if ( $local{FTP_USE_PASSIVE_MODE} ) {
      $ftp = Net::FTP->new($s2p_site, Passive => 1) or die "Cannot connect to $s2p_site: $!";
      ll("[FTP] Connected (PASV) to " . $s2p_site);
  } else {
      $ftp = Net::FTP->new($s2p_site) or die "Cannot connect to $s2p_site: $!";
      ll("[FTP] Connected to " . $s2p_site);
  }

  ## Get it.
  $ftp->login('anonymous', 'anonymous') or die "Cannot login: $!";
  $ftp->binary() or die "Cannot change to binary mode: $!";
  $ftp->cwd($s2p_dir) or die "Cannot change working directory to $s2p_dir: $!";
  $ftp->get( $s2p_file, $tmp_dl_file ) or die "Cannot download $s2p_file: $!";
  $ftp->quit;
  ll("[FTP] Got file.");

  ## Unpack to other temp dir.
  gunzip_file('gzip', $tmp_dl_file, $tmp_gunzip_file);

  ###
  ### Run.
  ###

  my @auth =
    (
     '-dbname', $local{EXTENSION},
     '-dbhost', $local{DB_HOST}
    );
  push @auth, ('-dbuser', $local{DB_USER}) if $local{DB_USER};
  push @auth, ('-dbauth', $local{DB_PASS}) if $local{DB_PASS};
  push @auth, ('-dbport', $local{DB_PORT}) if $local{DB_PORT};


  ## Run final command.
  my @s2p2p =
    (
     $s2p2p_script,
     '--no-dry-run',
     '--quiet',
     # '--every=60', # we'd like a little update
     @auth,
     $tmp_gunzip_file
    );
  my @loadc = ($loadc_script, @auth);
  for (\@s2p2p, \@loadc) {
      my @args = @$_;
      my $err = $args[0];
      $args[0] = $go_dev_path . $args[0];

      ll("[SYSTEM] \"@args\"");
      eval {
	  system(@args) == 0 || die "System \"@args\" failed: $?" if ! $opt_x;
      };
      if( $@ ){
	  ww("WARNING: $err failed.");
      }else{
	  $retval = 1;
      }

      ll("End run of $err.");
  }
  return $retval;
}


## Just a little printin' when feeling verbose.
sub ll {
  my $str = shift || '';
  print $str . "\n" if $opt_v;
}


## Just a little printin' when feeling afraid.
sub ww {
  my $str = shift || '';
  print STDERR $str . "\n";
}

###
### Doc.
###

=head1 NAME

go_db_install.pl

=head1 SYNOPSIS

go_db_install.pl [-h] [-v] [-i] [-n] [-j] [-x]
                 [-g <arg>] [-m <arg>] [-a <arg>] [-s <arg>]
                 [-f <arg>] [-l <arg>] [-z]
                 [-d <arg>] [-u <arg>] [-p <arg>] [-P <arg>]
                 [-t <arg>]
                 [-e <arg>]
                 [-D <YYYYMMDD>]
                 [-L <label>]

=head1 DESCRIPTION

This is the main GO/AmiGO mirror database loading script.

TODO

=head1 OPTIONS

=over

=item -h

Instructions to see this documentation.

=item -v

Enable more verbose messages. This is useful for checking installation errors.

=item -i

Get the lite database (without IEAs).

=item -j

Try loading additional phylotree data. The environmental variable PANTHER_NEWICK_PATH will (temporarily) have to be defined for this to work.

=item -x

Do a dry run--do not execute any commands that would change
something's state.

=item -n

Do not attempt to add views and materialized views.

=item -g <location>

Path and executable of gzip (or functional equivalent).

=item -m <location>

Path and executable of mysql.

=item -a <location>

Path and executable of mysqladmin.

=item -s <location>

Path and executable of mysqlshow

=item -f <server>

Fully qualified name of FTP server.

=item -l <path>

Path to archive on FTP server.

=item -z

Use FTP passive mode (helps getting through firewalls)

=item -d <db host>

Host of database.

=item -u <db user>

User name on database.

=item -p <db password>

User password on database.

=item -P <db port>

Port number for database (defaults to 3306).

=item -t <tmp dir>

Location of tmp direetory (defaults to /tmp).

=item -e <suffix>

Suffix to use in naming the databases.

=item -D <date>

Date in YYYYMMDD format. Eclipses many other options. Will load a seqdb/assocdb GO DB from the past. Can be used with -e.

=item -M <date>

Migrate/map the schema to the latest version (experimental). Changes after <date> are applied.

=back

=head1 SEE ALSO

http://wiki.geneontology.org/

=head1 EXAMPLES

Load the latest lite DB onto spitz, under the name go_latest_lite, views included:

/users/sjcarbon/local/src/svn/geneontology/go-dev/go-db-perl/scripts/go_db_install.pl -i -e go_latest_lite -v -d spitz

Load the latest lite DB onto localhost, under the name go_latest_lite, views not included, but additional phylotree data added:

PANTHER_NEWICK_PATH=/srv/www/htdocs/amigo/panther /home/sjcarbon/local/src/svn/geneontology/go-dev/go-db-perl/scripts/go_db_install.pl -i -n -j -e go_latest_lite -v -d localhost

Load the latest full onto spitz, no views included:

/users/sjcarbon/local/src/svn/geneontology/go-dev/go-db-perl/scripts/go_db_install.pl -v -n -d spitz

Load historical DB onto spitz (2004-01-01), include views:

/users/sjcarbon/local/src/svn/geneontology/go-dev/go-db-perl/scripts/go_db_install.pl -v -i -D 20040101 -d spitz

Load historical DB onto spitz (2004-01-01), include views, was name ye_old_db:

/users/sjcarbon/local/src/svn/geneontology/go-dev/go-db-perl/scripts/go_db_install.pl -v -i -D 20040101 -e ye_old_db -d spitz

=cut
