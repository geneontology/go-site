#!/usr/bin/perl

while(<>) {
    if (/create or replace view\s+(\S+)/i || /create view\s+(\S+)/i) {
	print "DROP TABLE IF EXISTS $1;\n";
    }
    print "$_";
}
