from ontobio.model import collections
from ontobio.model import association
from ontobio.io import assocparser, assocwriter
from ontobio.validation import metadata, rules, tools

from goat import cached_ontology
# from goat import sources

import os
import json
import pathlib

this_go_site_path = pathlib.Path(__file__).parent.parent.parent.parent.absolute()
metadata_dir = os.path.join(this_go_site_path, "metadata")

def process_single_file(source_file, gpis, ontology, out_dir, annotation_inferences=None):

    rules_without_26 = [r for r in range(1, 62) if r != 26]
    
    ontology = cached_ontology.from_file(ontology)
    config = assocparser.AssocParserConfig(
        ontology=ontology,
        goref_metadata=metadata.yamldown_lookup(os.path.join(metadata_dir, "gorefs")),
        rule_metadata=metadata.yamldown_lookup(os.path.join(metadata_dir, "rules")),
        rule_contexts=[],
        suppress_rule_reporting_tags=[],
        entity_idspaces=metadata.database_entities(metadata_dir),
        group_idspace=metadata.groups(metadata_dir),
        annotation_inferences=annotation_inferences,
        rule_set=rules_without_26
        # group_metadata=metadata.dataset_metadata_file(metadata_dir, group)
    )
    source_file_base_name = os.path.splitext(os.path.basename(source_file))[0].split("-")[0]
    # dataset_name = sources.dataset_name_from_src(os.path.basename(source_file))

    collected = collections.construct_collection(source_file, gpis, config)

    report_md_contents = collected.report.to_markdown()
    with open(os.path.join(out_dir, "{}-report.md".format(source_file_base_name)), "w") as report_md_f:
        report_md_f.write(report_md_contents)

    report_json_contents = collected.report.to_report_json()
    with open(os.path.join(out_dir, "{}-report.json".format(source_file_base_name)), "w") as report_json_f:
        report_json_f.write(json.dumps(report_json_contents, indent=4))

    with open(os.path.join(out_dir, "{}_valid.header".format(source_file_base_name)), "w") as header_f:
        header_f.write("\n".join(collected.headers))

    with open(os.path.join(out_dir, "{}_valid.gpad".format(source_file_base_name)), "w") as gpad_valid_f:
        gpad_writer = assocwriter.GpadWriter(gpad_valid_f, version=assocwriter.GPAD_2_0)
        gpad_writer.write(collected.associations.associations)
