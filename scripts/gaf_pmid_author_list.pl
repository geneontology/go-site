#!/usr/bin/perl

##### 
#####
##
## gaf_pmid_author_list.pl - a program to take PMID from gaf files and retrieve author list from NCBI PubMed server
## Author: Xiaosong Huang
#####
#####


use LWP 5.64;
use utf8;
use Text::Unidecode;

use Getopt::Std;
getopts('g:e');
my $gaf_dir = $opt_g if ($opt_g);       # -g for directory containing gaf files

my @pmids;
opendir(GO, $gaf_dir) or die $!;
for my $gaf (readdir GO) {
    next if $gaf =~ /^\.\.?$/;
	open (GAF, "$gaf_dir/$gaf");
	while (my $line = <GAF>){
		next if ($line =~ /^!/);
		chomp($line);
		my ($dbname,$go_gid,$gsym,$qualifier,$goacc,$ref,$ev_code,$with,$gotype,$a,$b,$c,$tax1,@else) = split('\t', $line);
		$ref =~ s/^\s+|\s+$//g;
		next unless $ref =~ /PMID:/;
		push (@pmids,($ref =~ /PMID:(\d+)/g));
	}
	close (GAF);
}
close (GO);

my %pmids = map { $_ => 1 } @pmids;

my $browser = LWP::UserAgent->new;

for my $id (keys %pmids){
	#print "$id";
	my $base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
	my $url = $base . "epost\.fcgi?db=pubmed&id=$id";
	#print "$url\n";
	my $response = $browser->get( $url );
	#print "$response\n";
	my @result_array = $response->content;
    my ($query_key, $web_env);
	foreach my $line ( @result_array )   # Search each line of the returned document for...
	{
	   #print "$line\n";
	   if( $line =~ m/<QueryKey>(.*)<\/QueryKey>/ )  # ...the query key, and...
	   {
		  $query_key  = $1;
	   }

	   if( $line =~ m/<WebEnv>(.*)<\/WebEnv>/ )      # ...the web environment.
	   {
		  $web_env = $1;
	   }
	}

	#print "Query Key: $query_key\nWeb Environment: $web_env\n";

	my $esummary_url =
	$base . "esummary\.fcgi?db=pubmed" .
		  "&query_key=$query_key&WebEnv=$web_env";

	# # eSummary returns a long string that can be split up into separate
	# # lines by using the Perl function "split" and the Perl representation for
	# # a line separator: the "newline" or '\n' character.
	my $response1 = $browser->get($esummary_url);   # Get the summary info.
	my $esummary_result_string = $response1->content;
	my @esummary_result_array = split (/\n/, $esummary_result_string);

	foreach my $line ( @esummary_result_array )    # Search each line for desired data.
	{
	   #print "$line\n";
	   $line =~ s/([^[:ascii:]]+)/unidecode($1)/ge;
	   print "$1\n" if ( $line =~ m/^.*<Item\s+Name="Author"\s+Type="String">(.*)<.*/ );
	}
}
