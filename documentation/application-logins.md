## Getting and Administering Gene Ontology Application Logins

* Context
* Relevant GitHub tickets
* How does it work?
  * Example stanza
* How do I login?
* What if it doesn’t work?
* FAQs

### Context:

The Persona login system was used by TermGenie (TG) and Noctua to
authenticate users. However Persona has been retired
[as of November 30th, 2016](https://developer.mozilla.org/en-US/Persona). Consequently
the GO software team (with help from Heiko Dietze) has migrated the
login infrastructure for these applications towards using GitHub.

### Relevant GitHub Tickets

- https://github.com/geneontology/go-site/issues/148
- https://github.com/geneontology/termgenie/issues/98
- https://github.com/geneontology/noctua/issues/270
- https://github.com/geneontology/go-ontology/issues/12795

### How does it work?

Both Noctua and TermGenie now authenticate users via their GitHub
credentials. To do so, they read the
[users.yaml](https://github.com/geneontology/go-site/blob/master/metadata/users.yaml)
that is used by applications written for the GO to coordinate user
information.

To work properly, an entry for a TermGenie-only should minimally include the
following stanzas:

* <b>uri</b> the unique identifier for a user
* <b>nickname</b> the common name for the user
* <b>authorizations</b> indicate the various access levels
  * <b>termgenie-go</b> for TermGenie login
    * <b>allow-write</b> to allow creation of new terms using the templates
    * <b>allow-review</b> to enable access to the commit review interface (typically for GO editors)
    * <b>allow-freeform</b> to enable access to TG free form
  * <b>noctua</b>
    * <b>go</b>
      * <b>allow-edit</b> for logins to the GO instance of Noctua
* <b>accounts</b> to register various login accounts to external sites
  * <b>github</b> should be included here, with your GitHub username as the value

To work properly, an entry for a Noctua-only should minimally include
the following stanzas:

* <b>uri</b> the unique identifier for a user
* <b>nickname</b> the common name for the user
* <b>organization</b> the common label for the current organization of the user
  * <b>noctua</b>
    * <b>go</b>
      * <b>allow-edit</b> for logins to the GO instance of Noctua
* <b>accounts</b> to register various login accounts to external sites
  * <b>github</b> should be included here, with your GitHub username as the value

Noctua also supports **groups** for users who have various
affiliations. If you're interested in using these, please contact the
GO Helpdesk.

Naturally, these can be mixed and matched as required for the user.

#### Example stanza

```yaml
-
  uri: 'http://orcid.org/0000-0002-9551-6370'
  xref: 'GOC:mec'
  nickname: 'Melanie Courtot'
  email-md5:
    - 792d70ba0832fd43a97a9d4ec5136c86
    - a1f4be95870984265a3b33604a963b01
  organization: GO
  authorizations:
    noctua-go:
      allow-edit: true
    termgenie-go:
      allow-write: true
      allow-review: true
      allow-freeform: true
      allow-freeform-litxref-optional: true
      allow-management: true
  accounts:
    github: mcourtot
```
	
### How do I login?

Once your metadata has been captured properly as per above, you should
be able to log in in your favorite web browser. You should be
presented with a login window like:

![Image of login scope authorization](https://raw.githubusercontent.com/geneontology/go-site/master/documentation/images/authorize-tg-screenshot.png)

Enter your GitHub username and password and you should be redirected
to the TG template page where you can create your commit.

### What if it doesn’t work?

Check your metadata is correct and complete in the users.yaml file; if
it is not please
[create a ticket](https://github.com/geneontology/go-site/issues). Remember
you need at a minimum a GitHub ID and authorizations for the
application that you want to use in the file (see above for full
details).

Check that you can login into [GitHub](https://github.com); if you
can’t and you know you have a GitHub account, there may be a temporary
issue with the GitHub server. Please try again later.  If you still
can’t login: please
[create a ticket](https://github.com/geneontology/go-site/issues). Please
indicate *exactly* the steps you are following (and URLs) and what
happens/error messages.

### FAQs:

1. Do I still need my Persona username/password? <br>
No. Unless you have made special arrangements with the administrators,
everything is authenticated via GitHub.

2. (<b>TermGenie</b>) I was able to login using my Persona username and password but can’t commit <br>
If you don’t have a _github_ account in the users.yaml file, the system will as a fallback attempt to log you in using your Persona credentials. This still seems to work as of today (Dec 1 2016) but will not allow you to commit terms. For full TG functionality you *need* to log in using your GitHub credentials.
