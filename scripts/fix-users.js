////
//// This code is meant to be used to get users.yaml into whatever
//// form is currently needed--it is not static to one purpose over
//// time.
////
//// Likely run as:
//// 
////  node ./scripts/fix-users.js -i config/users.yaml
////

//var bbop = require('bbop').bbop;
var opts = require('minimist');
var fs = require("fs");
var crypto = require('crypto');
var YAML = require('yamljs');
var us = require('underscore')

// Aliases.
var each = us.each;

///
/// Helpers.
///

// Strings to md5.
function str2md5(str){
    var shasum = crypto.createHash('md5');
    shasum.update(str);
    var ret = shasum.digest('hex');
    return ret;
}

///
/// Incoming files.
///

// Args from CLI.
var argv = opts(process.argv.slice(2));

// User information file.
var perm_file = null;
if( argv['f'] ){ perm_file = argv['f']; }
var user_list = YAML.parse(fs.readFileSync(perm_file, 'utf-8'));

// // User secrets file.
// var user_file = null;
// if( argv['s'] ){ user_file = argv['s']; }
// var user_secrets_list = YAML.parse(fs.readFileSync(user_file, 'utf-8'));

// // Make a lookup for the email address.
// var user_secrets_lookup = {};
// each(user_secrets_list, function(sec){
//     var email = sec['email'];
//     var xref = sec['xref'];
//     user_secrets_lookup[xref] = email;
// });

///
/// Make new merged super file that hides the email address.
///

each(user_list, function(u){

    // email-md5 now list.
    var em5 = u['email-md5'];
    u['email-md5'] = [em5];

    // New uri field to replace orcid.
    u['uri'] = u['orcid'] || u['xref'] || null;
    if( u['uri'] == null ){ throw new Error('unacceptable uri'); } 

    // orcid out.
    delete u['orcid'];
});

// var final_super = [];
// each(user_list,
//      function(u){
	 
// 	 var email = u.email;
// 	 var name = u.screenname;
// 	 if( ! email || ! name ){
// 	     console.log('no name/email ?!');
// 	     process.exit(1);
// 	 }else{

// 	     var struct = {
// 		 "nickname": name,
// 		 //"email": email,
// 		 "email-md5": str2md5(email),
// 		 "authorizations": {},
// 	     };

// 	     var xref = u.xref || null;
// 	     if( xref ){ struct.xref = xref; }

// 	     var orid = u.orcid || null;
// 	     if( orid ){ struct.orcid = orid; }

// 	     if( perm_hash[email] ){
// 		 var tg = perm_hash[email]['termgenie-go'] || null;
// 		 if( tg ){
// 		     struct['authorizations']['termgenie-go'] = tg;
// 		     struct['authorizations']['minerva-go'] = true;
// 		 }
	     
// 		 // var mme = perm_hash[email]['minerva-go'] || null;
// 		 // if( mme ){ struct['authorizations']['minerva-go'] = mme; }
// 	     }

// 	     final_super.push(struct);
// 	 }
//      });

//console.log(JSON.stringify(user_list, null, 4));
console.log(YAML.stringify(user_list, 10));
