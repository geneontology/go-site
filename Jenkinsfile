pipeline {
  agent any
  stages {
    stage('Initialize') {
      steps {
        parallel(
          "Initialize": {
            echo 'Hello, Pipeline.'
            
          },
          "Reset": {
            build 'shkyhook-reset'
            
          }
        )
      }
    }
    stage('Ready production software') {
      steps {
        build 'owltools-build'
      }
    }
    stage('Produce GAFs') {
      steps {
        build 'gaf-production'
      }
    }
  }
}