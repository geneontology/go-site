#!/usr/bin/perl
use YAML::Syck;
use strict;

my %taxon2db = (
    'taxon:5476' => 'cgd',
    'taxon:162425' => 'aspgd',
    'taxon:5085' => 'aspgd',
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
    'taxon:400035' => 'goa_chicken',
    'taxon:208526' => 'goa_chicken',
    'taxon:208525' => 'goa_chicken',
    'taxon:208524' => 'goa_chicken',
    'taxon:9913' => 'goa_cow',
    'taxon:297284' => 'goa_cow',
    'taxon:30523' => 'goa_cow',
    'taxon:9606' => 'goa_human',
    'taxon:9823' => 'goa_pig',
    'taxon:9615' => 'goa_dog',
    );

open(F,'db-xrefs.yaml') || die;
my $yaml = join("",<F>);
close(F);
my $xrefs = Load($yaml);

push(@$xrefs, {database=>'GOA', name=>'EBI Gene Ontology Annotation Database'});

my %xrefh = ();
foreach my $x (@$xrefs) {
    $xrefh{lc($x->{database})} = $x;
}

foreach (@ARGV) {
    unless (m@\.gz$@) {
        next;
    }
    # stale MGIs
    next if m@association.*.gpi.gz@;
    if (m@gene_association.(\S+).gz@) {
        emit('gaf', $1, $_);
    }
    elsif (m@(\w+)_association.gpi.gz@) {
        emit('gpi', $1, $_);
    }
    elsif (m@(\w+)_association.gpa.gz@) {
        emit('gpi', $1, $_);
    }
    elsif (m@(\w+).gpi.gz@) {
        emit('gpi', $1, $_);
    }
    elsif (m@(\w+).gpa.gz@) {
        emit('gpad', $1, $_);
    }
    elsif (m@(\w+).gpad.gz@) {
        emit('gpad', $1, $_);
    }
}
exit 0;

sub emit {
    my ($type, $dataset, $file) = @_;
    $dataset = lc($dataset);
    my $dbname;
    my $subdb = $dataset;
    my $auth = $dataset;
    my $entity_type = '';
    
    if ($dataset =~ m@_@) {
        if ($dataset =~ m@(\w+)_(\w+)_(\w+)@) {
            $auth = $1;
            #$subdb = $2."_"."$3";
            $subdb = $1."_".$2;
            $entity_type = $3;
        }
        elsif ($dataset =~ m@(\w+)_(\w+)@) {
            $auth = $1;
        }
        else {
            warn $dataset;
        }
    }
    else {
        
    }
    my $dbmeta = $xrefh{$auth};
    if ($dbmeta) {
        $dbname = $dbmeta->{name};
    }
    else {
        print STDERR "NO ENTRY FOR: $auth (db $dataset)\n";
        $dbname = $dataset;
    }
    
    my $base = $file;
    $base =~ s@.*/@@;
    my $id = "$dataset.$type";
    my $loc = $type eq 'gaf' ? 'gene-associations' : 'gpad-gpi/release';
    my $url = "http://geneontology.org/$loc/$base";

    my $src = "http://geneontology.org/$loc/submissions/$base";
    if ($auth eq 'mgi' && $type eq 'gpi') {
        $src = "ftp://ftp.informatics.jax.org/pub/reports/mgi.gpi.gz";
    }
    
    my @taxids = ();
    foreach my $k (keys %taxon2db) {
        if ($subdb eq $taxon2db{$k}) {
            my $t = $k;
            $t =~ s@taxon:@NCBITaxon:@;
            push (@taxids, $t);
        }
    }
    if (!@taxids) {
        print STDERR "NO TAXA FOR '$subdb' (dataset=$dataset)\n";
    }
    my $TAXA = join("", (map {"   - $_\n"} @taxids));
    
    print <<EOM;
-    
 id: $id
 label: "$dataset $type file"
 description: "$type file for $dataset from $dbname"
 url: $url
 type: $type
 dataset: $dataset
 submitter: $auth
 compression: gzip
 source: $src
 entity_type: $entity_type
 taxa:
$TAXA
EOM
}


=head1 USAGE

cd go-site/metadata
../scripts/bootstrap-dataset-yaml.pl ~/repos/go/gene-associations/submission/*gz ~/repos/go/gpad-gpi/submission/*gz > datasets.yaml

=cut
