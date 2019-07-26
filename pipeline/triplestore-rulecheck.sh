#!/bin/bash
ENDPOINT=http://localhost:$1/blazegraph/sparql
JOURNAL=${2:-"target/blazegraph-internal.jnl"}
OUT=${3:-"target/rules.json"}

function bg_start() {
    java -server -Xmx32g -Djetty.port=$1 \
        -Djetty.overrideWebXml=conf/readonly_cors.xml \
        -Dbigdata.propertyFile=conf/blazegraph.properties \
        -Dcom.bigdata.journal.AbstractJournal.file=$JOURNAL \
        -cp target/jars/blazegraph-jar.jar:target/jars/jetty-servlets.jar com.bigdata.rdf.sail.webapp.StandaloneNanoSparqlServer &
}

bg_start $1
export BG_PID=$!
echo "Wait for blazegraph to start..."
sleep 3
echo "skip sparta for now..."
# $PY_ENV/bin/python3 $PY_ENV/bin/sparta group $ENDPOINT --out $OUT
echo "Killing blazegraph on $BG_PID"
kill $BG_PID
