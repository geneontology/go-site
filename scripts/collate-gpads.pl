#!/usr/bin/perl -w
####
#### collate-gpads.pl legacy/gpad
####
#### Used to be: collate-gpads.pl legacy/gpad/*.gpad
####
#### Input is GPAD 2.0, where column 1 is a full CURIE (e.g. "ZFIN:ZDB-GENE-001")
#### rather than the bare prefix GPAD 1.x carried; collation keys on the prefix.
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

    ## GPAD 2.0 col1 is a CURIE; collate on its prefix.
    my $db = db_prefix($vals[0]);

    ## MGI annotations to PR go to MGI.
    my $index_override = '';
    if ( $db eq 'PR' && $vals[9] eq 'MGI' ) {
      $index_override = 'MGI';
    } elsif ( $db eq 'RefSeq' && $vals[9] eq 'MGI' ) {
      $index_override = 'MGI';
    }

    write_line_to_file($db, $index_override, $_);
  }
  close($input_fh);
}
foreach my $fh (values %fhmap) {
  $fh->close();
}
exit 0;

## The namespace prefix of a CURIE, or empty for a bare IRI. Mirrors
## GPADRenderer.dbForObject, which produced GPAD 1.x column 1.
sub db_prefix {
  my ($id) = @_;

  return '' if (!defined($id) || $id eq '' || $id =~ m@^http@);

  my ($prefix) = split(/:/, $id, 2);
  return defined($prefix) ? $prefix : '';
}

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

  my @colvals = split(/\t/, $line);
  my @props = split(/\|/, defined($colvals[11]) ? $colvals[11] : '');

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
    print $fh "!gpad-version: 2.0\n";
    print $fh "!generated-by: GO_Noctua\n";
    print $fh "!date-generated: $today\n";
    print $fh "!collation date: $today\n";
    print $fh "!collated from production models in https://github.com/geneontology/noctua-models/ where the col1 CURIE prefix matches $base; special rules for MGI (https://github.com/geneontology/pipeline/issues/313)\n";

    $fhmap{$base} = $fh;
  }

  ## Print to file.
  my $fh = $fhmap{$base};
  print $fh "$line\n";

}
