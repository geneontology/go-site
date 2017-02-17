#!/usr/bin/perl
use YAML::Syck;
use strict;

my %spcode = (
    sgd => 'Scer',
    pombase => 'Spom',
    mgi => 'Mmus',
    zfin => 'Drer',
    rgd => 'Rnor',
    dictybase => 'Ddis',
    fb => 'Dmel',
    tair => 'Atal',
    wb => 'Cele',
    gramene_oryza => 'Oryz',
    goa_human => 'Hsap',
    goa_dog => 'Cfam',
    goa_chicken => 'Ggal',
    goa_cow => 'Btau',
    goa_pig => 'Sscr',
    sgn => 'Solanaceae',
    pseudocap => 'Pseudomonas',
    aspgd => 'Aspergillus',

    );

my %taxon2db = (
    'taxon:5476' => 'cgd',
    'taxon:5052' => 'aspgd',
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
    'taxon:4081' => 'sgn',

    'taxon:176299' => 'PAMGO_Atumefaciens',

    'taxon:123356' => 'PAMGO_Oomycetes',
    'taxon:4784' => 'PAMGO_Oomycetes',
    'taxon:4785' => 'PAMGO_Oomycetes',
    'taxon:4786' => 'PAMGO_Oomycetes',
    'taxon:4787' => 'PAMGO_Oomycetes',
    'taxon:4792' => 'PAMGO_Oomycetes',
    'taxon:65070' => 'PAMGO_Oomycetes',
    'taxon:67593' => 'PAMGO_Oomycetes',
    'taxon:148305' => 'PAMGO_Mgrisea',
    'taxon:198628' => 'PAMGO_Ddadantii',

    'taxon:5833' => 'GeneDB_Pfalciparum',
    'taxon:37546' => 'GeneDB_tsetse',
    'taxon:212042' => 'jcvi',
    'taxon:198094' => 'jcvi',
    'taxon:227377' => 'jcvi',
    'taxon:246194' => 'jcvi',
    'taxon:195099' => 'jcvi',
    'taxon:195103' => 'jcvi',
    'taxon:167879' => 'jcvi',
    'taxon:243164' => 'jcvi',
    'taxon:205920' => 'jcvi',
    'taxon:243231' => 'jcvi',
    'taxon:228405' => 'jcvi',
    'taxon:265669' => 'jcvi',
    'taxon:243233' => 'jcvi',
    'taxon:222891' => 'jcvi',
    'taxon:220664' => 'jcvi',
    'taxon:223283' => 'jcvi',
    'taxon:264730' => 'jcvi',
    'taxon:211586' => 'jcvi',
    'taxon:246200' => 'jcvi',
    'taxon:686' => 'jcvi',
    'taxon:4528' => 'gramene_oryza',
    'taxon:4529' => 'gramene_oryza',
    'taxon:4530' => 'gramene_oryza',
    'taxon:4532' => 'gramene_oryza',
    'taxon:4533' => 'gramene_oryza',
    'taxon:4534' => 'gramene_oryza',
    'taxon:4535' => 'gramene_oryza',
    'taxon:4536' => 'gramene_oryza',
    'taxon:4537' => 'gramene_oryza',
    'taxon:4538' => 'gramene_oryza',
    'taxon:29689' => 'gramene_oryza',
    'taxon:29690' => 'gramene_oryza',
    'taxon:39946' => 'gramene_oryza',
    'taxon:39947' => 'gramene_oryza',
    'taxon:40148' => 'gramene_oryza',
    'taxon:40149' => 'gramene_oryza',
    'taxon:52545' => 'gramene_oryza',
    'taxon:63629' => 'gramene_oryza',
    'taxon:65489' => 'gramene_oryza',
    'taxon:65491' => 'gramene_oryza',
    'taxon:77588' => 'gramene_oryza',
    'taxon:83307' => 'gramene_oryza',
    'taxon:83308' => 'gramene_oryza',
    'taxon:83309' => 'gramene_oryza',
    'taxon:110450' => 'gramene_oryza',
    'taxon:110451' => 'gramene_oryza',
    'taxon:127571' => 'gramene_oryza',
    'taxon:364099' => 'gramene_oryza',
    'taxon:364100' => 'gramene_oryza',
    'taxon:208964' => 'pseudocap',
    
    );

open(F,'db-xrefs.yaml') || die;
my $yaml = join("",<F>);
close(F);
my $xrefs = Load($yaml);

my %is_append = ();

push(@$xrefs, {database=>'GOA', name=>'EBI Gene Ontology Annotation Database'});

my %xrefh = ();
foreach my $x (@$xrefs) {
    $xrefh{lc($x->{database})} = $x;
}
my %confh = ();

foreach (@ARGV) {
    if (m@(\w+)\.gaf\.conf$@) {
        parseconf(lc($1), $_);
        next;
    }
    elsif (m@(\w+)\.conf$@) {
        parseconf(lc($1), $_);
        next;
    }
    unless (m@\.gz$@) {
        next;
    }

    ## Deprecated
    next if m@goa_ref@;

    ## Old form: replaced by goa_foo[_type].gaf.gz
    next if m@gene_association\.goa@;

    # stale MGIs
    next if m@association.*.gpi.gz@;

    if (m@gene_association.(\S+).gz@) {
        emit('gaf', $1, $_);
    }
    elsif (m@(\w+)_association.gpi.gz@) {
        emit('gpi', $1, $_);
    }
    elsif (m@(\w+)_association.gpa.gz@) {
        emit('gpad', $1, $_);
    }
    elsif (m@(\w+).gaf.gz@) {
        emit('gaf', $1, $_);
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

foreach my $f (keys %is_append) {
    my $bn = $f;
    $bn =~ s@.yaml@.json@;
    my $cmd = "yaml2json.pl $f > $bn";
    if (system($cmd)) {
        die $cmd;
    }
}

exit 0;

sub parseconf {
    my ($dataset, $fn) = @_;
    #print STDERR "PARSING: $dataset FROM $fn\n";
    my $h = {};
    $confh{$dataset} = $h;
    open(F,$fn) || die $fn;
    while(<F>) {
        chomp;
        if (m@(\w+)=(.*)@) {
            $h->{$1} = $2;
        }
    }
    close(F);
}

sub emit {
    my ($type, $dataset, $file) = @_;
    $dataset = lc($dataset);
    my $authname;
    my $subdb = $dataset;
    my $auth = $dataset;
    my $entity_type = '';

    my $ch = $confh{$dataset};
    if (!$ch) {
        print STDERR "NO CONF FOR: $dataset\n";
        $ch = {};
    }
    
    if ($dataset =~ m@_@) {
        if ($dataset =~ m@(\w+)_(\w+)_(\w+)@) {
            $auth = $1;
            #$subdb = $2."_"."$3";
            $subdb = $1."_".$2;
            $entity_type = $3;
        }
        elsif ($dataset =~ m@(\w+)_(\w+)@) {
            $auth = $1;
            if ($auth eq 'goa') {
                $entity_type = 'protein';
            }
        }
        else {
            warn $dataset;
        }
    }
    else {
        
    }
    my $dbmeta = $xrefh{$auth};

    if ($dataset =~ m@paint_(\S+)@) {
        $dbmeta = { name => 'PAINT' };
    }

    if ($dbmeta) {
        $authname = $dbmeta->{name};
    }
    else {
        print STDERR "NO ENTRY FOR: $auth (db $dataset)\n";
        $authname = $dataset;
    }
    
    my $base = $file;
    $base =~ s@.*/@@;
    my $id = "$dataset.$type";
    my $loc = $type eq 'gaf' ? 'gene-associations' : 'gpad-gpi/release';
    my $url = "http://geneontology.org/$loc/$base";

    my $src = "http://geneontology.org/$loc/submission/$base";
    if ($auth eq 'mgi' && $type eq 'gpi') {
        $src = "http://www.informatics.jax.org/downloads/reports/";
    }
    if ($auth eq 'goa' && $dataset =~ m@goa_([a-z]+)@) {
        # e.g. ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/CHICKEN/goa_chicken_rna.gpi.gz
        $src = "ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/" . uc($1) . "/$base";
    }

    my $EXTRA = "";
    
    my @taxids = ();
    foreach my $k (keys %taxon2db) {
        if ($subdb eq lc($taxon2db{$k})) {
            my $t = $k;
            $t =~ s@taxon:@NCBITaxon:@;
            push (@taxids, $t);
        }
        if ($subdb =~ m@paint_(\S+)@) {
            if ($1 eq lc($taxon2db{$k})) {
                my $t = $k;
                $t =~ s@taxon:@NCBITaxon:@;
                push (@taxids, $t);
                
            }
        }
    }
    if (!@taxids) {
        print STDERR "NO TAXA FOR '$subdb' (dataset=$dataset)\n";
    }
    my $TAXA = join("", (map {"    - $_\n"} (sort @taxids)));

    
    my $ofn = "datasets/$auth.yaml";
    if ($is_append{$ofn}) {
        open(F, ">>$ofn") || die $ofn;
    }
    else {
        # HEADER
        open(F, ">$ofn") || die $ofn;
        print F "id: $auth\n";
        print F "label: $authname\n";
        print F "description: \"GO data for $authname\"\n";
        print F "datasets:\n";
    }
    $is_append{$ofn}++;        
    my $status = 'active';
    if ($auth eq 'reactome' || $auth eq 'goa_pdb') {
        $status = "inactive";
    }
    my $species_code = $spcode{$subdb};
    if (!$species_code && $subdb =~ m@paint_(\w+)@) {
        $species_code = $spcode{$1};
        $EXTRA .= "   merges_into: $1\n";
    }
    
    #my $dataset_description = "$type data for $ch->{project_name}" || "$type file for $dataset from $authname";
    my $dataset_description = "$type file for $dataset from $authname";
    print F <<EOM;
 -    
   id: $id
   label: "$dataset $type file"
   description: "$dataset_description"
   url: $url
   type: $type
   dataset: $dataset
   submitter: $auth
   compression: gzip
   source: $src
   entity_type: $entity_type
   status: $status
   species_code: $species_code
   taxa:
$TAXA$EXTRA   
EOM

   close(F);
}


=head1 USAGE

cd go-site/metadata
../scripts/bootstrap-dataset-yaml.pl ~/repos/go/gene-associations/*gz ~/repos/go/gpad-gpi/submission/*gz

=cut
