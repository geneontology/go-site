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
  }
}