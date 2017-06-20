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
  }
}