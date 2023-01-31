#!/usr/bin/perl -w
use strict;
use FileHandle;

my $today = `date +%Y-%m-%d`;
chomp $today;

# maps group names to filehandles;
# e.g. zfin => wrte filehandle for zfin.gpad
my %fhmap = ();
while(<>) {
    next if (m@^\!@);
    chomp;
    my @vals = split(/\t/, $_);
    write_line_to_file($vals[0], $_);
}
foreach my $fh (values %fhmap) {
    $fh->close();
}
exit 0;

sub write_line_to_file {
    my ($base, $line) = @_;
    if (!$base) {
        $base = 'other';
    }
    my @colvals = split(/\t/);
    my @props = split(/\|/, $colvals[11]);
    if (!grep {$_ eq 'model-state=production'} @props) {
        # skip non-production models
        print STDERR "No production models for $base\n";
        return;
    }
    $base = lc($base);
    #print STDERR "Writing: $base\n";
    if (!$fhmap{$base}) {
        my $fh = FileHandle::new();
        $fh->open(">legacy/$base.gpad") || die $base;
        print $fh "!gpa-version: 1.1\n";
        print $fh "!collation date: $today\n";
        print $fh "!collated from production models in https://github.com/geneontology/noctua-models/ where col1 matches $base\n";

        $fhmap{$base} = $fh;
    }
    my $fh = $fhmap{$base};
    print $fh "$line\n";

}
