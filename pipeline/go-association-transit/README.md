# GO Association Transit

Welcome to GO Association Transit, or GOAT!

All Aboard!

This is a command line tool made for the "Pipeline Re-orientation" project, as outlined in this ticket: https://github.com/geneontology/pipeline/issues/206

## Design Considerations

The new way of thinking for the next phase of the Pipeline is that a collection of scripts/commands that each do a bit of work is orchestrated to shuttle all our data from one end to the other of the processing.

1. Download Data
    * Using dataset metadata YAML files, download source annotation files
    * Use existing download script: `go-site/scripts/download_source_gafs.py`
        * Perhaps a name change is in order
    * Invariant: every gpad has a gpi with the same root name

2. Pristine
    * Pointed at either individual files in the downloaded source, or the entire source directory, process each annotation GAF or GPAD+GPI into a validated GPAD 2.0.
    * Reports MD and JSON will also be created at this step.
    * Invoked with `goat pristine ...`
    * Invariant: all "pristine" GPADs will be GPAD 2.0, and reports of GO Rules

3. No IEA
    * Starting with pristine: each file gets a `_noiea` version, where IEA evidence annotations are stripped out.
    * Future `goat` script/command?
4. "Shovel2Pile"
    * This is the point where PAINT and other Mixed In annotations should be merged into the final output annotation files.
    * Headers also properly joined
5. nquad
    * Using Dustin's gocamgen code, produce nquad files for each GPAD to be loaded into a blazegraph journal.


## Makefile

### TODO, open questions

* Download is currently orchestrated by `scripts/download-annotation-sources.py` which smartly grabs either gaf or gpad+gpi depending on what's available in the datasets metadata YAML files.
* Make targets will likely be individually invoked by the Jenkinsfile.
