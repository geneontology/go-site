#!/bin/sh
####
#### Variables out to make cron job less confusing (and get GO_ROOT global).
####
#### Set for dev machine; change exported variables. 
####
export GO_CVS=/home/sjcarbon/local/src/cvs/go
export GO_ROOT=/home/sjcarbon/local/src/svn/geneontology/go-dev/trunk
export GOBO_ROOT=/home/sjcarbon/local/src/svn/geneontology/gobo-dbic
export PANTHER_NEWICK_PATH=/srv/www/htdocs/amigo/panther
export GO_DBNAME=go_latest_lite
export GO_DBHOST=localhost
$GO_ROOT/go-db-perl/scripts/go_db_install.pl -z -F -i -n -j -e $GO_DBNAME -v -d $GO_DBHOST; cd $GO_CVS/gene-associations/submission/paint; cvs update; find . -name "*.gaf" | xargs -I {} perl -I $GOBO_ROOT -I $GO_ROOT/go-db-perl -I $GO_ROOT/go-perl $GO_ROOT/go-db-perl/scripts/load-go-into-db.pl -datatype go_assoc -h $GO_DBHOST -d $GO_DBNAME {}
