#!/bin/bash

# This script will convert a YAML file to Turtle format,
# given a JSON-LD context, also in YAML format.
# Since ROBOT is used, other file extensions for the output 
# can select other formats in addition to Turtle.
# Run: ./yaml2turtle.sh context.yaml data.yaml data.ttl

contextyaml=$1
# expected to have an array at the root
inputyaml=$2 
outputttl=$3
tmpfile=`mktemp`.jsonld
echo '{"@context": ' >$tmpfile
yaml2json $contextyaml >>$tmpfile
echo ', "@graph": ' >>$tmpfile
yaml2json $inputyaml >>$tmpfile
echo '}' >>$tmpfile
robot convert -i $tmpfile -o $outputttl
