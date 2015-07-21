#!/usr/bin/perl

$in = 0;
while(<>) {
    $in = 0 if /END\s+MATERIALIZE/;
    if ($in) {
        s/^\-\-\s+//;
        print;
    }
    $in = 1 if /BEGIN\s+MATERIALIZE/;
}

