# users.yaml

 - [users.yaml](users.yaml) - metadata on GOC members and contributors
 - [users.schema.yaml](users.schema.yaml) - schema

## Generating md5 hashes

When adding users to users.yaml, 
you need to generate an md5sum of their email address (as the lookup for our end of Persona). To generate this
hash, you should use:
```
echo -n "foo.bar@bib.example" | md5sum
```

# db-xrefs.yaml

 - [db-xrefs.yaml](db-xrefs.yaml) - prefix registry
 - [db-xrefs.schema.yaml](db-xrefs.schema.yaml) - schema

# datasets

See the [datasets/](datasets) directory for more details

 - [datasets.schema.yaml](datasets.schema.yaml) - schema

