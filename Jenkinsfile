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
        node(label: 'node') {
          build 'gaf-production'
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