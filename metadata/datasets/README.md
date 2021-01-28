# GO Dataset Metadata

Metadata on gene association datasets available from the GOC, organized by contributor. This drives the new GO association file publishing pipeline.

For GO Consortium Internal Docs, see http://wiki.geneontology.org/index.php/Release_Pipeline

## Technical Docs
 
Pipeline configuration: https://github.com/geneontology/go-site/tree/master/pipeline

## Editing the metadata

Anyone can suggest edits to any of the yaml files in this repo (in general the files will be edited either by GO Central, or by a representative from each producer). These edits are made by Pull Requests, which are evaluated by a member of GO Central, and merged if appropriate and the travis tests pass.

## Schema

See [../datasets.schema.yaml](../datasets.schema.yaml)

Any edit is checked against this schema

## Jenkins Jobs

 *  https://build.geneontology.org/job/geneontology/job/pipeline

## NEO

This drives the noctua entity ontology which drives selection in noctua

### Future

Ultimately, the metadata here will drive pages such as:
http://geneontology.org/page/download-annotations

And will also drive loading of Golr and the GO graphstore

See https://github.com/geneontology/go-site/issues/207 for more details.

For current plans on GO data architecture see: https://docs.google.com/presentation/d/1TmkHm_gq085_P7jWQCFdo2Y8NTsHGMCSNKAyXCZAsho/edit#slide=id.p4
