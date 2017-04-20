////
//// TODO.
////

var us = require('underscore');
var argv = require('minimist')(process.argv.slice(2));
var sync_request = require('sync-request');

///
/// Helpers.
///

var each = us.each;

function _die(message){
    console.error('['+ (new Date()).toJSON() +']: '+ message);
    process.exit(-1);
}

function getUrl(url){
    
    var ret = null;
    
    try {
        ret = sync_request('GET', url, {
	    'headers': {
		'user-agent': 'query-github-for-new-tickets.js; sync-request'
	    }});
    }catch(e){
        _die('ERROR in sync_request call, buh-bye!');
    }
    
    return ret;
}

///
/// Process CLI options.
///

// github org or user name, defaults to "geneontology"
var username = argv['u'] || argv['username'] || 'geneontology';
if( ! username || ! us.isString(username) ){
    _die('Option (u|username) is required to be well defined.');
}

// github project name, defaults to "go-ontology"
var projectname = argv['p'] || argv['project'] || 'go-ontology';
if( ! projectname || ! us.isString(projectname) ){
    _die('Option (p|project) is required to be well defined.');
}

// defaults to one day
var durationInDays = argv['r'] || argv['range'] || 1;
durationInDays = parseInt(durationInDays);
if( ! durationInDays || ! us.isNumber(durationInDays) ){
    _die('Option (r|range) is required to be well defined.');
}

// TODO add option to print to a separate file.
function main() {
    
    var today = new Date();
    var yesterday = new Date(new Date().setDate(new Date().getDate()-durationInDays));
    // yyyy-mm-dd quick hack
    var range = yesterday.toISOString().substring(0, 10);
    //console.log(range);
    
    var newTickets = getNewTickets(username, projectname, range);
    var modTickets = getUpdatedTickets(username, projectname, range);
    
    console.log("<h2>Summary for tickets from "+yesterday.toISOString()+" to "+today.toISOString()+"</h2>");
    var ids = {}; // track already used ids
    printNewTickets(newTickets, username, projectname, ids);
    printUpdatedTickets(modTickets, username, projectname, ids);
    
}

function printNewTickets(tickets, username, projectname, ids) {
    printTickets(tickets, username, 'new', 'New', projectname, ids);
}

function printUpdatedTickets(tickets, username, projectname, ids) {
    printTickets(tickets, username, 'updated', 'Updated', projectname, ids);
}

function printTickets(tickets, username, type, typeUpperCase, projectname, ids) {
    console.log("<h3>"+typeUpperCase+" Tickets</h3>");
    if (tickets !== undefined && tickets.length > 0) {

	var ticketCount = 0;
	var body = "<ul>\n";
	for (var k=0; k<tickets.length; k++) {
	    var ticket = tickets[k];
	    var alreadyUsed = ids[ticket.number];
	    if (alreadyUsed === true) {
		// skip already used tickets
		continue;
	    }
	    body += '<li>';
	    body += '<a href="'+ticket.html_url+'">' + ticket.number + '</a>';
	    body += " ";
	    body += makeHtmlSave(ticket.title);
	    body += '</li>\n';

	    ticketCount += 1;
	    ids[ticket.number] = true;
	}
	if (tickets.length > 0) {
	    if (tickets.length === 1) {
		console.log("There is one "+type+" ticket.");
	    }
	    else {
		console.log("There are "+ticketCount+" "+type+" tickets.");
	    }
	    body += "</ul>";
	    console.log(body);
	}
	else {
	    console.log("<p>There have been no "+type+" tickets.</p>");
	}
    }else {
	console.log("<p>There have been no "+type+" tickets.</p>");
    }
}

/**
 * Save guard against problematic text.<br>
 * Escape HTML reserved characters and remove non-ASCII symbols.
 */
function makeHtmlSave(s) {
    // rempve all non-ascii symbols with a '?'
    s = s.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '') ;
    // escape html specific characters 
    return s.replace(/&/g, '&amp;')
	.replace(/"/g, '&quot;')
	.replace(/>/g, '&gt;')
	.replace(/</g, '&lt;');
}

function getNewTickets(username, projectname, range) {
    // Example: https://api.github.com/search/issues?q=repo:geneontology/go-ontology+created:=>2015-08-05&type=Issues&per_page=100
    return getTickets(username, projectname, range, 'created:');
}

function getUpdatedTickets(username, projectname, range) {
    // Example: https://api.github.com/search/issues?q=repo:geneontology/go-ontology+updated:=>2015-08-05&type=Issues&per_page=100
    return getTickets(username, projectname, range, 'updated:');
}

/**
 * Get the tickets. Warning: This method uses process.exit(-1) to exit the
 * program in case of an error.
 * 
 * TODO: handle pagination, maybe add a retry count
 */
function getTickets(username, projectname, range, type) {
    var url = 'https://api.github.com/search/issues?q=repo:'+username+'/'+projectname+'+'+range+'&type=Issues&per_page=100';
    //console.log(url);
    var res = getUrl(url);
    //console.log(res);
    var payload = res.getBody();
    //console.log(payload);
    if (res.statusCode === 200) {
	var resultObj = JSON.parse(payload);
	/*
	 * TODO check:
	 * "total_count": 5,
	 * "incomplete_results": false,
	 *  "items": [{
	 *    number,
	 *    title,
	 *    html_url
	 *  }]
	 */
	return resultObj.items;
    } else {
	_die('HTTP error status code: '+res.statusCode+' for url: '+url);
    }
}

main();
