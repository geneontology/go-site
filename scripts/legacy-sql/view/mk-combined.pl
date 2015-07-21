#!/usr/bin/perl
@files=();
while(<>) {
    chomp;
    next if /^\#/;
    push(@files,$_) if $_;
}
print `cat @files`;
