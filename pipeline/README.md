New GO pipeline. For context, see:

 * https://github.com/geneontology/go-site/issues/209

## Overview

 * Gathers external contributed files (GAFs, GPADs, ...)
    * The locations of these are stored in [yaml metadata files](../metadata/datasets)
    * Groups can provide GAF or GPAD+GPI
 * Performs filtering and checking
    * We use an adapted version of "Mike's script", see [util/](util)
    * Afterwards runs owltools checks and inferences
 * Generates filtered files and derived files
    * GPAD, GAF and GPI
    * RDF for direct loading into blazegraph

## Jenkins Job

 * https://build.berkeleybop.org/job/go-gaf-pipeline-NEW/

Everything is driven by a makefile. It should be possible to run the makefile locally, on an amazon machine slaved to jenkins, etc

## Status

Note yet active. Running in parallel.

