#!/usr/bin/perl -w
####
#### collate-gpads.pl legacy/gpad
####
#### Used to be: collate-gpads.pl legacy/gpad/*.gpad
####
use strict;
use FileHandle;

my $today = `date +%Y-%m-%d`;
chomp $today;

## Glob instead of CLI, to deal with too many args;
## https://github.com/geneontology/pipeline/issues/360
my ($dir) = @ARGV;
my $full_glob = $dir . '/' . '*.gpad';

# maps group names to filehandles;
# e.g. zfin => wrte filehandle for zfin.gpad
my %fhmap = ();
while (my $curr_model = glob($full_glob)) {

  open( my $input_fh, "<", $curr_model ) || die "Can't open $curr_model: $!";
  while (<$input_fh>){

    next if (m@^\!@);
    chomp;
    my @vals = split(/\t/, $_);

    ## MGI annotations to PR go to MGI.
    my $index_override = '';
    if ( $vals[0] eq 'PR' && $vals[9] eq 'MGI' ) {
      $index_override = 'MGI';
    } elsif ( $vals[0] eq 'RefSeq' && $vals[9] eq 'MGI' ) {
      $index_override = 'MGI';
    }

    print $vals[0] . "...\n";
    print $index_override . "...\n";
    print $_ . "...\n";

    write_line_to_file($vals[0], $index_override, $_);
  }
  close($input_fh);
}
foreach my $fh (values %fhmap) {
  $fh->close();
}
exit 0;

sub write_line_to_file {
  my ($base, $override, $line) = @_;

  ## Push to override file.
  if ( $override ) {
    $base = $override;
  }

  ## If there is no base, push to "other".
  if (!$base) {
    $base = 'other';
  }

  my @colvals = split(/\t/);
  my @props = split(/\|/, $colvals[11]);

  ## Skip if not production.
  if (!grep {$_ eq 'model-state=production'} @props) {
    # skip non-production models
    print STDERR "No production models for $base\n";
    return;
  }

  ## Ensure open filehandle and add header.
  $base = lc($base);
  #print STDERR "Writing: $base\n";
  if (!$fhmap{$base}) {
    my $fh = FileHandle::new();
    $fh->open(">legacy/$base.gpad") || die $base;
    print $fh "!gpa-version: 1.2\n";
    print $fh "!collation date: $today\n";
    print $fh "!collated from production models in https://github.com/geneontology/noctua-models/ where col1 matches $base; special rules for MGI (https://github.com/geneontology/pipeline/issues/313)\n";

    $fhmap{$base} = $fh;
  }

  ## Print to file.
  my $fh = $fhmap{$base};
  print $fh "$line\n";

}
