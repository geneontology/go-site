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
    stage('Ready ZFIN GAF') {
      steps {
        build 'gaf-production'
        stash(name: 'pombase-gaf', useDefaultExcludes: true)
      }
    }
    stage('Recover PomBase GAF') {
      steps {
        unstash 'pombase-gaf'
        sh 'ls -AlF'
        sh 'ls -AlF pipeline'
        sh 'ls -AlF pipeline/target'
        sh 'ls -AlF pipeline/target/groups'
        sh 'ls -AlF pipeline/target/groups/pombase'
      }
    }
  }
}