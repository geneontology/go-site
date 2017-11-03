"""
Example AWS Lambda passthrough for creating issues on GitHub,
assuming that we have the GitHub API key somewhere in the environment.
"""
####
#### WARNING: This in not packagable/deployable as-is--this is a
#### hardcopy of something that was edited somewhat directly in the
#### AWS Lambda editor, but taken out for easier testing--to recreate,
#### copy and paste this into a new lambda function.
####

import json
import os
## Not using requests as I don't want to bother learning the packaging
## system for Lambda, so just straight runtime.
#import requests
import urllib.parse
import urllib.request

def lambda_handler(event, context):
    """Named as run--a single easy function."""

    ret = "{}"

    if event.get('body', False):
        #print("have incoming body")

        ## Things we need to proceed: body.
        body = json.loads(event['body'])
        gh_issue_body = body.get('body', None)
        gh_issue_title = body.get('title', None)

        ## As well, an API key.
        ghapi = os.environ.get('GHAPI', False)
        #print("have ghapi: " + ghapi)

        if not gh_issue_title or not gh_issue_body or not ghapi:
            pass
        else:

            ##
            headers = {'Accept': 'application/json', \
                       'User-Agent': \
                       'Experimental AWS Lambda GO Helpdesk Agent 0.0.1', \
                       'Authorization': 'token ' + ghapi}
            trgt = 'https://api.github.com/repos/kltm/request-annotation/issues'
            data = {'title': gh_issue_title, 'body': gh_issue_body}
            # resp = requests.post(trgt, \
                #                      data=data, \
                #                      headers=headers, \
                #                      stream=False)
            outdata = json.dumps(data).encode('utf8')
            req = urllib.request.Request(trgt, outdata, headers)
            okay_p = False
            try:
                resp = urllib.request.urlopen(req)
                okay_p = True
            except urllib.error.HTTPError as err:
                print(err.code)
                print(err.read().decode())

            #if resp.status_code == 200:
            #print('good return: ' + str(resp.status))
            if okay_p and (resp.status == 200 or resp.status == 201):
                #print('good return')
                ret = json.loads(resp.read().decode('utf8'))
                print(ret)

    return ret

if __name__ == '__main__':

    test_event = {
        "body": "{\"title\":\"Foo Title\", \"body\":\"Bar body.\"}",
        "queryStringParameters": {
            "foo": "bar"
        },
        "httpMethod": "POST",
        "stageVariables": {
            "baz": "qux"
        },
        "path": "/path/to/resource"
    }

    lambda_handler(test_event, {})
