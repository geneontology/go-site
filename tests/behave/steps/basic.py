####
#### Basic functions for checking external data resources.
####

from behave import *
import urllib2
import urllib
import json
import jsonpath_rw

## The basic and critical remote collector.
## It defines:
##  context.code
##  context.content_type
##  context.content
##  context.content_length
@given('I collect data at URL "{url}"')
def step_impl(context, url):

    ## Build request.
    values = {}
    data = urllib.urlencode(values)
    req = urllib2.Request(url, data)

    ## Make the attempt, fail.
    response = None
    try: response = urllib2.urlopen(req)
    except urllib2.URLError as e:
        if hasattr(e, 'code'):
            print('Server error, code: ', e.code)
        if hasattr(e, 'reason'):
            print('Failed to reach server: ', e.reason)
        assert True is False
    else:        
        ## Final
        pass

    ## Parcel out what we have for downstream checking.    
    context.code = response.code
    ## https://docs.python.org/2/library/mimetools.html#mimetools.Message
    context.content_type = response.info().gettype()
    context.content = response.read()
    context.content_length = 0
    if context.content :
        context.content_length = len(context.content)

@then('the content type should be "{ctype}"')
def step_impl(context, ctype):
    if not context.content_type :
        ## Apparently no content type at all...
        assert True is False
    else:
        assert context.content_type == ctype

@then('the content should contain "{text}"')
def step_impl(context, text):
    if not context.content :
        ## Apparently no text at all...
        assert True is False
    else:
        assert context.content.rfind(text) != -1

## Adds:
##  context.content_json
@when('the content is converted to JSON')
def step_impl(context):
    if not context.content :
        ## Apparently no text at all...
        assert True is False
    else:
        context.content_json = json.loads(context.content)

@then('the JSON should have the top-level property "{prop}"')
def step_impl(context, prop):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        assert context.content_json.get(prop)

@then('the JSON should have the JSONPath "{jsonpath}"')
def step_impl(context, jsonpath):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        jsonpath_expr = jsonpath_rw.parse(jsonpath)
        res = jsonpath_expr.find(context.content_json)
        #assert len(res) > 0
        #print(res)
        assert res

@then('the JSON should have JSONPath "{jsonpath}" equal to string "{value}"')
def step_impl(context, jsonpath, value):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        jsonpath_expr = jsonpath_rw.parse(jsonpath)
        res = jsonpath_expr.find(context.content_json)
        if not res[0] :
            assert True is False
        else: 
            assert res[0].value == value

@then('the JSON should have JSONPath "{jsonpath}" equal to float "{value}"')
def step_impl(context, jsonpath, value):
    if not context.content_json :
        ## Apparently no JSON at all...
        assert True is False
    else:
        jsonpath_expr = jsonpath_rw.parse(jsonpath)
        res = jsonpath_expr.find(context.content_json)
        if not res[0] :
            assert True is False
        else: 
            assert res[0].value == float(value)
