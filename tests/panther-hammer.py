####
#### Run as: python panther-hammer.py
####
#### Simple script to replicate issues at PANTHER: occasionally, the
#### same request will give *wildly* different answers and content
#### type.
####

import urllib2
import urllib

url = "http://pantherdb.org/webservices/go/overrep.jsp?ontology=biological_process&input=P31946%0AP62258%0AQ04917%0AP61981%0AP31947%0Abaxter%0AP27348%0AP63104%0AQ96QU6%0AQ8NCW5&species=HUMAN&correction=bonferroni&format=html"

## Build request.
values = {}
data = urllib.urlencode(values)
req = urllib2.Request(url, data)

## Loop for a very long time or until we replicate the issue.
first_run_p = True
for x in range(0, 100):

    ## Make attempt to contact server, fail.
    response = None
    try: response = urllib2.urlopen(req)
    except URLError as e:
        if hasattr(e, 'reason'):
            print('Failed to reach server: ', e.reason)
        elif hasattr(e, 'code'):
            print('Server error, code: ', e.code)
            assert True is False
    else:        
        ## Final
        pass

    content = response.read()
    if first_run_p :
        print "set basline"
        last_content = content
        first_run_p = False
    else:
        if content == last_content:
            ## Another loop.
            print "are the same: ", x
        else:
            print len(last_content), ' vs. ', len(content)
            print 'LAST: ', last_content
            print 'CURRENT: ', content
            exit(-1)
