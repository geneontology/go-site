#!/usr/bin/perl -w
use strict;
use YAML::Syck; $YAML::Syck::ImplicitTyping = 1;
use Data::Dumper;
# Supremely hacky script, see https://github.com/geneontology/go-site/issues/282

my $yaml = 0;
my $block = "";
my $out = "";
my @gorefs = ();
while(<>) {
    if (m@^\-\-\-@) {
        if ($yaml) {
            $yaml = 0;
            print_block($block);
        }
        else {
            $yaml = 1;
            $block = "";
        }
    }
    else {
        if ($yaml) {
            $block .= $_;
        }
        else {
            $out .= "$_";
        }
    }
    
}
if ($yaml) {
    die "unbalanced yaml markers";
}

print "$_\n" foreach @gorefs;
print "\n\n";
print $out;
exit 0;

sub print_block {
    my $block = shift;
    my $obj = Load($block);
    my $id = $obj->{id};
    $id =~ s@GO_REF:@@;
    $out.= "\n<a name=\"goref$id\"/>\n";

    my $title = $obj->{title};
    $out .= "## $title\n\n";

    $out .= " * id: [GO_REF:$id](https://github.com/geneontology/go-site/blob/master/metadata/gorefs/goref-$id.md)\n";

    my $status = $obj->{status};
    $out .= " * status: $status\n" if $status;

    my $year = $obj->{year};
    $out .= " * year: $year\n" if $year;

    my $citation = $obj->{citation};
    if ($citation) {
        my $citation_url = $citation;
        $citation_url =~s m@PMID:@http://www.ncbi.nlm.nih.gov/pubmed/@;
        $out .= " * citation: [$citation]($citation_url)\n";
    }

    $out .= "\n\n";
    push(@gorefs, " * <a href=\"#goref$id\">GO_REF:$id $title</a>");
}

