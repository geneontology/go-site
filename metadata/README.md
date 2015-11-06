# users.yaml

## Generating md5 hashes

When adding users to users.yaml, 
you need to generate an md5sum of their email address (as the lookup for our end of Persona). To generate this
hash, you should use:
```
echo "foo.bar@bib.example" | md5sum
```
Now, you might be wondering: why are you not using the "-n" flag for echo? Good question.
In the main code we use to consume this, we get an email address from Persona and feed it directly into the NPM
'crypto' package; the resulting hash matches the above. In this case, we are just following along, and have not
seen if the hiccup is in the returned email string or the use of the crytpo package.
