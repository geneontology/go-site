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
    stage('Env test A') {
      steps {
        echo 'env'
        echo '$BRANCH_NAME'
      }
    }
  }
}