How to add a reference to the system:

 1. Go to [https://github.com/geneontology/go-site/tree/master/metadata/gorefs](https://github.com/geneontology/go-site/tree/master/metadata/gorefs)
 2. Click [create new file](https://github.com/geneontology/go-site/new/master/metadata/gorefs)
 3. Be sure to follow naming conventions, the file should be called `goref-NNNNNNN.md`. Choose the next available ID.
 4. Add a markdown file, plus YAML block. The easiest thing is to adapt an existing one, e.g. [goref-0000026.md](goref-0000026.md) -- click on [raw](https://raw.githubusercontent.com/geneontology/go-site/master/metadata/gorefs/goref-0000026.md) to see the raw file.
 5. Save
 6. Select "make changes on a new branch" if requested
 67. Click the button to make a Pull Request

A member of GO Central will review your changes and either incorporate. This person will also update the index -- the [README.md](README.md) file. This is done by typing `make all` on the command line after checking out the repo.

Note the same procedure can be used to make edits to existing GOREFS.
