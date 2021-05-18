import re
import requests
import json
import datetime
import argparse
from pytz import timezone

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
    line = "<li><a href=\"{}\">{}</a> {}</li>".format(issue['html_url'], issue['number'], make_html_safe(issue['title']))
    print(line)


def print_issues(issues, event_type: str, printed_ids: set):
    to_prints = []
    printed_count = 0
    for issue in issues:
        if issue["number"] not in printed_ids:
            to_prints.append(issue)
            printed_count += 1
            printed_ids.add(issue["number"])
    print("<h3>{} Tickets</h3>".format(event_type))
    if printed_count > 0:
        print("There are {} {} tickets.".format(printed_count, event_type.lower()))
        print("<ul>")
        [print_single_issue(i) for i in to_prints]
        print("</ul>")
    else:
        print("<p>There have been no {} tickets.</p>".format(event_type.lower()))


def get_issues(repo: str, event_type: str, start_date: str):
    url = "https://api.github.com/search/issues?q=repo:{}+{}:=>{}+is:issue&type=Issues&per_page=100".format(repo, event_type, start_date)
    resp = requests.get(url)
    if resp.status_code == 200:
        resp_objs = json.loads(resp.content)
        issues = resp_objs.get("items", [])
        return issues
    else:
        raise Exception("HTTP error status code: {} for url: {}".format(resp.status_code, url))


if __name__ == "__main__":
    # repo = "geneontology/go-ontology"
    # repo = "geneontology/amigo"
    args = parser.parse_args()
    today_time = datetime.datetime.now(tz=timezone('US/Pacific'))
    yesterday_time = today_time - datetime.timedelta(int(args.duration_in_days))
    yesterday_time_str = yesterday_time.isoformat()

    # For display
    today = today_time.strftime("%Y-%m-%d")
    yesterday = yesterday_time.strftime("%Y-%m-%d")

    new_issues = get_issues(args.repo_name, "created", yesterday_time_str)
    updated_issues = get_issues(args.repo_name, "updated", yesterday_time_str)

    repo_name = args.repo_name
    if "/" in repo_name:
        repo_name = repo_name.rsplit("/", maxsplit=1)[-1]
    print("<h2>Summary for tickets in {} from {} to {}</h2>".format(repo_name, yesterday, today))
    ids = set()
    print_issues(new_issues, "New", ids)
    print_issues(updated_issues, "Updated", ids)
