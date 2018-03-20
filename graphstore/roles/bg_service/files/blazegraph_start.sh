#!/bin/bash

exec java -server -Xmx8g -Dbigdata.propertyFile=blazegraph.properties -jar jars/blazegraph-jar.jar
