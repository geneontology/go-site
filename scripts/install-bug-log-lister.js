////
//// Dump the contents of a log directory from AWS S3.
//// See:
////  geneontology/noctua#217
////  geneontology/amigo#259
////
//// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjects-property
////
//// A JSON file of credentials is required like:
////
//// { "accessKeyId": "XXX", "secretAccessKey": "YYY", "region": "us-west-1" }
////
//// Example usage (amigo/master):
////  node ./scripts/install-bug-log-lister.js -f ~/local/share/secrets/bbop/aws/s3/aws-go-log-viewer.json -b go-amigo-usage-logs/2.4.x
////
//// Example usage (noctua/master):
////  node ./scripts/install-bug-log-lister.js -f ~/local/share/secrets/bbop/aws/s3/aws-go-log-viewer.json -b go-noctua-usage-logs/master
////
//// Example usage (apollo/2.0.5), with debug on:
////  node ./scripts/install-bug-log-lister.js -f ~/local/share/secrets/bbop/aws/s3/aws-apollo-log-viewer.json -b apollo-usage-logs/2.0.5 -d
////

var AWS = require('aws-sdk');
var us = require('underscore');
var dns = require('dns');
var querystring = require('querystring');

///
/// Helpers.
///

// Aliases.
var each = us.each;

function _ll(arg1){
    console.log(arg1); 
}

var debug = false;
function _debug(arg1){
    if( debug ){
	console.log(arg1);
    }
}

// Two or one  args.
function _die(m1, m2){
    if( typeof(m2) !== 'undefined' ){
	console.error('ERROR:', m1, m2);
    }else{
	console.error('ERROR:', m1);
    }
    process.exit(-1);
}

var positive_re = /REST\.GET\.OBJECT ping\.json/;
var negative_re = /aws\-internal/;
function _of_interest_p(str){
    var ret = false;

    //_ll('TEST: ' + test);
    if( positive_re.test(str) && ! negative_re.test(str) ){
	ret = true;
    }

    return ret;
}

///
/// Opts.
///

var argv = require('minimist')(process.argv.slice(2));

// Add extra "debugging" messages.
debug = argv['d'] || argv['debug'];
if( debug ){
    _debug('Debugging is on.');
}else{
}

// AWS credentials from CLI.
var credential_file = argv['f'] || argv['file'];
if( ! credential_file ){
    _die('Option (f|file) is required.');
}else{
    //_ll('Will use credentials: ' + credential_file);
}
AWS.config.loadFromPath(credential_file);

// Bucket/prefix to use.
var bucket = null;
var prefix = null;
var bucket_raw = argv['b'] || argv['bucket'];
if( ! bucket_raw ){
    _die('Option (b|bucket) is required.');
}else{
    var parts = bucket_raw.split('/');
    if( ! parts || parts.length !== 2 ){
	_die('Not a good bucket descriptor: ' + bucket_raw);
    }else{
	bucket = parts[0];
	prefix = parts[1];
    }
    
    _debug('Will use bucket: ' + bucket + ', with prefix: ' + prefix);
}

///
/// Main.
///

var ipv4_re = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}';
var date_re = /\[(.*)\]/;
var parameters_re = /\?(.*)\ HTTP/;

// Get the bucket listings.
var s3 = new AWS.S3({params: {Bucket: bucket, Prefix: prefix}});
s3.listObjects(function(err, data){
    if(err){
	_die(err, err.stack);
    }else{
	_debug('In list objects loop.');
	
	// Extract the keys from the listing.
	if( data.Contents ){
	    each( data.Contents, function(obj){
		var key = obj.Key;

		// Get the objects.
		s3.getObject({Key: key}, function(err, data){
		    if( err ){
			_die(err, err.stack);
		    }else{
			_debug('In get objects loop.');
			
			// Break the body into separate lines
			var body = data.Body.toString('utf8');
			var lines = body.split("\n");
			us.each(lines, function(line){
			    _debug('In line loop.');

			    // Filter out anything we don't need.
			    if( _of_interest_p(line) ){
				_debug('```');
				_debug(line);
				_debug('```');
				
				// Pull out IP addresses, date, and
				// parameters.
				var ip_matches = line.match(ipv4_re);
				var date_matches = line.match(date_re);
				var parameter_matches = parameters_re.exec(line);
				_debug(ip_matches);
				_debug(date_matches);
				_debug(parameter_matches);

				// Assemble the strings we want to
				// display in the TSV log.
				var ip = ip_matches[0];
				var date = date_matches[1];
                                var parameters = "";
				if( parameter_matches ){
				    parameters = parameter_matches[1];
				}				
			    }

			    // Log line only on contents.
			    if( ip || date || parameters ){
				console.log([ip, date, parameters].join("\t"));
			    }
			});
		    }
		});
	    });
	}
    }
});
