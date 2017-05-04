pipeline {
  agent any
  stages {
    stage('Hello') {
      steps {
        parallel(
          "Hello, Pipeline!": {
            echo 'Hello, Pipeline.'
            
          },
          "Pre-step": {
            sh '''## Experimental stanza to support mounting the sshfs using the "hidden"
## skyhook identity.
mkdir -p $WORKSPACE/mnt/ || true
sshfs -oStrictHostKeyChecking=no -o IdentitiesOnly=true -o IdentityFile=$SKYHOOK_IDENTITY -o idmap=user skyhook@skyhook.berkeleybop.org:/home/skyhook $WORKSPACE/mnt/

## Copy the product to the right location.
mkdir -p $WORKSPACE/mnt/bin/ || true

date > $WORKSPACE/mnt/date.txt

## Bail on the filesystem.
fusermount -u $WORKSPACE/mnt/
'''
            
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
        stash(name: 'zfin-gaf', includes: 'pipeline/target/groups/zfin/zfin.gaf')
      }
    }
  }
}