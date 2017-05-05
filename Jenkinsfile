pipeline {
  agent any
  stages {
    stage('Hello') {
      steps {
        echo 'Hello, Pipeline.'
      }
    }
    stage('Ready early software') {
      steps {
        parallel(
          "Ready OWLTools": {
            build 'owltools-build'
            
          },
          "Ready RDFox": {
            build 'rdfox-cli-build'
            
          }
        )
      }
    }
    stage('Produce GAFs') {
      steps {
        build 'gaf-production'
      }
    }
  }
}