pipeline {
  agent any
  stages {
    stage('Hello') {
      steps {
        parallel(
          "Hello": {
            echo 'Hello, Pipeline.'
            
          },
          "Deng yi deng": {
            echo 'Dajai hao!'
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
    stage('Ready ZFIN GAF') {
      steps {
        build 'gaf-production'
      }
    }
  }
}