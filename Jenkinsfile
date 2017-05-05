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
        node(label: 'generic') {
          sh 'wget -N http://build.berkeleybop.org/job/RDFox-CLI/lastSuccessfulBuild/artifact/target/universal/rdfox-cli.tgz && tar -xvf rdfox-cli.tgz '
          sh 'wget -N http://skyhook.berkeleybop.org/bin/owltools && chmod 755 owltools'
          dir(path: 'pipeline') {
            sh 'PATH=$PATH:$WORKSPACE:$WORKSPACE/rdfox-cli/bin/ OWLTOOLS_MEMORY=128G RDFOX_MEM=128G make clean'
            sh 'PATH=$PATH:$WORKSPACE:$WORKSPACE/rdfox-cli/bin/ OWLTOOLS_MEMORY=128G RDFOX_MEM=128G make test'
            sh 'PATH=$PATH:$WORKSPACE:$WORKSPACE/rdfox-cli/bin/ OWLTOOLS_MEMORY=128G RDFOX_MEM=128G extra_files'
            sh 'PATH=$PATH:$WORKSPACE:$WORKSPACE/rdfox-cli/bin/ OWLTOOLS_MEMORY=128G RDFOX_MEM=128G  all_pombase'
          }
          
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