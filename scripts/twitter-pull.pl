#!/usr/bin/perl -w
####
#### A proof of concept for creating an RSS feed/file that can be used
#### by the Drupal site.
####

## Bring in generic necessaries.
use utf8;
use strict;
use Data::Dumper;
use Getopt::Long;
use Net::Twitter;
use Scalar::Util 'blessed';
use XML::RSS;
# use File::Path;
# use File::Find;
# use File::stat;
# use Time::localtime;
# use File::Temp qw(tempfile);

## Argument definitions.
my $verbose = '';
my $help = '';
my $file = '';
GetOptions ('verbose' => \$verbose,
	    'help' => \$help,
	    'file=s' => \$file);

## Embedded help through perldoc.
if( $help ){
  system('perldoc', __FILE__);
  exit 0;
}

## Just a little printin' when feeling verbose.
sub ll {
  my $str = shift || '';
  print $str . "\n" if $verbose;
}
ll("Verbose ON.");

## Make sure the environment is working.
my $consumer_key = $ENV{TWITTER_CONSUMER_KEY} || '';
my $consumer_secret = $ENV{TWITTER_CONSUMER_SECRET} || '';
my $access_token = $ENV{TWITTER_ACCESS_TOKEN} || '';
my $access_token_secret = $ENV{TWITTER_ACCESS_TOKEN_SECRET} || '';

## Environment argument check.
if( ! $consumer_key ||
    ! $consumer_secret ||
    ! $access_token ||
    ! $access_token_secret ){
  die "ERROR: unable to find proper environment";
}else{
  ll("TWITTER_CONSUMER_KEY: " . $consumer_key);
  ll("TWITTER_CONSUMER_SECRET: " . $consumer_secret);
  ll("TWITTER_ACCESS_TOKEN: " . $access_token);
  ll("TWITTER_ACCESS_TOKEN_SECRET: " . $access_token_secret);
}

###
### Main.
###

my $twi = Net::Twitter->new(
			    traits              => ['API::RESTv1_1'],
			    consumer_key        => $consumer_key,
			    consumer_secret     => $consumer_secret,
			    access_token        => $access_token,
			    access_token_secret => $access_token_secret,
			   );

eval {
  my $results = $twi->search('#geneontology #GeneOntology');
  if( ! defined $results || defined $results->{results} ){
    ll('No defined results.');
  }else{
    ll(Dumper($results));
    ## TODO: Examine results and get some XML::RSS output.
    # ll('# results: ' . scalar(@{$results->{results}}));
    # for my $status (@{$results->{results}}){
    #   ll('Dump result:');
    # }
  }
};
if( my $err = $@ ){
  if( blessed $err && $err->isa('Net::Twitter::Error') ){
    die "HTTP Response Code: ", $err->code, "\n",
	"HTTP Message......: ", $err->message, "\n",
	"Twitter error.....: ", $err->error, "\n";
  }else{
    die $@;
  }
}

ll("Done.");

###
### Help.
###

=head1 NAME

twitter-pull.pl

=head1 SYNOPSIS

twitter-pull.pl [-h/--help] [-v/--verbose]

=head1 DESCRIPTION

A proof of concept for creating an RSS feed/file that can be used by
the Drupal site.

=head1 OPTIONS

=over

=item -v/--verbose

Turn on verbose messages--make this script chatty.

=item -h/--help

This help message.

=back

=head1 SEE ALSO

http://localhost/

=cut
