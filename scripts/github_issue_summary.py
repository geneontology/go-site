import re
import requests
import json
import datetime
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('repo_name')
parser.add_argument('duration_in_days')


# TODO: Confirm this is working
def make_html_safe(s):
    s = re.sub(r'[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*', '', s)
    s = s.replace("&", '&amp;')
    s = s.replace("\"", '&quot;')
    s = s.replace(">", '&gt;')
    s = s.replace("<", '&lt;')
    return s


def print_single_issue(issue):
    line = f"<li><a href=\"{issue['html_url']}\">{issue['number']}</a> {make_html_safe(issue['title'])}</li>"
    print(line)


def print_issues(issues, event_type: str, printed_ids: set):
    to_prints = []
    printed_count = 0
    for issue in issues:
        if issue["number"] not in printed_ids:
            to_prints.append(issue)
            printed_count += 1
            printed_ids.add(issue["number"])
    print(f"<h3>{event_type} Tickets</h3>")
    if printed_count > 0:
        print(f"There are {printed_count} {event_type.lower()} tickets.")
        print("<ul>")
        [print_single_issue(i) for i in to_prints]
        print("</ul>")
    else:
        print(f"<p>There have been no {event_type.lower()} tickets.</p>")


def get_issues(repo: str, event_type: str, start_date: str):
    url = f"https://api.github.com/search/issues?q=repo:{repo}+{event_type}:=>{start_date}&type=Issues&per_page=100"
    resp = requests.get(url)
    if resp.status_code == 200:
        resp_objs = json.loads(resp.content)
        issues = resp_objs.get("items", [])
        return issues
    else:
        raise Exception(f"HTTP error status code: {resp.status_code} for url: {url}")


if __name__ == "__main__":
    # repo = "geneontology/go-ontology"
    # repo = "geneontology/amigo"
    args = parser.parse_args()
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(int(args.duration_in_days))

    new_issues = get_issues(args.repo_name, "created", yesterday)
    updated_issues = get_issues(args.repo_name, "updated", yesterday)

    print(f"<h2>Summary for tickets from {yesterday} to {today}</h2>")
    ids = set()
    print_issues(new_issues, "New", ids)
    print_issues(updated_issues, "Updated", ids)
