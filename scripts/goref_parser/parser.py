import collections
import logging
import sys
from pathlib import Path

import mistune
import yaml

sys.path.append("../parser/goref.py")
from goref import GoRef


logger = logging.getLogger(__name__)


def concat_children(node):
    result = ""
    for child in node["children"]:
        if child["type"] == "text":
            result += child["raw"]
        elif child["type"] == "inline_html":
            if child["raw"] == "<br>":
                result += "\n"
            else:
                result += child["raw"]
        elif child["type"] == "softbreak":
            result += " "
        else:
            raise ValueError(f"Unexpected child type: {child['type']}")
    return result


if __name__ == "__main__":
    # final list of all dicts that need to be converted to YAML
    all_gorefs = []

    markdown = mistune.create_markdown(renderer=None)

    root = Path(__file__).parent / "../../metadata/gorefs"
    for file_name in sorted(root.glob("goref-*.md")):
        goref_file = GoRef(str(file_name))

        (yaml_content, md_content) = goref_file.parse()
        markdown_ast = markdown(md_content)

        goref = collections.OrderedDict()

        after_comments_heading = False
        for node in markdown_ast:
            if node["type"] == "heading" and node.get('attrs', {}).get('level') == 2:
                heading = concat_children(node)
                if "title" not in goref:
                    goref["title"] = heading
                elif heading == "Comments":
                    after_comments_heading = True

            elif node["type"] == "paragraph":
                paragraph = concat_children(node)
                if not after_comments_heading:
                    if "description" in goref:
                        goref["description"] += f"\n{paragraph}"
                    else:
                        goref["description"] = paragraph
                else:
                    if "comments" not in goref:
                        goref["comments"] = []
                    goref["comments"].append(paragraph)

        for key in goref:
            try:
                goref[key] = goref[key].strip()
            except AttributeError:
                pass

        goref.update(yaml_content)
        goref.pop("layout", None)
        goref.move_to_end("id", last=False)

        all_gorefs.append(dict(goref))

    # export combined list of yamldown dicts compiled from all gorefs
    # and export to YAML

    def str_presenter(dumper, data):
        if '\n' in data or len(data) > 200:
            return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='>')
        return dumper.represent_scalar('tag:yaml.org,2002:str', data)
    yaml.representer.SafeRepresenter.add_representer(str, str_presenter)

    with open("gorefs.yaml", "w") as outfile:
        yaml.safe_dump(all_gorefs, outfile, encoding='utf-8', allow_unicode=True, sort_keys=False)
