## Notes

* In the main Zenodo archive, three derivative products were excluded due to Zenodo size limitations (https://github.com/geneontology/pipeline/issues/353): golr-index-contents.tgz, blazegraph-production.jnl.gz, and blazegraph-internal.jnl.gz.
* These products available in a separate Zenodo archive for these large "binary" secondary products (https://zenodo.org/records/10946933).

## Errata

* The built Solr index has an issue with the included evidence not propagating, making the Evidence filters malfunction. We will be rebuilding a new release due to this issue (https://github.com/geneontology/amigo/issues/716).
