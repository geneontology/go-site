import unittest
import rdflib
import os

from rdflib import term
from rulerunner.main import load_yamldown, validate, rules_directory
from rulerunner import rule

def query(rule_number):
    rule_id = "{:0>7}".format(rule_number)
    name = "gorule-{id}.md".format(id=rule_id)
    data_name = "gorule-{id}-test.ttl".format(id=rule_id)
    rule_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../../metadata/rules/", name)
    data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", data_name)
    return check_rule_with_data(rule_path, data_path)


def check_rule_with_data(rule_path, data_path):

    r = load_yamldown(rule_path)
    schema = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../metadata/rules.schema.yml")
    validate(r, schema)
    if not rule.sparql_from(r):
        raise Exception("No SPARQL impl for rule {}".format(rule_path))

    g = rdflib.graph.ConjunctiveGraph()
    test_data_graph = g.parse(data_path, format="ttl", publicID="http://geneontology.org/rules/test")
    test_data_graph.add((term.URIRef("http://geneontology.org/rules/test"), term.URIRef("http://geneontology.org/graphType"), term.URIRef("http://geneontology.org/gafCam")))
    results = g.query(rule.sparql_from(r))
    return results

class TestRules(unittest.TestCase):

    def test_rule_6(self):
        results = query(6)
        print("Results:")
        for row in results:
            print(row)

        self.assertEqual(1, len(results))

    def test_rule_7(self):
        results = query(7)
        print("Results:")
        for row in results:
            print(row)

        self.assertEqual(1, len(results))

    def test_rule_14(self):
        results = query(14)
        print("Results:")
        for row in results:
            print(row)

        self.assertEqual(1, len(results))

    def test_rule_11(self):
        results = query(11)
        print("Results")
        for row in results:
            print(row)

        self.assertEqual(1, len(results))


if __name__ == "__main__":
    unittest.main()
