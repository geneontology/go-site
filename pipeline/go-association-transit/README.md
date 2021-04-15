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
4. "Shovel2Pile" -- actually called "Assembly"
    * This is the point where PAINT and other Mixed In annotations should be merged into the final output annotation files.
    * Headers also properly joined
    * Final <dataset> = Sum[<dataset>.header, <mixin0>.header, <mixin1>.header, ...] + Sum[<dataset>, <mixin0>, <mixin1>, ...]
    * example, paint_mgi will have in metadata: `merges_into: mgi`.
        1. download-annotation-sources.py annotations -g mgi -g paint -x [the rest of paint]
           * sources: mgi.gpad, paint_mgi.gpad, 
        2. goat pristine sources/
           * pristine: mgi_valid.gpad, paint_mgi_valid.gpad
        3. goat assemble
           * assemble: mgi.gpad (contains mgi_valid and paint_mgi_valid), paint_mgi.gpad
    * So how does assemble know that paint_mgi_valid should be mixed into mgi_valid?
      * mgi_valid -> mgi; paint_mgi_valid -> paint_mgi; <mixin>_<dataset>
         * paint_mgi is a mixin because when we match <mixin>_<dataset> <dataset> matches an existing source, namely "mgi".
         * We find potential mixins by the filename, and separate on the first underscore. If we get a mixin pattern, we can check if the <dataset> part of the name corresponds to an existing file in "pristine". If it does, then we have a <dataset>, and a <mixin>_<dataset> match.
         * We can then look at the datasets yaml. For a mixin: <group>_<dataset>, look in <group>.yaml for a <dataset> entry, and if it `merges_into: <dataset>`. If so, we can confirm that this mixin should merge into the given dataset name.
         * A drawback with this is we're *very* tied to the filenames and dataset names
     * Alternatively: instead of the mixin metadata yamls saying what they merge into, we change the metadata so that primary datasets state what mixins they desire. Example: mgi would have: `"has_mixin": ["paint_mgi"]`
       * For every file in "pristine", we look up the metadata entry for that file, and look for any mixins. If we also have a file with the mixin name, we perform the mixin logic above.
       * Drawback: This requires changing the metada yamls formally.
       * This seems ultimately easier though, and less brittle to filename/dataset name changes

5. nquad
    * Using Dustin's gocamgen code, produce nquad files for each GPAD to be loaded into a blazegraph journal.


## Makefile

### TODO, open questions

* Download is currently orchestrated by `scripts/download-annotation-sources.py` which smartly grabs either gaf or gpad+gpi depending on what's available in the datasets metadata YAML files.
* Make targets will likely be individually invoked by the Jenkinsfile.
