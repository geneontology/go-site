# GO Dataset Metadata

Metadata on datasets available from the GOC, organized by contributor.

## Schema

See [../datasets.schema.yaml](../datasets.schema.yaml)

(in flux)

## Publishing

Published by this job:

https://build.berkeleybop.org/job/publish-go-site-datasets-json/

Published here:

http://s3.amazonaws.com/go-public/metadata/datasets.json

## How is this used?

### NEO

This drives the noctua entity ontology which drives selection in noctua

### Future

Ultimately, the metadata here will drive pages such as:
http://geneontology.org/page/download-annotations

And will also drive loading of Golr and the GO graphstore

See https://github.com/geneontology/go-site/issues/207 for more details.

For current plans on GO data architecture see: https://docs.google.com/presentation/d/1TmkHm_gq085_P7jWQCFdo2Y8NTsHGMCSNKAyXCZAsho/edit#slide=id.p4
