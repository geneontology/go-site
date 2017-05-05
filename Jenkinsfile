pipeline {
  agent any
  stages {
    stage('Hello') {
      steps {
        parallel(
          "Hello, Pipeline!": {
            echo 'Hello, Pipeline.'
            
          },
          "Nihao": {
            echo 'Daijia Hao'
            sleep 5
            
          }
        )
      }
    }
    stage('Ready OWLTools') {
      steps {
        build 'owltools-build'
      }
    }
    stage('Ready PomBase GAF') {
      steps {
        dir(path: 'pipeline') {
          sh 'wget -N http://build.berkeleybop.org/job/RDFox-CLI/lastSuccessfulBuild/artifact/target/universal/rdfox-cli.tgz && tar -xvf rdfox-cli.tgz && wget -N http://skyhook.berkeleybop.org/bin/owltools && chmod 755 owltools && export PATH=$PATH:$WORKSPACE:$WORKSPACE/rdfox-cli/bin/ && export OWLTOOLS_MEMORY=128G && export RDFOX_MEM=128G && make clean && make test && make extra_files && make all_pombase'
          stash(name: 'pombase-gaf', includes: '**')
        }
        
      }
    }
    stage('Recover PomBase GAF') {
      steps {
        unstash 'pombase-gaf'
        sh 'ls -AlF'
        sh 'ls -AlF pipeline'
        sh 'ls -AlF pombase-gaf'
      }
    }
  }
}