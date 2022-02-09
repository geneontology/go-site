import os
import sys
import logging

sys.path.append("../parser/goref.py")
from goref import GoRef

sys.path.append("../parser/utils.py")
from utils import get_html_string, merge_dicts

import yaml
import markdown


logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # final list of all dicts that need to be converted to YAML
    combined_dict_list = []

    for file_name in os.listdir("metadata/gorefs/yamldown/"):
        file_name = os.path.join("metadata/gorefs/yamldown", file_name)

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

        if len(header_contents) != len(paragraph_contents):
            logger.warning(
                f"There are standalone headers or paragraphs in: {yaml_content['id']}"
            )
            continue

        goref_body = []
        goref_content = {}

        for i in range(len(header_contents)):
            title_desc_pair = {}

            title_desc_pair["goref_title"] = header_contents[i]
            title_desc_pair["goref_body"] = paragraph_contents[i]

            goref_body.append(title_desc_pair)

        goref_content["goref_content"] = goref_body

        # yamldown content in the form of a dictionary
        merged_yaml_md = merge_dicts(yaml_content, goref_content)

        combined_dict_list.append(merged_yaml_md)
        
    # export combined list of yamldown dicts compiled from all gorefs
    # and export to YAML
    with open("gorefs.yaml", "w") as outfile:
        yaml.dump_all(combined_dict_list, outfile, sort_keys=False)
