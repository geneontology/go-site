# Scripts

This directory contains many scripts used by go-site and within a pipeline context.

## download-annotation-sources.py

Used for downloading annotation and gene data based on the Datasets YAML metadata files under `go-site/metadata/datasets/`.

This is a copy of `download_source_gafs.py`, but renamed to reflect its more general purpose.

### annotations

The `annotations` command will download annotation sources using information provided in the metadata datasets YAMLs and will download gpad+gpi files if those datasets are present within a group, otherwise will download gaf.

Additionally, this will only download "active" datasets - datasets whose YAML has the `status: active` key-value pair.

As a note, the `all` command differs in that it will download all files of a certain type, and so will either repeat data by downloading both gpad and gaf (if both are provided)

#### Examples

To download all annotations except `goa_uniprot_all` to a directory called "sources". All sources are zipped if unzipped, and unzipped if zipped with the `--zip-unzip` option:
```
python download-annotation-sources.py annotations --datasets path/to/go-site/datasets --target sources/ -x goa_uniprot_all --zip-unzip
```

To download only MGI, FB, and GOA groups, but excluding `goa_unprot_all`:

```
python download-annotation-sources.py annotations --datasets path/to/go-site/datasets --target sources/ -g mgi -g fb -g goa -x goa_uniprot_all --zip-unzip
```

### all

Using the datasets metadata YAML files, `all` will download all files referred to in the metadata. File types may be specified, in which case only those files that match the specified type will be downloaded.

### organize

Given a source directory that contains downloaded dataset files (from a previous invocation of `all`, or possibly `annotations`) `organize` will copy these files into the structure Ontobio expects in the main Pipeline Validate script.

