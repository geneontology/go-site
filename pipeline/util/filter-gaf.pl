#!/usr/bin/perl
#

# filter-gaf files
# version: $Revision: 1.119 $
# date: $Date: 2012/08/17 19:20:03 $
#
# specification of the gene_association format is defined at:
#   http://www.geneontology.org/GO.annotation.html#file
#
# Requires Perl 5.6.1 or later
#
# POD documentation is at the bottom of the file.
#  to see the documentation use pod2text from the command line
#
# Maintained by SGD for the Gene Ontology Consortium
#  author: Mike Cherry (cherry@stanford.edu) original script, maintained since July 2005
#          updated July 2005 Anand Sethuraman
# Adapted for new pipeline, 2017
#
###############################################################################

use strict;
use FindBin qw($Bin);


my $obofile = "target/go.obo";
my $abbsfile = "target/GO.xrf_abbs";

my $gzipexec = "/usr/bin/gzip --best";
my $gzcatexec = "/usr/bin/gzcat";

# error-free lines in the gene-assoc will be written out to the following location
# Note: all the user submitted gene-assoc files will be under this directory too
my $configfile;
###############################################################################

############ Get and check user passed in single character switches ##########
# process command line arguments
our $opt_h;
our $opt_q;
our $opt_d;
our $opt_e;
our $opt_w;
our $opt_r;
our $opt_t;
our $opt_o;
our $opt_i;
our $opt_p;
our $opt_x;
our $opt_v;

use Getopt::Std;

getopts('hqdewrto:i:p:x:v:');

# TRUE if the user wants the details report
# otherwise just the summary is provided
my $printhelp = defined($opt_h);
my $quietmode = defined($opt_q);
my $detail = defined($opt_d);
my $writebad = defined($opt_e);
my $writegood = defined($opt_w);
my $writereport = defined($opt_r);
my $taxonlogwrite = defined($opt_t);
my $gafversion = $opt_v;
my $inputfile = "-";
my $projectname = "";

# set defaults
$gafversion = 2 unless ($gafversion);

# number of columns required for GAF version
my $gaf_output_columns = 0;

# check the passed in options
&check_options;
###############################################################################

################## Define variables to keep track of errors ###################
# number of line in the input file
my $linenum = 0;

# current line of text
my $line = "";

# array of errors, column number is the index
my @errors = ();

# total errors, column specific errors and line errors
my $totalerr = 0;

# error detected on this line
my $errorfound = 0;

# errors with the whole line
my $lineerr = 0;

# errors with the number of columns
my $colnumerr = 0;

# error found on the current line, used by checkwarn()
my $erroronthisline = 0;

# total number of lines writing with the -w option
my $totallines = 0;

# total number of lines filtered out to make non-redundant
my $taxonfiltered = 0;

# total number of annotations to one of the unknown terms
# the GOIDs of these annotations are mapped to the corresponding
# root ID
my $unknownAnnotations = 0;

# earliest time annotations were found
# this is for the date check
use constant MINYEAR => 1985;

# date for limiting IEA associations
my ($sec,$min,$hour,$mday,$mon,$currentyear) = localtime(time);
$currentyear += 1900;
$mon += 1;
($mon = "0" . $mon) if ($mon < 10);
($mday = "0" . $mday) if ($mday < 10);
my $datetoday = $currentyear . $mon . $mday;

my $limitdate = $datetoday - 10000;
print STDERR "IEA limit date defined as $limitdate\n" if ($detail);

# after this date IEA annotation WITH field has cardinality of 1
my $limit_WITH_date_IEA = 20070501;
my $limit_WITH_date_IPI = 20120401;

# Hash to store dates listed in column number 14
my %dates = ();

# defined information about each column in the gene_association files
my @column = ();

# Column positions 
use constant DB => 0;
use constant DB_OBJECT_ID => 1;
use constant DB_OBJECT_SYMBOL => 2;
use constant QUALIFIER => 3;
use constant GOID => 4;
use constant REFERENCE => 5;
use constant EVIDENCE => 6;
use constant WITH => 7;
use constant ASPECT => 8;
use constant DB_OBJECT_NAME => 9;
use constant DB_OBJECT_SYNONYM => 10;
use constant DB_OBJECT_TYPE => 11;
use constant TAXON => 12;
use constant DATE => 13;
use constant ASSIGNED_BY => 14;
use constant ANNOTATION_XP => 15;         # ignored if GAF version < 2
use constant GENE_PRODUCT_ISOFORM => 16;  # ignored if GAF version < 2
use constant TAXONFILTER => 112;
use constant LINEERROR => 200;
use constant COLNUMERROR => 210;

# Number of TAB delimited columns in file (default).  Really only 15
# input columns for GAF V1.0.  Add a terminator column thus we make
# the constant is 16
use constant COLNUM => 16;

# Definition of positions in column array
use constant LABEL => 0;
use constant CARDINAL => 1;
use constant SPECIAL => 2;
use constant CHECKDB => 3;
use constant DUBCOLON => 4;

# Hashes to identify multiple DB_Object_ID and DB_Object_Symbol being used
my %DbId2StdName = ();

# Define Column Information
&populate_column_array;

# Get Evidence Codes, Object Types, Qualifier Types
my (%evicodes,  %objtypes, %qualtypes);
&populate_evi_obj_qual_hashes;

# Load TAXID specification, which project files can have which TAXIDs
my (%taxon2species);
my %taxonfilterlog;
&populate_taxon2species_hash;

# Parse the OBO file and populate goid hashes, including alt and obsolete GOIDs
my (%goids, %altids, %obsids, %goidaspect, %replacedby, %consider);
&parse_obo_file;;

# Parse the abbreviations file and find defined abbreviations
my %abbrev;
&parse_abbs_file;

### store header from parsed gene association config file
my $gene_assoc_header = "";

### parse gene associations file
&parse_gene_assoc_file;

exit;

###############################################################################
################################           ####################################
################################ FUNCTIONS ####################################
################################           ####################################
###############################################################################

###############################################################################
sub check_options
###############################################################################
{
    if ($writegood && $writebad)
    {
	die "Unable to have both -w and -e on.  This would print both
good and bad lines to STDOUT, effectively just duplicating the input
file.\nExiting now.\n\n";

    }

    if ($detail && $writebad)
    {
	print STDERR "\n * * * * WARNING * * * *\n
It is confusing to have detail (-d) and writebad (-e) on at the same
time.  Detail writes to STDERR while writebad writes to STDOUT.
Consider using only writebad.
\n * * * * * * * * * * * *\n\n\n";
    }

    if ($printhelp)
    {

	print STDOUT <<END;

      Usage:  $0 [-h] [-q] [-d] [-w] [-r] [-o filename] [-i input file] [-p project] [-v GAF-version]

	  -h displays this message
	  -q quiet mode
	  -i input to present a standard file, gzipped, or compressed file as input.
             STDIN is the default.
          -d switches to a line by line report of errors identified on STDERR
          -e write all "bad lines" to STDOUT
          -w write all "good lines" to STDOUT
          -r write e-mail report and file of all "good lines" to files
          -o alternative path to the gene_ontology_edit.obo file.
          -p force project name
             to turn off taxid check state project name as nocheck
          -x alternative path to GO.xrf_abbs file
          -v GAF format version number to output. Defaults to 2.
             converting from 2->1 involves truncating 2 columns.
             converting from 1->2 involves adding 2 blank columns.

	  examples:

	      check a file for any errors, obsolete GOIDs or old IEA annotations

		  % $0 -i gene_association.sgd.gz

	      filter any problems and output the validated lines, including headers

		  % $0 -i gene_association.fb.gz -w > filtered-output

	      check file without the taxid checking on, and write the bad lines to STDOUT

		  % $0 -i gene_association.fb.gz -p nocheck -e > bad-lines

END

    exit;

    }

    if ($opt_o)
    {
	$obofile = $opt_o;
    }
	
    if ($opt_x)
    {
	$abbsfile = $opt_x;
    }
	
    if ($opt_i)
    {
	$inputfile = $opt_i;
	$projectname = $inputfile;
	$projectname =~ s/.*gene_association\.//;
	$projectname =~ s/\.gaf\.gz//;
	$projectname =~ s/\.gz//;
    }
	
    if ($opt_p)
    {
	$projectname = $opt_p;
	print STDERR "Project Name set to $projectname\n" if ($detail);
    }
	
    print STDERR "Input filename = $inputfile\n" if ($detail);
    print STDERR "OBO filename = $obofile\n" if ($detail);
    print STDERR "Abbrev. filename = $abbsfile\n" if ($detail);
    print STDERR "Project Name = $projectname\n" if ($detail);
	
    if ( lc($opt_p) eq 'nocheck' )
    {
	$projectname = "";
    }

}

###############################################################################
sub populate_column_array
{
###############################################################################
# Column information:  Name (LABEL), Check Cardinality (CARDINAL), 
#  Special Check Included (SPECIAL), CheckDB name (CHECKDB), 
#  Check for double colon '::' in IDs (DUBCOLON)
# Cardinality; if 0 =
# Special check included; if 0 = FALSE or 1 = TRUE

    $column[DB] = ['DB', 1, 1, 0, 0];
    $column[DB_OBJECT_ID] = ['DB_Object_ID', 1, 1, 0, 1];
    $column[DB_OBJECT_SYMBOL] = ['DB_Object_Symbol', 1, 1, 0, 0];
    $column[QUALIFIER] = ['Qualifier', 0, 1, 0, 0];
    $column[GOID] = ['GOID', 1, 1, 0, 1];
    $column[REFERENCE] = ['DB:Reference', 2, 1, 1, 1];
    $column[EVIDENCE] = ['Evidence', 1, 1, 0, 0];
    $column[WITH] = ['With', 0, 1, 1, 1];
    $column[ASPECT] = ['Aspect', 1, 1, 0, 0];
    $column[DB_OBJECT_NAME] = ['DB_Object_Name', 0, 1, 0, 0];
    $column[DB_OBJECT_SYNONYM] = ['DB_Object_Synonym', 0, 1, 0, 0];
    $column[DB_OBJECT_TYPE] = ['DB_Object_Type', 1, 1, 0, 0];
    $column[TAXON] = ['Taxon', 2, 1, 0, 1];
    $column[DATE] = ['Date', 1, 1, 0, 0];
    $column[ASSIGNED_BY] = ['Assigned_by', 1, 1, 0, 0];


}

###############################################################################
sub populate_evi_obj_qual_hashes
###############################################################################
{

    %evicodes = ( IC => 1, IDA => 1, IEA => 1, IEP => 1, IGI => 1,
		  IMP => 1, IPI => 1, ISS => 1, NAS => 1, ND => 1,
		  TAS => 1, NR => 1, RCA =>1, IGC => 1, ISO => 1,
		  ISM => 1, ISA => 1, EXP => 1, IMR => 1, IRD => 1,
		  IBA => 1, IBD => 1, IKR => 1, IRD => 1 );

    # object types need to be all lowercase
    %objtypes = ( complex => 1, gene => 1, gene_product => 1,
		  mirna => 1, ncrna => 1, protein => 1, protein_complex => 1,
		  protein_structure => 1, rna => 1, rrna => 1, snorna => 1,
		  snrna => 1, transcript => 1, trna => 1, polypeptide => 1 );

    %qualtypes = ( not => 1, contributes_to => 1, colocalizes_with => 1,
                   acts_upstream_of_or_within => 1,
                   acts_upstream_of => 1,
                   involved_in => 1,
		   rapid_divergence => 1);

}

###############################################################################
sub populate_taxon2species_hash
###############################################################################
# which taxon IDs are allowed in which project files
{

%taxon2species = (
    'taxon:5476' => 'cgd',
    'taxon:1033177' => 'aspgd',
    'taxon:1073089' => 'aspgd',
    'taxon:1137211' => 'aspgd',
    'taxon:1160497' => 'aspgd',
    'taxon:331117' => 'aspgd',
    'taxon:332952' => 'aspgd',
    'taxon:341663' => 'aspgd',
    'taxon:344612' => 'aspgd',
    'taxon:41063' => 'aspgd',
    'taxon:451804' => 'aspgd',
    'taxon:46472' => 'aspgd',
    'taxon:5061' => 'aspgd',
    'taxon:5062' => 'aspgd',
    'taxon:602072' => 'aspgd',
    'taxon:690307' => 'aspgd',
    'taxon:746128' => 'aspgd',
    'taxon:75750' => 'aspgd',
    'taxon:767769' => 'aspgd',
    'taxon:767770' => 'aspgd',
    'taxon:162425' => 'aspgd',
    'taxon:5085' => 'aspgd',   ## appears to be deprecated in NCBI taxonomy?
    'taxon:5664' => 'GeneDB_Lmajor',
    'taxon:185431' => 'GeneDB_Tbrucei',
    'taxon:5782' => 'dictyBase',
    'taxon:44689' => 'dictyBase',
    'taxon:352472' => 'dictyBase',
    'taxon:366501' => 'dictyBase',
    'taxon:83333' => 'ecocyc',
    'taxon:7227' => 'fb',
    'taxon:4896' => 'PomBase',
    'taxon:284812' => 'PomBase',
    'taxon:10090' => 'mgi',
    'taxon:10116' => 'rgd',
    'taxon:4932' => 'sgd',
    'taxon:41870' => 'sgd',
    'taxon:285006' => 'sgd',
    'taxon:307796' => 'sgd',
    'taxon:559292' => 'sgd',
    'taxon:3702' => 'tair',
    'taxon:6239' => 'wb',
    'taxon:7955' => 'zfin',
    'taxon:9031' => 'goa_chicken',
    'taxon:9913' => 'goa_cow',
    'taxon:9606' => 'goa_human',
    'taxon:9823' => 'goa_pig',
    'taxon:9615' => 'goa_dog',
    );

#
# removed from the authority list on October 4, 2012
# this projects had not updated their annotations for > 24 months

#    'taxon:5833' => 'GeneDB_Pfalciparum',
#    'taxon:37546' => 'GeneDB_tsetse',
#    'taxon:212042' => 'jcvi',
#    'taxon:198094' => 'jcvi',
#    'taxon:227377' => 'jcvi',
#    'taxon:246194' => 'jcvi',
#    'taxon:195099' => 'jcvi',
#    'taxon:195103' => 'jcvi',
#    'taxon:167879' => 'jcvi',
#    'taxon:243164' => 'jcvi',
#    'taxon:205920' => 'jcvi',
#    'taxon:243231' => 'jcvi',
#    'taxon:228405' => 'jcvi',
#    'taxon:265669' => 'jcvi',
#    'taxon:243233' => 'jcvi',
#    'taxon:222891' => 'jcvi',
#    'taxon:220664' => 'jcvi',
#    'taxon:223283' => 'jcvi',
#    'taxon:264730' => 'jcvi',
#    'taxon:211586' => 'jcvi',
#    'taxon:246200' => 'jcvi',
#    'taxon:686' => 'jcvi',
#    'taxon:4528' => 'gramene_oryza',
#    'taxon:4529' => 'gramene_oryza',
#    'taxon:4530' => 'gramene_oryza',
#    'taxon:4532' => 'gramene_oryza',
#    'taxon:4533' => 'gramene_oryza',
#    'taxon:4534' => 'gramene_oryza',
#    'taxon:4535' => 'gramene_oryza',
#    'taxon:4536' => 'gramene_oryza',
#    'taxon:4537' => 'gramene_oryza',
#    'taxon:4538' => 'gramene_oryza',
#    'taxon:29689' => 'gramene_oryza',
#    'taxon:29690' => 'gramene_oryza',
#    'taxon:39946' => 'gramene_oryza',
#    'taxon:39947' => 'gramene_oryza',
#    'taxon:40148' => 'gramene_oryza',
#    'taxon:40149' => 'gramene_oryza',
#    'taxon:52545' => 'gramene_oryza',
#    'taxon:63629' => 'gramene_oryza',
#    'taxon:65489' => 'gramene_oryza',
#    'taxon:65491' => 'gramene_oryza',
#    'taxon:77588' => 'gramene_oryza',
#    'taxon:83307' => 'gramene_oryza',
#    'taxon:83308' => 'gramene_oryza',
#    'taxon:83309' => 'gramene_oryza',
#    'taxon:110450' => 'gramene_oryza',
#    'taxon:110451' => 'gramene_oryza',
#    'taxon:127571' => 'gramene_oryza',
#    'taxon:364099' => 'gramene_oryza',
#    'taxon:364100' => 'gramene_oryza',
#    'taxon:208964' => 'pseudocap',
#

}

###############################################################################
sub parse_obo_file
###############################################################################
{

    my $readgoid;
    my $cntaltid = 0;
    my $cntobsgoid = 0;

    open (OBSGA, $obofile) || die "Cannot open file $obofile: $!\n";

    while ( <OBSGA> )
    {
	chomp;

	if (/^id: (GO:\d\d\d\d\d\d\d)/)
	{
	    $readgoid = $1;
	    $goids{$1}++;
	} elsif (/^alt_id: (GO:\d\d\d\d\d\d\d)/)
	{
	    #
	    # don't add old unknown terms to altids.  They are now synonums in the
	    # ontology but I will map them to their roots later in this script.
	    #
	    if ( $1 eq "GO:0008372" || $1 eq "GO:0005554" || $1 eq "GO:0000004" )
	    {
		next;
	    }
	    $altids{$1} = $readgoid;
	    $cntaltid++;
	} elsif (/^is_obsolete: true/)
	{
	    $obsids{$readgoid}++;
	    $cntobsgoid++;
	} elsif (/^replaced_by: (GO:\d\d\d\d\d\d\d)/)
	{
	    $replacedby{$readgoid} = $1;
	} elsif (/^consider: (GO:\d\d\d\d\d\d\d)/)
	{
	    if (defined($consider{$readgoid}))
	    {
		$consider{$readgoid} .= "|$1";
	    } else
	    {
		$consider{$readgoid} = "$1";
	    }
	} elsif (/^namespace: (\w+)/)
	{
	    if ($1 eq 'biological_process')
	    {
		$goidaspect{$readgoid} = 'P';
	    } elsif ($1 eq 'molecular_function')
	    {
		$goidaspect{$readgoid} = 'F';
	    } elsif ($1 eq 'cellular_component')
	    {
		$goidaspect{$readgoid} = 'C';
	    }
	}
    }

    # Hardcode unknown terms so the annotation files will pass Then
    # they will be mapped to their root print STDERR "Hardcoding
    # unknown GOIDs so initial checks work.  Will later map these
    # GOIDs to their root IDs.\n" if ($detail);
    $goids{"GO:0008372"}++;
    $goids{"GO:0005554"}++;
    $goids{"GO:0000004"}++;
    $goidaspect{"GO:0008372"} = 'C';
    $goidaspect{"GO:0005554"} = 'F';
    $goidaspect{"GO:0000004"} = 'P';

    print STDERR "Read $cntaltid alternative GOIDs from $obofile\n" if ($detail);
    print STDERR "Read $cntobsgoid obsolete GOIDs from $obofile\n" if ($detail);

    close (OBSGA);

}

###############################################################################
sub parse_abbs_file
###############################################################################
{

    my $cntabbs = 0;
    my $cntsyn = 0;

    open (ABBS, $abbsfile) || die "Cannot open file $abbsfile: $!\n";

    while ( <ABBS> )
    {
	chomp;

	if (/^abbreviation: (\S+)/)
	{
	    $abbrev{ lc($1) }++;
	    $cntabbs++;
	}

	if (/^synonym: (\S+)/)
	{
	    my $foundstring = $1;
	    unless ( defined($abbrev{ lc($1) } ))
	    {
		$abbrev{ lc($foundstring) }++;
		$cntsyn++;
	    }
	}
    }

    close (ABBS);

    print STDERR "Read $cntabbs abbreviations and $cntsyn synonyms from $abbsfile\n\n" if ($detail);

}

###############################################################################
sub parse_gene_assoc_config_file
{
###############################################################################

    my ($base_file_name) = @_;  ### eg: gene_association.sgd

    my %gene_assoc_meta_data = ();

    $configfile = "${base_file_name}.conf";

    open (META, $configfile) || die "Cannot open file $configfile for reading: $!\n";

    while ( <META> )
    {
	chomp;

	if (/^project\_name=(.+)$/)
	{
	    next if ($1 eq 'unspecified');
	    $gene_assoc_meta_data{ "A" } = "!Project_name: $1\n";	    
	}
	elsif (/^project\_url=(.+)$/)
	{
	    next if ($1 eq 'unspecified');
	    $gene_assoc_meta_data{ "B" } = "!URL: $1\n";
	}
	elsif (/^contact\_email=(.+)$/)
	{
	    next if ($1 eq 'unspecified');
	    $gene_assoc_meta_data{ "C" } = "!Contact Email: $1\n";
	}
	elsif (/^funding\_source=(.+)$/)
	{
	    next if ($1 eq 'unspecified');
	    $gene_assoc_meta_data{ "D" } = "!Funding: $1\n";
	}
	else
	{
	    next;
	}
    }

    close (META);

    foreach my $confinfo (sort keys %gene_assoc_meta_data)
    {
	$gene_assoc_header .= $gene_assoc_meta_data{ $confinfo };
    }

}

###############################################################################
sub parse_gene_assoc_file
{
###############################################################################

    my $base_file_name = "";
    my $dirpath = "/tmp/";
    my $savedirpath = "";

    # logic assumes input is GAF v1
    my $input_gaf_version = 1;

    if ( $inputfile =~ /(.+)\.gz$/)
    {
	open (INPUT, "$gzcatexec $inputfile |") || die "Cannot open gzipped input $inputfile for reading: $!\n";
	$base_file_name = $1;
    }
    else
    {
	open (INPUT, $inputfile) || die "Cannot open input file $inputfile: $!\n";
	$base_file_name = $inputfile;
    }
    
    if ($writereport)
    {
	&parse_gene_assoc_config_file($base_file_name);

	if ( $base_file_name =~ /(^.*\/)(gene_association\..*|goa_.*)/ )
	{
	    $savedirpath = $1;
	    $base_file_name = $2;
	}

	unless ( -d $dirpath )
	{
	    # /tmp directory does not exist so use the current working directory for temp file
	    $dirpath = $savedirpath;
	}
	open (FILTER, "| $gzipexec > ${dirpath}${base_file_name}.filtered.gz") || die "Cannot write gzipped output ${dirpath}${base_file_name}.filtered.gz: $!\n";
        if ($gafversion == 2) 
        {
            print FILTER "!gaf-version: 2.0\n";
        }
	print FILTER "$gene_assoc_header";

    }

    my $headerCount = 1;

    my $previous_line = '';

    # Begin input loop
    while ( defined($line = <INPUT>) )
    {
	$linenum++;
	$errorfound = 0;
	$erroronthisline = 0;
	
	unless ( $line =~ /.*\n/ )
	{
	    &checkwarn ("$linenum: No end of line character, the last line of the file is probably missing a return character\n");
	    $lineerr++;
	    $erroronthisline++;
	}
	
	chomp $line;
    
	if ($line eq $previous_line) 
	{
	    &checkwarn ("Line identical to previous line: $line\n", LINEERROR);
	    $lineerr++;
	    $erroronthisline++;
	}
	$previous_line = $line;
	
        # skip comment lines
	if ($line =~ m/^\!/)
	{
            if ($line =~ m/^\!gaf-version:\s*(\d+)\./) 
            {
                $input_gaf_version = $1; # ignore minor version number.
                if ($gafversion == 2) 
                {
                    # already emitted gaf-version tag for header
		    # will fix the number of columns below
                    next;
                }
		else
                {
                    # force output to be consistent with -v flag
                    $line =~ s/^\!gaf-version:.*/\!gaf-version: 1.0/;
                }
            }

	    print "$line\n" if ( $writegood );

	    unless ( ($line =~ m/^!Version\:\s*Revision\:/i) || ($line =~ m/^!From\:\s/i) || ($line =~ m/^!URL\:\s/i) || ($line =~ m/^!Contact.Email\:\s/i) || ($line =~ m/^!Funding\:\s/i) || ($line =~ m/^!Project_name\:\s/i) )
	    {
		print FILTER "$line\n" if ( $writereport);
	    }

	    next;
	}

	# blank line?
	if ( $line eq "" )
	{
	    &checkwarn ("$linenum: BLANK line, these should be deleted or start with an \'\!\'\n", LINEERROR);
	    $lineerr++;
	    $erroronthisline++;
	    next;
	}
	
	$line .= "\t-1";

	# split TAB delimited columns
	my @cols = split(/\t/, $line);

#	print "input_gaf_version = $input_gaf_version\n";
#	print "gafversion = $gafversion\n";

	if ($gafversion == 1)
	{
	    $gaf_output_columns = COLNUM;
	}
	else
	{
	    $gaf_output_columns = COLNUM+2;
	}



	if ( scalar @cols > $gaf_output_columns || scalar @cols < $gaf_output_columns )
	{
#	    &checkwarn ("$linenum: Incorrect number of columns for GAF ver $gafversion, found " . scalar @cols . ". Should be " . ($gaf_output_columns - 1) . ". Columns added or subtracted as needed.\n", COLNUMERROR);

	    while ( scalar @cols != $gaf_output_columns)
	    {
		while ( scalar @cols > $gaf_output_columns)
		{
		    if ($cols[scalar @cols] == "") {
			# remove terminator column
			pop(@cols);
			    
			# remove last input column
			if ($cols[$#cols] eq '')
			{
			    pop(@cols);
			}
			else
			{
			    $line = join("\t", @cols);
			    die "\n\nFATAL ERROR:\nDeleting column number $#cols that is not empty \"$cols[$#cols]\"\n\nINPUT line is:\n\"$line\"\n\n";
			}
			    
			# add back terminator column
			push(@cols, '-1');
		    }
		}

		while ( scalar @cols < $gaf_output_columns)
		{
		    # remove terminator column
		    pop(@cols);
			
		    # add another input column
		    push(@cols, '');

		    # add terminator column
		    push(@cols, '-1');
		}
	    }

#	    $erroronthisline++;

	    # increment error counter
	    $colnumerr++;

	    # done changing the number of columns
	    # remove terminator column
	    pop(@cols);

	    # remake $line
	    $line = join("\t", @cols);
			
#	    print STDOUT "$line\n\n" if ($writebad);

	    # add back terminator column
	    push(@cols, '-1');

	}

	if ($gafversion == 1) 
	{
                # there is 1 non-backwards compatible change in
                # switching from v1 to v2; in the original spec, the
                # DB_OBJECT_TYPE column refers to the DB_OBJECT.  in
                # v2, the type column refers to col17. in v2, the
                # DB_OBJECT is *always* a gene

                $cols[DB_OBJECT_TYPE] = 'gene';

		# one more check for number of columns
		print ("GAF1.0 col num problem " . scalar @cols) unless (scalar @cols == COLNUM);
        }

	if ($gafversion == 2)
        {
            # output to GAF 2.x
            # we dynamically extend the spec

            $column[ANNOTATION_XP] = ['Annotation_cross_product', 0, 0, 0, 0]; # TODO - special check
            $column[GENE_PRODUCT_ISOFORM] = ['Gene_product_isoform', 0, 0, 1, 0];

	    # one more check for number of columns
	    print ("GAF2.0 col num problem " . scalar @cols) unless (scalar @cols == COLNUM+2);
        }

	# done processing column numbers
	# remove terminator column
	pop(@cols);
    
	# remake $line
	$line = join("\t", @cols);
    
	# add back terminator column
	push(@cols, '-1');
    
	# loop through all the columns on this line of input
	for (my $cnum=0; $cnum < @column; $cnum++)
	{
	    # Any leading or trailing spaces?
	    my $value = $cols[$cnum];
	    if ( ($value =~ m/^\s/) || ($value =~ m/\s$/) )
	    {
		&checkwarn ($linenum . ": " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " leading or trailing white space: \"" . $value . "\"\n", $cnum);
		# error to have leading or trailing spaces, remove them and continue
		$cols[$cnum] =~ s/^\s+//;
		$cols[$cnum] =~ s/\s+$//;
		$erroronthisline++;
	    }

	    my (@field) = split(/\|/, $cols[$cnum]);

	    foreach my $value (@field)
	    {
		if ( ( $value =~ /^.+:$/ ) && ( $cnum != DB_OBJECT_NAME ) )
		{
		    &checkwarn ("$linenum: " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " incomplete entry in $column[$cnum][LABEL]: \"$value\"\n", $cnum);
		    $erroronthisline++;
		}
	    }
	    
	    # Internal spaces are only allowed for DB_OBJECT_NAME and DB_OBJECT_SYNONYM
	    unless ( ( $cnum == DB_OBJECT_NAME ) || 
		     ( $cnum == DB_OBJECT_SYNONYM ) ||
		     ( $cnum == DB_OBJECT_SYMBOL ) )
	    {
		my $value = $cols[$cnum];
		if ($value =~ m/\s/)
		{
		    &checkwarn ($linenum . ": " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " unexpected white space: \"" . $value . "\"\n", $cnum);
		    $erroronthisline++;
		}
	    }
	    # Check Cardinality
	    if ($column[$cnum][CARDINAL] > 0)
	    {
		if ($cols[$cnum] eq "")
		{
		    # Cardinality of 2 means one or more items are required.
		    if ($column[$cnum][CARDINAL] == 2)
		    {
			&checkwarn ($linenum . ": " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " cardinality should be 1 or 2, found 0: \"" . $cols[$cnum] . "\"\n", $cnum);
		    $erroronthisline++;
		    } else
		    {
			&checkwarn ($linenum . ": " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " cardinality should be 1, found 0: \"" . $cols[$cnum] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		}
		my @field = split(/\|/, $cols[$cnum]);

		# Cardinality of 1 means one only item is required
		if ($column[$cnum][CARDINAL] == 1)
		{
		    if ( @field > 1 )
		    {
			&checkwarn ($linenum . ": " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " cardinality should equal 1, found > 1: \"" . $cols[$cnum] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		}
	    } # end of CARDINAL checks

	    # Specific Checks
	    if ($column[$cnum][SPECIAL])
	    {

		# Was a valid DB abbreviation used
		if ($cnum == DB)
		{
		    unless ($abbrev{ lc($cols[DB]) })
		    {
			&checkwarn ("$linenum: " . $column[DB][LABEL] . " column=" . (DB + 1) . " allowed database abbreviation not correct, found \"" . $cols[DB] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		} # end of DB checks
		
		# Check for valid DB name
		if ($cnum == DB_OBJECT_ID)
		{
		    if ( exists($DbId2StdName{$cols[DB_OBJECT_ID]}) && 
			 $cols[DB_OBJECT_SYMBOL] ne $DbId2StdName{$cols[DB_OBJECT_ID]} )
		    {
			&checkwarn ("$linenum: " . $column[DB_OBJECT_ID][LABEL] . " column=" . (DB_OBJECT_ID + 1) . " two symbols for $cols[DB_OBJECT_ID], found \"$cols[DB_OBJECT_SYMBOL]\" and \"$DbId2StdName{$cols[DB_OBJECT_ID]}\"\n", $cnum);
			$erroronthisline++;
		    } else
		    {
			$DbId2StdName{$cols[DB_OBJECT_ID]} = $cols[DB_OBJECT_SYMBOL];
		    }

		} # end of DB_OBJECT_ID checks
		
		# Qualifier Column on NOT, contributes_to, colocalizes_with
		if ($cnum == QUALIFIER)
		{
		    my @field = split(/\|/, $cols[QUALIFIER]);

		    foreach my $value (@field)
		    {
			unless ( $qualtypes{ lc($value) } )
			{
			    &checkwarn ($linenum . ": " . $column[QUALIFIER][LABEL] . " column=" . (QUALIFIER + 1) . " allowed type not present, found \"" . $cols[QUALIFIER] . "\"\n", $cnum);
			    $erroronthisline++;
			    next;
			}
			if ( (lc($value) eq "contributes_to") && ($cols[ASPECT] ne "F"))
			{
			    &checkwarn ($linenum . ": " . $column[QUALIFIER][LABEL] . " column=" . (QUALIFIER + 1) . " contributes_to can only be used for Molecular Function annotations\n", $cnum);
			    $erroronthisline++;
			}
			if ( (lc($value) eq "colocalizes_with") && ($cols[ASPECT] ne "C"))
			{
			    &checkwarn ($linenum . ": " . $column[QUALIFIER][LABEL] . " column=" . (QUALIFIER + 1) . " colocalizes_with can only be used for Cellular Component annotations\n", $cnum);
			    $erroronthisline++;
			}
		    }
		} # end of QUALIFIER checks
		
		# If GOID in WITH column is it valid, also check if a valid abbreviation is used
		if ($cnum == WITH && $cols[WITH] ne "")
		{
    		    if ( $cols[WITH] =~ /\;/)
		    {
			&checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " semicolon found \"" . $cols[WITH] . "\"\n", $cnum);
			$erroronthisline++;
		    }

# this makes the script compliant with gaf v2.1
# allow both pipe and common as deliminator for IDs

		    my @field = split(/[\|\,]/, $cols[WITH]);
		    foreach my $value (@field)
		    {
			
			if ($value =~ /^GO\:\w+/)
			{
			    #
			    # Use the %obsids hash to check if current GOID is obsolete
			    # if TRUE then $is_obs equals 1
			    #
			    
			    if (defined($obsids{$value}))
			    {
				my $obsextratext = "";
				if (defined($replacedby{$value}))
				{
				    $obsextratext = "; Replaced by $replacedby{$value} ";
				} elsif (defined($consider{$value}))
				{
				    $obsextratext = "; Consider these $consider{$value} ";
				} else
				{
				    $obsextratext = "; OBO file contains no suggested alternatives";
				}
				#obsolete
				&checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " obsolete GOID in WITH: \"" . $cols[WITH] . "\"$obsextratext\n", $cnum);
				$erroronthisline++;
			    } elsif (defined($altids{$cols[WITH]}))
			    {
				# Use the %altids hash to check if current GOID is an alternate
				# The secondary is the key, the primary ID is the value of the hash.
				&checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " this is a secondary ID " . $cols[WITH] . " should use " . $altids{$cols[WITH]} . " instead.\n", $cnum);
				$erroronthisline++;
			    }
			    
			    if ( (! defined($goids{$value})) && ($errorfound == 0) )
			    {
				# A secondary or obsolete GOID
				&checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " GOID in WITH \"$value\" is not valid: \"" . $cols[WITH] . "\"\n", $cnum);
				$erroronthisline++;
			    }
			    
			} else
			{

			    my @tmpabbrev = split(/:/, lc($value));
			    unless ($abbrev{$tmpabbrev[0]})
			    {
				&checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " allowed database abbreviation not correct, found \"" . $cols[$cnum] . "\"\n", $cnum);
				$erroronthisline++;
			    }
			}
		    }
		} # end of WITH checks

		# Aspect only one of P, F or C
		if ($cnum == ASPECT)
		{

		    unless ( ($cols[ASPECT] eq 'P') || ($cols[ASPECT] eq 'F') || ($cols[ASPECT] eq 'C') )
		    {
			&checkwarn ("$linenum: " . $column[ASPECT][LABEL] . " column=" . (ASPECT + 1) . " only P, F, or C allowed \"" . $cols[ASPECT] . "\"\n", $cnum);
			$erroronthisline++;
		    } 
		} # end of ASPECT checks
		
		# Was a valid Object type provided
		if ($cnum == DB_OBJECT_TYPE)
		{
		    unless ($objtypes{ lc($cols[DB_OBJECT_TYPE]) })
		    {
			&checkwarn ("$linenum: " . $column[DB_OBJECT_TYPE][LABEL] . " column=" . (DB_OBJECT_TYPE + 1) . " allowed type not present, found \"" . $cols[DB_OBJECT_TYPE] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		} # end of DB_OBJECT_TYPE checks
		
		# Basic format check for reference ids
		if ($cnum == REFERENCE)
		{
		    
		    if ( $cols[REFERENCE] =~ /\;/)
		    {
			&checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " semicolon found \"" . $cols[REFERENCE] . "\"\n", $cnum);
			$erroronthisline++;
		    }

		    if ( $cols[REFERENCE] =~ m/unpublished/i)
		    {
			&checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " unpublished not allowed.  A DB or PubMed ID is required, found \"" . $cols[REFERENCE] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		    if ( $cols[REFERENCE] =~ m/PMID\:PMID\:/i)
		    {
			&checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " PMID:PMID: not allowed, found \"" . $cols[REFERENCE] . "\"\n", $cnum);
			$erroronthisline++;
		    }

		    my @field = split(/\|/, $cols[REFERENCE]);
		    foreach my $value (@field)
		    {
			
			# NOTE: WB uses [ & ] in their reference IDs
			unless ( $value =~ m/\w+\:[\[\]\w]+/ )
			{
			    &checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " format of reference not DB:REFID \"" . $cols[REFERENCE] . "\"\n", $cnum);
			    $erroronthisline++;
			} elsif ($value =~ /^GO\:\w+/)
			{
			    
			    # Use the %obsids hash to check if current GOID is obsolete
			    # if TRUE then $is_obs equals 1
			    
			    # obsolete ids
			    if (defined($obsids{$value}))
			    {
				my $obsextratext = "";
				if (defined($replacedby{$value}))
				{
				    $obsextratext = "; Replaced by $replacedby{$value} ";
				} elsif (defined($consider{$value}))
				{
				    $obsextratext = "; Consider these $consider{$value} ";
				} else
				{
				    $obsextratext = "; OBO file contains no suggested alternatives";
				}
				#obsolete
				&checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " obsolete GOID \"$value\" as REFERENCE: \"" . $cols[REFERENCE] . "\"$obsextratext\n", $cnum);
				$erroronthisline++;
			    } elsif (defined($altids{$cols[REFERENCE]}))
			    {
				# Use the %altids hash to check if current GOID is an alternate
				# The secondary is the key, the primary ID is the value of the hash.
				&checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " this is a secondary ID " . $cols[REFERENCE] . " should use " . $altids{$cols[REFERENCE]} . " instead.\n", $cnum);
				$erroronthisline++;
			    }
			    
			    if ( (! defined($goids{$value})) && ($errorfound == 0) )
			    {
				# A secondary or obsolete GOID
				&checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " GOID as REFERENCE \"$value\" is not valid: \"" . $cols[REFERENCE] . "\"\n", $cnum);
				$erroronthisline++;
			    }    
			}
		    }
		} # end of REFERENCE checks
		
		# Taxon string must start with taxon:
		if ($cnum == TAXON)
		{

		    if ($cols[TAXON] eq "taxon:")
		    {
			&checkwarn ("$linenum: " . $column[TAXON][LABEL] . " column=" . (TAXON + 1) . " blank taxon found \"" . $cols[TAXON] . "\"\n", $cnum);
			$erroronthisline++;
		    }

# Split multiple taxon values
		    my @field = split(/\|/, $cols[TAXON]);

		    foreach my $value (@field)
		    {
			unless ( $value =~ m/^taxon:\d+/ )
			{
			    &checkwarn ("$linenum: " . $column[TAXON][LABEL] . " column=" . (TAXON + 1) . " must start with taxon: \"" . $cols[TAXON] . "\"\n", $cnum);
			    $erroronthisline++;
			}
		    }

#
# Only certain taxids are allowed is particular gene association files.
# The %taxon2species hash allows this check.
# If the a particular taxon is not allowed thats an error
#
# if input is from STDIN then we don't know the gene association files creator,
# in this case do not to the species filtering
#
# A taxon ID is only in the %taxon2species if there is a MOD file that specifically
# provides it.  If the taxon ID is not in the hash then do not filter
#

		    $projectname =~ (s/.*gene_association\.//);
		    $projectname =~ (s/.*goa_/goa_/);
		    $projectname =~ (s/_complex//);
		    $projectname =~ (s/_isoform//);
		    $projectname =~ (s/_rna//);
		    $projectname =~ (s/\-src//);
		    $projectname =~ (s@target/@@);
                    
		    unless ($projectname eq "")
		    {

# only restrict the first taxon ID
			if (defined( $taxon2species{ $field[0] } ) )
			{
			    unless ( lc($projectname) eq lc($taxon2species{ $field[0] } ) )
			    {
				&checkwarn ("$linenum: " . $column[TAXON][LABEL] . " column=" . (TAXON + 1) . " taxid not allowed for this project: \"" . lc($projectname) . "\" <--> \"" . $field[0] . "\"\n", TAXONFILTER);
				$taxonfilterlog{$field[0]}++;
#				print STDOUT "taxon removed\t$field[0]\n" if ($taxonlogwrite);
				$erroronthisline++;
			    }
			}
		    }
		} # end of TAXON checks
		
		if ($cnum == GOID)
		{
		    
# GOID string must start with GO:

		    unless ( $cols[GOID] =~ m/^GO:/ )
		    {
			&checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " must start with GO: \"" . $cols[GOID] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		    
# Use the %obsids hash to check if current GOID is obsolete
# if TRUE then $is_obs equals 1
		    
		    if (defined($obsids{$cols[GOID]}))
		    {
			my $obsextratext = "";
			if (defined($replacedby{$value}))
			{
			    $obsextratext = "; Replaced by $replacedby{$value} ";
			} elsif (defined($consider{$value}))
			{
			    $obsextratext = "; Consider these $consider{$value} ";
			} else
			{
			    $obsextratext = "; OBO file contains no suggested alternatives";
			}
			#obsolete
			&checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " obsolete GOID: \"" . $cols[GOID] . "\"$obsextratext\n", $cnum);
			$erroronthisline++;
		    } elsif (defined($altids{$cols[GOID]}))
		    {
			# Use the %altids hash to check if current GOID is an alternate
			# The secondary is the key, the primary ID is the value of the hash.
			&checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " this is a secondary ID " . $cols[GOID] . " should use " . $altids{$cols[GOID]} . " instead.\n", $cnum);
			$erroronthisline++;
		    } elsif  ( $goidaspect{$cols[GOID]} eq "" )
		    {
			&checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " This ID \"" . $cols[GOID] . "\" is not in the OBO file.  Is the OBO file up-to-date? Is it the correct GOID?\n", $cnum);
			$erroronthisline++;
		    } elsif ( $cols[ASPECT] ne $goidaspect{$cols[GOID]} )
		    {
			&checkwarn ("$linenum: " . $column[ASPECT][LABEL] . " column=" . (ASPECT + 1) . " Wrong ASPECT \"" . $cols[ASPECT] . "\" for GOID \"" . $cols[GOID] . "\", should be \"" . $goidaspect{$cols[GOID]} . "\"\n", ASPECT);
			$erroronthisline++;
		    }
		    
		    if ( (! defined($goids{$value})) && ($errorfound == 0) )
		    {
			my $obsextratext = "";
			if (defined($replacedby{$value}))
			{
			    $obsextratext = "; Replaced by $replacedby{$value} ";
			} elsif (defined($consider{$value}))
			{
			    $obsextratext = "; Consider these $consider{$value} ";
			} else
			{
			    $obsextratext = "; OBO file contains no suggested alternatives";
			}
			# A secondary or obsolete GOID
			&checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " GOID: \"$value\" is not valid: \"" . $cols[GOID] . "\"$obsextratext\n", $cnum);
			$erroronthisline++;
		    }

# Protein binding (GO:0005515) requires special checks.  Can only be used with IPI
# and requires WITH information

		    if ( $cols[GOID] eq "GO:0005515" || $cols[GOID] eq "GO:0005488" )
		    {
			if ( $cols[EVIDENCE] ne "IPI" )
			{
			    &checkwarn ($linenum . ": " . $column[EVIDENCE][LABEL] . " column=" . (EVIDENCE + 1) . " binding (GO:0005488) can only be used with the IPI evidence code, found \"" . $cols[EVIDENCE] . "\"\n", EVIDENCE);
			    $erroronthisline++;
			}
		    }
	       } # end of GOID checks
		
# Check Date in proper format, YYYYMMDD
# arbitarily define the MINYEAR that makes sense

		if ($cnum == DATE)
		{
		    if ($cols[DATE] =~ m/(\d\d\d\d)(\d\d)(\d\d)/)
		    {
			if ( ($1 > $currentyear) || ($1 < MINYEAR) || ($2 > 12) || ($3 > 31) )
			{
			    &checkwarn ("$linenum: " . $column[DATE][LABEL] . " column=" . (DATE + 1) . " bad date format \"" . $cols[DATE] . "\"\n", $cnum);
			    $erroronthisline++;
			}
			if ( ($cols[DATE] > $datetoday) )
			{
			    &checkwarn ("$linenum: " . $column[DATE][LABEL] . " column=" . (DATE + 1) . " date is in the future \"" . $cols[DATE] . "\"\n", $cnum);
			    $erroronthisline++;
			}
			$dates{$cols[DATE]}++;
		    } elsif ($cols[DATE] ne "")
		    {
			# Can ignore blank columns because the cardinality check would have
			# already reported them.

			&checkwarn ("$linenum: " . $column[DATE][LABEL] . " column=" . (DATE + 1) . " bad date format \"" . $cols[DATE] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		    
		    if ( $cols[EVIDENCE] eq "IEA" )
		    {
			
			# If IEA, is the association less than a year old?
			# If the association is old then $is_oldiea equals 1

			if ( $cols[DATE] < $limitdate)
			{
			    &checkwarn ("$linenum: " . $column[DATE][LABEL] . " column=" . (DATE + 1) . " IEA evidence code present with a date more than a year old \"" . $cols[DATE] . "\"\n", $cnum);
			    $erroronthisline++;
			} else
			{
			    if ( $cols[DATE] > $limit_WITH_date_IEA )
			    {
				if ( $cols[WITH] eq "")
				{
				    &checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " required for IEA annotations after May 1, 2007, DATE = $cols[DATE]\n", WITH);
				    $erroronthisline++;
				}
			    }
			}
		    }
		} # end of DATE checks

		if ($cnum == EVIDENCE)
		{
		    # Was a valid Evidence code used
		    unless ($evicodes{ $cols[EVIDENCE] })
		    {
			&checkwarn ("$linenum: " . $column[EVIDENCE][LABEL] . " column=" . (EVIDENCE + 1) . " code not present in allowed list, found \"" . $cols[EVIDENCE] . "\"\n", $cnum);
			$erroronthisline++;
		    }

		    # WITH not allowed with these EVIDENCE codes
		    if ( ( $cols[EVIDENCE] eq "IDA" ) ||
			 ( $cols[EVIDENCE] eq "NAS" ) ||
			 ( $cols[EVIDENCE] eq "ND" ) ||
			 ( $cols[EVIDENCE] eq "TAS" ) ||
			 ( $cols[EVIDENCE] eq "EXP" ) )
		    {
			if ( $cols[WITH] ne "" )
			{
			    &checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " not allowed when using the IDA, NAS, ND, TAS or EXP evidence codes, found \"" . $cols[WITH] . "\" and \"" . $cols[EVIDENCE] . "\"\n", WITH);	
			    $erroronthisline++;
			}
		    }
		    if ( ($cols[EVIDENCE] eq "IKR") && (lc($cols[QUALIFIER]) ne "not") )
		    {
			&checkwarn ("$linenum: " . $column[QUALIFIER][LABEL] . " column=" . (QUALIFIER + 1) . " NOT required when using the IKR evidence code\n", QUALIFIER);
			$erroronthisline++;
		    }

# WITH required with IKR except when there is a PMID in REFERENCE
		    if ( ($cols[EVIDENCE] eq "IKR") && (lc($cols[WITH]) eq "") )
		    {
			if ($cols[REFERENCE] =~ m/PMID\:/i)
			{
# there is a PMID in REFERENCE so WITH is not required but is okay to be present
# this is okay
#			    print "found IKR and PMID in REFERENCE and NO WITH\n$line\n\n";
			} else {
			&checkwarn ("$linenum: " . $column[QUALIFIER][LABEL] . " column=" . (QUALIFIER + 1) . " WITH required when using the IKR evidence code except with PMID in REFERENCE column\n", QUALIFIER);
			$erroronthisline++;
			}
		    }

		    if ( ( $cols[EVIDENCE] eq "ISO" ) ||
			 ( $cols[EVIDENCE] eq "ISA" ) )
		    {
			if ( $cols[WITH] eq "" )
			{
			    &checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " required when using the ISA, ISO or IKR evidence codes\n", WITH);
			    $erroronthisline++;
			}
		    }
		    if ( $cols[EVIDENCE] eq "IC" )
		    {
			if ( $cols[WITH] =~ /^GOID:\d+$/ )
			{
			    if ( $cols[WITH] eq "")
			    {
				&checkwarn ("$linenum: " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " must include GOID for IC annotations\n", $cnum);
				$erroronthisline++;
			    }
			}
		    }
		    if ( $cols[EVIDENCE] eq "IEP" )
		    {
			if ( $cols[ASPECT] ne "P" )
			{
			    &checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " evidence IEP can only be used with Biological Process GOIDs, found " . $cols[GOID] . " this is of ASPECT " . $cols[ASPECT] . "\n", GOID);
			    $erroronthisline++;
			}
		    }
		    if ( $cols[EVIDENCE] eq "IPI" )
		    {
			if ( $cols[WITH] eq "" )
			{
			    if ( $cols[DATE] > $limit_WITH_date_IPI )
			    {
				&checkwarn ($linenum . ": " . $column[WITH][LABEL] . " column=" . (WITH + 1) . " binding (GO:0005488) requires WITH information to be defined\n", WITH);
				$erroronthisline++;
			    }
			}
		    }
		    if ( $cols[EVIDENCE] eq "ND" )
		    {
			# map Unknown GOIDs to their ROOT IDs
			# change the original string
			if ( $cnum == GOID )
			{
			    if ( $cols[GOID] ne "GO:0008372" && 
				 $cols[GOID] ne "GO:0005554" &&
				 $cols[GOID] ne "GO:0000004" )
			    {
			    &checkwarn ("$linenum: " . $column[GOID][LABEL] . " column=" . (GOID + 1) . " evidence ND can only be used with the root terms, found " . $cols[GOID] . "\n", GOID);
			    $erroronthisline++;
			    }
			}

			# ND annotations cannot have PUBMED IDs

			if ( $cnum == REFERENCE )
			{
			    if ( $cols[REFERENCE] ne "" )
			    {
			    &checkwarn ("$linenum: " . $column[REFERENCE][LABEL] . " column=" . (REFERENCE + 1) . " evidence ND cannot have PUBMED IDs, found " . $cols[REFERENCE] . "\n", REFERENCE);
			    $erroronthisline++;
			    }
			}
		    }

		} # end of EVIDENCE checks
		
		if ($cnum == ASSIGNED_BY)
		{
		    unless ($abbrev{ lc($cols[ASSIGNED_BY]) })
		    {
			&checkwarn ("$linenum: " . $column[ASSIGNED_BY][LABEL] . " column=" . (ASSIGNED_BY + 1) . " allowed database abbreviation not correct, found \"" . $cols[$cnum] . "\"\n", $cnum);
			$erroronthisline++;
		    }
		} # end of ASSIGNED_BY checks

		if ($writereport)
		{
		    # decode SGML to TEXT
		    # do this just once, so just when its on the DB_OBJECT_SYMBOL column.
		    if ( $cnum == DB_OBJECT_SYMBOL )
		    {
			if ( $line =~ /\&/ )
			{
			    $line = &_decon($line);
			}
		    }

		    # map Unknown GOIDs to their ROOT IDs
		    # change the original string
		    if ( $cnum == GOID )
		    {
			if ( $cols[GOID] eq "GO:0008372" || $cols[GOID] eq "GO:0005554" ||
			     $cols[GOID] eq "GO:0000004" )
			{
			    $line = &_changerootid($line);
			}
		    }
		}
	    } # end of SPECIAL checks	    

	    # Look for double colons
	    if ($column[$cnum][DUBCOLON])
	    {
		if ($cols[$cnum] =~ /\:\:/)
		{
		    &checkwarn ("$linenum: " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " double colon in ID not allowed, found \"" . $cols[$cnum] . "\"\n", $cnum);
		    $erroronthisline++;
		}
	    } # end of DUBCOLON condition

	    # CHECK the DB part of an identifier
	    if ($column[$cnum][CHECKDB])
	    {
		
		if ( $cols[$cnum] =~ /\:/ )
		{
		    my @field = split(/\|/, $cols[$cnum]);
		    foreach my $tmpfld ( @field )
		    {
			if ( $tmpfld =~ /\:/ )
			{
			    my ( @dbname ) = split(/\:/, $tmpfld);
			    unless ($abbrev{ lc($dbname[0]) })
			    {
				&checkwarn ("$linenum: " . $column[$cnum][LABEL] . " column=" . ($cnum + 1) . " allowed database abbreviation not correct, found \"" . $dbname[0] . "\" in the ID \"" . $cols[$cnum] . "\"\n", $cnum);
				$erroronthisline++;
			    }
			}
		    }
		}
	    } # end of CHECKDB condition
	    
	    # check for unprintable characters just do this once for
	    # the whole line during the check for DB_OBJECT_NAME
	    # column
	    if ($cnum == DB_OBJECT_NAME)
	    {
		# characters greater than 128 are not printable.
		# Below 32 are the control characters.  Char 9 is TAB
		# and Char 10 is newline.
		if ($line !~ /^[\012\011\040-\176]+$/)
		{
		    &checkwarn ("$linenum: unprintable character found on this line, may not be this column\n", $cnum);
		    $erroronthisline++;
		}
	    }

	} # end of loop over each column
	
	unless ($errorfound > 0)
	{
	    print FILTER "$line\n" if ($writereport);
	    print "$line\n" if ($writegood);
	    $totallines++;
	} 
	elsif ($writebad)
	{
	    print STDOUT "$line\n";
	}
       
	}
    
    close(INPUT);

# output summary of errors
    
# assume TAB = 8 spaces
    use constant TABWIDTH => 8;
    
    my $report;
    
    if ( ($totalerr > 0) || ($taxonfiltered > 0) || ($colnumerr > 0))
    {
	$report = "\nNUMBER of ERRORS by COLUMN\n\n";
	$report .= "Column\t\t\tCol#\tNumber of Errors\n";
	for (my $index=0; $index < @errors; $index++)
	{
	    if ($errors[$index] > 0)
	    {
		if (length($column[$index][LABEL]) < TABWIDTH)
		{
		    $column[$index][LABEL] .= "\t";
		}
		if (length($column[$index][LABEL]) < (TABWIDTH * 2))
		{
		    $column[$index][LABEL] .= "\t";
		}
		$report .= $column[$index][LABEL] . "\t" . ($index + 1) . "\t" . $errors[$index] . "\n";
	    }
	}

	$report .= "General errors\t\t-\t" . $lineerr . "\n" if ($lineerr > 0);

	if ($colnumerr > 0)
	{
	    $report .= "Number of Columns\t-\t" . $colnumerr . "\tLines were fixed, not removed\n";

	    if ($gafversion != $input_gaf_version)
	    {
		if ($gafversion == 1)
		{
		    $report .= "\nConverted file to GAF version 1.0 format\n";
		}
		else
		{
		    $report .= "\nConverted file to GAF version 2.0 format\n";
		}
	    }
	}

	$report .= "\nTOTAL ERRORS or WARNINGS = " . $totalerr . "\n";
	$report .= "TOTAL ROWS with no issues = " . $totallines . "\n";

	if ($unknownAnnotations > 0)
	{
	    $report .= "TOTAL Annotations to an unknown GOID, remapped = " . $unknownAnnotations . "\n";
	}
	if ($taxonfiltered > 0)
	{
	    $report .= "TOTAL ROWS removed after taxon check = " . $taxonfiltered . "\n\tNumber of annotations removed\n";

	    foreach my $taxonkey ( sort keys %taxonfilterlog )
	    {
		$report .= "\t$taxonkey\t$taxonfilterlog{$taxonkey}\n";
	    }
	    $report .= "\n";
	}
	$report .= "TOTAL ROWS in file = " . $linenum . "\n\n";

	if ($writereport && ($totallines == 0))
	{
	    print FILTER "! All Gene Associations in this file have been removed by the GO Consortium.\n!\n! The submitted associations most likely stated an NCBI Taxonomy Identifier\n! for each association that is available from another GO member project.\n! The GO Consortium started filtering gene association files in October 2005\n! in an effort to minimize confusion resulting in redundancy between the\n! many projects providing gene association files. At that time the Consortium\n! also started removing associations to obsolete GOIDs, IEA annotations older than\n! one year, and any association that did not meet the syntax defined for this file.\n!\n";

	    close(FILTER);
	}

    }
    else
    {
	$report .= "\nCongratulations, there are no errors.\n\n";
    }
    
    my $countdates = 0;
    my $lastdate = "";
    foreach my $dkeys (keys %dates)
    {
	$countdates++;
	$lastdate = $dkeys;
    }
    
    if ($countdates == 1)
    {
	$report .= "\n********************************************************\nAll the dates in column 14 are the same ==> \"$lastdate\"!\nThis column should represent when the association was\ndetermined, not when this file was created.\n********************************************************\n\n";
    }
    
    if ($opt_w)
    {
	$report .= "Total of $totallines lines (not including header) written to STDOUT.\n\n";
    }
    
    if ($writereport)
    {
	unless ($report =~ m/Congratulations/i)
	{
	    &write_report($report, $dirpath, $base_file_name);
	}
    }
    print STDERR $report unless ($quietmode);

    }

###############################################################################
sub checkwarn
{
###############################################################################
# print each error if $detail equals 1
    my ($errortext, $colnum) = @_;

    print "HELP\n" if ($colnum eq '');

    print STDERR $errortext if ($detail);

    my (@words) = split(/\:/, $errortext);
    if (!$erroronthisline)
    {
	print STDOUT "\n" if ( ($writebad) && !($detail) );
    }
    print STDOUT $errortext if ( ($writebad) && !($detail) );

    unless ($errorfound)
    {
	if ($colnum == TAXONFILTER)
	{
	    $taxonfiltered++;
	    $errorfound = 1;
	}
	elsif ($colnum == LINEERROR)
	{
	    $errorfound = 1;
	}
	elsif ($colnum == COLNUMERROR)
	{
	    $errorfound = 0;
	}
	else
	{
	    $errors[$colnum]++;
	    $errorfound = 1;
	}
	$totalerr++;
    }
}


###############################################################################
sub write_report
{
###############################################################################

    my ($report, $report_path, $report_file_name) = @_;

    $report_file_name = "${report_path}${report_file_name}.report";
    my $gafilename = $inputfile;
    $gafilename =~ s|.*/submission/||;

    my $body1 = "Please review the errors summarized in this report and fix your gene-associations file as is appropriate. This is an automated message summarizing results of the GOC filtering for file:\n\n$gafilename\n";

    my $body2 = "To review a report of the errors use the following command from the gene-associations/submission directory:\n\n  $0 -d -i $gafilename\n\nFor a complete report including the bad row from your gene association file use this command:\n\n  $0 -e -i $gafilename\n\n";

    my $body3 = "The rows without errors are now available from the gene-associations directory at the geneontology.org web, FTP and SVN sites. Your email is defined as the address where these reports should be sent. If this is not correct please have the conf file updated. If you have any questions or suggestions, please do not hesitate to contact me.\n\n";

    open (REPORT, ">${report_file_name}") || die "Cannot write to ${report_file_name}: $!\n";
    print REPORT "Dear Colleague,\n"; 
    print REPORT "\n";
    print REPORT "$body1";
    print REPORT "\n---$report---\n\n";
    print REPORT "$body2";
    print REPORT "$body3";
    print REPORT "Mike Cherry\n";
    print REPORT "E-mail: cherry\@stanford.edu\n";
    close(REPORT);

}

###############################################################################
sub _decon
{
###############################################################################
# decode greek SGML into text

    my ($string) = $_[0];

# fix for two problems in FB file
# can remove with the FB file is fixed
    $string =~ s/\\\&bgr\\\;/&bgr;/g;
    $string =~ s/&g-Tub37C/&ggr;-Tub37C/g;

    $string =~ s/&agr\;/alpha/g;
    $string =~ s/&Agr\;/Alpha/g;
    $string =~ s/&bgr\;/beta/g;
    $string =~ s/&Bgr\;/Beta/g;
    $string =~ s/&ggr\;/gamma/g;
    $string =~ s/&Ggr\;/Gamma/g;
    $string =~ s/&dgr\;/delta/g;
    $string =~ s/&Dgr\;/Delta/g;
    $string =~ s/&egr\;/epsilon/g;
    $string =~ s/&Egr\;/Epsilon/g;
    $string =~ s/&zgr\;/zeta/g;
    $string =~ s/&Zgr\;/Zeta/g;
    $string =~ s/&eegr\;/eta/g;
    $string =~ s/&EEgr\;/Eta/g;
    $string =~ s/&thgr\;/theta/g;
    $string =~ s/&THgr\;/Theta/g;
    $string =~ s/&igr\;/iota/g;
    $string =~ s/&Igr\;/Iota/g;
    $string =~ s/&kgr\;/kappa/g;
    $string =~ s/&Kgr\;/Kappa/g;
    $string =~ s/&lgr\;/lambda/g;
    $string =~ s/&Lgr\;/Lambda/g;
    $string =~ s/&mgr\;/mu/g;
    $string =~ s/&Mgr\;/Mu/g;
    $string =~ s/&ngr\;/nu/g;
    $string =~ s/&Ngr\;/Nu/g;
    $string =~ s/&xgr\;/xi/g;
    $string =~ s/&Xgr\;/Xi/g;
    $string =~ s/&ogr\;/omicron/g;
    $string =~ s/&Ogr\;/Omicron/g;
    $string =~ s/&pgr\;/pi/g;
    $string =~ s/&Pgr\;/Pi/g;
    $string =~ s/&rgr\;/rho/g;
    $string =~ s/&Rgr\;/Rho/g;
    $string =~ s/&sgr\;/sigma/g;
    $string =~ s/&Sgr\;/Sigma/g;
    $string =~ s/&tgr\;/tau/g;
    $string =~ s/&Tgr\;/Tau/g;
    $string =~ s/&ugr\;/upsilon/g;
    $string =~ s/&Ugr\;/Upsilon/g;
    $string =~ s/&phgr\;/phi/g;
    $string =~ s/&PHgr\;/Phi/g;
    $string =~ s/&khgr\;/chi/g;
    $string =~ s/&KHgr\;/Chi/g;
    $string =~ s/&psgr\;/psi/g;
    $string =~ s/&PSgr\;/Psi/g;
    $string =~ s/&ohgr\;/omega/g;
    $string =~ s/&OHgr\;/Omega/g;
    $string =~ s/\<\/down\>/\]\]/g;
    $string =~ s/\<down\>/\[\[/g;
    $string =~ s/\<up\>/\[/g;
    $string =~ s/\<\/up\>/\]/g;

    return ($string);
}

###############################################################################
sub _changerootid
{
###############################################################################
# change unknown GOIDs to ROOT GOIDs

    my ($string) = $_[0];

# Cellular Component
# GO:0008372  -->  GO:0005575
#
    $string =~ s/GO\:0008372/GO:0005575/g;

# Molecular Function
# GO:0005554  -->  GO:0003674
#
    $string =~ s/GO\:0005554/GO:0003674/g;

# Biological Process
# GO:0000004  -->  GO:0008150
#
    $string =~ s/GO\:0000004/GO:0008150/g;

    $unknownAnnotations++;

    return ($string);
}

###############################################################################

__END__

=head1 NAME

I<filter-gaf.pl> - checks GO gene association file format and data

=head1 SYNOPSIS

=over

=item print usage

  filter-gaf.pl -h

=back

=over

=item run checks on the specified gene association file

  filter-gaf.pl -i gene_association.sgd.gz

=back

=over

=item run checks and provide details on all errors on GA file

  filter-gaf.pl -i gene_association.tair.gz -d |& more

=back

=over

=item filter out lines with errors and output validated lines to STDOUT

  filter-gaf.pl -i gene_association.fb.gz -w > filtered-output

=back

=head1 DESCRIPTION

Check gene association file for check syntax, plus removes obsolete
GOIDs, IEA annotations that are older than one year, and annotations
that are provided by one of the MOD projects.  

=head1 ARGUMENTS

Arguments can control the input file, the project name, the level of
detail and whether the filtered results are output.

=over

=item -h

print usage message

=item -q

quiet mode, don't print final report to STDERR

=item -i

name of input gene association file.  The file can be compressed or
gzipped.  To specify STDIN use "-i -".

Caveat: The project name is automatically determined from the name of
the gene association file.  When using STDIN for input you must use
the -p option to specify the project name, otherwize all rows will be
filtered out.

=item -d

turn on detailed output.  Each error, if any, are output to STDERR.
The line number within the input file and a description of the type of
error(s) are provided.

Caveat: The details are set to STDERR.  If you wish to view the errors
with a paging program such as more you will need to use "|&" instead
of the normal pipe symbol "|".  Normally only STDOUT is set through a
pipe.  Adding the ampersand will will send both STDOUT and STDERR to
through the pipe.

=item -e

Output each bad line to STDOUT.  The line number within the input file
and a description of the type of error(s) are provided.

=item -w

write validated lines, including header lines, to STDOUT.  You can use
the -d (detailed listing of errors and statistics) with the -w option.
The errors, if any will be displayed on STDERR and the validated lines
will be set to STDOUT.  If any error in format or data is identified
for a line it will not be sent to the output.

=item -r

creates two files in the submission directory: .filtered.gz and
.report files; the .filtered.gz file has all the error-free lines from
the gene_association file and the .report file has a summary of the
errors found in the MOD sumitted gene_association file.  When writing
out the .filetred.new file, the scripts uses the contents of .conf
file for that particular gene association file to create its header
section.  For more information about the format of .conf file, please
see the INPUT section below.

=item -o

full name to OBO file.  The default is
$gosvnbase/ontology/gene_ontology_edit.obo, as if you are running this
script from within the gene-associations directory in your GO SVN
checkout sandbox.  You can use any file in OBO format, the obsolete
GOIDs are identified by the "is_obsolete: true" line.

=item -p

used to define the project name.  A specific project name is required
for the species filtering.  This option takes precedent over the
automatic project name determination that uses the input file name.
The -p option is required if using STDIN to provide the gene
association file.  List of project names and taxids.  Each of these
taxids is only allowed within the defined project specific file.  All
other taxids are allowed without restriction.

NOTE: To turn off the taxid checking use the -p option and specify the
name as "nocheck".

=item -x

full name to GO abbreviation file.  The default is $gosvnbase/doc/GO.xrf_abbs,
as if you running this script from within the gene-associations
directory in your GO SVN sandbox.  You can use any file in a similar
form as the GO.xrf_abbs file in the GO SVN.

=back

=head1 INPUT

The specification of the gene_association format is defined at:
http://www.geneontology.org/GO.annotation.html#file

=over

=item GA file column definitions

 0: DB, database contributing the file (always "SGD" for this file).
 1: DB_Object_ID, SGDID (SGD's unique identifier for genes and
    features).
 2: DB_Object_Symbol, see below
 3: Qualifier (optional), one or more of 'NOT', 'contributes_to',
    'colocalizes_with' as qualifier(s) for a GO annotation, when needed,
    multiples separated by pipe (|)
 4: GO ID, unique numeric identifier for the GO term
 5: DB:Reference(|DB:Reference), the reference associated with the GO
    annotation
 6: Evidence, the evidence code for the GO annotation
 7: With (or) From (optional), any With or From qualifier for the GO
    annotation
 8: Aspect, which ontology the GO term belongs (Function, Process or
    Component)
 9: DB_Object_Name(|Name) (optional), a name for the gene product in
    words, e.g. 'acid phosphatase'
10: DB_Object_Synonym(|Synonym) (optional), see below
11: DB_Object_Type, type of object annotated, e.g. gene, protein, etc.
12: taxon(|taxon), taxonomic identifier of species encoding gene
    product
13: Date, date GO annotation was defined in the format YYYYMMDD
14: Assigned_by, source of the annotation (always "SGD" for this file)

=item Config file format

 project_name=Saccharomyces Genome Database (SGD)
 contact_email=yeast-curator@yeastgenome.org
 project_url=http://www.yeastgenome.org/
 funding_source=NHGRI at US NIH, grant number 5-P41-HG001315
 email_report=yeast-curator@yeastgenome.org,cherry@stanford.edu

=back

=head1 OUTPUT

The default output using the -w output is a validated gene association
file on STDOUT. See the INPUT section for details on this format.
When using -r option, two output files will be creaed: .filtered.gz
and .report files.  See the INPUT section for config file format.

=head1 REASON ROWS WOULD BE REJECTED

The following is a brief summary of the common errors this script will find.

   1. Not the correct number of columns.
   2. Any leading or trailing spaces on any field.
   3. Cardinality does not match format specification.
   4. DB abbreviation is not one of the standard set used by the GO Consortium.
   5. Qualifier column can only include NOT, contributes_to or colocalizes_with
   6. One of the three aspects (ontologies) is stated for each line.
   7. Evidence code column needs to be present and one of the standard set.
   8. DB Object Type is one of the defined set.
   9. Stated Taxid is allowed for the particular project file.
  10. GOID is not obsolete.
  11. Date is in proper format.
  12. IEA annotations are less than one year old.

=head1 FUTURE ENHANCEMENTS

 Check GOID and Aspect column for consistency.

=cut

