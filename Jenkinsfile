pipeline {
  agent any
  stages {
    stage('Hello') {
      steps {
        echo 'Hello, Pipeline.'
      }
    }
    stage('Ready OWLTools') {
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
    stage('Produce GAF') {
      steps {
        build 'gaf-production'
      }
    }
  }
}