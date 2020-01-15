[![Stories in Ready](https://badge.waffle.io/geneontology/go-site.png?label=ready&title=Ready)](https://waffle.io/geneontology/go-site)
[![Build Status](https://travis-ci.org/geneontology/go-site.svg?branch=master)](https://travis-ci.org/geneontology/go-site?branch=master)

A collection of metadata, files, and tools associated with the GO public
website and geneontology.org web presence.

As well, the tracker is used as a catch-all for anything not tied to another GO project.

Every directory should have its own description.

Any of the files here can be edited via the [go-site page on github](https://github.com/geneontology/go-site/). After editing, create a pull request. Edits will be checked for validity by travis (see the [.travis.yml](.travis.yml) file).

# metadata

The location of all core GO-related metadata. Most notably:

 - [db-xrefs.yaml](metadata/db-xrefs.yaml) - prefix registry, for anything that is col1 of a GAF, or the prefix of a CURIE/Identifier
 - [users.yaml](metadata/users.yaml) - metadata on GOC members and contributors
 - [groups.yaml](metadata/groups.yaml) - metadata on GOC groups, for anything that cann be the value of a 'contributor' or 'assigned_by'
 - [datasets/](metadata/datasets/) - metadata on contributed and released files
 - [rules/](metadata/rules/) - metadata on cGO annotation QC rules

Each of the these has their own yaml schema.

See the [metadata/README.md](metadata/README.md) for more details

# scripts

  Maintenance and support scripts.

# drupal7

  The files that we're using tp modify our Drupal 7 installation from
  stock. This may also serve as a base for when we push onto a
  service.

# cgi-bin (legacy)

  This files an scripts that we want to preserve from the old GO site.
  Ideally, any critical functionality can be rewritten in a simpler
  and more reusable way than the original.



