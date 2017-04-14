from typing import List, Dict
import SPARQLWrapper

class RuleResult(object):
    """
    Encapsulates the result of running a rule against a sparql
    endpoint. If there are results returned from the sparql query,
    then the rule has failed. The result object can be turned into
    a dictionary for writing out to JSON (or YAML if desired).
    """

    def __init__(self, returned: List, rule: Dict):
        """
        PARAMS:
            - returned (List): the list of returned sparql results in JSON
            format.
            - rule (JSON Dict): The in memory dictionary of the GO Rule
            expressed in YAML.
        """
        self.returned = returned
        self.rule = rule
        self.passing = "pass" if len(returned) == 0 else "fail"

    def jsonify(self) -> Dict:
        """
        Creates a dictionary of this RuleResult for writing out as JSON or
        YAML. This has detailed information about the Rule that produced this
        RuleResult as well as if the rule passed or failed, a limited number
        of results from the SPARQL query if any, and the total numer of results
        from the SPARQL query.
        """
        returned_dict = []
        for entry in self.returned:
            simple_binding = {}
            for binding, value in entry.items():
                simple_binding[binding] = value["value"]
            returned_dict.append(simple_binding)
            if len(returned_dict) >= 5:
                break

        result_dict = {
            "name": self.rule["rule"]["name"],
            "sparql": self.rule["rule"]["sparql"],
            "pass": self.passing,
            "fail_mode": self.rule["rule"]["fail_mode"],
            "some_results": returned_dict,
            "total_found": len(self.returned)
        }
        return result_dict

def run_query(query, endpoint):
    """
    Run a sparql query against an endpoint and return the results converted to
    JSON dictionary.
    """
    sparql = SPARQLWrapper.SPARQLWrapper(endpoint)
    sparql.setQuery(query)
    sparql.setReturnFormat(SPARQLWrapper.JSON)
    return sparql.query().convert()

def test_rule(rule: Dict, endpoint: str) -> RuleResult:
    """
    Perform a real test of the Rule against the given endpoint. A RuleResult is
    returned.
    PARAMS:
        - rule: JSON/YAML dictionary of the GO Rule with a sparql query to run
        - endpoint: A SPARQL endpoint
    """
    query_results = run_query(rule["rule"]["sparql"], endpoint)
    return RuleResult(query_results["results"]["bindings"], rule)

def generate_results_json(rule_results_list: List[RuleResult]) -> Dict:
    """
    For each Rule, we will produce RuleResult. This function takes the list of
    RuleResults and produces a final JSON dictionary blob for writing to a file
    if desired. This includes at the top level to keys, "build" and "results".
    "build" can be 'pass', 'unstable', or 'fail' if the results have no failures,
    have only at least soft failures, or have any hard failures respectively.
    This can be read by a tool to know if the Rule checks should ultimately be
    declared unstable or failed. 
    """
    results_json = [result.jsonify() for result in rule_results_list]

    build = "pass"
    for result in rule_results_list:
        if result.passing == "fail" and result.rule["rule"]["fail_mode"] == "soft" and build == "pass":
            build = "unstable"
        if result.passing == "fail" and result.rule["rule"]["fail_mode"] == "hard" and build != "fail":
            build = "fail"
            break

    return {
        "build": build,
        "results": rules_results_json
    }
