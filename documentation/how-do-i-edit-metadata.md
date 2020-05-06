
## How do I edit the metadata for my resource?

Previously the only way to change the metadata for your ontology was
report it to GO central and have them work with you. You are still
welcome to do this, but with our public GitHub-based system you can
now do this yourself.

You will first need an account on [GitHub](http://github.com).

See below for a tutorial. If you are already familiar with GitHub and
forks and pull requests, here is how the GO resource metadata works.

Each resource has its own file in GitHub called `RESOURCE.yaml`, where
RESOURCE is the internal id for your resource.

## Gorey details

### YAML Metadata

The YAML for your resource may look something like this (example based
on WormBase):

```yaml
id: wb
label: WormBase database of nematode biology
description: "GO data for WormBase database of nematode biology"
project_name: "WormBase"
contact_email: "help@foo.org"
project_url: "http://www.wormbase.org/"
funding_source: "US National Institutes of Health, UK Medical Research Council, UK Biotechnology and Biological Sciences Research Council"
email_report: "foo@bar.edu,bar@foo.edu"
datasets:
 -
   id: wb.gaf
   label: "wb gaf file"
   description: "gaf file for wb from WormBase database of nematode biology"
   url: http://current.geneontology.org/annotations/wb.gaf.gz
   type: gaf
   dataset: wb
   submitter: wb
   compression: gzip
   source: ftp://ftp.wormbase.org/pub/wormbase/species/c_elegans/PRJNA13758/annotation/go_annotations/c_elegans.PRJNA13758.current.go_annotations.gaf.gz
   entity_type:
   status: active
   species_code: Cele
   taxa:
    - NCBITaxon:6239
```

*TODO* link to doc for properties

A few key properties to be aware of:

* *source* - the upstream location of the data to be downloaded and processed by the GO pipeline

 <!-- * *layout* - this is not actually metadata about the ontology but controls how the page is displayed. You should not mess with this unless you are a web style guru. -->
 <!-- * *id* - this should not be touched. Your ontology id is fixed in the system by OBO administrators at time of registration and should never be changed. Contact the OBO team if you have a valid reason for changing this. See [ID Policy](../id-policy.html) -->
 <!-- * *title* - a *short* name for your ontology - this is typically the spelling out of your ontology acronym. -->
 <!-- * *description* - a short one line description of your ontology. It should state concisely what the contents of the ontology are. Don't write this like a paper abstract. You can be more verbose in the custom section below -->
 <!-- * *tracker* - typically a GitHub issues url -->

### Pull Request Pipeline

Any user can make propsed changes to any RESOURCE.yaml file. These
remain on their fork until approved by GO administrators.

For information purposes, the workflow is:

 1. An automated Travis job will run to validate your changes
 2. If it failed the Travis check, it will not be accepted
 3. A GO administrator will evaluate your PR
 4. If the the GO administrator rejects, it they will provide feedback in the comment form which you can use to inform edits and corrections
 5. More likely, the change will be accepted by the GO administrator; they will click "merge" and the changes will be visible in a few seconds
 6. Pipeline runs, starting at midnight, will now reflect this updated metadata

## Pull Request Tutorial

This is a walk through of how a pull request works, featuring the
GitHub user @kittens (who maintains the GO resource "wb") and
the GO administrator @cmungall.

### Getting Started

@kittens navigates to the [page with their resource](https://github.com/geneontology/go-site/blob/master/metadata/datasets/wb.yaml), in this case "wb".

<!-- <img style="border: 2px solid black" alt="s1" width="50%" src="/images/eo-example-s1.png"/> -->

<!-- ### Editing metadata: first create a fork -->

The user can click on the "Edit" button from the GitHub page (a
pencil), this will take them to a web-based editor for their metadata.

When this button is clicked, you will get a banner like:

```text
You’re editing a file in a project you don’t have write access to.
Submitting a change to this file will write it to a new branch in your fork kittens/go-site, so you can send a pull request.
```

This means you're on the right track.

(Note that users that already have direct edit privileges will not see
this banner and have a slightly different workflow. If you have this
ability and don't know what to do, please contact one of the GO
administrators.)

<!-- As a first step, the user will be asked to "Fork this -->
<!-- repository". This is to prevent any random GitHub user for making -->
<!-- unwanted changes. The changes will exist only on the user's fork until -->
<!-- approved by OBO admins: -->

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s3.png"/> -->

<!-- You don't need to worry about details here. Just click the big green button to fork! -->

<!-- You will only ever need to do this step once. -->

### Editing metadata: web based editing

You will now be placed into a web-based editor. Edit the file as you
want.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s4.png"/> -->

<!-- At this time eo has a relatively minimal freeform -->
<!-- description. For now we will focus on the yaml. -->

<!-- The tracker entry in the yaml above is for sourceforge. The -->
<!-- @kittens has migrated their tracker from sourceforge to GitHub, -->
<!-- so they now want to change this: -->

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s5.png"/> -->

Don't worry too much about making mistakes at this stage - as we'll
see later the system will prevent syntax errors from making it into
the system, and a friendly GO admin will double-check what you've
done.

If you're still nervous, you can click "Preview changes".

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s6.png"/> -->

Once you're happy you can propose the change by clicking on the green
"Propose file change" button at the bottom of the page. Filling in a
title and message to go with your change optional, but we recommend
doing it. After this you will be taken to a page for comparing your
version and the previous version.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s7.png"/> -->

### Comparing changes

Here you can see your changes once again (this time on the raw source):

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s8.png"/> -->

If it all looks good, click the big green button that says "Create
pull request" to make a PR!

### Open a pull request

Almost there! You can make any additional comments on this page if you
have not already done so. Similar to the last page, you will again
click the big green button that says "Create pull request" to finalize
it.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s9.png"/> -->

### Automated validation by Travis

If all goes well, you soon will get a green checkbox to indicate that
you created a well-structured PR (i.e. passing the Travis checks).

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s10.png"/> -->

<!-- You may see a message that the check is in progress - it should only -->
<!-- take a few seconds for it to finish. -->

Read later on for more on what happens if this step fails.

### Merging of PRs by GO administrators

@kittens now has to wait a bit for changes to become live.

Soon, GO admin @cmungall comes along and examines the PR.
<!-- This is what my view looks like: -->

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s11.png"/> -->

@cmungall vets your changes, and most likely these should be fine, in which case they will merge.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s12.png"/> -->

The change is then reflected within seconds on the main site.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s13.png"/> -->

<!-- (note that changes will not be immediately visible in the front -->
<!-- table. The OBO admin will need to regenrate metadata for this) -->

### What happens with mistakes?

Now let's work through an example of what happens when a user makes a
syntax error when editing their metadata.

From [the wb
page](https://github.com/geneontology/go-site/blob/master/metadata/datasets/wb.yaml),
the user clicks the edit button, and enters some bad text or data.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s14.png"/> -->

They go through the same steps as before, except now when they get to
the automatic validation page they get a big red mark next to their
change.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s15.png"/> -->

You can click on "details" to see the report. This takes you to the
Travis website. Scroll down to see the error message.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s16.png"/> -->

Sometimes these may be a bit cryptic, but you should get the idea. If
this is too geeky, a GO administrator can help you if you get
stuck--the GO administrators will be able to see the failed PRs and
may contact you with friendly advice.

<!-- This is what it looks like from -->
<!-- @cmungall's end: -->

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s17.png"/> -->

A GO administrator will in general not merge a PR that fails the Travis
checks.

There are a few things to do here. You can just sit back and wait for
advice. Or, you can proactively go back and make further changes to
fix your error. The patter is certainly the more expedient path.

Alternatively, if you want to abort and start again you can easily do
this. You may want to close your PR (click "Close and comment"). You
can optionally leave a message. Finally delete your branch.

<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s18.png"/> -->


<!-- <img style="border: 2px solid black" alt="s" width="50%" height="50%" src="/images/eo-example-s19.png"/> -->

## Happy? Confused?

If this seems bewildering, don't worry. The PR mechanism is optional
you can always ask GO administrators to make any changes for you, via
email or the tracker (https://github.com/geneontology/helpdesk).
