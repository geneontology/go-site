### 1. Get Linux
FROM ubuntu:18.04

RUN apt-get update -y

RUN apt-get install -y git curl make wget python3.6 python3-pip openjdk-11-jdk ca-certificates-java maven
RUN update-ca-certificates -f

RUN java --version

# Setup our software
WORKDIR /pipeline

RUN mkdir bin
RUN mkdir lib

# Gaferencer
RUN wget https://github.com/geneontology/gaferencer/releases/download/v0.4.1/gaferencer-0.4.1.tgz
RUN tar -xvf gaferencer-0.4.1.tgz
RUN cp gaferencer-0.4.1/bin/* bin/
RUN cp gaferencer-0.4.1/lib/* lib/

# Blazegraph Runner
RUN wget https://github.com/balhoff/blazegraph-runner/releases/download/v1.4/blazegraph-runner-1.4.tgz
RUN tar -xvf blazegraph-runner-1.4.tgz
RUN cp blazegraph-runner-1.4/bin/* bin/
RUN cp blazegraph-runner-1.4/lib/* lib/

# Arachne
RUN wget https://github.com/balhoff/arachne/releases/download/v1.0.2/arachne-1.0.2.tgz
RUN tar -xvf arachne-1.0.2.tgz
RUN cp arachne-1.0.2/bin/* bin/
RUN cp arachne-1.0.2/lib/* lib/

# OwlTool and Robot
WORKDIR tmp
RUN git clone https://github.com/owlcollab/owltools.git
WORKDIR owltools
RUN mvn -f OWLTools-Parent/pom.xml -U clean install -DskipTests -Dmaven.javadoc.skip=true -Dsource.skip=true
RUN cp OWLTools-Runner/target/owltools  /pipeline/bin/

WORKDIR ..
RUN git clone https://github.com/ontodev/robot.git
WORKDIR robot
RUN mvn org.apache.maven.plugins:maven-help-plugin:2.1.1:evaluate -Dexpression=project.version
RUN mvn -U clean package -DskipTests
RUN cp bin/* /pipeline/bin/

ENV PATH "/pipeline/bin:/pipeline/lib:$PATH"

RUN which pip3
RUN pip3 --version

WORKDIR /pipeline
ADD pipeline/requirements.txt .
ADD graphstore/rule-runner/ rule-runner/
RUN pip3 install -r requirements.txt
RUN pip3 install ./rule-runner/
