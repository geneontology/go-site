# Rule Runner

Python code to run a directory of SPARQL implemented rules for the GO.

## Install

    [sauron@myeyebook:rule-runner]$ python3 -m venv env
    [sauron@myeyebook:rule-runner]$ source env/bin/activate
    [sauron@myeyebook:rule-runner]$ pip3 install .

## Run

Run by just pointing out a directory with Rules YAML files and a SPARQL
endpoint. Rule Runner will open each YAML, run the sparql query, and test if
any results were returned. _It's considered a failure if the Query returns
any results_.

    rulerunner path/to/rules/ http://rdf.geneontology.org/blazegraph/sparql

If you want to save detailed results (For example, for usage in a build script)
you can supply the `--out` option:

    rulerunner --out results.json path/to/rules/ http://rdf.geneontology.org/blazegraph/sparql

Lastly, you can supply the `--schema` parameter and specify a schema file to
validate Rules YAML files with. By default rulerunner will look in the `schema`
directory in `rule-runner` main directory:

    rulerunner --schema my/schema/file path/to/rules/ http://rdf.geneontology.org/blazegraph/sparql

    
