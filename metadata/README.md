# users.yaml

## Generating md5 hashes

When adding users to users.yaml, 
you need to generate an md5sum of their email address (as the lookup for our end of Persona). To generate this
hash, you should use:
```
echo -n "foo.bar@bib.example" | md5sum
```
