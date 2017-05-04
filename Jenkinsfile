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
        stash(name: 'pombase-gaf', includes: '**/pipeline/target/groups/pombase/*.gaf', useDefaultExcludes: true)
      }
    }
    stage('Recover PomBase GAF') {
      steps {
        unstash 'pombase-gaf'
        sh 'head pipeline/target/groups/pombase/pombase.gaf'
      }
    }
  }
}