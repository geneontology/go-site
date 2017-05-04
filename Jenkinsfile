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
        git(url: 'https://github.com/owlcollab/owltools.git', branch: 'master')
        build 'owltools-build'
      }
    }
  }
}