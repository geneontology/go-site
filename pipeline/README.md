

# GO Pipeline "Mega" step

Everything in this directory corresponds to the "Produce GAFs, TTLs, and journal (mega-step)"
in the Jenkins pipeline step, located here https://build.geneontology.org/job/geneontology/job/pipeline/job/snapshot/

## Overview

The Makefile:

 * Gathers external contributed files (GAFs, GPADs, ...)
    * The locations of these are stored in [yaml metadata files](../metadata/datasets)
    * Groups can provide GAF or GPAD+GPI
 * Performs filtering and checking
    * We use an adapted version of "Mike's script", see [util/](util)
    * Afterwards runs owltools checks and inferences
 * Generates filtered files and derived files
    * GPAD, GAF and GPI
    * RDF for direct loading into blazegraph
    
### Role in the Pipeline

The Pipeline is controlled by a Jenkinsfile in https://github.com/geneontology/pipeline
which is picked up by our Jenkins machine. This is one of the larger, main steps. 

Before the the Makefile is run the Pipeline will:
1. Produce all software
2. Build the Gene Ontology (https://github.com/geneontology/go-ontology/)
3. Download Annotation data used by this step
4. Using the GO-CAM models made in Noctua, produce GPADs

The Makefile's primary function here is to then run ontobio on all the annotation
GAF files, produce reports, and validate the GAF, bundling them for final release.

Afterward, the Pipeline will perform some sanity checks on the produced data,
load Amigo, and publish the data.

## Jenkins Jobs

 * https://build.geneontology.org/job/geneontology/job/pipeline/


## Environment and Requirements

The pipeline/environment.sh script can be used to setup the environment locally before the makefile
is run. Use `source` to run the script:

    source environment.sh

or

    . environment.sh
    
This creates a python virtual environment in the `target` directory, `source`s the 
activate script, and then installs all python dependencies listed in `requirements.txt`.

### Robot

1. You will need [robot](https://github.com/ontodev/robot/) in your path.
    You can get the latest release on the github page, or build it yourself locally.
    Read the installation instructions at http://robot.obolibrary.org/. Both the 
    JAR and the execution script should be on the PATH.
    
2. To add to to your PATH variable:


    export PATH=/path/to/robot:$PATH

3. You can verify that it's added by running `robot --version`

_Optional and Advanced setup: If you develop on robot, or build it locally, you
    can make a symlink to the robot script in this directory and then adding this
    directory to your PATH: `export PATH=$(pwd):$PATH`._

### Owltools

1. The github page for owltools is https://github.com/owlcollab/owltools/

2. Download a release here: https://github.com/owlcollab/owltools/releases

3. Ensure that the owltools binary is set to executable (`chmod +x owltools`)
    and that it's in the PATH (like for ROBOT above)
    

### Gaferencer

1. Download the latest release here: https://github.com/geneontology/gaferencer/releases

2. Unpack the tar

3. Ensure gaferencer is on the PATH as in above
    

## The Mega Makefile

The makefile is fairly complicated, so what follows in this section is a breakdown
of all the moving parts. This assumes some existing familiarity with `make` and
Makefiles. For an introduction, see https://www.gnu.org/software/make/manual/make.html#Introduction

For quick reference of constructs commonly used here:

- `$@`: Special variable meaning the name of the target of the rule
    
- `$>:` Special variable meaning the first prerequisite of the rule

- `%`: The 'stem' of a pattern rule: See https://www.gnu.org/software/make/manual/html_node/Pattern-Intro.html#Pattern-Intro

- `$*`: The stem that is matched for pattern rule. For example if the target is
`%-foo`, and make was run with `make hello-foo`, then `$*` would be `hello`.

These are coverend in the "Automatic Variables" section of the make manual: https://www.gnu.org/software/make/manual/html_node/Automatic-Variables.html

### Ontology

For the steps involving ontobio, the JSON format of the Gene Ontology is used.

    target/go-ontology.json:
        wget --no-check-certificate $(ONTOLOGY) -O $@.tmp && mv $@.tmp $@ && touch $@
        
It's named `go-ontology.json` by ontobio convention.

We also download go-gaf.owl for reasoning later on:

    $(GAF_OWL):
        wget --no-check-certificate $(OBO)/go/snapshot/extensions/go-gaf.owl -O $@.tmp && mv $@.tmp $@ && touch $@

### Validating and Reporting with Ontobio

Ontobio is a python project that does a few things, but for the pipeline is the 
main GAF annotation validation and reporting system. The github project is here:
https://github.com/biolink/ontobio

Ontobio takes input source GAFs defined in go-site/metadata/datasets/<group>.yaml,
downloads the source GAFs (if not present already) and using the `go-ontology.json`
file from above, reasoned output from Gaferencer, and various bits of other metadata
in the metadata directory:
1. Validates each GAF file
2. Produces the final release GAF file in addition to GPAD, GPI, and TTL
3. Generates reports for issues found in each file processed.

#### Groups and Datasets

A **Group** is an organization that provides us with GAF files to process. Often
these are model organism database groups. There are also sometimes called 
Resource Groups. Each YAML file in `datasets` represents the metadata for a single
**group**.

A **Dataset** is a resource file specified _in_ the group metadata. Most groups have 
more than one **datasets**. These include sources of GAF, GPI, and GPAD, and others. 
Each dataset definition includes things like the name of the dataset, file type,
and where to download the source file.

- So **Groups** have _many_ **datasets**.


#### GAF Validation with Ontobio and Owltools

Ontobio works on **groups**, but the Makefile works on individual files (**datasets**). 
So much of the Makefile strangeness comes from this mismatch.

Targets that run ontobio take the form:

    make target/groups/<group>/<group>.group
    
The `<group>.group` file is just a signal file that shows that the group has
been processed. This sets up targets for any single dataset group. This runs
only ontobio.

##### Variables and recipes that control and orchestrate GAF validation

To validate all GAFs, the `target/gafs.touch` target is used. This has a dependency
on all individual group targets, so make will validate each group as the above target
before running `target/gafs.touch`. This is again a signal file.

Let's examine the prerequisite part of the rule:

    $(foreach group,$(RESOURCE_GROUPS),target/groups/$(group)/$(group).group)
    
This will make a list of paths for each resource defined in `RESOURCE_GROUPS`

**RESOURCE_GROUPS** defines the list of groups that the Makefile should act on.
Normally, this works by reading the datasets directory file and finding the names 
of each YAML file directly:

    RESOURCE_GROUPS ?= $(foreach path,$(shell find $(METADATA_DIR)/datasets -name '*.yaml'),$(basename $(notdir $(path))))
    
This will: for each yaml file in the datasets dirctory, remove the directory path,
leaving only the filename (`notdir`) and then strip off the extension (`basename`).
This leaves us with a list of all filenames in the datasets directory.

To see how all make functions work, see https://www.gnu.org/software/make/manual/html_node/Functions.html

Note also that we set the `RESOURCE_GROUPS` with `?=`. This will allow us to override
the computed value with one in the environment. If Make sees a defined `RESOURCE_GROUPS`
then it will use that instead of the above command. 

Read about make variable setting here: https://www.gnu.org/software/make/manual/html_node/Setting.html#Setting

##### Dataset Exclusions



The recipe is this:

    .PRECIOUS: %.gaf.gz
    %.group: target/go-ontology.json # %.gaferences.json
    	mkdir -p $(dir $*) 
    	$(eval group := $(lastword $(subst /, ,$*)))
    	validate.py produce $(group) --gpad --ttl -m $(METADATA_DIR) --target target/ --ontology $< $(DONT_VALIDATE) $(SUPPRESS_THESE_TAGS) --skip-existing-files --gaferencer-file $*.gaferences.json
    	touch $@
        
The target being run here will end up being target/groups/



## Status

Active

## The Makefile

The Makefile here is how the largest step of the Jenkins pipeline

For context: see https://github.com/geneontology/go-site/issues/209
