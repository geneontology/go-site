#!/bin/bash

# This script will convert a YAML file to Turtle format,
# given a JSON-LD context, also in YAML format.
# Run: ./yaml2turtle.sh context.yaml data.yaml data.ttl

contextyaml=$1
# expected to have an array at the root
inputyaml=$2 
outputttl=$3
tmpfile=`mktemp`
echo '{"@context": ' >tmpfile
yaml2json $contextyaml >>tmpfile
echo ', "@graph": ' >>tmpfile
yaml2json $inputyaml >>tmpfile
echo '}' >>tmpfile 
riot --syntax=jsonld --output=turtle tmpfile >$outputttl
