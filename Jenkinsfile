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
          sh 'make clean && make test && make extra_files && make all_pombase'
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