####
#### Invocation examples:
####
#### Dump GAF-like direct annotation TSVs into /tmp, scanning geneontology/go-ontology titles for the last seven days:
####
####   python3.6 ./scripts/annotation-review-report.py geneontology/go-ontology 7 --output /tmp --verbose
####

import logging
import sys
import re
import requests
import json
import datetime
import argparse
from pytz import timezone

## Logger basic setup w/killer error.
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger('annotation-review-report')
LOG.setLevel(logging.WARNING)
def die_screaming(instr):
    """Make sure we exit in a way that will get Jenkins's attention."""
    LOG.error(instr)
    sys.exit(1)

parser = argparse.ArgumentParser()
parser.add_argument('repo_name')
parser.add_argument('duration_in_days')
parser.add_argument('-t', '--todays_date', help="Override the date to start 'looking back' from. Date must be in ISO format e.g. '2022-08-16'")
parser.add_argument('-o', '--output',  help='Output directory')
parser.add_argument('-v', '--verbose', action='store_true', help='More verbose output')

collected_issues = []
new_printed_count = 0
updated_printed_count = 0

##
## TODO: Confirm this is working
def make_html_safe(s):
    s = re.sub(r'[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*', '', s)
    s = s.replace("&", '&amp;')
    s = s.replace("\"", '&quot;')
    s = s.replace(">", '&gt;')
    s = s.replace("<", '&lt;')
    return s


## Append to global variable, including print information.
def collect_issues(issues, event_type: str, printed_ids: set):

    for issue in issues:
        if re.match("GO:[0-9]+", issue['title']):
            matches = re.findall("GO:[0-9]+", issue['title'])
            for m in matches:
                #print(m)
                collected_issues.append(m)

## Pull issues from GH.
def get_issues(repo: str, event_type: str, start_date: str):
    url = "https://api.github.com/search/issues?q=repo:{}+{}:=>{}+is:issue&type=Issues&per_page=100".format(repo, event_type, start_date)
    resp = requests.get(url)
    if resp.status_code == 200:
        resp_objs = json.loads(resp.content)
        issues = resp_objs.get("items", [])
        return issues
    else:
        raise Exception("HTTP error status code: {} for url: {}".format(resp.status_code, url))

## Get Annotation TSV from GOlr.
def get_term_annotation_data(term: str):
    url = "http://golr-aux.geneontology.io/solr/select?defType=edismax&qt=standard&indent=on&wt=csv&rows=100000&start=0&fl=source,bioentity_internal_id,bioentity_label,qualifier,annotation_class,reference,evidence_type,evidence_with,aspect,bioentity_name,synonym,type,taxon,date,assigned_by,annotation_extension_class,bioentity_isoform&facet=true&facet.mincount=1&facet.sort=count&json.nl=arrarr&facet.limit=25&hl=true&hl.simple.pre=%3Cem%20class=%22hilite%22%3E&hl.snippets=1000&csv.encapsulator=&csv.separator=%09&csv.header=false&csv.mv.separator=%7C&fq=annotation_class:%22{}%22&fq=document_category:%22annotation%22&q=*:*".format(term)
    resp = requests.get(url)
    if resp.status_code == 200:
        resp_tsv = resp.text
        return resp_tsv
    else:
        raise Exception("HTTP error status code: {} for url: {}".format(resp.status_code, url))

## Start.
if __name__ == "__main__":

    args = parser.parse_args()

    ## Verbose messages or not.
    if args.verbose:
        LOG.setLevel(logging.INFO)
        LOG.info('Verbose: on')

    if not args.output:
        die_screaming('need an output directory')
    LOG.info('Will output to: ' + args.output)

    ## Get date/time for GH interactions/filtering.
    today_time = datetime.datetime.now(tz=timezone('US/Pacific'))
    if args.todays_date:
        try:
            today_time = datetime.datetime.strptime(args.todays_date, '%Y-%m-%d')
        except ValueError:
            raise ValueError("Incorrect data format, todays_date should be YYYY-MM-DD")
    yesterday_time = today_time - datetime.timedelta(int(args.duration_in_days))
    yesterday_time_str = yesterday_time.isoformat()

    ## Get times/dates for display.
    today = today_time.strftime("%Y-%m-%d")
    yesterday = yesterday_time.strftime("%Y-%m-%d")

    ## Pull in created and updated issues.
    new_issues = get_issues(args.repo_name, "created", yesterday_time_str)
    updated_issues = get_issues(args.repo_name, "updated", yesterday_time_str)

    ## Filter and sort the items in global collected_issues([]).
    repo_name = args.repo_name
    if "/" in repo_name:
        repo_name = repo_name.rsplit("/", maxsplit=1)[-1]
    ids = set()
    collect_issues(new_issues, "New", ids)
    collect_issues(updated_issues, "Updated", ids)

    ## DEBUG:
    #collected_issues = ['GO:0030234', 'GO:0048478', 'GO:0031508']

    ## Print out reports.
    for t in collected_issues:
        LOG.info(t)

        ## Final writeout to files of the same name as the term.
        outfile = args.output + '/' + t.replace(':','_')+ '.tsv'
        LOG.info('output to file: ' + outfile)
        with open(outfile, 'w+') as fhandle:
            fhandle.write(get_term_annotation_data(t))
