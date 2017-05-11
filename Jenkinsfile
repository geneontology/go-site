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
            build 'skyhook-reset'
            
          }
        )
      }
    }
    stage('Ready production software') {
      steps {
        parallel(
          "Ready owltools": {
            build 'owltools-build'
            
          },
          "Ready robot": {
            build 'robot-build'
            
          }
        )
      }
    }
    stage('Produce ontology') {
      steps {
        build 'ontology-production'
      }
    }
    stage('Produce GAFs') {
      steps {
        build 'gaf-production'
      }
    }
    stage('TODO: Sanity I') {
      steps {
        echo 'TODO: sanity'

      }
    }
    stage('Produce derivatives') {
      steps {
        parallel(
          "Produce index": {
            echo 'TODO: index'
            
          },
          "Produce graphstore": {
            echo 'TODO: graphstore'
            
          }
        )
      }
    }
    stage('TODO: Sanity II') {
      steps {
        echo 'TODO: sanity'

      }
    }
    stage('Publish') {
      steps {
        parallel(
          "Ontology publish": {
            build 'ontology-publish'
            
          },
          "GAF publish": {
            build 'gaf-publish'
            
          }
        )
      }
    }
    stage('Deploy') {
      steps {
        echo 'TODO: deploy AmiGO'
      }
    }
    stage('TODO: Final status') {
      steps {
        echo 'TODO: final'

      }
    }
  }
}