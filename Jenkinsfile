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
        stash(name: 'zfin-gaf', includes: '*.gaf', useDefaultExcludes: true, excludes: '**')
      }
    }
    stage('Recover ZFIN GAF') {
      steps {
        unstash 'zfin-gaf'
        sh 'head pipeline/target/groups/zfin/zfin.gaf'
      }
    }
  }
}