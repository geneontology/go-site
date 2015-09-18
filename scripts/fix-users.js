////
//// This code is meant to be used to get users.yaml into whatever
//// form is currently needed--it is not static to one purpose over
//// time.
////
//// Ths current use is to perform a three-way merge between
//// metadata/GO.user_data.json,
//// metadata/termgenie-user-permissions.json, and
//// metadata/users.yaml, with the last one being used as the base.
////
//// Likely run something like:
//// 
////  node ./scripts/fix-users.js -f metadata/users.yaml -t metadata/GO.user_data.json -d ../../svn/geneontology.org/trunk/doc/GO.curator_dbxrefs -p metadata/termgenie-user-permissions.json 
////

//var bbop = require('bbop').bbop;
var opts = require('minimist');
var fs = require("fs");
var crypto = require('crypto');
var YAML = require('yamljs');
var us = require('underscore');

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

function die(str){
    //console.log('ERROR: ' + str);
    console.error('ERROR: ' + str);
    process.exit(-1);
}

function update_with(base, base_xref_map, in_entry){

    // Try and find an "id".
    var id = in_entry['uri'];
    if( ! id ){ // uri is stringer than xref.
	id = in_entry['xref'];
    }

    // An ID is required--hard exit if none found.
    if( ! id ){
	die('no id found for entry in incoming entry: ' + in_entry);
    }
    
    // Attempt to find the user we'd be referring to.
    var ref_user = null;
    if( base[id] ){
	ref_user = base[id];
    }else if( base_xref_map[id] ){
	ref_user = base[base_xref_map[id]];
    }else if( in_entry['xref'] ){
	ref_user = base[base_xref_map[in_entry['xref']]];
    }

    // If not there, a new user.
    if( ! ref_user ){
	//console.error('new user: ' + id);
	
	var new_user = {
	    uri: id
	};
	if( in_entry['xref'] ){
	    new_user['xref'] = in_entry['xref'];
	}
	if( in_entry['nickname'] ){
	    new_user['nickname'] = in_entry['nickname'];
	}
	if( in_entry['organization'] ){
	    new_user['organization'] = in_entry['organization'];
	}
	if( in_entry['comment'] ){
	    new_user['comment'] = in_entry['comment'];
	}
	// And a slightly more complicated email2md5.
	if( in_entry['email'] ){
	    new_user['email-md5'] = [str2md5(in_entry['email'])];
	}
	//console.log('new user: ', new_user);

	// Add.
	base[id] = new_user;

    }else{

	// Possibly update current user.
	//console.log('update current user: ', ref_user);
	//console.error('update current user: ', ref_user);
	//console.error('with entry: ', in_entry);
	if( in_entry['uri'] && (in_entry['uri'] !== ref_user['uri']) ){
	    //console.log('update uri for: ' + ref_user['uri']);
	    ref_user['uri'] = in_entry['uri'];
	}
	if( in_entry['xref'] && (in_entry['xref'] !== ref_user['xref']) ){
	    //console.log('update xref for: ' + ref_user['uri']);
	    ref_user['xref'] = in_entry['xref'];
	}
	if( in_entry['nickname'] && (in_entry['nickname'] !== ref_user['nickname']) ){
	    //console.log('update nickname for: ' + ref_user['uri']);
	    ref_user['nickname'] = in_entry['nickname'];
	}
	if( in_entry['organization'] && (in_entry['organization'] !== ref_user['organization']) ){
	    //console.log('update organization for: ' + ref_user['uri']);
	    ref_user['organization'] = in_entry['organization'];
	}
	if( in_entry['comment'] && (in_entry['comment'] !== ref_user['comment']) ){
	    //console.error('update comment for: ' + ref_user['uri']);
	    ref_user['comment'] = in_entry['comment'];
	    //console.error('new: ', ref_user);
	}

	// And a slightly more complicated email2md5 detection and addition.
	if( in_entry['email'] ){
	    var md5ed = str2md5(in_entry['email']);
	    if( ! us.contains(ref_user['email-md5'], md5ed) ){
		//console.log('added email for: ' + ref_user['uri']);
		ref_user['email-md5'].push(md5ed);
	    }
	}

	// Remove any old copies.
	var deletables = [ in_entry['uri'],
			   in_entry['xref'],
			   ref_user['uri'],
			   ref_user['xref']
			 ];
	each(deletables, function(d){
	    if( d ){
		delete base[d];
		delete base_xref_map[d];
	    }
	});

	// Add the freshly merged copy.
	base[id] = ref_user;
    }

    // Update the xref map as well if necessary.
    if( base[id]['xref'] ){
	base_xref_map[base[id]['xref']] = base[id]['uri'];
    }
}

///
/// Incoming files.
///

// Args from CLI.
var argv = opts(process.argv.slice(2));

///
/// Read in the base file.
///

// User information file.
var base_file = null;
if( argv['f'] ){ base_file = argv['f']; }
var base_user_list = YAML.parse(fs.readFileSync(base_file, 'utf-8'));

var users = {};
each(base_user_list, function(entry){

    // uri is the key.
    if( ! entry['uri'] ){
	die('all base entries must have a uri');
    }else{
	var uri = entry['uri'];
	users[uri] = entry;
    }
});

// Generate an initial map of xref to uri.
var users_xref_map = {};
each(us.values(users), function(entry){
    if( entry['xref'] ){
	users_xref_map[entry['xref']] = entry['uri'];
    }
});

//console.error('INIT: check GOC user a: ', users['http://orcid.org/0000-0002-9791-0064']);
//console.error('INIT: check GOC user b: ', users['GOC:gr']);

///
/// Add/update TG users.
///

// TermGenie users.
var tg_file = null;
if( argv['t'] ){ tg_file = argv['t']; }
var tg_user_list = JSON.parse(fs.readFileSync(tg_file, 'utf-8'));
//console.log(tg_user_list);

each(tg_user_list, function(tg_entry){

    var try_entry = {	
    };

    // Try and find an "id".
    var id = tg_entry['orchid'];
    if( ! id ){
	id = tg_entry['xref'];
    }

    // An ID is required--hard exit if none found.
    if( ! id ){
	die('no id found for entry in TG users');
    }

    try_entry['uri'] = id;
    try_entry['xref'] = tg_entry['xref'];
    try_entry['nickname'] = tg_entry['screenname'];
    try_entry['email'] = tg_entry['email'];

    update_with(users, users_xref_map, try_entry);
});

//console.error('TG: check GOC user a: ', users['http://orcid.org/0000-0002-9791-0064']);
//console.error('TG: check GOC user b: ', users['GOC:gr']);

///
/// Add/update data from GO.curators_dbxrefs.
///

// GO curators
var goc_file = null;
if( argv['d'] ){ goc_file = argv['d']; }
var goc_raw_text = fs.readFileSync(goc_file, 'utf-8');
var goc_lines = goc_raw_text.split("\n");
//console.log('num entries: ' + goc_lines.length);
each(goc_lines, function(line){
    var fields = line.split("\t");
    // console.log(' num fields: ' + fields.length);
    // //if( fields.length === 5 ){
    // 	console.log(fields);
    // //}
    
    // Skip anything not GOC.
    var xref = fields[0];
    //console.log(xref);
    var head = xref.split(':');
    //console.log(head[0]);
    if( head[0] !== 'GOC' ){
	// Skip.
    }else{
	var goc_user = {
	    uri: xref,
	    xref: xref
	};
	if( fields[1] ){ goc_user['organization'] = fields[1]; }
	if( fields[2] ){ goc_user['nickname'] = fields[2]; }
	if( fields[3] ){ goc_user['comment'] = fields[3]; }

	// There may be a field 5 for orcids.
	if( fields[4] ){
	    var f4 = fields[4];
	    //console.error('GOC secret field user: ' + f4.substring(0, 7));
	    if( f4.substring(0, 7) === 'http://' ){
		goc_user['uri'] = f4;
		//console.error('GOC secret field user: ', goc_user);
	    }
	}

	// Merge GOC user into main group.
	//if( xref === 'GOC:gr' ){
	//console.error('pre GOC user: ', goc_user);
	update_with(users, users_xref_map, goc_user);
	//console.error('post GOC user: ', users[goc_user['uri']]);
	//}
    }
});

//console.error('GO: check GOC user a: ', users['http://orcid.org/0000-0002-9791-0064']);
//console.error('GO: check GOC user b: ', users['GOC:gr']);
//console.log(goc_raw_text);

///
/// Add/update TG permissions.
///

// Keyed by email, so need an email map.
var users_emailmd5_map = {};
each(users, function(u){
    each(u['email-md5'], function(e5){
	users_emailmd5_map[e5] = u;
    });
});

// TermGenie user permissions.
var tg_perm_file = null;
if( argv['p'] ){ tg_perm_file = argv['p']; }
var tg_perm_map = JSON.parse(fs.readFileSync(tg_perm_file, 'utf-8'));
//console.log(tg_perm_list);

each(tg_perm_map, function(perms, email){

    // Try and find the user by email.
    var md5key = str2md5(email);
    
    if( ! users_emailmd5_map[md5key] ){
	die('unable to lookup user: ' + email);
	//console.log('unable to lookup user: ' + email);
    }

    // Merge in final permissions.
    var user = users_emailmd5_map[md5key];
    var tperms = perms['termgenie-go'];
    if( ! tperms ){
	die('no termgenie-go perms: ' + email);
    }else{

	// Trim out the gunk.
	var pre_list = tperms.split("), (");
	//console.log(pre_list);	
	var post_list = [];
	each(pre_list, function(str){
	    
	    if( str.substring(0, 1) === '(' ){
		str = str.substring(1, str.length);
	    }
	    if( str.substring(str.length -1, str.length) === ')' ){
		str = str.substring(0, str.length -1);
	    }

	    post_list.push(str);
	});

	// Okay, cycle through every individual permissions and add
	// it.
	each(post_list, function(p){
	    var perms = p.split(", ");
	    var opt = perms[1];
	    var val = perms[2];

	    // Ensure structure.
	    if( ! user['authorizations'] ){
		user['authorizations'] = {};
	    }
	    if( ! user['authorizations']['termgenie-go'] ){
		user['authorizations']['termgenie-go'] = {};
	    }

	    if( opt === 'allowWrite' ){
		user['authorizations']['termgenie-go']['allow-write'] = true;
	    }else if( opt === 'allowCommitReview' ){
		user['authorizations']['termgenie-go']['allow-review'] = true;
	    }else if( opt === 'allowManagement' ){
		user['authorizations']['termgenie-go']['allow-management'] = true;
	    }else if( opt === 'allowFreeForm' ){
		user['authorizations']['termgenie-go']['allow-freeform'] = true;
	    }else if( opt === 'allowFreeFormLitXrefOptional' ){
		user['authorizations']['termgenie-go']['allow-freeform-litxref-optional'] = true;
	    }else if( opt === 'allowFreeFormWrite' ){
		// skip
	    }else{
		die('unknown perm: ' + opt);
	    }
	});
	//console.log(post_list);

    }
});

//console.error('TGP: check GOC user a: ', users['http://orcid.org/0000-0002-9791-0064']);
//console.error('TGP: check GOC user b: ', users['GOC:gr']);
//console.log(goc_raw_text);

///
/// Final dump.
///

// Check to fix lack of nicknames in some cases.
// each(us.values(users), function(u){
//     if( ! u['nickname'] ){
// 	console.log('no nickname: ', u);
//     }
// });
// each(us.values(users), function(u){
//     if( u['xref'] === 'GOC:mec' ){
// 	console.log('mec: ', u);
//     }
// });

console.log(YAML.stringify(us.values(users), 10));
