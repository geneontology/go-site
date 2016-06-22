Some scripts for running GO things in Jenkins.

# query-sf-for-new-terms.js

This is a node-ified version of Heiko's original.

To run from scratch, start by getting to this directory:

```
cd scripts/jenkins
npm install
node ./query-sf-for-new-terms.js
```

# query-github-for-new-terms.js

This is a node-ified version of Heiko's original.

To run from scratch, start by getting to this directory:

```
cd scripts/jenkins
npm install
node ./query-github-for-new-tickets.js
```

# create-annotation-summary-statistics.js

This is a node-ified version of Heiko's original.

To run from scratch, start by getting to this directory:

```
cd scripts/jenkins
npm install
node node ./create-annotation-summary-statistics.js -i /foo/bar/go_annotation_metadata.json -o /tmp/go_annotation_metadata.all.json
```
