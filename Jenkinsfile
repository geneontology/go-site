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