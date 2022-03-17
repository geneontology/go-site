import os
import sys
import json
import logging

sys.path.append("../parser/goref.py")
from goref import GoRef

sys.path.append("../parser/utils.py")
from utils import get_html_string, merge_dicts

import yaml
import ruamel.yaml
import markdown


logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # final list of all dicts that need to be converted to YAML
    combined_dict_list = []

    for file_name in os.listdir("metadata/gorefs/"):
        if any(
            non_goref in file_name
            for non_goref in [
                "README-editors.md",
                "Makefile",
                "README.md",
                "gorefs.yaml",
                "gorefs.json",
                "gorefs.schema.json",
            ]
        ):
            continue

        file_name = os.path.join("metadata/gorefs/", file_name)

        with open(file_name, "r") as file:
            data = file.read()

        goref = GoRef(file_name)

        # fetch YAML contents
        yaml_content = goref.parse(portion="yaml")

        # fetch MD content
        md_content = goref.parse(portion="md")

        # convert MD into HTML
        html = markdown.markdown(md_content)

        # get content between <h2> tags
        header_contents = get_html_string("h2", html)

        # get content between <p> tags
        paragraph_contents = get_html_string("p", html)

        # enable this block if you want to handle multiple comments differently
        # if len(header_contents) != len(paragraph_contents):
        #     logger.warning(
        #         f"There are standalone headers or paragraphs in: {yaml_content['id']}"
        #     )
        #     continue

        title_desc_pair = {}

        title_desc_pair["title"] = header_contents[0]
        title_desc_pair["comments"] = paragraph_contents

        # yamldown content in the form of a dictionary
        merged_yaml_md = merge_dicts(yaml_content, title_desc_pair)

        combined_dict_list.append(merged_yaml_md)

    # export combined list of yamldown dicts compiled from all gorefs
    # and export to YAML
    with open("gorefs.yaml", "w") as outfile:
        yaml.dump(combined_dict_list, outfile, sort_keys=False)

    # convert the dumped YAML file into JSON
    with open("gorefs.yaml", "r") as yaml_in, open("gorefs.json", "w") as json_out:
        yaml_object = ruamel.yaml.safe_load(yaml_in)
        json.dump(yaml_object, json_out, indent=4)
