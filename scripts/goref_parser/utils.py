import re


def get_html_string(tag, html):
    # regex to extract required strings
    reg_str = "<" + tag + ">(.*?)</" + tag + ">"
    res = re.findall(reg_str, html, re.DOTALL)

    return res


def merge_dicts(*dicts):
    super_dict = {}

    for d in dicts:
        super_dict.update(d)
        
    return super_dict