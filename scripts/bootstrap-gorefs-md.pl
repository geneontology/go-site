#!/usr/bin/perl
use YAML::Syck;
use strict;

our %MV = (
    'external_accession' => 1,
    'alt_id' => 1
    );
my $fn = shift @ARGV;
open(F,$fn) || die;
my @refs = ();
my $ref = {};
my $id;
while(<F>) {
    next if m@^\!@;
    chomp;
    if (m@go_ref_id: GO_REF:(\d+)@) {
        $id = $1;
        $ref = {
            id => $id
        };
        push(@refs, $ref);
    }
    elsif (m@(\S+):\s+(.*)@) {
        my ($k,$v) = ($1,$2);
        if ($MV{$k}) {
            push(@{$ref->{$k}}, $v);
        }
        else {
            die if $ref->{$k};
            $ref->{$k} = $v;
        }
    }
    elsif (m@^\s*$@) {
    }
    else {
        die "cannot parse line: $_";
    }
}
close(F);

foreach my $ref (@refs) {
    my $id = $ref->{id};
    $ref->{id} = "GO_REF:$id";
    my $fn = "goref-$id.md";

    my $abstract = $ref->{abstract};
    delete $ref->{abstract};
    my $comment = $ref->{comment};
    delete $ref->{comment};
    
    open(F, ">$fn") || die $fn;
    print F Dump($ref); 
    print F "layout: goref\n";
    print F "---\n\n";
    print F "$abstract\n";
    if ($comment) {
        print F "\n## Comments\n\n";
        print F $comment;
    }
    close(F);
}


=head1 USAGE

cd go-site/metadata/gorefs
../../scripts/bootstrap-gorefs-md.pl ~/repos/go/doc/GO.references

=cut
