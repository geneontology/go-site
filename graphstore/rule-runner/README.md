# SPARTA

SPArql Rule Test Automation.

Python code to run a directory or single file of yamldown with implemented
sparql rules the for Gene Ontology. For the SPARQL implementations of these rules,
_It's considered a failure if the Query returns any results_. Success is zero
results.

## Install

    [sauron@myeyebook:rule-runner]$ python3 -m venv env
    [sauron@myeyebook:rule-runner]$ source env/bin/activate
    [sauron@myeyebook:rule-runner]$ pip3 install .

## Run

### `test`

This runs a single rule defined in a GO Rule yamldown. See the yaml schema for
[go rules](../../metadata/rules.schema.yml). For the `--rule` parameter, you
can supply a number representing the GORULE id, the entire seven digit id, the
full go rule id (GORULE:nnnnnnn) or just a path directly to some yamldown file
that follows the rules schema.

If there is a SPARQL implementation then it will be run against the supplied
sparql endpoint.

Example:

    sparta test --rule 6 http://localhost:8899/blazegraph/sparql

You can also use the `-o/--out FILE` to output a JSON report of the test to the
given file.


### `group`

Run by just supplying the sparql endpoint as an argument. sparta will open each
yamldown, run the sparql query, and test if any results were returned.

    sparta http://rdf.geneontology.org/blazegraph/sparql

If you want to save detailed results (For example, for usage in a build script)
you can supply the `--out` option:

    sparta --out results.json http://rdf.geneontology.org/blazegraph/sparql

Lastly, you can supply the `--schema` option and specify a schema file to
validate Rules YAML files with. By default sparta will look in the `metadata`
directory in top level go-site main directory for `rules.schema.yml`:

    sparta --schema my/schema/file http://rdf.geneontology.org/blazegraph/sparql
