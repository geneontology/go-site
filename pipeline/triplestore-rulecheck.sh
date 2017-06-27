#!/bin/bash
ENDPOINT=http://localhost:$1/blazegraph/sparql

function bg_start() {
    java -server -Xmx32g -Djetty.port=$1 -Djetty.overrideWebXml=conf/readonly_cors.xml -Dbigdata.propertyFile=conf/blazegraph.properties -cp target/jars/blazegraph-jar.jar:target/jars/jetty-servlets.jar com.bigdata.rdf.sail.webapp.StandaloneNanoSparqlServer &
}

bg_start $1
export BG_PID=$!
echo "Wait for blazegraph to start..."
sleep 3
sparta group $ENDPOINT --out target/rules.json
echo "Killing blazegraph on $BG_PID"
kill $BG_PID
