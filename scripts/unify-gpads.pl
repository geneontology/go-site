#!/usr/bin/perl -w
####
#### Turn minerva output GPADs into a single GPAD.
####
#### Usage:
####   unify-gpads.pl legacy/gpad > unified-gpads.gpad
####
use strict;
use FileHandle;

my $today = `date +%Y-%m-%d`;
chomp $today;

## Glob instead of CLI, to deal with too many args;
## https://github.com/geneontology/pipeline/issues/360
my ($dir) = @ARGV;
my $full_glob = $dir . '/' . '*.gpad';

## Print header.
print STDOUT "!gpa-version: 1.2\n";
print STDOUT "!collation date: $today\n";

## Spray them out.
while (my $curr_model = glob($full_glob)) {

  open( my $input_fh, "<", $curr_model ) || die "Can't open $curr_model: $!";
  while (<$input_fh>){

    next if (m@^\!@);
    chomp;

    write_line_to_file($_);
  }
  close($input_fh);
}

exit 0;

sub write_line_to_file {
  my ($line) = @_;

  my @colvals = split(/\t/);
  my @props = [];
  if( $colvals[11] ){
    @props = split(/\|/, $colvals[11]);
  }

  ## Skip if not production.
  if (!grep {$_ eq 'model-state=production'} @props) {
    # skip non-production models
    print STDERR "No production models for line: $line\n";
    return;
  }

  print STDOUT "$line\n";
}
