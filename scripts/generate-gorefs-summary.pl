#!/usr/bin/perl -w
use strict;
use YAML::Syck; $YAML::Syck::ImplicitTyping = 1;
use Data::Dumper;
# Supremely hacky script, see https://github.com/geneontology/go-site/issues/271

print "# GO REFs\n\n";
print "This is a collection of references used by the GO Consortium\n\n";
print "To see how to add to this file, see [README-editors.md](README-editors.md)\n\n";

my $yaml = 0;
my $block = "";
my $out = "";
my @gorefs = ();
while(<>) {
    if (m@^\-\-\-@) {
        if ($yaml) {
            $yaml = 0;

            # hacky lookahead
            while (<>) {
                chomp;
                if (m@^#*\s+(.*)@) {
                    my $title = $1;
                    die unless $title;
                    $block .= "title: \"$title\"";
                    last;
                }
                elsif (m@^\s*$@) {
                }
                else {
                    die "unexpected: $_";
                }
            }
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
        $citation_url =~ s@PMID:@http://www.ncbi.nlm.nih.gov/pubmed/@;
        $out .= " * citation: [$citation]($citation_url)\n";
    }

    my $authors = $obj->{authors};
    $out .= " * authors: $authors\n" if $authors;

    my $ext_accs = $obj->{external_accessions} || [];
    $out .= " * ext xref: $_\n" foreach @$ext_accs;
    
    $out .= "\n\n";
    push(@gorefs, " * <a href=\"#goref$id\">GO_REF:$id $title</a>");
}

