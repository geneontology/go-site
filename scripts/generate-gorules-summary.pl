#!/usr/bin/perl -w
use strict;
use YAML::Syck; $YAML::Syck::ImplicitTyping = 1;
use Data::Dumper;
# Supremely hacky script, see https://github.com/geneontology/go-site/issues/282

my $yaml = 0;
my $block = "";
my $out = "";
my @rules = ();
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

print "$_\n" foreach @rules;
print "\n\n";
print $out;
exit 0;

sub print_block {
    my $block = shift;
    my $obj = Load($block);
    my $id = $obj->{id};
    $id =~ s@GORULE:@@;
    $out.= "<a name=\"gorule$id\"/>\n";

    my $title = $obj->{title};
    $out .= "## $title\n\n";

    $out .= " * id: [GORULE:$id](https://github.com/geneontology/go-site/blob/master/metadata/rules/gorule-$id.md)\n";

    my $status = $obj->{status};
    $out .= " * status: $status\n" if $status;

    $out .= "\n";
    push(@rules, " * <a href=\"#gorule$id\">GORULE:$id $title</a>");
}

