New GO pipeline. For context, see:

 * https://github.com/geneontology/go-site/issues/209

## Overview

 * Gathers external contributed files (GAFs, GPADs, ...)
    * The locations of these are stored in [yaml metadata files](../metadata/datasets)
    * Groups can provide GAF or GPAD+GPI
 * Performs filtering and checking
    * Uses ontobio validate for parsing and reporting
    * Afterwards runs owltools checks and inferences
 * Generates filtered files and derived files
    * GPAD, GAF and GPI
    * RDF for direct loading into blazegraph

## Products

* Snapshot: Run every day and results go to http://snapshot.geneontology.org
* Release: Run on the 1st of each month, and goes to http://release.geneontology.org with each release in it's own directory
* Current: http://current.geneontology.org is the current, most up to date release of products which appears in releases, above.

Everything is driven by a makefile. It should be possible to run the makefile locally, on an amazon machine slaved to jenkins, etc

## Environment

The pipeline/environment.sh script can be used to setup the environment before the makefile
is run. Use `source` to run the script:

    source environment.sh

or

    . environment.sh

## Status

Active. Running in parallel. Bulk of processing and reporting is done by ontobio validate.py.

## Pipeline Re-Orientation
To support a more flexible processing environment and to support all annotation input types, we will
change the basic structure of the pipeline, outlined here: https://github.com/geneontology/pipeline/issues/206

This new pipeline "kernel" will be a series of scripts/commands that perform simple steps file-by-file. This
new set of scripts/commands will be placed in the "go-association-transit" directory.

See the go-association-transit readme for more.
