####
#### Examples:
####
#### Produce full report; aka summary email contents
####   python3.6 ./scripts/github_issue_summary.py geneontology/go-ontology 7
#### Produce just summary; aka summary email title
####   python3.6 ./scripts/github_issue_summary.py geneontology/go-ontology 7 --summary_only true
####

import re
import requests
import json
import datetime
import argparse
from pytz import timezone

parser = argparse.ArgumentParser()
parser.add_argument('repo_name')
parser.add_argument('duration_in_days')
parser.add_argument('-t', '--todays_date', help="Override the date to start 'looking back' from. Date must be in ISO "
                                                "format e.g. '2022-08-16'")
parser.add_argument('-s', '--summary_only', help="only output the summary; useful for titles")

collected_issues = []
new_printed_count = 0
updated_printed_count = 0

# TODO: Confirm this is working
def make_html_safe(s):
    s = re.sub(r'[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*', '', s)
    s = s.replace("&", '&amp;')
    s = s.replace("\"", '&quot;')
    s = s.replace(">", '&gt;')
    s = s.replace("<", '&lt;')
    return s


def print_single_issue(issue):
    line = "<li><a href=\"{}\">{}</a> {}</li>".format(issue['html_url'], issue['number'],
                                                      make_html_safe(issue['title']))
    return line


def collect_issues(issues, event_type: str, printed_ids: set):
    global new_printed_count
    global updated_printed_count
    global collected_issues

    printed_count = 0
    to_prints = []

    for issue in issues:
        if issue["number"] not in printed_ids:
            to_prints.append(issue)
            printed_count += 1
            printed_ids.add(issue["number"])
    collected_issues.append("<h3>{} Tickets</h3>".format(event_type))
    if printed_count > 0:
        collected_issues.append("There are {} {} tickets.".format(printed_count, event_type.lower()))
        collected_issues.append("<ul>")
        [collected_issues.append(print_single_issue(i)) for i in to_prints]
        collected_issues.append("</ul>")
    else:
        collected_issues.appent("<p>There have been no {} tickets.</p>".format(event_type.lower()))
    if event_type == "New":
        new_printed_count = printed_count
    else:
        updated_printed_count = printed_count

def get_issues(repo: str, event_type: str, start_date: str):
    url = "https://api.github.com/search/issues?q=repo:{}+{}:=>{}+is:issue&type=Issues&per_page=100".format(repo,
                                                                                                            event_type,
                                                                                                            start_date)
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
    if args.todays_date:
        try:
            today_time = datetime.datetime.strptime(args.todays_date, '%Y-%m-%d')
        except ValueError:
            raise ValueError("Incorrect data format, todays_date should be YYYY-MM-DD")
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
    ids = set()
    collect_issues(new_issues, "New", ids)
    collect_issues(updated_issues, "Updated", ids)

    if args.summary_only:
        print("Summary for tickets ({} new, {} updated) in {} from {} to {}".format(new_printed_count, updated_printed_count, repo_name, yesterday, today))
    else:
        print("<h2>Summary for tickets ({} new, {} updated) in {} from {} to {}</h2>".format(new_printed_count, updated_printed_count, repo_name, yesterday, today))
        for c in collected_issues:
            print(c)
