/* 
 * Package: core.js
 * 
 * Namespace: bbop.core
 * 
 * BBOP language extensions to JavaScript.
 * 
 * Purpose: Helpful basic utilities and operations to fix common needs in JS.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.core == "undefined" ){ bbop.core = {}; }
//if ( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Function: crop
 *
 * Crop a string nicely.
 * 
 * Parameters:
 *  str - the string to crop
 *  lim - the final length to crop to (optional, defaults to 10)
 *  suff - the string to add to the end (optional, defaults to '')
 * 
 * Returns: Nothing. Side-effects: throws an error if the namespace
 * defined by the strings is not currently found.
 */
bbop.core.crop = function(str, lim, suff){
    var ret = str;

    var limit = 10;
    if( lim ){ limit = lim; }

    var suffix = '';
    if( suff ){ suffix = suff; }
    
    if( str.length > limit ){
	ret = str.substring(0, (limit - suffix.length)) + suffix;
    }
    return ret;
};

/*
 * Function: fold
 *
 * Fold a pair of hashes together, using the first one as an initial
 * template--only the keys in the default hash will be defined in the
 * final hash--and the second hash getting precedence.
 * 
 * The can be quite useful when defining functions--essentially
 * allowing a limited default value system for arguments.
 * 
 * Parameters:
 *  default_hash - Template hash.
 *  arg_hash - Argument hash to match.
 * 
 * Returns: A new hash.
 * 
 * Also see: <merge>
 */
bbop.core.fold = function(default_hash, arg_hash){

    if( ! default_hash ){ default_hash = {}; }
    if( ! arg_hash ){ arg_hash = {}; }

    var ret_hash = {};
    for( var key in default_hash ){
	if( bbop.core.is_defined(arg_hash[key]) ){
	    ret_hash[key] = arg_hash[key];
	}else{
	    ret_hash[key] = default_hash[key];
	}
    }
    return ret_hash;
};

/*
 * Function: merge
 *
 * Merge a pair of hashes together, the second hash getting
 * precedence. This is a superset of the keys both hashes.
 * 
 * Parameters:
 *  older_hash - first pass
 *  newer_hash - second pass
 * 
 * Returns: A new hash.
 * 
 * Also see: <fold>
 */
bbop.core.merge = function(older_hash, newer_hash){

    if( ! older_hash ){ older_hash = {}; }
    if( ! newer_hash ){ newer_hash = {}; }

    var ret_hash = {};
    function _add (key, val){
	ret_hash[key] = val;
    }
    bbop.core.each(older_hash, _add);
    bbop.core.each(newer_hash, _add);
    return ret_hash;
};

/*
 * Function: get_keys
 *
 * Get the hash keys from a hash/object, return as an array.
 *
 * Parameters:
 *  arg_hash - the hash in question
 *
 * Returns: an array of keys
 */
bbop.core.get_keys = function (arg_hash){

    if( ! arg_hash ){ arg_hash = {}; }
    var out_keys = [];
    for (var out_key in arg_hash) {
	if (arg_hash.hasOwnProperty(out_key)) {
	    out_keys.push(out_key);
	}
    }
    
    return out_keys;
};

/*
 * Function: hashify
 *
 * Returns a hash form of the argument array/list. For example ['a',
 * 'b'] would become {'a': true, 'b': true} or [['a', '12'], ['b',
 * '21']] would become {'a': '12', 'b': '21'}. Using mixed sub-lists
 * is undefined.
 *
 * Parameters:
 *  list - the list to convert
 *
 * Returns: a hash
 */
bbop.core.hashify = function (list){
    var rethash = {};

    if( list && list[0] ){
	if( bbop.core.is_array(list[0]) ){
	    bbop.core.each(list,
			   function(item){
			       var key = item[0];
			       var val = item[1];
			       if( bbop.core.is_defined(key) ){
				   rethash[key] = val;
			       }
			   });
	}else{
	    bbop.core.each(list,
			   function(item){
			       rethash[item] = true;
			   });
	}
    }

    return rethash;
};

/*
 * Function: is_same
 *
 * Returns true if it things the two incoming arguments are value-wise
 * the same.
 * 
 * Currently only usable for simple (atomic single layer) hashes,
 * atomic lists, boolean, null, number, and string values. Will return
 * false otherwise.
 * 
 * Parameters:
 *  thing1 - thing one
 *  thing2 - thing two
 *
 * Returns: boolean
 */
bbop.core.is_same = function (thing1, thing2){

    var retval = false;

    // If is hash...steal the code from test.js.
    if( bbop.core.is_hash(thing1) && bbop.core.is_hash(thing2) ){
	
	var same_p = true;
	
	// See if the all of the keys in hash1 are defined in hash2
	// and that they have the same ==.
	for( var k1 in thing1 ){
	    if( typeof thing2[k1] === 'undefined' ||
		thing1[k1] !== thing2[k1] ){
		    same_p = false;
		    break;
		}
	}

	// If there is still no problem...
	if( same_p ){
	    
	    // Reverse of above.
	    for( var k2 in thing2 ){
		if( typeof thing1[k2] === 'undefined' ||
		    thing2[k2] !== thing1[k2] ){
			same_p = false;
			break;
		    }
	    }
	}

	retval = same_p;

    }else if( bbop.core.is_array(thing1) && bbop.core.is_array(thing2) ){
	// If it's an array convert and pass it off to the hash function.
	retval = bbop.core.is_same(bbop.core.hashify(thing1),
				   bbop.core.hashify(thing2));
    }else{
	
	// So, we're hopefully dealing with an atomic type. If they
	// are the same, let's go ahead and try.
	var t1_is = bbop.core.what_is(thing1);
	var t2_is = bbop.core.what_is(thing2);
	if( t1_is == t2_is ){
	    if( t1_is == 'null' ||
		t1_is == 'boolean' ||
		t1_is == 'null' ||
		t1_is == 'number' ||
		t1_is == 'string' ){
		    if( thing1 == thing2 ){
			retval = true;
		    }
		}
	}
    }

    return retval;
};

/*
 * Function: what_is
 *
 * Return the string best guess for what the input is, null if it
 * can't be identified. In addition to the _is_a property convention,
 * current core output strings are: 'null', 'array', 'boolean',
 * 'number', 'string', 'function', and 'object'.
 * 
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: a string
 */
bbop.core.what_is = function(in_thing){
    var retval = null;
    if( typeof(in_thing) != 'undefined' ){

	// If it's an object, try and guess the 'type', otherwise, let
	// typeof.
	if( in_thing == null ){
	    retval = 'null';
	}else if( typeof(in_thing) == 'object' ){
	    
	    // Look for the 'is_a' property that I should be using.
	    if( typeof(in_thing._is_a) != 'undefined' ){
		retval = in_thing._is_a;
	    }else{
		if( bbop.core.is_array(in_thing) ){
		    retval = 'array';
		}else{
		    retval = 'object';
		}		
	    }
	}else{
	    retval = typeof(in_thing);
	}
    }
    return retval;
};

/*
 * Function: is_array
 *
 * Return the best guess (true/false) for whether or not a given
 * object is being used as an array.
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_array = function(in_thing){
    var retval = false;
    if( in_thing &&
	typeof(in_thing) == 'object' &&
	typeof(in_thing.push) == 'function' &&
	typeof(in_thing.length) == 'number' ){
	retval = true;
    }
    return retval;
};

/*
 * Function: is_hash
 *
 * Return the best guess (true/false) for whether or not a given
 * object is being used as a hash.
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_hash = function(in_thing){
    var retval = false;
    if( in_thing &&
	typeof(in_thing) == 'object' &&
	(! bbop.core.is_array(in_thing)) ){
	retval = true;
    }
    return retval;
};

/*
 * Function: is_empty
 *
 * Return true/false on whether or not the object in question has any
 * items of interest (iterable?).
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_empty = function(in_thing){
    var retval = false;
    if( bbop.core.is_array(in_thing) ){
	if( in_thing.length == 0 ){
	    retval = true;
	}
    }else if( bbop.core.is_hash(in_thing) ){
	var in_hash_keys = bbop.core.get_keys(in_thing);
	if( in_hash_keys.length == 0 ){
	    retval = true;
	}
    }else{
	// TODO: don't know about this case yet...
	//throw new Error('unsupported type in is_empty');	
	retval = false;
    }
    return retval;
};

/*
 * Function: is_defined
 *
 * Return true/false on whether or not the passed object is defined.
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_defined = function(in_thing){
    var retval = true;
    if( typeof(in_thing) === 'undefined' ){
	retval = false;
    }
    return retval;
};

/*
 * Function: each
 *
 * Implement a simple iterator so I don't go mad.
 *  array - function(item, index)
 *  object - function(key, value)
 *
 *  TODO/BUG/WARNING?: This does not seem to work with the local
 *  function variable "arguments".
 * 
 * Parameters: 
 *  in_thing - hash or array
 *  in_function - function to apply to elements
 *
 * Returns:
 *  n/a
 */
bbop.core.each = function(in_thing, in_function){

    // Probably an not array then.
    if( typeof(in_thing) == 'undefined' ){
	// this is a nothing, to nothing....
    }else if( typeof(in_thing) != 'object' ){
	throw new Error('Unsupported type in bbop.core.each: ' +
			typeof(in_thing) );
    }else if( bbop.core.is_hash(in_thing) ){
	// Probably a hash...
	var hkeys = bbop.core.get_keys(in_thing);
	for( var ihk = 0; ihk < hkeys.length; ihk++ ){
	    var ikey = hkeys[ihk];
	    var ival = in_thing[ikey];
	    in_function(ikey, ival);
	}
    }else{
	// Otherwise likely an array.
	for( var iai = 0; iai < in_thing.length; iai++ ){
	    in_function(in_thing[iai], iai);
	}
    }
};

/*
 * Function: pare
 *
 * Take an array or hash and pare it down using a couple of functions
 * to what we want.
 * 
 * Both parameters are optional in the sense that you can set them to
 * null and they will have no function; i.e. a null filter will let
 * everything through and a null sort will let things go in whatever
 * order.
 *
 * Parameters: 
 *  in_thing - hash or array
 *  filter_function - hash (function(key, val)) or array (function(item, i)).
 *   This function must return boolean true or false.
 *  sort_function - function to apply to elements: function(a, b)
 *   This function must return an integer as the usual sort functions do.
 *
 * Returns: An array.
 */
bbop.core.pare = function(in_thing, filter_function, sort_function){

    var ret = [];
    
    // Probably an not array then.
    if( typeof(in_thing) === 'undefined' ){
	// this is a nothing, to nothing....
    }else if( typeof(in_thing) != 'object' ){
	throw new Error('Unsupported type in bbop.core.pare: ' +
			typeof(in_thing) );
    }else if( bbop.core.is_hash(in_thing) ){
	// Probably a hash; filter it if filter_function is defined.
	if( filter_function ){	
	    bbop.core.each(in_thing,
			   function(key, val){
			       if( filter_function(key, val) ){
				   // Remove matches to the filter.
			       }else{
				   ret.push(val);
			       }
			   });
	}else{
	    bbop.core.each(in_thing, function(key, val){ ret.push(val); });
	}
    }else{
	// Otherwise, probably an array; filter it if filter_function
	// is defined.
	if( filter_function ){	
	    bbop.core.each(in_thing,
			   function(item, index){
			       if( filter_function(item, index) ){
				   // filter out item if true
			       }else{
				   ret.push(item);
			       }
			   });
	}else{
	    bbop.core.each(in_thing, function(item, index){ ret.push(item); });
	}
    }

    // For both: sort if there is anything.
    if( ret.length > 0 && sort_function ){
	ret.sort(sort_function);	    
    }

    return ret;
};

/*
 * Function: clone
 *
 * Clone an object down to its atoms.
 *
 * Parameters: 
 *  thing - whatever
 *
 * Returns: a new whatever
 */
bbop.core.clone = function(thing){

    var clone = null;

    if( typeof(thing) === 'undefined' ){
	// Nothin' doin'.
	//print("looks undefined");
    }else if( typeof(thing) === 'function' ){
	// Dunno about this case...
	//print("looks like a function");
	clone = thing;
    }else if( typeof(thing) === 'boolean' ||
	      typeof(thing) === 'number' ||
	      typeof(thing) === 'string' ){
	// Atomic types can be returned as-is (i.e. assignment in
	// JS is the same as copy for atomic types).
	//print("cloning atom: " + thing);
	clone = thing;
    }else if( typeof(thing) === 'object' ){
	// Is it a hash or an array?
	if( typeof(thing.length) === 'undefined' ){
	    // Looks like a hash!
	    //print("looks like a hash");
	    clone = {};
	    for(var h in thing){
		clone[h] = bbop.core.clone(thing[h]);
	    }
	}else{
	    // Looks like an array!
	    //print("looks like an array");
	    clone = [];
	    for(var i = 0; i < thing.length; i++){
		clone[i] = bbop.core.clone(thing[i]);
	    }
	}
    }else{
	// Then I don't know what it is--might be platform dep.
	//print("no idea what it is");
    }
    return clone;
};

/*
 * Function: to_string
 *
 * Essentially add standard 'to string' interface to the string class
 * and as a stringifier interface to other classes. More meant for
 * output--think REPL. Only atoms, arrays, and objects with a
 * to_string function are handled.
 *
 * Parameters: 
 *  in_thing - something
 *
 * Returns: string
 * 
 * Also See: <dump>
 */
bbop.core.to_string = function(in_thing){

    // First try interface, then the rest.
    if( in_thing &&
	typeof(in_thing.to_string) !== 'undefined' &&
	typeof(in_thing.to_string) == 'function' ){
	return in_thing.to_string();
    }else{
		
	var what = bbop.core.what_is(in_thing);
	if( what == 'number' ){
	    return in_thing.toString();
	}else if( what == 'string' ){
	    return in_thing;
	}else if( what == 'array' ){
	    return bbop.core.dump(in_thing);
	// }else if( what == 'object' ){
	//     return bbop.core.dump(in_thing);
	// }else{
	//     return '[unsupported]';
	}else{
	    return in_thing;
	}
    }
};

/*
 * Function: dump
 *
 * Dump an object to a string form as best as possible. More meant for
 * debugging. This is meant to be an Object walker. For a slightly
 * different take (Object identification), see <to_string>.
 *
 * Parameters: 
 *  in_thing - something
 *
 * Returns: string
 * 
 * Also See: <to_string>
 */
bbop.core.dump = function(thing){

    var retval = '';

    var what = bbop.core.what_is(thing);
    if( what == null ){
	retval = 'null';
    }else if( what == 'null' ){
	retval = 'null';
    }else if( what == 'string' ){
	retval = '"' + thing + '"';
    }else if( what == 'boolean' ){
	if( thing ){
	    retval = "true";
	}else{
	    retval = "false";
	}
    }else if( what == 'array' ){

	var astack = [];
	bbop.core.each(thing, function(item, i){
			   astack.push(bbop.core.dump(item));
		       });
	retval = '[' + astack.join(', ') + ']';

    }else if( what == 'object' ){

	var hstack = [];
	bbop.core.each(thing, function(key, val){
			   hstack.push('"'+ key + '": ' +
				       bbop.core.dump(val));
		       });
	retval = '{' + hstack.join(', ') + '}';

    }else{
	retval = thing;
    }

    return retval;
};

/*
 * Function: has_interface
 *
 * Check to see if all top-level objects in a namespace supply an
 * "interface".
 * 
 * Mostly intended for use during unit testing.
 *
 * Parameters: 
 *  iobj - the object/constructor in question
 *  interface_list - the list of interfaces (as a strings) we're looking for
 *
 * Returns: boolean
 *
 * TODO: Unit test this to make sure it catches both prototype (okay I
 * think) and uninstantiated objects (harder/impossible?).
 */
bbop.core.has_interface = function(iobj, interface_list){
    var retval = true;
    bbop.core.each(interface_list,
		   function(iface){
		       //print('|' + typeof(in_key) + ' || ' + typeof(in_val));
		       //print('|' + in_key + ' || ' + in_val);
		       if( typeof(iobj[iface]) == 'undefined' &&
			   typeof(iobj.prototype[iface]) == 'undefined' ){
			   retval = false;
			   throw new Error(bbop.core.what_is(iobj) +
					   ' breaks interface ' + 
					   iface);
                       }
		   });
    return retval;
};

/*
 * Function: get_assemble
 *
 * Assemble an object into a GET-like query. You probably want to see
 * the tests to get an idea of what this is doing.
 * 
 * The last argument of double hashes gets quoted (Solr-esque),
 * otherwise not. It will try and avoid adding additional sets of
 * quotes to strings.
 *
 * This does nothing to make the produced "URL" in any way safe.
 * 
 * WARNING: Not a hugely clean function--there are a lot of special
 * cases and it could use a good (and safe) clean-up.
 * 
 * Parameters: 
 *  qargs - hash/object
 *
 * Returns: string
 */
bbop.core.get_assemble = function(qargs){

    var mbuff = [];
    for( var qname in qargs ){
	var qval = qargs[qname];

	// null is technically an object, but we don't want to render
	// it.
	if( qval != null ){
	    if( typeof qval == 'string' || typeof qval == 'number' ){
		// Is standard name/value pair.
		var nano_buffer = [];
		nano_buffer.push(qname);
		nano_buffer.push('=');
		nano_buffer.push(qval);
		mbuff.push(nano_buffer.join(''));
	    }else if( typeof qval == 'object' ){
		if( typeof qval.length != 'undefined' ){
		    // Is array (probably).
		    // Iterate through and double on.
		    for(var qval_i = 0; qval_i < qval.length ; qval_i++){
			var nano_buff = [];
			nano_buff.push(qname);
			nano_buff.push('=');
			nano_buff.push(qval[qval_i]);
			mbuff.push(nano_buff.join(''));
		    }
		}else{
		    // // TODO: The "and" case is pretty much like
		    // // the array, the "or" case needs to be
		    // // handled carefully. In both cases, care will
		    // // be needed to show which filters are marked.
		    // Is object (probably).
		    // Special "Solr-esque" handling.
		    for( var sub_name in qval ){
			var sub_vals = qval[sub_name];
			
			// Since there might be an array down there,
			// ensure that there is an iterate over it.
			if( bbop.core.what_is(sub_vals) != 'array' ){
			    sub_vals = [sub_vals];
			}
			
			var loop = bbop.core.each;
			loop(sub_vals,
			     function(sub_val){
				 var nano_buff = [];
				 nano_buff.push(qname);
				 nano_buff.push('=');
				 nano_buff.push(sub_name);
				 nano_buff.push(':');
				 if( typeof sub_val !== 'undefined' && sub_val ){
				     // Do not double quote strings.
				     // Also, do not requote if we already
				     // have parens in place--that
				     // indicates a complicated
				     // expression. See the unit tests.
				     var val_is_a = bbop.core.what_is(sub_val);
				     if( val_is_a == 'string' &&
					 sub_val.charAt(0) == '"' &&
					 sub_val.charAt(sub_val.length -1) == '"' ){
					     nano_buff.push(sub_val);
					 }else if( val_is_a == 'string' &&
						   sub_val.charAt(0) == '(' &&
						   sub_val.charAt(sub_val.length -1) == ')' ){
						       nano_buff.push(sub_val);
						   }else{
						       nano_buff.push('"' + sub_val + '"');
						   }
				 }else{
				     nano_buff.push('""');
				 }
				 mbuff.push(nano_buff.join(''));
			     });
		    }
		}
	    }else if( typeof qval == 'undefined' ){
		// This happens in some cases where a key is tried, but no
		// value is found--likely equivalent to q="", but we'll
		// let it drop.
		// var nano_buff = [];
		// nano_buff.push(qname);
		// nano_buff.push('=');
		// mbuff.push(nano_buff.join(''));	    
	    }else{
		throw new Error("bbop.core.get_assemble: unknown type: " + 
				typeof(qval));
	    }
	}
    }
    
    return mbuff.join('&');
};

/*
 * Function: 
 *
 * Random number generator of fixed length. Return a random number
 * string of length len.
 *
 * Parameters: 
 *  len - the number of random character to return.
 *
 * Returns: string
 */
bbop.core.randomness = function(len){

    var random_base =
	['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
	 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    var length = len || 10;
    var cache = new Array();
    for( var ii = 0; ii < length; ii++ ){
	var rbase_index = Math.floor(Math.random() * random_base.length);
	cache.push(random_base[rbase_index]);
    }
    return cache.join('');
};

/*
 * Function: first_split
 *
 * Attempt to return a two part split on the first occurrence of a
 * character.
 *
 * Returns '' for parts not found.
 * 
 * Unit tests make the edge cases clear.
 * 
 * Parameters:
 *  character - the character to split on
 *  string - the string to split
 *
 * Returns:
 *  list of first and second parts
 */
bbop.core.first_split = function(character, string){

    var retlist = null;

    var eq_loc = string.indexOf(character);
    if( eq_loc == 0 ){
	retlist = ['', string.substr(eq_loc +1, string.length)];
    }else if( eq_loc > 0 ){
	var before = string.substr(0, eq_loc);
	var after = string.substr(eq_loc +1, string.length);
	retlist = [before, after];
    }else{
	retlist = ['', ''];
    }

    return retlist;
};

/*
 * Function: url_parameters
 *
 * Return the parameters part of a URL.
 *
 * Unit tests make the edge cases clear.
 * 
 * Parameters:
 *  url - url (or similar string)
 *
 * Returns:
 *  list of part lists
 */
bbop.core.url_parameters = function(url){

    var retlist = [];

    // Pull parameters.
    var tmp = url.split('?');
    var path = '';
    var parms = [];
    if( ! tmp[1] ){ // catch bad url--nothing before '?'
	parms = tmp[0].split('&');
    }else{ // normal structure
	path = tmp[0];
	parms = tmp[1].split('&');
    }

    // Decompose parameters.
    bbop.core.each(parms,
		  function(p){
		      var c = bbop.core.first_split('=', p);
		      if( ! c[0] && ! c[1] ){
			  retlist.push([p]);
		      }else{
			  retlist.push(c);		  
		      }
		  });
    
    return retlist;
};

/*
 * Function: resourcify
 *
 * Convert a string into something consistent for urls (getting icons,
 * etc.). Return a munged/hashed-down version of the resource.
 * Assembles, converts spaces to underscores, and all lowercases.
 * 
 * Parameters:
 *  base - base url for the resource(s)
 *  resource - the filename or whatever to be transformed
 *  extension - *[optional]* the extension of the resource
 *
 * Returns:
 *  string
 */
bbop.core.resourcify = function(base, resource, extension){

    var retval = base + '/' + resource;

    // Add the extension if it is there.
    if( extension ){
	retval += '.' + extension;	
    }

    // Spaces to underscores and all lowercase.
    return retval.replace(" ", "_", "g").toLowerCase();
};

/*
 * Function: uuid
 *
 * RFC 4122 v4 compliant UUID generator.
 * From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
 *
 * Parameters:
 *  n/a
 *
 * Returns:
 *  string
 */
bbop.core.uuid = function(){

    // Replace x (and y) in string.
    function replacer(c) {
	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	return v.toString(16);
    }
    var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return target_str.replace(/[xy]/g, replacer);
};

/*
 * Function: numeric_sort_ascending
 *
 * A sort function to put numbers in ascending order.
 * 
 * Useful as the argument to .sort().
 * 
 * See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
 * 
 * Parameters:
 *  a - the first number
 *  b - the second number
 *
 * Returns:
 *  number of their relative worth
 */
bbop.core.numeric_sort_ascending = function(a, b){
    return a - b;
};

/*
 * Function: numeric_sort_descending
 *
 * A sort function to put numbers in descending order.
 * 
 * Useful as the argument to .sort().
 * 
 * See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
 * 
 * Parameters:
 *  a - the first number
 *  b - the second number
 *
 * Returns:
 *  number of their relative worth
 */
bbop.core.numeric_sort_descending = function(a, b){
    return b - a;
};

/*
 * Function: dequote
 *
 * Remove the quotes from a string.
 * 
 * Parameters:
 *  str - the string to dequote
 *
 * Returns:
 *  the dequoted string (or the original string)
 */
bbop.core.dequote = function(str){
    var retstr = str;

    if( bbop.core.is_defined(str) && str.length > 2 ){
	var end = str.length -1;
	if( str.charAt(0) == '"' && str.charAt(end) == '"' ){
	    retstr = str.substr(1, end -1);
	}
    }

    return retstr;
};

/*
 * Function: ensure
 *
 * Make sure that a substring exists at the beginning or end (or both)
 * of a string.
 * 
 * Parameters:
 *  str - the string to ensure that has the property
 *  add - the string to check for (and possibly add)
 *  place - *[optional]* "front"|"back", place to ensure (defaults to both)
 *
 * Returns:
 *  a new string with the property enforced
 */
bbop.core.ensure = function(str, add, place){

    // 
    var do_front = false;
    var do_back = false;
    if( ! bbop.core.is_defined(place) ){
	do_front = true;
	do_back = true;
    }else if( place == 'front' ){
	do_front = true;
    }else if( place == 'back' ){
	do_back = true;
    }else{
	// Don't know what it is, not doing anything.
    }

    //
    var strlen = str.length;
    var addlen = add.length;
    var front_substr = str.substr(0, addlen);
    var back_substr = str.substr((strlen - addlen), (strlen -1));

    //
    var front_add = '';
    if( do_front && front_substr != add ){
	front_add = add;
    }
    var back_add = '';
    if( do_back && back_substr != add ){
	back_add = add;
    }

    // print('do_front: ' + do_front);
    // print('do_back: ' + do_back);
    // print('str.length: ' + strlen);
    // print('add.length: ' + addlen);
    // print('front_substr: ' + front_substr);
    // print('back_substr: ' + back_substr);
    // print('front_add: ' + front_add);
    // print('back_add: ' + back_add);

    return front_add + str + back_add;
};

/*
 * Function: chomp
 *
 * Trim the leading and trailing whitespace from a string.
 * Named differently so as not to confuse with JS 1.8.1's trim().
 * 
 * Parameters:
 *  str - the string to ensure that has the property
 *
 * Returns:
 *  the trimmed string
 */
bbop.core.chomp = function(str){

    var retstr = '';

    retstr = str.replace(/^\s+/,'');
    retstr = retstr.replace(/\s+$/,'');

    return retstr;
};

/*
 * Function: splode
 *
 * Break apart a string on certain delimiter.
 * 
 * Parameters:
 *  str - the string to ensure that has the property
 *  delimiter - *[optional]* either a string or a simple regexp; defaults to ws
 *
 * Returns:
 *  a list of separated substrings
 */
bbop.core.splode = function(str, delimiter){

    var retlist = null;

    if( bbop.core.is_defined(str) ){
	if( ! bbop.core.is_defined(delimiter) ){
	    delimiter = /\s+/;
	}
	
	retlist = str.split(delimiter);
    }

    return retlist;
};

// // Giving up on this for now: the general case seems too hard to work with 
// // in so many different, contradictory, and changing environments.
// /*
//  * Function: evaluate
//  * 
//  * Getting a cross-platform that can evaluate to the global namespace
//  * seems a little bit problematic. This is an attempt to wrap that all
//  * away.
//  * 
//  * This is not an easy problem--just within browsers there are a lot
//  * of issues:
//  * http://perfectionkills.com/global-eval-what-are-the-options/ After
//  * that, the server side stuff tries various ways to keep you from
//  * affecting the global namespace in certain circumstances.
//  * 
//  * Parameters:
//  *  to_eval - the string to evaluate
//  * 
//  * Returns:
//  *  A list with the following fields: retval, retval_str, okay_p, env_type.
//  */
// bbop.core.evaluate = function(to_eval){

//     var retval = null;
//     var retval_str = '';
//     var okay_p = true;
//     var env_type = 'server';

//     // Try and detect our environment.
//     try{
// 	if( bbop.core.is_defined(window) &&
// 	    bbop.core.is_defined(window.eval) &&
// 	    bbop.core.what_is(window.eval) == 'function' ){
// 		env_type = 'browser';
// 	    }
//     } catch (x) {
// 	// Probably not a browser then, right? Hopefully all the
// 	// servers that we'll run into are the same (TODO: check
// 	// nodejs).
//     }
//     print('et: ' + env_type);

//     // Now try for the execution.
//     try{
// 	// Try and generically evaluate.
// 	if( env_type == 'browser' ){
// 	    print('eval as if (browser)');
// 	    retval = window.eval(to_eval);
// 	}else{
// 	    // TODO: Does this work?
// 	    print('eval as else (server)');
// 	    //retval = this.eval(to_eval);		
// 	    retval = bbop.core.global.eval(to_eval);
// 	}
//     }catch (x){
// 	// Bad things happened.
// 	print('fail on: (' + retval +'): ' + to_eval);
// 	retval_str = '[n/a]';
// 	okay_p = false;
//     }
	
//     // Make whatever the tmp_ret is prettier for the return string.
//     if( bbop.core.is_defined(retval) ){
// 	if( bbop.core.what_is(retval) == 'string' ){
// 	    retval_str = '"' + retval + '"';
// 	}else{
// 	    retval_str = retval;
// 	}
//     }else{
// 	// Return as-is.
//     }

//     return [retval, retval_str, okay_p, env_type];
// };

/*
 * Function: extend
 * 
 * What seems to be a typical idiom for subclassing in JavaScript.
 * 
 * This attempt has been scraped together from bits here and there and
 * lucid explanations from Mozilla:
 * 
 * https://developer.mozilla.org/en-US/docs/JavaScript/Introduction_to_Object-Oriented_JavaScript
 * https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Details_of_the_Object_Model
 * https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Inheritance_Revisited
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/new
 * 
 * Parameters:
 *  subclass - the subclass object
 *  superclass - the superclass object
 * 
 * Returns:
 *  n/a
 */
bbop.core.extend = function(subclass, baseclass){

    // Create a temporary nothing so that we don't fiddle the
    // baseclass's(?) with what we do to subclass later on.
    function tmp_object(){}

    // This nothings prototype gets the base class's.
    tmp_object.prototype = baseclass.prototype;

    // We instantiate the tmp_object, whose prototype is the
    // baseclass's; we make subclass's prototype this object, giving
    // us something that is very much like baseclass.
    subclass.prototype = new tmp_object; // same as: "new tmp_object();"

    // Now we go back and make the constructor of subclass actually
    // subclass again--we blew it away in the last step. Now we have a
    // subclass constructor with the protoype of baseclass.
    subclass.prototype.constructor = subclass;

    // // Create a property to allow access to the constructor of
    // // baseclass. This is useful when subclass needs access to
    // // baseclass's constructor for property setting.
    // subclass.base_constructor = baseclass;

    // // Create a property to
    // subclass.parent_class = baseclass.prototype;
};
/* 
 * Package: test.js
 * 
 * Namespace: bbop.test
 * 
 * A trivial testing framework for JS. See test.tests.js for usage.
 * 
 *  Note: this cannot depend on core.js (it tests that), so some stuff
 *  may be duped. On the other hand, we can test ourselves--see
 *  test.js.tests.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: test
 * 
 * Contructor for the BBOP JS unit test system.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  BBOP test suite object
 */
bbop.test = function(){

    ///
    /// Accounting and reporting.
    ///

    var test_number = 1;
    var tests_passed = 0;
    var tests_failed = 0;
    function _incr_tests(){ test_number = test_number + 1; }
    function _incr_passed(){ tests_passed = tests_passed + 1; }
    function _incr_failed(){ tests_failed = tests_failed + 1; }
    function _incr_failed(){ tests_failed = tests_failed + 1; }
    function _complete(bool, msg){
	if( bool ){
	    if( msg ){
		print('Test ' + test_number + ' passed: ' + msg + '.');
	    }else{
		print('Test ' + test_number + ' passed.');
	    }
	    _incr_passed();
	}else{
	    if( msg ){
		print('FAIL: Test ' + test_number + ' failed: ' + msg + '.');
	    }else{
		print('FAIL: Test ' + test_number + ' failed.');
	    }
	    _incr_failed();
	}
	test_number++;	
    }

    /*
     * Function: report
     *
     * Print a report about what happened during the tests.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  n/a; but prints the report as a side-effect
     */
    this.report = function(){
	if( tests_passed + 1 == test_number ){
	    print('* All tests passed.');
	}else{
	    print('* Tests passed: ' + tests_passed);
	    print('* Tests failed: ' + tests_failed);
	}
    };

    ///
    /// Internal helper functions--different kinds of comparisions.
    ///

    //
    function _same_array(one, two){
	var retval = true;
	if( one.length != two.length ){
	    retval = false;
	}else{
	    for( var i = 0; i < one.length; i++ ){
		if( one[i] != two[i] ){
		    retval = false;
		    break;
		}
	    }
	}
	return retval;
    }

    // Looking at array as sets of...something.
    function _same_set(set1, set2){
	var h1 = {};
	var h2 = {};
	for( var h1i = 0; h1i < set1.length; h1i++ ){ h1[set1[h1i]] = 1; }
	for( var h2i = 0; h2i < set2.length; h2i++ ){ h2[set2[h2i]] = 1; }
	return _same_hash(h1, h2);
    }

    // NOTE/WARNING: This is a very shallow comparison function.
    function _same_hash(hash1, hash2){

	var same_p = true;
	
	// See if the all of the keys in hash1 are defined in hash2
	// and that they have the same ==.
	for( var k1 in hash1 ){
	    if( typeof hash2[k1] === 'undefined' ||
		hash1[k1] !== hash2[k1] ){
		same_p = false;
		break;
	    }
	}

	// If there is still no problem...
	if( same_p ){

	    // Reverse of above.
	    for( var k2 in hash2 ){
		if( typeof hash1[k2] === 'undefined' ||
		    hash2[k2] !== hash1[k2] ){
		    same_p = false;
		    break;
		}
	    }
	}
	
	return same_p;
    }

    // TODO: This could probably be done better.
    function _link_comp(str1, str2){

	// Decompose links and arguments.
	var tmp1 = str1.split('?');
	var head1 = '';
	var args1 = [];
	if( ! tmp1[1] ){ // nothing before '?'
	    args1 = tmp1[0].split('&');
	}else{ // normal structure
	    head1 = tmp1[0];
	    args1 = tmp1[1].split('&');
	}
	var sorted_args1 = args1.sort();

	var tmp2 = str2.split('?');
	var head2 = '';
	var args2 = [];
	if( ! tmp2[1] ){ // nothing before '?'
	    args2 = tmp2[0].split('&');
	}else{ // normal structure
	    head2 = tmp2[0];
	    args2 = tmp2[1].split('&');
	}
	var sorted_args2 = args2.sort();

	// var tmp2 = str2.split('?');
	// var head2 = tmp2[0];
	// var args2 = tmp2[1].split('&');
	// var sorted_args2 = args2.sort();

	// Compare heads and arguments.
	var retval = false;
	if( head1 == head2 &&
	    _same_array(sorted_args1, sorted_args2) ){
	    retval = true;
	}
	return retval;
    }

    // Walk through the list and see if it's there.
    // If compareator is not defined, just to atom comparison.
    function _in_list(in_item, list, comparator){

	var retval = false;
	for(var li = 0; li < list.length; li++ ){
	    var list_item = list[li];

	    if( comparator ){
		var comp_op = comparator(in_item, list_item);
		if( comp_op && comp_op == true ){
		    retval = true;
		}
	    }else{
		if( in_item == list_item ){
		    retval = true;
		}
	    }
	}

	return retval;
    }

    // Basically asking if you can make the target string from the
    // base string with the add_str added into it somewhere. Strange,
    // but another way of looking at URL creation in some cases.
    function _is_string_embedded(target_str, base_str, add_str){

	// Walk through all of ways of splitting base_str and add
	// add_str in there to see if we get the target_str.
	var retval = false;
	for(var si = 0; si <= base_str.length; si++ ){
	    
	    var car = base_str.substr(0, si);
	    var cdr = base_str.substr(si, base_str.length);
	    //print(car + "|" + add_str + "|" + cdr);
	    if( car + add_str + cdr == target_str){
		retval = true;
		break;
	    }
	}
	return retval;
    }

    ///
    /// End-user comparisions and assertions.
    ///

    /*
     * Function: is_same_atom
     *
     * Test whether two atoms are the same.
     *
     * Parameters: 
     *  question - the atom to test
     *  answer - the expected atom
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    function _is_simple_same(question, answer, msg){
	_complete(question == answer, msg);
    }
    this.is_same_atom = _is_simple_same;

    /*
     * Function: is_different_atom
     *
     * A negative version of <is_same_atom>.
     *
     * Parameters: 
     *  question - the atom to test
     *  answer - the unexpected atom
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_atom = function(question, answer, msg){
	_complete(question != answer, msg);
    };

    /*
     * Function: is_defined
     *
     * Test whether a value is defined.
     *
     * Parameters: 
     *  thing - the value to test for being defined
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_defined = function(thing, msg){
	if( thing ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_not_defined
     *
     * A negative version of <is_defined>.
     *
     * Parameters: 
     *  thing - the value to test for being undefined
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_not_defined = function(thing, msg){
	if( thing ){
	    _complete(false, msg);
	}else{
	    _complete(true, msg);
	}
    };

    /*
     * Function: is_true
     *
     * Test whether a value is true.
     *
     * Parameters: 
     *  bool - the variable to test
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_true = function(bool, msg){
	if( bool == true ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_false
     *
     * A negative version of <is_true>.
     *
     * Parameters: 
     *  bool - the variable to test
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_false = function(bool, msg){
	if( bool == false ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_x_greater_than_y
     *
     * Test whether one value is greate than another. Uses the
     * standard ">" operator.
     *
     * Parameters: 
     *  x_thing - the expected greater value
     *  y_thing - the expected lesser value
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_x_greater_than_y = function(x_thing, y_thing, msg){
	if( x_thing > y_thing ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_same_url
     *
     * Test whether two links are functionally equivalent.
     *
     * Parameters: 
     *  link1 - url
     *  link2 - url
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_same_url = function(link1, link2, msg){
	_complete(_link_comp(link1, link2), msg);
    };    

    /*
     * Function: is_different_url
     *
     * A negative version of <is_same_url>.
     *
     * Parameters: 
     *  link1 - url
     *  link2 - url
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_url = function(link1, link2, msg){
	_complete(! _link_comp(link1, link2), msg);
    };    

    // /*
    //  * Function: is_same_url_by_assembly
    //  *
    //  * Test whether two URLs are functionally equivalent.
    //  *
    //  * Parameters: 
    //  *  link - url
    //  *  base - string
    //  *  psuedo_assembly - hash 
    //  *  msg - *[optional]* informational message about test
    //  *
    //  * Returns: 
    //  *  n/a
    //  */
    // function _psuedo_assmble(assembly){
    // 	var retval = '';
    // 	for( var k2 in hash2 ){
    // 	return retval;
    // }
    // this.is_same_url_by_assembly = function(link, base,
    // 					    psuedo_assembly, msg){
    // 	_complete(_link_comp(link,
    // 			     base + bbop.core.get_assemble(assembly)),
    // 		  msg);
    // };    

    /*
     * Function: is_same_set
     *
     * Test whether two sets (as atomic arrays) are the same.
     *
     * Parameters: 
     *  set1 - set (as array)
     *  set2 - set (as array)
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_same_set = function(set1, set2, msg){
	_complete(_same_set(set1, set2), msg);
    };

    /*
     * Function: is_different_set
     *
     * A negative version of <is_same_set>.
     *
     * Parameters: 
     *  set1 - set (as array)
     *  set2 - set (as array)
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_set = function(set1, set2, msg){
	_complete(! _same_set(set1, set2), msg);
    };

    /*
     * Function: is_same_hash
     *
     * Test whether two simple atomic hashes are the same.
     *
     * Parameters: 
     *  hash1 - hash
     *  hash2 - hash
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_same_hash = function(hash1, hash2, msg){
	_complete(_same_hash(hash1, hash2), msg);
    };

    /*
     * Function: is_different_hash
     *
     * A negative version of <is_same_hash>.
     *
     * Parameters: 
     *  hash1 - hash
     *  hash2 - hash
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_hash = function(hash1, hash2, msg){
	_complete(! _same_hash(hash1, hash2), msg);
    };

    /*
     * Function: is_in_list
     *
     * Test whether an item is in a list (array).
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_in_list = function(item, list, msg){
	_complete(_in_list(item, list), msg);
    };

    /*
     * Function: is_not_in_list
     *
     * A negative version of <is_in_list>.
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_not_in_list = function(item, list, msg){
	_complete(! _in_list(item, list), msg);
    };

    /*
     * Function: is_in_list_diy
     *
     * A DIY version of is_in_list. In this case, you can pass your
     * own comparison function to check the item against the list.
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  comp - the comparison function; like: function(in_item, list_item){...}
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_in_list_diy = function(item, list, comp, msg){
	_complete(_in_list(item, list, comp), msg);
    };

    /*
     * Function: is_not_in_list_diy
     *
     * A negative version of <is_in_list_diy>.
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  comp - the comparison function; like: function(in_item, list_item){...}
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_not_in_list_diy = function(item, list, comp, msg){
	_complete(! _in_list(item, list, comp), msg);
    };

    /*
     * Function: is_string_embedded
     *
     * Test whether a target string (target_str) can be made by
     * embedding a string (added_str) into a base string (base_str).
     * 
     * Useful in certain cases when checking URLs.
     *
     * Parameters: 
     *  target_str - the value to test
     *  base_str - the expected value
     *  added_str - the expected value
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_string_embedded = function(target_str, base_str, added_str, msg){
	_complete(_is_string_embedded(target_str, base_str, added_str), msg);
    };

    /*
     * Function: is_string_not_embedded
     *
     * A negative version of <is_string_embedded>.
     *
     * Parameters: 
     *  target_str - the value to test
     *  base_str - the expected value
     *  added_str - the expected value
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_string_not_embedded =
	function(target_str, base_str, added_str, msg){
	    _complete(! _is_string_embedded(target_str, base_str, added_str),
		      msg);
	};

    /*
     * Function: pass
     *
     * Always return test as true--useful when testing using control
     * structures and the like.
     *
     * Parameters: 
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.pass = function(msg){
	_complete(true, msg);
    };

    /*
     * Function: fail
     *
     * Always return test as false--useful when testing using control
     * structures and the like.
     *
     * Parameters: 
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.fail = function(msg){
	_complete(false, msg);
    };
};
/* 
 * Package: version.js
 * 
 * Namespace: bbop.version
 * 
 * This package was automatically generated during the build process
 * and contains its version information--this is the release of the
 * API that you have.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.version == "undefined" ){ bbop.version = {}; }

/*
 * Variable: revision
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 */
bbop.version.revision = "2.1.1";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
bbop.version.release = "20140616";
/*
 * Package: logger.js
 * 
 * Namespace: bbop.logger
 * 
 * BBOP JS logger object. Using .kvetch(), you can automatically log a
 * message in almost any environment you find yourself in--browser,
 * server wherever. Also, if you have jQuery available and an element
 * with the id "bbop-logger-console-textarea",
 * "bbop-logger-console-text", or "bbop-logger-console-html", the
 * logger will append to that element (with a "\n" (autoscroll), "\n",
 * or "<br />" terminator respectively) instead.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: logger
 * 
 * Arguments: (optional) initial context.
 */
bbop.logger = function(initial_context){

    /*
     * Variable: DEBUG 
     * 
     * Different debugging available per object. Externally toggle
     * between true and false to switch on and off the logging.
     */
    this.DEBUG = false;

    var anchor = this;

    // Define an optional context to tag onto the front of messages.
    this._context = [];
    if( initial_context ){
	this._context = [initial_context];
    }

    /*
     * Function: reset_context
     * 
     * Define the ability to reset the contex.
     * 
     * Arguments:
     *  new_initial_context - (optional) New context to start with.
     */
    this.reset_context = function(new_initial_context){
	if( new_initial_context ){
	    this._context = [new_initial_context];
	}else{
	    this._context = [];	    
	}
    };

    /*
     * Function: push_context
     * 
     * Add an additional logging context to the stack.
     * 
     * Arguments:
     *  new_context - New context to add to the context stack.
     */
    this.push_context = function(new_context){
	this._context.push(new_context);
    };

    /*
     * Function: pop_context
     * 
     * Remove the last context if it's there.
     */
    this.pop_context = function(){
	var popped_context = null;
	if( this._context.length > 0 ){
	    popped_context = this._context.pop();
	}
	return popped_context;
    };

    // Generalizer console (or whatever) printing.
    this._console_sayer = function(){};

    // // Check for: Opera, FF, Safari, Chrome, console, etc.
    // if( typeof(jQuery) != 'undefined' &&
    // 	jQuery('#' + 'bbop-logger-console-textarea') != 'undefined' ){
    // 	    // Our own logging console takes precedence. 
    // 	    this._console_sayer = function(msg){
    // 		var area = jQuery('#'+ 'bbop-logger-console-textarea');
    // 		area.append(msg + "\n");
    // 		try{
    // 		    area.scrollTop(area[0].scrollHeight);
    // 		} catch (x) {
    // 		    // could scroll
    // 		}
    // 	    };
    // }else if( typeof(jQuery) != 'undefined' &&
    // 	jQuery('#' + 'bbop-logger-console-text') != 'undefined' &&
    // 	jQuery('#' + 'bbop-logger-console-text').length != 0 ){
    // 	    // Our own logging console takes precedence. 
    // 	    this._console_sayer = function(msg){
    // 		jQuery('#' + 'bbop-logger-console-text').append(msg + "\n");
    // 	    };
    // }else
    if( typeof(jQuery) != 'undefined' &&
	jQuery('#' + 'bbop-logger-console-html') != 'undefined' &&
	jQuery('#' + 'bbop-logger-console-html').length ){
	    // Our own logging console takes precedence. 
	    this._console_sayer = function(msg){
		var area = jQuery('#'+ 'bbop-logger-console-html');
		area.append(msg + "<br />");
		try{
    		    area.scrollTop(area[0].scrollHeight);
		} catch (x) {
		    // could scroll
		}
		//jQuery('#' + 'bbop-logger-console-html').append(msg + "<br />");
	    };
    }else if( typeof(console) != 'undefined' &&
	      typeof(console.log) == 'function' ){
	// This may be okay for Chrome and a subset of various console
	// loggers. This should now include FF's Web Console and NodeJS.
	//this._console_sayer = function(msg){ console.log(msg + "\n"); };
	// These usually seem to have "\n" incorporated now.
	this._console_sayer = function(msg){ console.log(msg); };
    }else if( typeof(opera) != 'undefined' &&
	typeof(opera.postError) == 'function' ){
	// If Opera is in there, probably Opera.
	this._console_sayer = function(msg){ opera.postError(msg + "\n"); };
    }else if( typeof(window) != 'undefined' &&
	      typeof(window.dump) == 'function' ){
	// From developer.mozilla.org: To see the dump output you have
	// to enable it by setting the preference
	// browser.dom.window.dump.enabled to true. You can set the
	// preference in about:config or in a user.js file. Note: this
	// preference is not listed in about:config by default, you
	// may need to create it (right-click the content area -> New
	// -> Boolean).
	this._console_sayer = function(msg){ dump( msg + "\n"); };
    }else if( typeof(window) != 'undefined' &&
	      typeof(window.console) != 'undefined' &&
	      typeof(window.console.log) == 'function' ){
	// From developer.apple.com: Safari's "Debug" menu allows you
	// to turn on the logging of JavaScript errors. To display the
	// debug menu in Mac OS X, open a Terminal window and type:
	// "defaults write com.apple.Safari IncludeDebugMenu 1" Need
	// the wrapper function because safari has personality
	// problems.
	this._console_sayer = function(msg){ window.console.log(msg + "\n"); };
    }else if( typeof(build) == 'function' &&
	      typeof(getpda) == 'function' &&
	      typeof(pc2line) == 'function' &&
	      typeof(print) == 'function' ){
	// This may detect SpiderMonkey on the comand line.
	this._console_sayer = function(msg){ print(msg); };
    }else if( typeof(org) != 'undefined' &&
	      typeof(org.rhino) != 'undefined' &&
	      typeof(print) == 'function' ){
	// This may detect Rhino on the comand line.
	this._console_sayer = function(msg){ print(msg); };
    }
    
    /*
     * Function: kvetch
     * 
     * Log a string to somewhere. Also return a string to (mostly for
     * the unit tests).
     * 
     * Arguments:
     *  string - The string to print out to wherever we found.
     */
    this.kvetch = function(string){
	var ret_str = null;
	if( anchor.DEBUG == true ){

	    // Make sure there is something there no matter what.
	    if( typeof(string) == 'undefined' ){ string = ''; }

	    // Redefined the string a little if we have contexts.
	    if( anchor._context.length > 0 ){
		var cstr = anchor._context.join(':');
		string = cstr + ': '+ string;
	    }

	    // Actually log to the console.
	    anchor._console_sayer(string);

	    // Bind for output.
	    ret_str = string;
	}
	return ret_str;
    };
};
/* 
 * Package: json.js
 * 
 * Namespace: bbop.json
 * 
 * JSON stringifying and parsing capabilities.  This package is a
 * small modification of json2.js (in the Public Domain from
 * https://raw.github.com/douglascrockford/JSON-js/master/json2.js and
 * http://json.org) to fit in a little more with the style of BBOP
 * JS. As well, the Date prototypes were removed. See json2.js in the
 * source directory for this package for the original.
 * 
 * As much of the original documentation and structure was kept as
 * possible while converting to Naturaldocs and the bbop namespace.
 * 
 * Purpose: Ensure that JSON parsing capabilites exist on all
 * platforms that BBOP JS runs on.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.json == "undefined" ){ bbop.json = {}; }

/*
 * Function: stringify
 * 
 * This method produces a JSON text from a JavaScript value.
 * 
 * When an object value is found, if the object contains a toJSON
 * method, its toJSON method will be called and the result will be
 * stringified. A toJSON method does not serialize: it returns the
 * value represented by the name/value pair that should be serialized,
 * or undefined if nothing should be serialized. The toJSON method
 * will be passed the key associated with the value, and this will be
 * bound to the value.

 * For example, this would serialize Dates as ISO strings.
 * 
 * : Date.prototype.toJSON = function (key) {
 * :         function f(n) {
 * :               // Format integers to have at least two digits.
 * :                    return n < 10 ? '0' + n : n;
 * :                }
 * :
 * :                return this.getUTCFullYear()   + '-' +
 * :                  f(this.getUTCMonth() + 1) + '-' +
 * :                     f(this.getUTCDate())      + 'T' +
 * :                     f(this.getUTCHours())     + ':' +
 * :                     f(this.getUTCMinutes())   + ':' +
 * :                     f(this.getUTCSeconds())   + 'Z';
 * :            };
 * 
 * You can provide an optional replacer method. It will be passed the
 * key and value of each member, with this bound to the containing
 * object. The value that is returned from your method will be
 * serialized. If your method returns undefined, then the member will
 * be excluded from the serialization.
 * 
 * If the replacer parameter is an array of strings, then it will be
 * used to select the members to be serialized. It filters the results
 * such that only members with keys listed in the replacer array are
 * stringified.
 * 
 * Values that do not have JSON representations, such as undefined or
 * functions, will not be serialized. Such values in objects will be
 * dropped; in arrays they will be replaced with null. You can use
 * a replacer function to replace those with JSON values.
 * JSON.stringify(undefined) returns undefined.
 * 
 * The optional space parameter produces a stringification of the
 * value that is filled with line breaks and indentation to make it
 * easier to read.
 * 
 * If the space parameter is a non-empty string, then that string will
 * be used for indentation. If the space parameter is a number, then
 * the indentation will be that many spaces. For example:
 * 
 * : text = JSON.stringify(['e', {pluribus: 'unum'}]);
 * : // text is '["e",{"pluribus":"unum"}]'
 * : 
 * : text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
 * : // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
 * :
 * : text = JSON.stringify([new Date()], function (key, value) {
 * :          return this[key] instanceof Date ?
 * :                 'Date(' + this[key] + ')' : value;
 * :  });
 * :  // text is '["Date(---current time---)"]'
 *
 * Parameters:
 *  value - any JavaScript value, usually an object or array.
 *  replacer - an optional parameter that determines how object values are stringified for objects. It can be a function or an array of strings.
 *  space - an optional parameter that specifies the indentation of nested structures. If it is omitted, the text will be packed without extra whitespace. If it is a number, it will specify the number of spaces to indent at each level. If it is a string (such as '\t' or '&nbsp;'), it contains the characters used to indent at each level.
 * 
 * Returns: string
 */

/*
 * Function: parse
 * (text, reviver)
 * 
 * This method parses a JSON text to produce an object or array.
 * It can throw a SyntaxError exception.
 * 
 * The optional reviver parameter is a function that can filter and
 * transform the results. It receives each of the keys and values,
 * and its return value is used instead of the original value.
 * If it returns what it received, then the structure is not modified.
 * If it returns undefined then the member is deleted. For example:
 * 
 * : // Parse the text. Values that look like ISO date strings will
 * : // be converted to Date objects.
 * :
 * : myData = JSON.parse(text, function (key, value) {
 * :     var a;
 * :     if (typeof value === 'string') {
 * :         a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 * :         if (a) {
 * :             return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
 * :                 +a[5], +a[6]));
 * :         }
 * :     }
 * :     return value;
 * : });
 * :
 * : myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
 * :     var d;
 * :     if (typeof value === 'string' &&
 * :             value.slice(0, 5) === 'Date(' &&
 * :             value.slice(-1) === ')') {
 * :         d = new Date(value.slice(5, -1));
 * :                   if (d) {
 * :             return d;
 * :         }
 * :     }
 * :     return value;
 * : });
 * 
 * Parameters:
 *  text - the string to parse to a JavaScript entity.
 *  reviver - *[optional]* optional transforming function for modifying results; see the documentation above for more details.
 * 
 * Returns: well, pretty much anything you put in...
 */

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

(function () {
    //'use strict';

    // function f(n) {
    //     // Format integers to have at least two digits.
    //     return n < 10 ? '0' + n : n;
    // }

    // if (typeof Date.prototype.toJSON !== 'function') {

    //     Date.prototype.toJSON = function (key) {

    //         return isFinite(this.valueOf())
    //             ? this.getUTCFullYear()     + '-' +
    //                 f(this.getUTCMonth() + 1) + '-' +
    //                 f(this.getUTCDate())      + 'T' +
    //                 f(this.getUTCHours())     + ':' +
    //                 f(this.getUTCMinutes())   + ':' +
    //                 f(this.getUTCSeconds())   + 'Z'
    //             : null;
    //     };

    //     String.prototype.toJSON      =
    //         Number.prototype.toJSON  =
    //         Boolean.prototype.toJSON = function (key) {
    //             return this.valueOf();
    //         };
    // }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

//    if (typeof bbop.json.stringify !== 'function') {
        bbop.json.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('bbop.json.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
//    }


// If the JSON object does not yet have a parse method, give it one.

//    if (typeof bbop.json.parse !== 'function') {
        bbop.json.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('bbop.json.parse: ' + text);
        };
//    }
}());
/*
 * Package: template.js
 * 
 * Namespace: bbop.template
 * 
 * BBOP JS template object/enginette.
 * 
 * Some (nonsensical) usage is like:
 * 
 * : var tt = new bbop.template("{{foo}} {{bar}} {{foo}}");
 * : 'A B A' == tt.fill({'foo': 'A', 'bar': 'B'});
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: template
 * 
 * Arguments:
 *  template_string - the string template to use for future fill calls
 * 
 * Returns:
 *  self
 */
bbop.template = function(template_string){
    this.is_a = 'bbop.template';

    var anchor = this;

    anchor._template_string = template_string;

    // First break the template string into ordered sections which we
    // will interleve later.
    var split_re = /\{\{[A-Za-z0-9_-]+\}\}/;
    anchor._template_split_strings =
	template_string.split(split_re);

    // Now map out which variables are at which locations.
    var var_id_re = /\{\{[A-Za-z0-9_-]+\}\}/g;
    anchor._var_id_matches =
	template_string.match(var_id_re);
    // Trim off the '{{' and '}}' from the matches.
    bbop.core.each(anchor._var_id_matches,
		  function(item, index){
		      var new_item = item.substring(2, item.length -2);
		      anchor._var_id_matches[index] = new_item;
		  });

    /*
     * Function: fill
     * 
     * Fill the template with the corresponding hash items. Undefined
     * variables are replaced with ''.
     * 
     * Arguments:
     *  fill_hash - the template with the hashed values
     * 
     * Returns:
     *  string
     */
    this.fill = function(fill_hash){
	var ret_str = '';

	bbop.core.each(anchor._template_split_strings,
		       function(str, index){

			   // Add the next bit.
			   ret_str += str;

			   // Add the replacement value if we can make
			   // sense of it.
			   if( index < anchor._var_id_matches.length ){
			       var use_str = '';
			       var varname = anchor._var_id_matches[index];
			       if( varname &&
				   bbop.core.is_defined(fill_hash[varname]) ){
				   use_str = fill_hash[varname];
			       }
			       ret_str += use_str;
			   }
		       });

	return ret_str;
    };

    /*
     * Function: variables
     * 
     * Return a hash of the variables used in the template.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  a hash like: {'foo': true, 'bar': true, ...}
     */
    this.variables = function(){
	return bbop.core.hashify(anchor._var_id_matches);
    };

};
/*
 * Package: context.js
 * 
 * Namespace: bbop.context
 * 
 * This package contains an often used set of tools to tease apart a
 * specially structured hash to get things like readable names and
 * colors.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: context
 * 
 * Initial take from go-mme/js/bbop-mme-context.js
 * 
 * Arguments:
 *  entities - a hash defining all of the properties to unscramble
 * default_color - the color to use when a color cannot be found (#800800)
 * 
 * Returns:
 *  aiding object
 */

bbop.context = function(entities, default_color){
    
    // Make sure some kind of color is there.
    if( ! default_color ){
	default_color = '#808080'; // grey
    }
    
    // Compile entity aliases.
    var entity_aliases = {};
    bbop.core.each(entities,
		   function(ekey, eobj){
		       entity_aliases[ekey] = ekey; // identity
		       bbop.core.each(eobj['aliases'],
				      function(alias){
					  entity_aliases[alias] = ekey;
				      });
		   });

    // Helper fuction to go from unknown id -> alias -> data structure.
    this._dealias_data = function(id){
	
	var ret = null;
	if( id ){
	    if( entity_aliases[id] ){ // directly pull
		var tru_id = entity_aliases[id];
		ret = entities[tru_id];
	    }
	}

	return ret;
    };

    /* 
     * Function: readable
     *
     * Returns a human readable form of the inputted string.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  readable string or original string
     */
    this.readable = function(ind){
	var ret = ind;

	var data = this._dealias_data(ind);
	if( data && data['readable'] ){
	    ret = data['readable'];
	}
	
	return ret;
    };

    /* 
     * Function: color
     *
     * Return the string of a color of a rel.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or 'grey'
     */
    this.color = function(ind){
	
	var ret = default_color;

	var data = this._dealias_data(ind);
	if( data && data['color'] ){
	    ret = data['color'];
	}
	
	return ret;
    };

    /* 
     * Function: relation_glyph
     *
     * Return the string indicating the glyph to use for the edge marking.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or null
     */
    this.glyph = function(ind){
	
	var ret = null; // default

	var data = this._dealias_data(ind);
	if( data && data['glyph'] ){
	    ret = data['glyph'];
	}
	
	return ret;
    };

    /* 
     * Function: priority
     *
     * Return a number representing the relative priority of the
     * entity under consideration.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate integer or 0
     */
    this.priority = function(ind){
	
	var ret = 0;

	var data = this._dealias_data(ind);
	if( data && data['priority'] ){
	    ret = data['priority'];
	}
	
	return ret;
    };

    /* 
     * Function: all_entities
     *
     * Return a list of the currently known entities.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_entities = function(){	
	var rls = bbop.core.get_keys(entities);
	return rls;
    };

    /* 
     * Function: all_known
     *
     * Return a list of the currently known entities and their aliases.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_known = function(){	
	var rls = bbop.core.get_keys(entity_aliases);
	return rls;
    };
};
/*
 * Package: logic.js
 * 
 * Namespace: bbop.logic
 * 
 * BBOP object to try and take some of the pain out of managing the
 * boolean logic that seems to show up periodically. Right now mostly
 * aimed at dealing with Solr/GOlr.
 * 
 * Anatomy of a core data bundle.
 * 
 * : data_bundle => {op: arg}
 * : op => '__AND__', '__OR__', '__NOT__'
 * : arg => <string>, array, data_bundle
 * : array => [array_item*]
 * : array_item => <string>, data
 * 
 * Example:
 * 
 * : {and: [{or: ...}, {or: ...}, {and: ...} ]}
 * : var filters = {'and': []};
 *
 * TODO: parens between levels
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: logic
 * 
 * Contructor for the bbop.logic object. NOTE: during processing,
 * binary operators with a single argument cease to exist as they will
 * never make it to output.
 * 
 * Arguments:
 *  default_conjuntion - *[optional]* "and" or "or"; defaults to "and"
 * 
 * Returns:
 *  bbop logic object
 */
bbop.logic = function(default_conjunction){
    this._is_a = 'bbop.logic';

    // Add logging.
    var logger = new bbop.logger();
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    var logic_anchor = this;

    // // Handling conjunctions.
    // this._and = '__AND__';
    // this._or = '__OR__';
    // this._not = '__NOT__';
    // function _is_token(possible_token){
    // 	var retval = false;
    // 	if( possible_token == this._and ||
    // 	    possible_token == this._or ||
    // 	    possible_token == this._not ){
    // 	   retval = true; 
    // 	}
    // 	return retval;
    // }
    // // Convert the internal
    // function _usable

    // // Set the internal default conjunction. Default to "and".
    // if( ! default_conjunction ){
    // 	default_conjunction = this._and;
    // }else if( default_conjunction == this._or ){
    // 	default_conjunction = this._or;
    // }else{
    // 	default_conjunction = this._and;
    // }
    if( ! default_conjunction ){
    	default_conjunction = 'and';
    }
    this.default_conjunction = default_conjunction;

    // Set initial state.
    // ie: this._bundle = {'__AND__': []};
    //this._bundle = {};
    //this._bundle[this.default_conjunction] = [];
    // See documentation for empty().
    var _empty = function(){
	logic_anchor._bundle = {};
	logic_anchor._bundle[logic_anchor.default_conjunction] = [];
    };
    _empty();

    /*
     * Function: add
     * 
     * Add to the current stored logic bundle.
     * 
     * Parameters:
     *  item - string or bbop.logic object
     * 
     * Returns:
     *  n/a
     */
    //this.and = function(){
    //this.or = function(){
    //this.not = function(){
    this.add = function(item){

	// Add things a little differently if it looks like a bit of
	// logic.
	if(  bbop.core.what_is(item) == 'bbop.logic' ){
	    this._bundle[this.default_conjunction].push(item._bundle);
	}else{
	    this._bundle[this.default_conjunction].push(item);
	}
    };

    /*
     * Function: negate
     * 
     * Negate the current stored logic.
     * 
     * TODO/BUG: I think this might cause an unreleasable circular
     * reference.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.negate = function(){
	var nega = {};
	nega['not'] = this._bundle;
	this._bundle = nega;
    };
    
    // Walk the data structure...
    this._read_walk = function(data_bundle, in_encoder, lvl){
	
	// The encoder defaults to whatever--no transformations
	var encoder = in_encoder || function(in_out){ return in_out; };

	ll("LRW: with: " + bbop.core.dump(data_bundle));

	// If level is not defined, we just started and we're on level
	// one, the first level.
	var l_enc = '(';
	var r_enc = ')';
	if( typeof(lvl) == 'undefined' ){
	    lvl = 1;
	    l_enc = '';
	    r_enc = '';
	}	

	var read = '';
	
	// The task of walking is broken into the terminal case (a
	// string) or things that we need to operate on (arrays or
	// sub-data_bundles).
	if( bbop.core.what_is(data_bundle) == 'string' ){
	    ll("LRW: trigger string");
	    read = data_bundle;
	}else{
	    ll("LRW: trigger non-string");

	    // Always single op.
	    var op = bbop.core.get_keys(data_bundle)[0];
	    var arg = data_bundle[op];

	    // We can treat the single data_bundle/string case like a
	    // degenerate array case.
	    if( ! bbop.core.is_array(arg) ){
		arg = [arg];
	    }

	    // Recure through the array and join the results with the
	    // current op.
	    //ll('L: arg: ' + bbop.core.what_is(arg));
	    var stack = [];
	    bbop.core.each(arg, function(item, i){
			       stack.push(logic_anchor._read_walk(item,
								  encoder,
								  lvl + 1));
			   });

	    // Slightly different things depending on if it's a unary
	    // or binary op.
	    if( op == 'not' ){
		// TODO: I believe that it should no be possible
		// (i.e. policy by code) to have a 'not' with more
		// that a single argument.
		read = op + ' ' + stack.join('');
	    }else{
		read = l_enc + stack.join(' ' + op + ' ') + r_enc;
	    }
	}

	
	ll("LRW: returns: " + read);
	return read;
    };

    /*
     * Function: to_string
     * 
     * Dump the current data out to a string.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.to_string = function(){
	return logic_anchor._read_walk(logic_anchor._bundle);
    };

    /*
     * Function: url
     * 
     * TODO
     * 
     * Dump the current data out to a URL.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.url = function(){
	return logic_anchor._read_walk(logic_anchor._bundle);
    };

    /*
     * Function: empty
     * 
     * Empty/reset self.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    // Staggered declaration so I can use it above during initialization.
    this.empty = _empty;

    /*
     * Function: parse
     * 
     * TODO: I think I can grab the shunting yard algorithm for a
     * similar problem in the old AmiGO 1.x codebase.
     * 
     * Parse an incoming string into the internal data structure.
     * 
     * Parameters:
     *  in_str - the incoming string to parse
     * 
     * Returns:
     *  n/a
     */
    this.parse = function(in_str){
	return null;
    };

};
/* 
 * Package: registry.js
 * 
 * Namespace: bbop.registry
 * 
 * BBOP generic lightweight listener/callback registry system.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: registry
 * 
 * Contructor for BBOP registry. Takes a list of event categories as
 * strings.
 * 
 * Arguments:
 *  evt_list - a list of strings that identify the events to be used
 * 
 * Returns:
 *  bbop registry object
 */
bbop.registry = function(evt_list){
    this._is_a = 'bbop.registry';

    var registry_anchor = this;

    // Handle the registration of call functions to get activated
    // after certain events.
    this.callback_registry = {};
    bbop.core.each(evt_list, function(item, i){
		       registry_anchor.callback_registry[item] = {};
		   });
    
    /*
     * Function: register
     *
     * Add the specified function from the registry, with an optional
     * relative priority against other callback functions.
     *
     * The in_priority value is relative to others in the category,
     * with a higher priority...getting priority.
     * 
     * Parameters: 
     *  category - string; one of the pre-defined categories
     *  function_id - string; a unique string to identify a function
     *  in_function - function
     *  in_priority - *[optional]* number
     *
     * Returns: 
     *  n/a
     * 
     * See also:
     *  <apply>
     */
    this.register = function(category, function_id, in_function, in_priority){

	// Only these categories.
	if( typeof(registry_anchor.callback_registry[category]) == 'undefined'){
	    throw new Error('cannot register, unknown category');
	}

	// The default priority is 0.
	var priority = 0;
	if( in_priority ){ priority = in_priority; }

	registry_anchor.callback_registry[category][function_id] =
	    {
		runner: in_function,
		priority: priority
	    };
    };

    /*
     * Function: is_registered
     *
     * Returns whether or not an id has already been registered to a
     * category. Will return null if the category does not exist.
     * 
     * Parameters: 
     *  category - string; one of the pre-defined categories
     *  function_id - string; a unique string to identify a function
     *
     * Returns: 
     *  true, false, or null
     */
    this.is_registered = function(category, function_id){

	var retval = null;

	var anc = registry_anchor.callback_registry;

	//
	if( typeof(anc[category]) != 'undefined'){
	    
	    retval = false;

	    if( typeof(anc[category][function_id]) != 'undefined'){
		retval = true;
	    }
	}

	return retval;
    };

    /*
     * Function: unregister
     *
     * Remove the specified function from the registry. Must specify a
     * legitimate category and the function id of the function in it.
     *
     * Parameters: 
     *  category - string
     *  function_id - string
     *
     * Returns: 
     *  boolean on whether something was unregistered
     */
    this.unregister = function(category, function_id){
	var retval = false;
	if( registry_anchor.callback_registry[category] &&
	    registry_anchor.callback_registry[category][function_id] ){
		delete registry_anchor.callback_registry[category][function_id];
		retval = true;
            }
	return retval;
    };
    
    /*
     * Function: get_callbacks
     *
     * Generic getter for callback functions, returns by priority.
     *
     * Parameters: 
     *  category - string
     *
     * Returns: 
     *  an ordered (by priority) list of function_id strings
     */
    this.get_callbacks = function(category){

	var cb_id_list =
	    bbop.core.get_keys(registry_anchor.callback_registry[category]);
	// Sort callback list according to priority.
	var ptype_registry_anchor = this;
	cb_id_list.sort(
	    function(a, b){  
		var pkg_a =
		    ptype_registry_anchor.callback_registry[category][a];
		var pkg_b =
		    ptype_registry_anchor.callback_registry[category][b];
		return pkg_b['priority'] - pkg_a['priority'];
	    });
	
	// Collect the actual stored functions by priority.
	var cb_fun_list = [];
	for( var cbi = 0; cbi < cb_id_list.length; cbi++ ){
	    var cb_id = cb_id_list[cbi];
	    var to_run =
		registry_anchor.callback_registry[category][cb_id]['runner'];
	    cb_fun_list.push(to_run);
	    // ll('callback: ' + category + ', ' + cb_id + ', ' +
	    //    this.callback_registry[category][cb_id]['priority']);
	}
	
	return cb_fun_list;
    };

    /*
     * Function: apply_callbacks
     *
     * Generic runner for prioritized callbacks with various arguments
     * and an optional change in context..
     *
     * Parameters: 
     *  category - string
     *  arg_list - a list of arguments to pass to the function in the category
     *  context - *[optional]* the context to apply the arguments in
     *
     * Returns: 
     *  n/a
     */
    this.apply_callbacks = function(category, arg_list, context){

	// Run all against registered functions.
	var callbacks = registry_anchor.get_callbacks(category);
	for( var ci = 0; ci < callbacks.length; ci++ ){
	    var run_fun = callbacks[ci];
	    //run_fun(arg_list);
	    run_fun.apply(context, arg_list);
	}
    };
};
/* 
 * Package: html.js
 * 
 * Namespace: bbop.html
 * 
 * Right now contains bbop.html.tag, but all html producing functions
 * should go in here somewhere.
 * 
 * All bbop.html implement the interface:
 *  .to_string(): returns a string of you and below
 *  .add_to(): add things between the tags
 *  .empty(): empties all things between the tags
 *  .get_id(): return the id or null if not defined
 * These are enforced during the tests.
 * 
 * For functions that take attribute hashes, there is a special
 * attribute {'generate_id': true} that will generate a somewhat
 * random id if an incoming id was not already specified. This id can
 * be retrieved using get_id().
 * 
 * This package takes all of the bbop.html.* namespace.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.html == "undefined" ){ bbop.html = {}; }
if ( typeof bbop.html.tag == "undefined" ){ bbop.html.tag = {}; }
if ( typeof bbop.html.accordion == "undefined" ){ bbop.html.accordion = {}; }
if ( typeof bbop.html.list == "undefined" ){ bbop.html.list = {}; }
if ( typeof bbop.html.input == "undefined" ){ bbop.html.input = {}; }
if ( typeof bbop.html.img == "undefined" ){ bbop.html.img = {}; }

/*
 * Namespace: bbop.html.tag
 * 
 * Constructor: tag
 * 
 * Create the fundamental tag object to work with and extend.
 * 
 * Parameters:
 *  tag - the tag name to be created
 *  attrs - *[serially optional]* the typical attributes to add
 *  below - *[optional]* a list/array of other html objects that exists "between" the tags
 * 
 * Returns:
 *  bbop.html.tag object
 */
bbop.html.tag = function(tag, attrs, below){
    this._is_a = 'bbop.html.tag';

    // Arg check--attrs should be defined as something.
    if( ! attrs ){
	attrs = {};
    }else{
	// Prevent sharing of structure.
	attrs = bbop.core.clone(attrs);
    }

    // Generate (or not) id if it was requested.
    if( ! bbop.core.is_defined(attrs['id']) &&
	bbop.core.is_defined(attrs['generate_id']) &&
	bbop.core.is_defined(attrs['generate_id']) == true ){
	    // Add a real id.
	    attrs['id'] = 'gen_id-bbop-html-'+ bbop.core.randomness(20);
	    // Remove the 'generated_id' property.
	    delete attrs['generate_id'];
	}
    this._attrs = attrs;
    
    // Arg check--below should be some kind of an array.
    if( ! below ){
	below = [];
    }else if( bbop.core.is_array(below) ){
	// do nothing
    }else{
	// hopefully a bbop.html.tag then
	below = [below];
    }

    // Accumulate the incoming attributes if there are any.
    var additional_attrs = '';
    bbop.core.each(this._attrs, function(in_key, in_val){
		       additional_attrs = additional_attrs + ' ' +
			   in_key + '="' + in_val + '"';
		   });

    this._car = '<' + tag + additional_attrs + '>';
    this._cdr = '</' + tag + '>';
    this._contents = below;
    this._singleton = '<' + tag + additional_attrs + ' />';
};

/*
 * Function: to_string
 * 
 * Convert a tag object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.tag.prototype.to_string = function(){
    var acc = '';
    bbop.core.each(this._contents,
		   function(item, i){
		       // if( typeof(item) == 'string' ){
		       // 	   acc = acc + item;
		       // }else if( typeof(item['to_string']) == 'function' ){
		       // 	   acc = acc + item.to_string();
		       // }else{
		       // 	   throw new Error('No to_string for (' +
		       // 			   bbop.core.what_is(item) +
		       // 			   ') ' + item);
		       // }
		       acc = acc + bbop.core.to_string(item);
		   });
    
    // Special return case if there are no children (to prevent
    // weirdness for things like br and input).
    var output = this._singleton;
    if( acc != '' ){ output = this._car + acc + this._cdr; }

    return output;
};

/*
 * Function: add_to
 * 
 * Add content between the tags. Order of addition is order of output.
 * 
 * Parameters:
 *  bbop_html_tag_or_string - another tag object or a string (html or otherwise)
 * 
 * Returns: n/a
 */
bbop.html.tag.prototype.add_to = function(bbop_html_tag_or_string){
    this._contents.push(bbop_html_tag_or_string);
};

/*
 * Function: empty
 * 
 * Remove all content between the tags.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.tag.prototype.empty = function(){
    this._contents = [];
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.tag.prototype.get_id = function(){
    var retval = null;
    if( bbop.core.is_defined(this._attrs['id']) ){
	retval = this._attrs['id'];
    }
    return retval;
};

/*
 * Namespace: bbop.html.accordion
 * 
 * Constructor: accordion
 * 
 * Create the a frame for the functional part of a jQuery accordion
 * structure.
 * 
 * :Input:
 * : [[title, string/*.to_string()], ...]
 * :
 * :Output:
 * : <div id="accordion">
 * :  <h3><a href="#">Section 1</a></h3>
 * :  <div>
 * :   <p>
 * :    foo
 * :   </p>
 * :  </div>
 * :  ...
 * : </div>
 * 
 * Parameters:
 *  in_list - accordion frame headers: [[title, string/*.to_string()], ...]
 *  attrs - *[serially optional]* attributes to apply to the new top-level div
 *  add_id_p - *[optional]* true or false; add a random id to each section
 * 
 * Returns:
 *  bbop.html.accordion object
 * 
 * Also see: <tag>
 */
bbop.html.accordion = function(in_list, attrs, add_id_p){
    this._is_a = 'bbop.html.accordion';

    //
    if( typeof(add_id_p) == 'undefined' ){ add_id_p = false; }

    // Arg check--attrs should be defined as something.
    this._attrs = attrs || {};

    // Internal stack always starts with a div.
    this._div_stack = new bbop.html.tag('div', this._attrs);

    this._section_id_to_content_id = {};

    // Iterate over the incoming argument list.
    var accordion_this = this;
    bbop.core.each(in_list, function(item){
		       var sect_title = item[0];
		       var content = item[1];
		       accordion_this.add_to(sect_title, content, add_id_p);
		   });
};

/*
 * Function: to_string
 * 
 * Convert the accordion object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.accordion.prototype.to_string = function(){
    return this._div_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add a contect section to the accordion.
 * 
 * Parameters:
 *  section_info - a string or a hash with 'id', 'label', and 'description'
 *  content_blob - string or bbop.html object to put in a section
 *  add_id_p - *[optional]* true or false; add a random id to the section
 * 
 * Returns: n/a
 */
bbop.html.accordion.prototype.add_to =
    function(section_info, content_blob, add_id_p){

    // If section_info isn't an object, assume it is a string and use
    // it for everything.
    var section_id = null;
    var section_label = null;
    var section_desc = null;
    if(typeof section_info != 'object' ){
	section_id = section_info;
	section_label = section_info;
    }else{
	if( section_info['id'] ){ section_id = section_info['id']; }
	if( section_info['label'] ){ section_label = section_info['label']; }
	if( section_info['description'] ){
	    section_desc = section_info['description'];
	}
    }

    // Add header section.
    //var h3 = new bbop.html.tag('h3', {title: section_desc});
    var h3 = new bbop.html.tag('h3');
    var anc = null;
    if( section_desc ){
	// anc = new bbop.html.tag('a', {href: '#'}, section_label);
	anc = new bbop.html.tag('a', {href: '#', title: section_desc},
				section_label);
    }else{
	anc = new bbop.html.tag('a', {href: '#'}, section_label);
    }
    h3.add_to(anc);
    this._div_stack.add_to(h3);

    var div = null;

    // Generate random id for the div.
    if( typeof(add_id_p) == 'undefined' ){ add_id_p = false; }
    if( add_id_p ){
	var rid = 'accordion-' + section_id + '-' + bbop.core.randomness(20);
	this._section_id_to_content_id[section_id] = rid;    
	div = new bbop.html.tag('div', {'id': rid});	
    }else{
	div = new bbop.html.tag('div');	
    }

    // Add add content stub to section.
   var p = new bbop.html.tag('p', {}, bbop.core.to_string(content_blob));
    div.add_to(p);
    this._div_stack.add_to(div);
};

// // Add a section to the accordion.
// bbop.html.accordion.prototype.add_to_section = function(sect_id, content){
//     var cdiv = this._section_id_to_content_div[sect_id];
//     if( ! cdiv ){
// 	throw new Error('Cannot add to undefined section.');
//     }
// };

/*
 * Function: empty
 * 
 * Empty all sections from the accordion.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.accordion.prototype.empty = function(){
    this._div_stack = new bbop.html.tag('div', this._attrs);
    this._section_id_to_content_id = {};
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.accordion.prototype.get_id = function(){
    return this._div_stack.get_id();
};

/*
 * Function: get_section_id
 * 
 * Get the "real" section id by way of the "convenience" section id?
 * 
 * Parameters:
 *  sect_id - TODO ???
 * 
 * Returns: TODO ???
 */
bbop.html.accordion.prototype.get_section_id = function(sect_id){
	return this._section_id_to_content_id[sect_id];    
};


// // TODO: just empty the contents from an ided section.
// bbop.html.accordion.prototype.empty_section = function(sect_id){
//     var div = this._section_id_to_content_div[sect_id];
//     div.empty();
// };

/*
 * Namespace: bbop.html.list
 * 
 * Constructor: list
 * 
 * Create the a frame for an unordered list object.
 * 
 * :Input:
 * : [string/*.to_string(), ...]
 * :
 * :Output:
 * : <ul id="list">
 * :  <li>foo</li>
 * :   ...
 * : </ul>
 * 
 * Parameters:
 *  in_list - list of strings/bbop.html objects to be li separated
 *  attrs - *[optional]* attributes to apply to the new top-level ul
 * 
 * Returns:
 *  bbop.html.list object
 * 
 * Also see: <tag>
 */
bbop.html.list = function(in_list, attrs){
    this._is_a = 'bbop.html.list';
    
    // Arg check--attrs should be defined as something.
    if( ! attrs ){ attrs = {}; }
    this._attrs = attrs;

    // Internal stack always starts with a ul.
    this._ul_stack = new bbop.html.tag('ul', this._attrs);

    var list_this = this;
    bbop.core.each(in_list, function(item){ list_this.add_to(item); });
};

/*
 * Function: to_string
 * 
 * Convert a list object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.list.prototype.to_string = function(){
    return this._ul_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add a new li section to a list.
 * 
 * Optionally, it can take multiple arguments and will add each of
 * them to the new li tag in turn.
 * 
 * Parameters:
 *  item1 - another tag object or a string (html or otherwise)
 *  item2 - *[optional]* ...on forever
 * 
 * Returns: n/a
 */
bbop.html.list.prototype.add_to = function(){

    // Convert anonymous arguments into an Array.
    var args = Array.prototype.slice.call(arguments); 

    // Cycle through and add them to the accumulator for the new li.
    var li_acc = [];
    bbop.core.each(args,
		   function(arg){
		       li_acc.push(bbop.core.to_string(arg));
		   });

    // Join them and add them to the stack of the encompassing ul.
    var li = new bbop.html.tag('li', {}, li_acc.join(" "));
    this._ul_stack.add_to(li);
};

/*
 * Function: empty
 * 
 * Remove all content (li's) from the list.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.list.prototype.empty = function(){
    this._ul_stack = new bbop.html.tag('ul', this._attrs);
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.list.prototype.get_id = function(){
    return this._ul_stack.get_id();
};

/*
 * Namespace: bbop.html.input
 * 
 * Constructor: input
 * 
 * Create a form input.
 * 
 * Parameters:
 *  attrs - *[optional]* the typical attributes to add
 * 
 * Returns:
 *  bbop.html.input object
 */
bbop.html.input = function(attrs){
    this._is_a = 'bbop.html.input';
    
    // Arg check--attrs should be defined as something.
    if( ! attrs ){ attrs = {}; }
    this._attrs = attrs;

    // Internal stack always starts with a ul.
    this._input_stack = new bbop.html.tag('input', this._attrs);
};

/*
 * Function: to_string
 * 
 * Convert an input into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.input.prototype.to_string = function(){
    return this._input_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add content between the input tags.
 * 
 * Parameters:
 *  item - another tag object or a string (html or otherwise)
 * 
 * Returns: n/a
 */
bbop.html.input.prototype.add_to = function(item){
    this._input_stack.add_to(bbop.core.to_string(item));
};

/*
 * Function: empty
 * 
 * Reset/remove all children.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.input.prototype.empty = function(){
    this._input_stack = new bbop.html.tag('input', this._attrs);
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.input.prototype.get_id = function(){
    return this._input_stack.get_id();
};

/*
 * Namespace: bbop.html.anchor
 * 
 * Constructor: anchor
 * 
 * Create an anchor object. Note: href, title, etc. go through
 * in_attrs.
 * 
 * Parameters:
 *  in_cont - the contents between the "a" tags
 *  in_attrs - *[optional]* the typical attributes to add
 * 
 * Returns:
 *  bbop.html.anchor object
 */
bbop.html.anchor = function(in_cont, in_attrs){
    this._is_a = 'bbop.html.anchor';
    
    // Arg check--attrs should be defined as something.
    this._attrs = in_attrs || {};

    // Internal stack always starts with a ul.
    this._anchor_stack = new bbop.html.tag('a', this._attrs, in_cont);
};

/*
 * Function: to_string
 * 
 * Convert an anchor object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.anchor.prototype.to_string = function(){
    return this._anchor_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add content between the tags. Order of addition is order of output.
 * 
 * Parameters:
 *  item - another tag object or a string (html or otherwise)
 * 
 * Returns: n/a
 */
bbop.html.anchor.prototype.add_to = function(item){
    this._anchor_stack.add_to(item);
};

/*
 * Function: empty
 * 
 * Remove all content between the tags.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.anchor.prototype.empty = function(){
    this._anchor_stack.empty();
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.anchor.prototype.get_id = function(){
    return this._anchor_stack.get_id();
};

/*
 * Namespace: bbop.html.image
 * 
 * Constructor: image
 * 
 * Create an image (img) object. Note: alt, title, etc. go through
 * in_attrs.
 * 
 * Parameters:
 *  in_attrs - *[optional]* the typical attributes to add
 * 
 * Returns:
 *  bbop.html.image object
 */
bbop.html.image = function(in_attrs){
    this._is_a = 'bbop.html.image';
    
    // Arg check--attrs should be defined as something.
    this._attrs = in_attrs || {};

    // Internal stack always starts with a ul.
    this._image_stack = new bbop.html.tag('img', this._attrs);
};

/*
 * Function: to_string
 * 
 * Convert an image object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.image.prototype.to_string = function(){
    return this._image_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add content between the tags. Order of addition is order of output.
 * 
 * Parameters:
 *  item - another tag object or a string (html or otherwise)
 * 
 * Returns: n/a
 */
bbop.html.image.prototype.add_to = function(item){
    this._image_stack.add_to(item);
};

/*
 * Function: empty
 * 
 * Remove all content between the tags.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.image.prototype.empty = function(){
    this._image_stack.empty();
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.image.prototype.get_id = function(){
    return this._image_stack.get_id();
};

/*
 * Namespace: bbop.html.table
 * 
 * Constructor: table
 * 
 * Create a simple table structure.
 * in_headers is necessary, but can be empty.
 * in_entries is necessary, but can be empty.
 * 
 * Parameters:
 *  in_headers - ordered list of headers
 *  in_entries - lists of lists of entry items
 *  in_attrs - *[optional]* the typical attributes to add to the table
 * 
 * Returns:
 *  bbop.html.table object
 */
bbop.html.table = function(in_headers, in_entries, in_attrs){
    this._is_a = 'bbop.html.table';
    
    // Arg check--attrs should be defined as something.
    var headers = in_headers || [];
    var entries = in_entries || [];
    this._attrs = in_attrs || {};

    // Row class count.
    this._count = 0;

    // Internal stack always starts with a table.
    this._table_stack = new bbop.html.tag('table', this._attrs);

    // Only add headers if they exist.
    if( ! bbop.core.is_empty(headers) ){
	var head_row = new bbop.html.tag('tr');
	bbop.core.each(headers,
		       function(header){
			   var th = new bbop.html.tag('th');
			   th.add_to(header);
			   head_row.add_to(th);
		       });
	var head_stack = new bbop.html.tag('thead');
	head_stack.add_to(head_row);
	this._table_stack.add_to(head_stack);
    }

    // Add incoming rows to the body. Keep the body stack around for
    // bookkeeping.
    this._body_stack = new bbop.html.tag('tbody');
    this._table_stack.add_to(this._body_stack);

    var this_table = this;
    bbop.core.each(entries, function(item){ this_table.add_to(item); });
};

/*
 * Function: to_string
 * 
 * Convert a table object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.table.prototype.to_string = function(){
    return this._table_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add data row. The entries argument is coerced into an array of tds.
 * 
 * Parameters:
 *  entries - lists of lists of entry items
 * 
 * Returns: n/a
 */
bbop.html.table.prototype.add_to = function(entries){
    
    //this._body_stack = new bbop.html.tag('tbody');

    // Get the class for the row.
    var row_class = 'odd_row';
    if( this._count % 2 == 0 ){ row_class = 'even_row'; }
    this._count = this._count + 1;

    var tr = new bbop.html.tag('tr', {'class': row_class});

    // Array or not, add everything as tds.
    if( ! bbop.core.is_array(entries) ){ entries = [entries]; }
    bbop.core.each(entries,
		   function(entry){
		       var td = new bbop.html.tag('td');
		       td.add_to(entry);
		       tr.add_to(td);
		   });
    this._body_stack.add_to(tr);
};

/*
 * Function: empty
 * 
 * Headers do not get wiped, just the data rows in the tbody.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.table.prototype.empty = function(){
    this._count = 0;
    this._body_stack.empty();
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.table.prototype.get_id = function(){
    return this._table_stack.get_id();
};

/*
 * Namespace: bbop.html.button
 * 
 * Constructor: button
 * 
 * Create a button object.
 * For after-the-fact decoration, take a look at:
 * <https://jquery-ui.googlecode.com/svn/tags/1.6rc5/tests/static/icons.html>
 * 
 * Parameters:
 *  in_label - label
 *  in_attrs - *[optional]* the typical attributes to add
 * 
 * Returns:
 *  bbop.html.button object
 */
bbop.html.button = function(in_label, in_attrs){
    this._is_a = 'bbop.html.button';
    
    // Arg check--attrs should be defined as something.
    this._attrs = in_attrs || {};

    // Internal stack is just the top-level button.
    this._button_stack = new bbop.html.tag('button', this._attrs, in_label);
};

/*
 * Function: to_string
 * 
 * Convert a button object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.button.prototype.to_string = function(){
    return this._button_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add content between the tags. Order of addition is order of output.
 * Not really worth much as it just equates to changing the label.
 * 
 * Parameters:
 *  item - another tag object or a string (html or otherwise)
 * 
 * Returns: n/a
 */
bbop.html.button.prototype.add_to = function(item){
    this._button_stack.add_to(item);
};

/*
 * Function: empty
 * 
 * Remove all content between the tags. This equates to removing the
 * label.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.button.prototype.empty = function(){
    this._button_stack.empty();
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.button.prototype.get_id = function(){
    return this._button_stack.get_id();
};

/*
 * Namespace: bbop.html.span
 * 
 * Constructor: span
 * 
 * Create a span object.
 * Fun for calling live bits after the fact.
 * 
 * Parameters:
 *  in_label - label
 *  in_attrs - *[optional]* the typical attributes to add
 * 
 * Returns:
 *  bbop.html.span object
 */
bbop.html.span = function(in_label, in_attrs){
    this._is_a = 'bbop.html.span';
    
    // Arg check--attrs should be defined as something.
    this._attrs = in_attrs || {};

    // Internal stack is just the top-level span.
    this._span_stack = new bbop.html.tag('span', this._attrs, in_label);
};

/*
 * Function: to_string
 * 
 * Convert a span object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.span.prototype.to_string = function(){
    return this._span_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add content between the tags. Order of addition is order of output.
 * Not really worth much as it just equates to changing the label.
 * 
 * Parameters:
 *  item - another tag object or a string (html or otherwise)
 * 
 * Returns: n/a
 */
bbop.html.span.prototype.add_to = function(item){
    this._span_stack.add_to(item);
};

/*
 * Function: empty
 * 
 * Remove all content between the tags. This equates to removing the
 * label.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.span.prototype.empty = function(){
    this._span_stack.empty();
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.span.prototype.get_id = function(){
    return this._span_stack.get_id();
};
/* 
 * Package: collapsible.js
 * 
 * Namespace: bbop.html.collapsible
 * 
 * Implement the Bootstrap 3 collapse JS widget.
 * http://getbootstrap.com/javascript/#collapse
 * 
 * See also:
 *  <bbop.html>
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.html == "undefined" ){ bbop.html = {}; }

/*
 * Namespace: bbop.html.collapsible
 * 
 * Constructor: collapsible
 * 
 * Create the a frame for the functional part of a jQuery collapsible
 * structure.
 * 
 * :Input:
 * : [[title, string/*.to_string()], ...]
 * :
 * :Output:
 * :<div class="panel-group" id="accordion">
 * : <div class="panel panel-default">
 * :  <div class="panel-heading">
 * :   <h4 class="panel-title">
 * :    <a data-toggle="collapse" data-parent="#accordion" href="#collapseOne">
 * :     ...
 * :    </a>
 * :   </h4>
 * :  </div>
 * :  <div id="collapseOne" class="panel-collapse collapse in">
 * :   <div class="panel-body">
 * :    ...
 * :   </div>
 * :  </div>
 * : </div>
 * : ...
 * 
 * Parameters:
 *  in_list - collapsible frame headers: [[title, string/*.to_string()], ...]
 *  attrs - *[serially optional]* attributes to apply to the new top-level div
 * 
 * Returns:
 *  bbop.html.collapsible object
 * 
 * Also see: <tag>
 */
bbop.html.collapsible = function(in_list, attrs){
    this._is_a = 'bbop.html.collapsible';

    // Arg check--attrs should be defined as something.
    this._attrs = attrs || {};

    // We must add 'panel-group' to the class list.
    if( this._attrs['class'] ){
	this._attrs['class'] = this._attrs['class'] + ' panel-group';
    }else{
	this._attrs['class'] = 'panel-group';
    }

    // An id is necessary, and needs to be generated up front for
    // reference.
    this._cid = null;
    if( ! this._attrs['id'] ){
	this._attrs['id'] = 'gen_id-bbop-html-clps-' + bbop.core.randomness(20);
    }
    this._cid = this._attrs['id'];

    // Internal stack always starts with a div.
    this._div_stack = new bbop.html.tag('div', this._attrs);

    this._section_id_to_content_id = {};

    // Iterate over the incoming argument list.
    var collapsible_this = this;
    bbop.core.each(in_list, function(item){
		       var sect_title = item[0];
		       var content = item[1];
		       collapsible_this.add_to(sect_title, content);
		   });
};

/*
 * Function: to_string
 * 
 * Convert the collapsible object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.collapsible.prototype.to_string = function(){
    return this._div_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add a contect section to the collapsible.
 * 
 * Parameters:
 *  section_info - a string or a hash with 'id', 'label', and 'description'
 *  content_blob - string or bbop.html object to put in a section
 * 
 * Returns: n/a
 */
bbop.html.collapsible.prototype.add_to = function(section_info,
						  content_blob){
	
    // If section_info isn't an object, assume it is a string and
    // use it for everything.
    var section_id = null;
    var section_label = null;
    var section_desc = null;
    if(typeof section_info != 'object' ){ // is a string
	section_id = section_info;
	section_label = section_info;
    }else{
	if( section_info['id'] ){ section_id = section_info['id']; }
	if( section_info['label'] ){ section_label = section_info['label']; }
	if( section_info['description'] ){
	    section_desc = section_info['description'];
	}
    }

    // Section ID and bookkeeping.
    var coll_id = 'collapsible-' + section_id + '-' + bbop.core.randomness(20);
    var cont_id = 'content-' + section_id + '-' + bbop.core.randomness(20);
    this._section_id_to_content_id[section_id] = cont_id;    

    // Inner-most header structure: label.
    //    <a data-toggle="collapse" data-parent="#this._cid" href="#cont_id">
    var title_a_attrs = {
    	'data-toggle': 'collapse',
    	'data-parent': '#' + this._cid,
    	'href': '#' + coll_id
    };
    // Cannot be null in assembly.
    if( section_desc ){	title_a_attrs['title'] = section_desc; }
    var title_a = new bbop.html.tag('a', title_a_attrs, section_label);
    
    //   <h4 class="panel-title">
    var h4_attrs = {
    	'class': 'panel-title'
    };
    var h4 = new bbop.html.tag('h4', h4_attrs, title_a);

    // Complete the panel heading.
    //  <div class="panel-heading">
    var divh_attrs = {
    	'class': 'panel-heading'
    };
    var divh = new bbop.html.tag('div', divh_attrs, h4);
    
    // Add the panel body.
    //    <div class="panel-body">
    var body_attrs = {
    	'class': 'panel-body',
	'style': 'overflow-x: auto;', // emergency overflow scrolling
    	'id': cont_id
    };
    var body = new bbop.html.tag('div', body_attrs, content_blob);

    // Add the collapsing frame around the panel body.
    //  <div id="collapseOne" class="panel-collapse collapse in">
    var divb_attrs = {
    	'class': 'panel-collapse collapse',
    	'id': coll_id
    };
    var divb = new bbop.html.tag('div', divb_attrs, body);

    // Add both to the local panel container.
    // <div class="panel panel-default">
    var divp_attrs = {
    	'class': 'panel panel-default'
    };
    var divp = new bbop.html.tag('div', divp_attrs, [divh, divb]);
    
    //
    this._div_stack.add_to(divp);
};

/*
 * Function: empty
 * 
 * Empty all sections from the collapsible.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.collapsible.prototype.empty = function(){
    this._div_stack = new bbop.html.tag('div', this._attrs);
    this._section_id_to_content_id = {};
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.collapsible.prototype.get_id = function(){
    return this._div_stack.get_id();
};

/*
 * Function: get_section_id
 * 
 * Get the "real" section id by way of the "convenience" section id?
 * 
 * Parameters:
 *  sect_id - TODO ???
 * 
 * Returns: TODO ???
 */
bbop.html.collapsible.prototype.get_section_id = function(sect_id){
	return this._section_id_to_content_id[sect_id];    
};
/* 
 * Package: handler.js
 * 
 * Namespace: bbop.handler
 * 
 * This package contains a "useable", but utterly worthless reference
 * implementation of a handler.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: handler
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  n/a
 */
bbop.handler = function(){
    this._is_a = 'bbop.handler';
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  data - the incoming thing to be handled
 *  name - the field name to be processed
 *  context - *[optional]* a string to add extra context to the call
 *  fallback - *[optional]* a fallback function to call in case nothing is found
 * 
 * Returns:
 *  null
 */
bbop.handler.prototype.dispatch = function(data, name, context, fallback){
    return null;
};
/* 
 * Package: linker.js
 * 
 * Namespace: bbop.linker
 * 
 * This package contains a "useable", but utterly worthless reference
 * implementation of a linker.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: linker
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  n/a
 */
bbop.linker = function(){
    this._is_a = 'bbop.linker';
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id (context)
 * 
 * Returns:
 *  null -- always "fails""
 */
bbop.linker.prototype.url = function(id, xid){
    return null;
};

/*
 * Function: anchor
 * 
 * Return an html anchor string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id (context)
 * 
 * Returns:
 *  null -- always "fails""
 */
bbop.linker.prototype.anchor = function(id, xid){
    return null;
};
/* 
 * Package: model.js
 * 
 * Namespace: bbop.model
 * 
 * Purpose: Basic edged graph and operations.
 * 
 * NOTE: A model instance may not be the whole graph, just a
 * subgraph--this is the difference between nodes and
 * named_nodes. nodes are real things, while named_nodes are things
 * referenced by edges.
 * 
 * Check TODOs, we would like everything as linear as possible.
 * 
 * TODO: memoize everything but add_*. Functional enough that it
 * should work if we just empty the caches after every add_* op.
 * 
 * Required: bbop.core (<core.js>)
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.model == "undefined" ){ bbop.model = {}; }

/*
 * Variable: default_predicate
 * 
 * The predicate we'll use when none other is defined. You can
 * probably safely ignore this if all of the edges in your graph are
 * the same.
 */
bbop.model.default_predicate = 'points_at';

///
///  Node sub-object.
///

/*
 * Namespace: bbop.model.node
 * 
 * Constructor: node
 * 
 * Contructor for a BBOP graph model node.
 * 
 * Arguments:
 *  new_id - a unique id for the node
 *  new_label - *[optional]* a user-friendly description of the node
 * 
 * Returns:
 *  bbop model node
 */
bbop.model.node = function(new_id, new_label){
    this._is_a = 'bbop.model.node';
    this._id = new_id || undefined;
    this._label = new_label || undefined;

    // Only have a real type if the constructor went properly.
    this._type = 'node';
    if( ! new_id ){
	this._type = undefined;	
    }

    this._metadata = undefined;
};

/*
 * Function: id
 *
 * Getter/setter for node id.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.node.prototype.id = function(value){
    if(value) this._id = value; return this._id; };

/*
 * Function: type
 *
 * Getter/setter for node type.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.node.prototype.type = function(value){
    if(value) this._type = value; return this._type; };

/*
 * Function: label
 *
 * Getter/setter for node label.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.node.prototype.label = function(value){
    if(value) this._label = value; return this._label; };

/*
 * Function: metadata
 *
 * Getter/setter for node metadata.
 * 
 * The metadata value does not necessarily have to be an atomic type.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  value
 */
bbop.model.node.prototype.metadata = function(value){
    if(value) this._metadata = value; return this._metadata; };

/*
 * Function: clone
 *
 * Get a fresh new copy of the current node (using bbop.core.clone for
 * metadata object).
 *
 * Parameters:
 *  n/a
 *
 * Returns: 
 *  string
 */
bbop.model.node.prototype.clone = function(){
    var tmp_clone = new bbop.model.node(this.id());
    tmp_clone.type(this.type());
    tmp_clone.label(this.label());
    tmp_clone.metadata(bbop.core.clone(this.metadata()));
    return tmp_clone;
};


///
///  Edge sub-object.
///

/*
 * Namespace: bbop.model.edge
 * 
 * Constructor: edge
 * 
 * Contructor for a BBOP graph model edge.
 * 
 * If no predicate is given, <default_predicate> is used.
 * Predicates are currently treated as raw strings.
 * 
 * Arguments:
 *  subject - node id string or node
 *  object - node id string or node
 *  predicate - *[optional]* a user-friendly description of the node
 * 
 * Returns:
 *  bbop model edge
 */
bbop.model.edge = function(subject, object, predicate){
    this._is_a = 'bbop.model.edge';

    // Either a string or a node.
    if( ! subject ){
	this._subject_id = undefined;
    }else if( typeof subject == 'string' ){
	this._subject_id = subject;	
    }else{
	this._subject_id = subject.id();
    }
    // Either a string or a node.
    if( ! object ){
	this._object_id = undefined;
    }else if( typeof object == 'string' ){
	this._object_id = object;	
    }else{
	this._object_id = object.id();
    }
    // Predicate default or incoming.
    this._predicate_id = bbop.model.default_predicate;
    if( predicate ){
	this._predicate_id = predicate;
    }

    // Only have a real type if the constructor went properly.
    this._type = 'edge';
    if( ! subject || ! object ){
	this._type = undefined;	
    }

    //
    this._metadata = undefined;
};

/*
 * Function: subject_id
 *
 * Getter/setter for edge subject id.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.edge.prototype.subject_id = function(){
    return this._subject_id; };

/*
 * Function: object_id
 *
 * Getter/setter for edge object id.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.edge.prototype.object_id = function(){
    return this._object_id; };

/*
 * Function: predicate_id
 *
 * Getter/setter for edge predicate id.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.edge.prototype.predicate_id = function(){
    return this._predicate_id; };

/*
 * Function: type
 *
 * Getter/setter for edge type.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.edge.prototype.type = function(value){
    if(value) this._type = value; return this._type; };

/*
 * Function: metadata
 *
 * Getter/setter for edge metadata.
 *
 * The metadata value does not necessarily have to be an atomic type.
 * 
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  value
 */
bbop.model.edge.prototype.metadata = function(value){
    if(value) this._metadata = value; return this._metadata; };

/*
 * Function: clone
 *
 * Get a fresh new copy of the current edge (using bbop.core.clone for
 * metadata object).
 *
 * Parameters:
 *  n/a
 *
 * Returns: 
 *  string
 */
bbop.model.edge.prototype.clone = function(){
    var tmp_clone = new bbop.model.edge(this.subject_id(),
					this.object_id(),
					this.predicate_id());
    // Metadata kind of needs to be duped separately.
    tmp_clone.metadata(bbop.core.clone(this.metadata()));
    return tmp_clone;
};

///
///  Graph sub-object.
///

/*
 * Namespace: bbop.model.graph
 * 
 * Constructor: graph
 * 
 * Contructor for a BBOP graph model graph.
 * 
 * TODO: make compilation piecewise with every added node and edge.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  bbop model node
 */
//
bbop.model.graph = function(){
    this._is_a = 'bbop.model.graph';

    this._id = undefined;

    // A per-graph logger.
    this._logger = new bbop.logger(this._is_a);
    this._logger.DEBUG = true;
    //this._logger.DEBUG = false;
    //function ll(str){ anchor._logger.kvetch(str); }

    // For bbop.model.node and bbop.model.edge (hash not possible for
    // edges--only relation, not "real").
    this._nodes = { array: new Array, hash: {} };
    this._edges = { array: new Array };
    this._predicates = { array: new Array, hash: {} };

    // All things that are referenced by edges (which may not include
    // actual node ids--dangling links).
    this._named_nodes = { array: new Array, hash: {} };

    // Useful forthings like leaves, roots, and singletons.
    this._subjects = { array: new Array, hash: {} };
    this._objects = { array: new Array, hash: {} };     

    // Table structures for quick lookups of relations.
    //this._predicate_subject_table = {};    // [pred][sub] -> bbop.model.edge.
    //this._subject_predicate_table = {};    // [sub][pred] -> bbop.model.edge.
    //this._predicate_object_table = {};     // [pred][obj] -> sub data struct.
    //this._object_predicate_table = {};     // [obj][pred] -> sub data struct.

    // New parallel structures to for our simplified graph.
    this._so_table = {}; // true/undef
    this._os_table = {}; // true/undef
    this._sop_table = {}; // {'rel1': true, 'rel2': true}

    // Table structures for quick lookups of node properties.
    this._is_a_singleton_lookup = {}; // [nid] -> bbop.model.node.    
};


/*
 * Function: id
 *
 * Getter/setter for the graph id.
 *
 * Parameters: 
 *  value - *[optional]* new value for this property to take
 *
 * Returns: 
 *  string
 */
bbop.model.graph.prototype.id = function(value){
    if( value ) this._id = value; return this._id;
};

/*
 * Function: add_node
 *
 * Add a node to the graph.
 *
 * Parameters: 
 *  node - <node> to add to the graph
 *
 * Returns: 
 *  n/a
 */
bbop.model.graph.prototype.add_node = function(node){

    // Check for for anything funny.
    if( ! node.id() ||
	this._nodes.hash[ node.id() ] ||
	this._nodes.hash[ node.id() ] ){
	    //alert("tried to add same node: " + node.id());
	    //throw new Error("tried to add same node: " + node.id());
	}else{

	    var nid = node.id();
	    
	    // Add it to all the concerned recall data structures.
	    this._nodes.hash[ nid ] = node;
	    this._nodes.array.push(node);
	    this._named_nodes.hash[ nid ] = node;
	    this._named_nodes.array.push(node);

	    // If this does not belong to any relation so far, then it is a
	    // singleton.
	    if( ! this._subjects.hash[ nid ] && ! this._objects.hash[ nid ] ){
		this._is_a_singleton_lookup[ nid ] = true;
	    }
	}
};


/*
 * Function: add_edge
 *
 * Add an edge to the graph.
 *
 * Parameters: 
 *  edge - <edge> to add to the graph
 *
 * Returns: 
 *  n/a
 */
bbop.model.graph.prototype.add_edge = function(edge){

    //
    var sub_id = edge.subject_id();
    var obj_id = edge.object_id();
    var pred_id = edge.predicate_id();

    // Subject -> object.
    if( ! this._so_table[ sub_id ] ){ this._so_table[ sub_id ] = {}; }
    this._so_table[ sub_id ][ obj_id ] = true;
    // Object -> subject.
    if( ! this._os_table[ obj_id ] ){ this._os_table[ obj_id ] = {}; }
    this._os_table[ obj_id ][ sub_id ] = true;
    // Their relationships (defined by SOP).
    if( ! this._sop_table[ sub_id ] ){
	this._sop_table[ sub_id ] = {}; }
    if( ! this._sop_table[ sub_id ][ obj_id ] ){
	this._sop_table[ sub_id ][obj_id] = {}; }
    //this._sop_table[ sub_id ][ obj_id ][ pred_id ] = true;
    this._sop_table[ sub_id ][ obj_id ][ pred_id ] = edge;

    // If this is a new predicate add it to all of the necessary data
    // structures.
    if( ! this._predicates.hash[ pred_id ] ){
	this._predicates.hash[ pred_id ] = true; 
	this._predicates.array.push(pred_id); 
    }

    // 
    if( ! this._subjects.hash[ sub_id ] ){
	this._subjects.hash[ sub_id ] = true; 
	this._subjects.array.push(sub_id); 
	//this._subject_predicate_table[ sub_id ] = {};
    }
    if( ! this._objects.hash[ obj_id ] ){
	this._objects.hash[ obj_id ] = true; 
	this._objects.array.push(obj_id); 
	//this._object_predicate_table[ obj_id ] = {};
    }

    // Remove the edge's subject and object from the singleton table.
    if( this._is_a_singleton_lookup[ sub_id ] ){
	delete this._is_a_singleton_lookup[ sub_id ]; }
    if( this._is_a_singleton_lookup[ obj_id ] ){
	delete this._is_a_singleton_lookup[ obj_id ]; }

    // Onto the array and subject and object into named bodies.
    this._edges.array.push(edge);
    if( ! this._named_nodes.hash[ sub_id ] ){
	this._named_nodes.array.push(sub_id); }
    this._named_nodes.hash[ sub_id ] = edge;
    if( ! this._named_nodes.hash[ obj_id ] ){
	this._named_nodes.array.push(obj_id); }
    this._named_nodes.hash[ obj_id ] = edge;
};

/*
 * Function: all_nodes
 *
 * Returns an /original/ list of all added nodes.
 *
 * Parameters:
 *  n/a
 *
 * Returns: 
 *  array of nodes
 */
bbop.model.graph.prototype.all_nodes = function(){
    return this._nodes.array;
};

/*
 * Function: all_edges
 *
 * Returns an /original/ list of all added edges.
 *
 * Parameters:
 *  n/a
 *
 * Returns: 
 *  array of edges
 */
bbop.model.graph.prototype.all_edges = function(){
    return this._edges.array;
};

/*
 * Function: all_predicates
 *
 * Returns an /original/ list of all added predicates.
 *
 * Parameters:
 *  n/a
 *
 * Returns: 
 *  array of predicates (strings)
 */
bbop.model.graph.prototype.all_predicates = function(){
    return this._predicates.array;
};

/*
 * Function: all_dangling
 *
 * List all external nodes by referenced id.
 *
 * Parameters:
 *  n/a
 *
 * Returns: 
 *  array of extrnal nodes by id
 */
bbop.model.graph.prototype.all_dangling = function(){
    // Disjoint of named and extant.
    var unnamed = new Array();
    for( var named_id in this._named_nodes.hash ){
	if( ! this._nodes.hash[named_id] ){
	    unnamed.push(named_id);
	}
    }
    return unnamed;
};

/*
 * Function: is_complete
 *
 * Any bad parts in graph? Essentially, make sure that there are no
 * weird references and nothing is dangling.
 *
 * Parameters:
 * n/a
 *
 * Returns: 
 *  boolean
 */
bbop.model.graph.prototype.is_complete = function(){
    var retval = true;
    if( this.all_dangling().length > 0 ){
	retval = false;
    }
    return retval;
};

/*
 * Function: get_node
 *
 * Return a /copy/ of a node by id (not the original) if extant.
 *
 * Parameters:
 *  nid - the id of the node we're looking for
 *
 * Returns: 
 *  <bbop.model.node>
 */
bbop.model.graph.prototype.get_node = function(nid){
    var retnode = null;
    if( this._nodes.hash[ nid ] ){
	var tmp_node = this._nodes.hash[ nid ];
	retnode = tmp_node.clone();
    }
    return retnode;
};

/*
 * Function: get_edge
 *
 * Return a /copy/ of an edge by ids (not the original) if extant.
 *
 * Parameters:
 *  sub_id - the subject_id of the edge we're looking for
 *  obj_id - the object_id of the edge we're looking for
 *  pred - *[optional]* the predicate of the edge we're looking for
 *
 * Returns: 
 *  <bbop.model.edge>
 */
bbop.model.graph.prototype.get_edge = function(sub_id, obj_id, pred){	

    if( ! pred ){ pred = bbop.model.default_predicate; }

    var ret_edge = null;
    if( this._sop_table[sub_id] &&
	this._sop_table[sub_id][obj_id] &&
	this._sop_table[sub_id][obj_id][pred] ){
	    var tmp_edge = this._sop_table[sub_id][obj_id][pred];
	    ret_edge = tmp_edge.clone();
	}
    return ret_edge; 
};

/*
 * Function: get_edges
 *
 * Return all edges (copies) of given subject and object ids. Returns
 * entirely new edges.
 *
 * Parameters:
 *  sub_id - the subject_id of the edge we're looking for
 *  obj_id - the object_id of the edge we're looking for
 *
 * Returns: 
 *  list of <bbop.model.edge>
 */
bbop.model.graph.prototype.get_edges = function(sub_id, obj_id){
    var retlist = new Array();
    if( this._sop_table[sub_id] &&
	this._sop_table[sub_id][obj_id] ){
	    for( var pred in this._sop_table[sub_id][obj_id] ){
		var found_edge = this._sop_table[sub_id][obj_id][pred];
		var tmp_edge = found_edge.clone();
		retlist.push(tmp_edge);
	    }
	}		
    return retlist;
};


/*
 * Function: get_predicates
 *
 * Return all predicates of given subject and object ids.
 *
 * Parameters:
 *  sub_id - the subject_id of the edge we're looking for
 *  obj_id - the object_id of the edge we're looking for
 *
 * Returns: 
 *  list of predicate ids (as strings)
 */
bbop.model.graph.prototype.get_predicates = function(sub_id, obj_id){
    var retlist = [];
    if( this._sop_table[sub_id] &&
	this._sop_table[sub_id][obj_id] ){
	    for( var pred in this._sop_table[sub_id][obj_id] ){
		retlist.push(pred);
	    }
	}
    return retlist;
};


/*
 * Function: edges_to_nodes
 *
 * Translate an edge array into extant (node) bodies, switching on
 * either 'subject' or 'object'.
 * 
 * This will return the /original/ nodes.
 *
 * This will throw an error on any world issues that crop up.
 * 
 * Parameters: 
 *  in_edges - the edges we want the subjects or objects of
 *  target - 'subject' or 'object'
 *
 * Returns: 
 *  array of <bbop.model.node>
 */
bbop.model.graph.prototype.edges_to_nodes = function(in_edges, target){
    
    // Double check.
    if( target != 'subject' && target != 'object'){
	throw new Error('Bad target for edges to bodies.');
    }

    // 
    var results = new Array();
    for( var i = 0; i < in_edges.length; i++ ){ 
	var in_e = in_edges[i];

	// Switch between subject and object.
	var target_id = null;
	if( target == 'subject' ){
	    target_id = in_e.subject_id();
	}else{
	    target_id = in_e.object_id();
	}
	
	//
	if( target_id && this._nodes.hash[ target_id ] ){
	    results.push(this._nodes.hash[ target_id ]);
	}else{
	    throw new Error(target + ' world issue');
	}
    }
    return results;
};

/*
 * Function: is_root_node
 *
 * Roots are defined as nodes who are the subject of nothing,
 * independent of predicate.
 *
 * Parameters: 
 *  nb_id - id of the node to check
 *
 * Returns: 
 *  boolean
 */
bbop.model.graph.prototype.is_root_node = function(nb_id){
    var result = false;	
    if( this._nodes.hash[ nb_id ] &&
	! this._subjects.hash[ nb_id ] ){	    
	    result = true;
	}
    return result;
};


/*
 * Function: get_root_nodes
 *
 * Return a list of /copies/ of the root nodes.
 * 
 * BUG/TODO: Could I speed this up by my moving some of the
 * calculation into the add_node and add_edge methods? O(|#nodes|)
 * 
 * Parameters:
 *  n/a 
 *
 * Returns:
 *  array of <bbop.model.node>
 */
bbop.model.graph.prototype.get_root_nodes = function(){
    var results = new Array();
    for( var nb_id in this._nodes.hash ){
	if( this.is_root_node(nb_id) ){
	    results.push( this.get_node(nb_id).clone() );
	}
    }
    return results;
};


/*
 * Function: is_leaf_node
 *
 * Leaves are defined as nodes who are the object of nothing,
 * independent of predicate.
 * 
 * Parameters: 
 *  nb_id - id of the node to check
 *
 * Returns: 
 *  boolean
 */
bbop.model.graph.prototype.is_leaf_node = function(nb_id){

    var result = false;
    if( this._nodes.hash[ nb_id ] &&
	! this._objects.hash[ nb_id ] ){	    
	    result = true;
	}
    return result;
};

/*
 * Function: get_leaf_nodes
 *
 * Return a list of /copies/ of the leaf nodes.
 * 
 * BUG/TODO: Could I speed this up by my moving some of the
 * calculation into the add_node and add_edge methods? O(|#nodes|)
 * 
 * Parameters:
 *  n/a 
 *
 * Returns:
 *  array of <bbop.model.node>
 */
bbop.model.graph.prototype.get_leaf_nodes = function(){
    var results = new Array();
    for( var nb_id in this._nodes.hash ){
	if( this.is_leaf_node(nb_id) ){
	    results.push( this.get_node(nb_id).clone() );
	}
    }
    return results;
};

/*
 * Function: get_singleton_nodes
 *
 * Find nodes that are roots and leaves over all relations. This
 * returns the /original/ node.
 * 
 * Throws an error if there is a world issue.
 *
 * Parameters:
 *  n/a 
 *
 * Returns: 
 *  array of <bbop.model.node>
 */
bbop.model.graph.prototype.get_singleton_nodes = function(){
    // Translate array into array extant bodies.
    var singleton_array = new Array();
    for( var singleton_id in this._is_a_singleton_lookup ){
	if( this._nodes.hash[ singleton_id ] ){
	    singleton_array.push( this._nodes.hash[ singleton_id ] );
	}else{
	    throw new Error("world issue in get_singletons: "+singleton_id);
	}
    }
    return singleton_array;
};

/*
 * Function: get_parent_edges
 *
 * Return all parent edges; the /originals/. If no predicate is given,
 * use the default one.
 * 
 * TODO: it might be nice to memoize this since others depend on it.
 *
 * Parameters: 
 *  nb_id - the node to consider
 *  in_pred - *[optional]* over this predicate
 *
 * Returns: 
 *  array of <bbop.model.edge>
 */
bbop.model.graph.prototype.get_parent_edges = function(nb_id, in_pred){

    var results = new Array();

    // Get all parents, or just parents from a specific relation.
    var preds_to_use = new Array();
    if( in_pred ){
	preds_to_use.push(in_pred);
    }else{
	preds_to_use = this._predicates.array;
    }

    // Try all of our desired predicates.
    for( var j = 0; j < preds_to_use.length; j++ ){
	var pred = preds_to_use[j];

	// Scan the table for goodies; there really shouldn't be a
	// lot here.
	if( this._so_table[ nb_id ] ){		
	    for( var obj_id in this._so_table[nb_id] ){
		// If it looks like something is there, try to see
		// if there is an edge for our current pred.
		var tmp_edge = this.get_edge(nb_id, obj_id, pred);
		if( tmp_edge ){
		    results.push( tmp_edge );
		}
	    }
	}
    }
    return results;
};

/*
 * Function: get_parent_nodes
 *
 * Return all parent nodes; the /originals/. If no predicate is given,
 * use the default one.
 * 
 * Parameters: 
 *  nb_id - the node to consider
 *  in_pred - *[optional]* over this predicate
 *
 * Returns: 
 *  array of <bbop.model.node>
 */
bbop.model.graph.prototype.get_parent_nodes = function(nb_id, in_pred){

    var results = new Array();
    var edges = this.get_parent_edges(nb_id, in_pred);
    for( var i = 0; i < edges.length; i++ ){
	// Make sure that any found edges are in our
	// world.
	var obj_id = edges[i].object_id();
	var tmp_node = this.get_node(obj_id);
	if( tmp_node ){
	    results.push( this.get_node(obj_id) );
	}
    }
    return results;
};

/*
 * Function: get_child_nodes
 *
 * Return all child nodes; the /originals/. If no predicate is given,
 * use the default one.
 * 
 * Parameters: 
 *  nb_id - the node to consider
 *  in_pred - *[optional]* over this predicate
 *
 * Returns: 
 *  array of <bbop.model.node>
 */
bbop.model.graph.prototype.get_child_nodes = function(nb_id, in_pred){

    var results = new Array();

    // Get all children, or just children from a specific relation.
    var preds_to_use = new Array();
    if( in_pred ){
	preds_to_use.push(in_pred);
    }else{
	preds_to_use = this._predicates.array;
    }

    // Try all of our desired predicates.
    for( var j = 0; j < preds_to_use.length; j++ ){
	var pred = preds_to_use[j];

	// Scan the table for goodies; there really shouldn't be a
	// lot here.
	if( this._os_table[ nb_id ] ){		
	    for( var sub_id in this._os_table[nb_id] ){
		// If it looks like something is there, try to see
		// if there is an edge for our current pred.
		if( this.get_edge(sub_id, nb_id, pred) ){
		    // Make sure that any found edges are in our
		    // world.
		    var tmp_node = this.get_node(sub_id);
		    if( tmp_node ){
			results.push( this.get_node(sub_id) );
		    }
		}
	    }
	}
    }
    return results;
};

/*
 * Function: get_ancestor_subgraph
 *
 * Return new ancestors subgraph. Single id or id list as first
 * argument. Predicate string/id as optional second.
 *
 * Parameters: 
 *  nb_id_or_list - the node id(s) to consider
 *  pid - *[optional]* over this predicate
 *
 * Returns: 
 *  <bbop.model.graph>
 */
bbop.model.graph.prototype.get_ancestor_subgraph = function(nb_id_or_list, pid){

    // Shared data structure to trim multiple paths.
    // Nodes: color to get through the graph quickly and w/o cycles.
    var seen_node_hash = {};
    // Edges: just listed--hashing would be essentially the same
    // as a call to graph.add_edge (I think--benchmark?).
    var seen_edge_list = [];
    var anchor = this;

    // Define recursive ascent.
    function rec_up(nid){

	//print('rec_up on: ' + nid);

    	var results = new Array();
    	var new_parent_edges = anchor.get_parent_edges(nid, pid);

	// Capture edge list for later adding.
	for( var e = 0; e < new_parent_edges.length; e++ ){
	    seen_edge_list.push(new_parent_edges[e]);
	}

	// Pull extant nodes from edges. NOTE: This is a retread
	// of what happens in get_parent_nodes to avoid another
	// call to get_parent_edges (as all this is now
	// implemented).
	var new_parents = new Array();
	for( var n = 0; n < new_parent_edges.length; n++ ){
	    // Make sure that any found edges are in our
	    // world.
	    var obj_id = new_parent_edges[n].object_id();
	    var temp_node = anchor.get_node(obj_id);
	    if( temp_node ){
		new_parents.push( temp_node );
	    }
	}

	// Make sure we're in there too.
	var tmp_node = anchor.get_node(nid);
	if( tmp_node ){
	    new_parents.push( tmp_node );
	}

	// Recur on unseen things and mark the current as seen.
    	if( new_parents.length != 0 ){
    	    for( var i = 0; i < new_parents.length; i++ ){
    		// Only do things we haven't ever seen before.
    		var new_anc = new_parents[i];
    		var new_anc_id = new_anc.id();
    		if( ! seen_node_hash[ new_anc_id ] ){
    		    seen_node_hash[ new_anc_id ] = new_anc;
    		    rec_up(new_anc_id);	
    		}
    	    }
    	}
    	return results;
    }
    
    // Recursive call and collect data from search. Make multiple
    // ids possible.
    //if( nb_id_or_list.length && nb_id_or_list.index ){
    if( bbop.core.is_array(nb_id_or_list) ){ // verify listy-ness
	for( var l = 0; l < nb_id_or_list.length; l++ ){	    
	    rec_up(nb_id_or_list[l]);
	}
    }else{
    	rec_up(nb_id_or_list);
    }
    
    // Build new graph using data.
    var new_graph = new bbop.model.graph();
    for( var k in seen_node_hash ){
	new_graph.add_node(seen_node_hash[k]);
    }
    for( var x = 0; x < seen_edge_list.length; x++ ){	    
	new_graph.add_edge(seen_edge_list[x]);
    }

    return new_graph;
};

/*
 * Function: merge_in
 * 
 * Add a graph to the current graph, without sharing any of the merged
 * in graph's structure.
 * 
 * TODO: a work in progress 'type' not currently imported (just as
 * not exported)
 * 
 * Parameters:
 *  bbop.model.graph
 * 
 * Returns:
 *  true; side-effects: more graph
 */
bbop.model.graph.prototype.merge_in = function(in_graph){

    var anchor = this;

    // First, load nodes; scrape out what we can.
    bbop.core.each(in_graph.all_nodes(),
		   function(in_node){
		       var new_node = in_node.clone();
		       anchor.add_node(new_node);
		   });

    // Now try to load edges; scrape out what we can.
    bbop.core.each(in_graph.all_edges(),
		   function(in_edge){
		       var new_edge = in_edge.clone();
		       anchor.add_edge(new_edge);
		   });

    return true;
};

/*
 * Function: load_json
 * 
 * Load the graph from the specified JSON object (not string).
 * 
 * TODO: a work in progress 'type' not currently imported (just as
 * not exported)
 * 
 * Parameters:
 *  JSON object
 * 
 * Returns:
 *  true; side-effects: creates the graph internally
 */
bbop.model.graph.prototype.load_json = function(json_object){

    var anchor = this;

    // First, load nodes; scrape out what we can.
    if( json_object.nodes ){
	bbop.core.each(json_object.nodes,
		       function(node_raw){
			   var nid = node_raw.id;
			   var nlabel = node_raw.lbl;
			   var n = new bbop.model.node(nid, nlabel);
			   if(node_raw.meta){ n.metadata(node_raw.meta); }
			   anchor.add_node(n);
		       });
    }

    // Now try to load edges; scrape out what we can.
    if( json_object.edges ){
	bbop.core.each(json_object.edges,
		       function(edge_raw){
			   var e = new bbop.model.edge(edge_raw.sub,
						       edge_raw.obj,
						       edge_raw.pred);
			   // Copy out meta.
			   if(edge_raw.meta){ e.metadata(edge_raw.meta); } 
			   
			   anchor.add_edge(e);
		      });
    }

    return true;
};

/*
 * Function: to_json
 * 
 * Dump out the graph into a JSON-able object.
 * 
 * TODO: a work in progress; 'type' not currently exported (just as
 * not imported)
 * 
 * Parameters:
 *  n/a
 * 
 * Returns:
 *  An object that can be converted to a JSON string by dumping.
 */
bbop.model.graph.prototype.to_json = function(){

    var anchor = this;

    // Copy
    var nset = [];
    bbop.core.each(anchor.all_nodes(),
		   function(raw_node){

		       var node = bbop.core.clone(raw_node);
		       var ncopy = {};

		       var nid = node.id();
		       if(nid){ ncopy['id'] = nid; }

		       // var nt = node.type();
		       // if(nt){ ncopy['type'] = nt; }

		       var nlabel = node.label();
		       if(nlabel){ ncopy['lbl'] = nlabel; }

		       var nmeta = node.metadata();
		       if(nmeta){ ncopy['meta'] = nmeta; }

		       nset.push(ncopy);
		   });

    var eset = [];
    var ecopy = bbop.core.clone(anchor._edges['array']);
    bbop.core.each(anchor.all_edges(),
		   function(node){
		       var ecopy = {};

		       var s = node.subject_id();
		       if(s){ ecopy['sub'] = s; }

		       var o = node.object_id();
		       if(o){ ecopy['obj'] = o; }

		       var p = node.predicate_id();
		       if(p){ ecopy['pred'] = p; }

		       eset.push(ecopy);
		   });

    // New exportable.
    var ret_obj = {'nodes': nset, 'edges': eset};

    return ret_obj;
};
/* 
 * Package: tree.js
 * 
 * Namespace: bbop.model.tree
 * 
 * Purpose: Extend <bbop.model> in <model.js> to be handy for a (phylo)tree.
 * 
 * TODO: /Much/ better documentation. I have no idea what's going on
 * in there anymore...
 * 
 * TODO: Subtree calculation during bracket_down.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.model == "undefined" ){ bbop.model = {}; }
if ( typeof bbop.model.tree == "undefined" ){ bbop.model.tree = {}; }

/*
 * Namespace: bbop.model.tree.node
 * 
 * Constructor: node
 * 
 * Same as parent, but just takes id in constructor.
 * 
 * Arguments:
 *  new_id - a unique id for the node
 */
bbop.model.tree.node = function(new_id){
    bbop.model.node.call(this, new_id);
    this._is_a = 'bbop.model.tree.node';
};
bbop.core.extend(bbop.model.tree.node, bbop.model.node);

/*
 * Namespace: bbop.model.tree.edge
 * 
 * Constructor: edge
 * 
 * Same as parent class, but optionally adds distance as an argument.
 */
bbop.model.tree.edge = function(parent, child, distance){
    bbop.model.edge.call(this, child, parent, '');
    this._is_a = 'bbop.model.tree.edge';
    this._distance = distance || 0.0;
};
bbop.core.extend(bbop.model.tree.edge, bbop.model.edge);

/*
 * Function: distance
 *
 * Return an edge's "distance".
 *
 * Parameters:
 *  value - *[optional]* new number for this property to take
 *
 * Returns: 
 *  number
 */
bbop.model.tree.edge.prototype.distance = function(d){
    if(d){ this._distance = d; }
    return this._distance;
};

/*
 * Function: clone
 *
 * Make sure that clone gets distance as well.
 *
 * Parameters: 
 *  n/a
 *
 * Returns: 
 *  <bbop.model.tree.edge>
 */
bbop.model.tree.edge.prototype.clone = function(){
    var tmp_clone = new bbop.model.tree.edge(this.object_id(),
					     this.subject_id(),
					     this.distance());
    tmp_clone.metadata(bbop.core.clone(this.metadata()));
    return tmp_clone;
};

/*
 * Namespace: bbop.model.tree.graph
 * 
 * Constructor: graph
 * 
 * Same as parent.
 * Needs some more functionality...
 */
bbop.model.tree.graph = function(){
    bbop.model.graph.call(this);
    this._is_a = 'bbop.model.tree.graph';

    // Useful for making sure that certain recursive functions keep
    // the desired notion of "this"ness.
    var anchor = this;

    /*
     * Function: default_sort
     *
     * The default comparator function for ordering the
     * brackets. Alphabetical down.
     * 
     * Parameters: 
     *  a - a bracket item
     *  b - a bracket item
     *
     * Returns: 
     *  string
     */
    this.default_sort = function(a, b){
	var sort_val = 0;
	if( a.id < b.id ){
	    sort_val = - 1;
	}else if( a.id > b.id ){
	    sort_val = 1;
	}
	//_kvetch('sort: ' + a.id + ' <?> ' + b.id + ' = ' + sort_val);
	return sort_val;
    };

    // Get information on kids, relations, and distances working our
    // way up from the leaves.
    var max_dist = 0.0;
    var all_dists_parent = {};
    var all_dists_child = {};
    var node_list = new Array();
    var node_hash = {};
    var edge_list = new Array();
    var edge_hash = {};
    function info_up(node_id){
	
	var nid = node_id;
	//_kvetch("info_up: working on: " + nid);

	// Node bookkeeping.
	if( ! node_hash[nid] ){
	    node_hash[nid] = true;
	    node_list.push(nid);
	}

	// Can only have at most one parent.
	var node_parent = anchor.get_parent_nodes(nid);
	if( node_parent && node_parent.length ){
	    node_parent = node_parent[0];
	    var pid = node_parent.id();

	    // Edge bookkeeping.
	    var edge_uid = pid + '_!muNge!_' + node_id;
	    if( ! edge_hash[edge_uid] ){
		edge_hash[edge_uid] = true;
		edge_list.push([pid, node_id]);
		//_kvetch('info_up: indexing: ' + edge_uid);
	    }

	    // Add new data to globals.
	    //_kvetch(" info_up: seems to have parent: " + pid);
	    if( ! all_dists_parent[pid]){
		all_dists_parent[pid] = {};
	    }
	    if( ! all_dists_child[nid]){
		all_dists_child[nid] = {};
	    }

	    if( ! all_dists_parent[pid][nid] ){
		// 
		var dist = anchor.get_edge(nid,pid).distance();
		all_dists_parent[pid][nid] = dist;
		all_dists_child[nid][pid] = dist;
		// Look a little for max.
		if( dist > max_dist ){
		    max_dist = dist;
		}
	    }

	    // Get any data you can from your kids.
	    for( var k_id in all_dists_parent[nid] ){

		var increment = all_dists_parent[pid][nid] +
		    all_dists_parent[nid][k_id];
		all_dists_parent[pid][k_id] = increment;
		all_dists_child[k_id][pid] = increment;

		// Look a little for max.
		if( increment > max_dist ){
		    max_dist = increment;
		}
	    }

	    // Recur on parent.
	    info_up(pid);
	}
    }

    // Recursive comb down (give partitioned ordering).
    // A bracket looks like: "[{id:a, brackets: [...]}, ...]".
    // TODO: subtree calculation during.
    var brackets = new Array();
    var max_depth = 0;
    function bracket_down(in_node, lvl, parent_node_id){
	    
	// Bootstrap lvl to 1.
	if( ! lvl ){ lvl = 1; }
	if( ! parent_node_id ){ parent_node_id = null; }

	var in_node_id = in_node.id();
	//_kvetch(' bracket_down: ' + in_node_id);

	// 
	var child_bracket = new Array();
	var child_nodes = anchor.get_child_nodes(in_node_id);
	for( var cb = 0; cb < child_nodes.length; cb++ ){
	    var child_node = child_nodes[cb];
	    var child_node_id = child_node.id();
	    //_kvetch('  bracket_down: pushing: ' + child_node_id);
	    child_bracket.push(bracket_down(child_node, lvl + 1, in_node_id));
	}

	// Sort the children.
	child_bracket.sort(anchor.default_sort);

	// Grab max depth.
	if( lvl > max_depth ){ max_depth = lvl;	}

	//
	//_kvetch(' bracket_down: found kids: ' + child_bracket.length);
	return {
	    id: in_node_id,
	    routing_node: false,
	    level: lvl,
	    parent_id: parent_node_id,
	    brackets: child_bracket
	};
    }

    // Return a layout that can be trivially rendered
    // by...something...
    var max_width = 0;
    var cohort_list = new Array(); // will reinit

    /*
     * Function: layout
     *
     * With the current graph, produce a usable layout object.
     * 
     * TODO: layout should take bracket ordering func
     *
     * Parameters:
     *  n/a
     *
     * Returns: 
     *  a rather complicated layout object
     */
    this.layout = function (){

	// Refresh scope on new layout call.
	brackets = new Array();
	node_list = new Array();
	node_hash = {};
	edge_list = new Array();
	edge_hash = {};
	cohort_list = new Array(); // token--now also reset and sized below

	// Pass one:
	// Collect all of our bracketing information, also order the
	// brackets to some function.
	var base_nodes = anchor.get_root_nodes();
	for( var bb = 0; bb < base_nodes.length; bb++ ){
	    //_kvetch('bracket_down: start: ' + base_nodes[bb].id());
	    brackets.push(bracket_down(base_nodes[bb]));
	}
	// The children are ordered--make the top-level one ordered as
	// well.
	brackets.sort(anchor.default_sort);

	// Pass one:
	// Essentially walk the brackets, find brackets that end early
	// (above max_depth) and add routing nodes down.
	function dangle_routing(in_item){
	    if( in_item.level < max_depth ){
		in_item.brackets.push({id: in_item.id,
				       routing_node: true,
				       level: in_item.level + 1,
				       parent_id: in_item.id,
				       brackets: []
				      });
		dangle_routing(in_item.brackets[0]);
	    }
	    return in_item;
	}
	function add_routing(in_brackets){

	    //
	    for( var i = 0; i < in_brackets.length; i++ ){
		var item = in_brackets[i];

		//
		if( item.brackets.length == 0 && item.level < max_depth ){
		    //_kvetch(' add_routing: dangle: ' + item.id);
		    dangle_routing(item);
		}else if( item.brackets.length != 0 ){
		    //_kvetch(' add_routing: descend: ' + item.id);
		    add_routing(item.brackets);
		}
	    }
	}
	add_routing(brackets);

	// Pass three:
	// Collect global cohort information into a matrix (cohort_list).
	cohort_list = new Array(max_depth);
	for( var cli = 0; cli < cohort_list.length; cli++ ){
	    cohort_list[cli] = new Array();
	}
	// Walk down and stack up.
	function order_cohort(in_brackets){	    
	    // Push into global cohort list list.
	    for( var i = 0; i < in_brackets.length; i++ ){
		var bracket_item = in_brackets[i];
		//
		//_kvetch(' order_cohort: i: ' + i);
		//_kvetch(' order_cohort: lvl: ' + bracket_item.level);
		cohort_list[bracket_item.level - 1].push(bracket_item);
		// Drill down.
		if( bracket_item.brackets.length > 0 ){
		    //_kvetch(' order_cohort: down: ' +
		    //        bracket_item.brackets.length);
		    order_cohort(bracket_item.brackets);
		}
	    }
	}
	order_cohort(brackets);

	// Gather distance info up from leaves.
	var base_info_nodes = anchor.get_leaf_nodes();
	max_width = base_info_nodes.length; // by def, leaves are widest
	for( var bi = 0; bi < base_info_nodes.length; bi++ ){
	    info_up(base_info_nodes[bi].id());
	}

	///
	/// Decide relative y positions by walking backwards through
	/// the cohorts.
	///


	// Walk backwards through the cohorts to find a base Y position. for
	// the final cohort.
	var position_y = {};
	var final_cohort = cohort_list[(max_depth - 1)];
	//_kvetch('look at final cohort: ' + (max_depth - 1));
	for( var j = 0; j < final_cohort.length; j++ ){
	    var f_item = final_cohort[j];
	    //var local_shift = j + 1.0; // correct, but shifts too far down
	    var local_shift = j + 0.0;
	    position_y[f_item.id] = local_shift;
	    //_kvetch('position_y: ' + f_item.id + ', ' + local_shift);
	}
	// Walk backwards through the remaining cohorts to find the best Y
	// positions.
	for( var i = cohort_list.length - 1; i > 0; i-- ){
	    //
	    var cohort = cohort_list[i - 1];
	    //_kvetch('look at cohort: ' + (i - 1));
	    for( var k = 0; k < cohort.length; k++ ){
		var item = cohort[k];

		// Deeper placements always take precedence.
		if( position_y[item.id] != undefined ){
		    //_kvetch('position_y (old): '+ item.id);
		}else{

		    // If you have one parent, they have the same Y as you.
		    // This generalizes to: the parent has the average Y of
		    // it's children. This is easy then, once we
		    // start, but how to get the initial leaf
		    // placement? Get item's children and take their
		    // average (by definition, they must already be in
		    // the placed list (even if it was just a routing
		    // node)).
		    var c_nodes = anchor.get_child_nodes(item.id);
		    var position_acc = 0.0;
		    for( var ci = 0; ci < c_nodes.length; ci++ ){
			var node = c_nodes[ci];
			position_acc = position_acc + position_y[node.id()];
		    }
		    // _kvetch(' position_acc: ' + position_acc);
		    // _kvetch(' c_nodes: ' + c_nodes);
		    // _kvetch(' c_nodes.length: ' + c_nodes.length);
		    var avg = position_acc / (c_nodes.length * 1.0);
		    position_y[item.id] = avg;
		    //_kvetch('position_y (new): '+ item.id +', '+ avg);
		}
	    }
	}
 
	//
	var x_offset = 0.0;
	var position_x = {};
	var roots = anchor.get_root_nodes();
	for( var r = 0; r < roots.length; r++ ){

	    var root_id = roots[r].id();
	    position_x[root_id] = x_offset;
	    //_kvetch('position_x:: ' + root_id + ', ' + position_x[root_id]);
    
	    if( item.routing_node == false ){
		// Get kids and their x distance (for placement).
		for( var nid in all_dists_parent[root_id] ){
		    var dist = all_dists_parent[root_id][nid] + x_offset;
		    position_x[nid] = dist;
		    //_kvetch('position_x:: ' + nid + ', ' + dist);
		}
	    }
	}

	//
	return {
	    parent_distances: all_dists_parent,
	    child_distances: all_dists_child,
	    max_distance: max_dist,
	    max_depth: max_depth,
	    max_width: max_width,
	    cohorts: cohort_list,
	    //routing: routing_list,
	    brackets: brackets,
	    node_list: node_list,
	    edge_list: edge_list,
	    position_x: position_x,
	    position_y: position_y
	};
    };

    /*
     * Function: dump_cohorts
     *
     * Dump the cohorts; for debugging?
     *
     * Parameters:
     *  n/a
     *
     * Returns: 
     *  n/a
     */
    this.dump_cohorts = function(){
    	for( var i = 0; i < cohort_list.length; i++ ){
    	    for( var j = 0; j < cohort_list[i].length; j++ ){
    		var item = cohort_list[i][j];
    		//_kvetch(item.id + ' ' + i +':'+ j + ', ' + item.routing_node);
    	    }
    	}
    };

    /*
     * Function: dump_dist
     *
     * Dump distances; for debugging?
     *
     * Parameters: 
     *  in_arg - string; 'child'/'parent'?
     *
     * Returns: 
     *  n/a
     */
    this.dump_dist = function(in_arg){

	//_kvetch(' in ');

	// Argument selection.
	var dists = all_dists_parent;
	if( in_arg == "child" ){
	    dists = all_dists_child;
	}

	// Dump selected dist.
	for( var n_id in dists ){
	    for( var k_id in dists[n_id] ){
		//_kvetch(n_id +' : '+ k_id +' => '+ dists[n_id][k_id]);
	    }
	}
    };

    /*
     * Function: dump_brackets
     *
     * Dump brackets; for debugging?
     *
     * Parameters: 
     *  brack - *[optional]* ???
     *
     * Returns: 
     *  n/a
     */
    this.dump_brackets = function(brack){

	// Bootstrap if just starting.
	if( ! brack ){ brack = brackets; }
	//if( ! lvl ){ lvl = 1; }

	// Printer.
	for( var i = 0; i < brack.length; i++ ){

	    var pid = '(null)';
	    if( brack[i].parent_id ){ pid = brack[i].parent_id; }

	    // _kvetch('id: ' + brack[i].id +
	    // 		     ', parent: ' + pid +
	    // 		     ', level: ' + brack[i].level);
	    this.dump_brackets(brack[i].brackets);
	}
    };

};
bbop.core.extend(bbop.model.tree.graph, bbop.model.graph);
// Overload add_node to add label information to new object.
/* 
 * Package: bracket.js
 * 
 * Namespace: bbop.model.bracket.graph
 * 
 * Purpose: An extension of <bbop.model.graph> to produce a bracketed
 * layout (like the neighborhood view in AmiGO 1.8).
 * 
 * TODO: A work in progress...
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.model == "undefined" ){ bbop.model = {}; }
if ( typeof bbop.model.bracket == "undefined" ){ bbop.model.bracket = {}; }
//if ( typeof bbop.model.bracket.graph == "undefined" ){ bbop.model.bracket.graph = {}; }

/*
 * Namespace: bbop.model.bracket.graph
 * 
 * Constructor: bracket
 * 
 * Extension of <bbop.model.graph>
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  this
 */
bbop.model.bracket.graph = function(){
    bbop.model.graph.call(this);
    this._is_a = 'bbop.model.bracket.graph';

    var anchor = this;
    var each = bbop.core.each;
    anchor._logger.DEBUG = true;
    function ll(str){ anchor._logger.kvetch(str); }

    /*
     * Function: bracket_layout
     *
     * Largely borrowed from ChewableGraph.pm from the perl section on
     * AmiGO 2.
     * 
     * Produces a simple bracketed layout based on the maximum
     * distance from the node-of-interest to all other nodes. It also
     * includes direct children as the last row. Useful in some layout
     * contexts.
     *
     * Any node in a properly made graph should be fine, but for the
     * usual end case, see <rich_bracket_layout>.
     * 
     * Parameters: 
     *  term_acc - node of interest
     *
     * Returns: 
     *  list of lists or id strings [[id1, id2], ...]
     */
    this.bracket_layout = function(term_acc){
	
	// // This is the actual path climbing agent.
	// function max_info_climber(in_curr_term, in_curr_term_dist,
	// 			  in_max_hist, in_enc_hist){

	//     // We either bootstrap (first run) or pull them in.
	//     var curr_term = in_curr_term || term_acc;
	//     var curr_term_distance = in_curr_term_dist || 0;
	//     var max_hist = in_max_hist || {};
	//     var encounter_hist = in_enc_hist || {};

	//     // ll('looking at: ' + curr_term + ' at ' + curr_term_distance);

	//     // Only recur if our encounter history sez that either
	//     // this node is new or if we have a higher distance count
	//     // (in which case we add it and continue on our merry
	//     // way).
	//     if( ! bbop.core.is_defined(encounter_hist[curr_term]) ){
	// 	// ll(curr_term + ' is a new encounter at distance ' +
	// 	//    curr_term_distance);

	// 	// Note that we have encountered this node before.
	// 	encounter_hist[curr_term] = 1;

	// 	// Our first distance is the current one!
	// 	max_hist[curr_term] = curr_term_distance;

	// 	// Increment our distance.
	// 	curr_term_distance++;

	// 	// Take a look at all the parents of our current term.
	// 	each(anchor.get_parent_nodes(curr_term),
	// 	     function(p){
	// 		 // Since this is a new node encounter, let's
	// 		 // see what else is out there to discover.
	// 		 max_info_climber(p.id(), curr_term_distance,
	// 				  max_hist, encounter_hist);
	// 	     });

	//     }else if( encounter_hist[curr_term] ){
	// 	// ll(curr_term + ' has been seen before');

	// 	// If we're seeing this node again, but with a
	// 	// separate history, we'll add the length or our
	// 	// history to the current, but will not recur in any
	// 	// case (we've been here before).
	// 	if( max_hist[curr_term] < curr_term_distance ){
	// 	    // ll(curr_term +' has a new max of '+ curr_term_distance);
	// 	    max_hist[curr_term] = curr_term_distance;
	// 	}
	//     }

	//     // Return the collected histories.
	//     return max_hist;
	// }

	// This is the actual path climbing agent.
	function max_info_climber(in_curr_list, in_curr_term_dist,
				  in_max_hist, in_enc_hist){

	    // We either bootstrap (first run) or pull them in.
	    var curr_list = in_curr_list || [];
	    // curr_list must be a list.
	    if( ! bbop.core.is_array(curr_list) ){ curr_list = [curr_list]; }
	    var curr_term_distance = in_curr_term_dist || 0;
	    var max_hist = in_max_hist || {};
	    var encounter_hist = in_enc_hist || {};

	    function update_info_for(update_item, update_distance){
		if( ! encounter_hist[update_item] ){
		    // ll('first time encountering: ' +
		    //    update_item + ', @:' + update_distance);
		    // Note that we have encountered this node before.
		    encounter_hist[update_item] = 1;
		    // Our first distance is the current one!
		    max_hist[update_item] = update_distance;
		}else{
		    // ll('have seen before: ' + update_item + '...' +
		    //    max_hist[update_item] + '/' + update_distance);
		    // If we're seeing this node again, but with a
		    // separate history, we'll add the length or our
		    // history to the current, but will not recur in
		    // any case (we've been here before).
		    if( max_hist[update_item] < update_distance ){
			// ll('   new high at current: ' + update_distance);
			max_hist[update_item] = update_distance;
		    }else{
			// ll('   keeping current: ' + max_hist[update_item]);
		    }
		}
	    }

	    // //
	    // ll('new set @' + curr_term_distance + ' looks like: ' +
	    //    bbop.core.dump(curr_list));

	    // Only work if we have things in our list.
	    if( curr_list && curr_list.length > 0 ){

		// Process everything in the list.
		each(curr_list,
		     function(item){
			 update_info_for(item, curr_term_distance);
		     });

		// Collect the parents of everything in the list.
		var next_round = {};
		each(curr_list,
		     function(item){
			 each(anchor.get_parent_nodes(item),
			      function(p){
				  var pid = p.id();
				  next_round[pid] = true;
			      });
		     });
		var next_list = bbop.core.get_keys(next_round);

		// Increment our distance.
		curr_term_distance++;

		// //
		// ll('future @' + curr_term_distance + ' looks like: ' +
		//    bbop.core.dump(next_list));

		// Recur on new parent list.
		max_info_climber(next_list, curr_term_distance,
				 max_hist, encounter_hist);
	    }

	    // Return the collected histories.
	    return max_hist;
	}

	// A hash of the maximum distance from the node-in-question to
	// the roots.
	var max_node_dist_from_root = max_info_climber(term_acc);
	// ll('max_node_dist_from_root: ' +
	//    bbop.core.dump(max_node_dist_from_root));

	///
	/// Convert this into something like brackets.
	///

	// First, invert hash.
	// E.g. from {x: 1, y: 1, z: 2} to {1: [x, y], 2: [z]} 
	var lvl_lists = {};
	each(max_node_dist_from_root,
	    function(node_id, lvl){
		// Make sure that level is defined before we push.
		if( ! bbop.core.is_defined(lvl_lists[lvl]) ){
		    lvl_lists[lvl] = [];
		}

		lvl_lists[lvl].push(node_id);
	    });
	// ll('lvl_lists: ' + bbop.core.dump(lvl_lists));

	// Now convert the level-keyed hash into an array of arrays.
	// E.g. from {1: [x, y], 2: [z]} to [[x, y], [z]]
	var bracket_list = [];
	var levels = bbop.core.get_keys(lvl_lists);
	levels.sort(bbop.core.numeric_sort_ascending);
	// ll('levels: ' + bbop.core.dump(levels));
	each(levels,
	    function(level){
		var bracket = [];
		each(lvl_lists[level],
		     function(item){
			 bracket.push(item);
		     });
		bracket_list.push(bracket);
	    });
	bracket_list.reverse(); // ...but I want the opposite
	// ll('bracket_list: ' + bbop.core.dump(bracket_list));

	// Well, that takes care of the parents, now lets do the
	// trivial task of adding all of the kids (if any).
	var c_nodes = anchor.get_child_nodes(term_acc);
	// Only add another level when there are actually kids.
	if( c_nodes && ! bbop.core.is_empty(c_nodes) ){ 
	    var kid_bracket = [];
	    each(c_nodes,
		 function(c){
		     kid_bracket.push(c.id());
		 });
	    bracket_list.push(kid_bracket);
	}

	return bracket_list;
    };

    /*
     * Function: relation_weight
     *
     * A GO-specific take on the relative importance of relations in a
     * graph.
     * 
     * Parameters: 
     *  predicate_acc - as string
     *  default_weight - *[optional]* as numbrt
     *
     * Returns: 
     *  relative weight of predicate as number; defaults to 0
     */
    this.relation_weight = function(predicate_acc, default_weight){

	var rel = predicate_acc || '';
	var dflt = default_weight || 0;
	var order =
	    {
		is_a: 1,
		has_part: 2,
		part_of: 3,
		regulates: 4,
		negatively_regulates: 5,
		positively_regulates: 6
	    };

	var ret_weight = dflt;
	if( bbop.core.is_defined(rel) &&
	    rel &&
	    bbop.core.is_defined(order[rel]) ){
	    ret_weight = order[rel];
	}

	return ret_weight;
    };

    /*
     * Function: dominant_relationship
     *
     * Given a bunch of relationships, return the one that is more
     * "dominant".
     * 
     * A GO-specific take on the relative importance of relations in a
     * graph.
     * 
     * Parameters: 
     *  whatever - predicate acc, or lists of lists them...whatever
     *
     * Returns: 
     *  string acc of the dominant relationship or null
     * 
     * See also:
     *  <relationship_weight>
     */
    this.dominant_relationship = function(){

	// Collect all of the relations, recursively unwinding as
	// necessary to get to the end of the arguments/lists of
	// predicate accs.
	// WARNING: Do /not/ try to refactor this for loop--see the
	// documentation for each for the reason.
	var all_rels = [];
	for( var dri = 0; dri < arguments.length; dri++ ){
	    var arg = arguments[dri];
	    //ll('ARG: ' + arg);
	    if( bbop.core.what_is(arg) === 'array' ){
		// This funny thing is actually "dereferencing" the
		// array one step for the recursion.
		all_rels.push(this.dominant_relationship.apply(this, arg));
	    }else{
		all_rels.push(arg);
	    }
	}
	
	// Sort all of the remaining predicate accs according to
	// relation_weight.
	all_rels.sort(function(a, b){
			  return anchor.relation_weight(b) -
			      anchor.relation_weight(a);
		      });

	// Choose the top if it's there, null otherwise.
	var retval = null;
	if( all_rels.length ){
	    retval = all_rels[0];
	}

	return retval;
    };

    /*
     * Function: rich_bracket_layout
     *
     * Very similar to <bracket_layout>, except that instead of the
     * node id, there is a list of [node_id, node_label, predicate].
     * 
     * This is only reliably producable if the following two condition
     * is met: the transitivity graph is the one made for the node of
     * interest by the GOlr loading engine. This is easy to meet if
     * using GOlr, but probably better to roll your own if you're not.
     * 
     * Also, the relative weight of the relations used is very
     * GO-specific--see <relation_weight>.
     * 
     * Again, heavy borrowing from ChewableGraph.pm from the perl
     * section in AmiGO 2.
     * 
     * Parameters: 
     *  term_acc - node of interest
     *  transitivity_graph - the <bbop.model.graph> for the relations
     *
     * Returns: 
     *  list of lists of lists: [[[id, label, predicate], ...], ...]
     */
    this.rich_bracket_layout = function(term_acc, transitivity_graph){
	
	// First, lets just get our base bracket layout.
	var layout = anchor.bracket_layout(term_acc);

	// So, let's go through all the rows, looking on the
	// transitivity graph to see if we can find the predicates.
	var bracket_list = [];
	each(layout,
	    function(layout_level){
		var bracket = [];
		each(layout_level,
		     function(layout_item){

			 // The defaults for what we'll pass back out.
			 var curr_acc = layout_item;
			 var pred_id = 'is_a';			 
			 var curr_node = anchor.get_node(curr_acc);
			 var label = curr_node.label() || layout_item;

			 // 

			 // Now we just have to determine
			 // predicates. If we're the one, we'll just
			 // use the defaults.
			 if( curr_acc == term_acc ){
			     // Default.
			 }else{
			     // Since the transitivity graph only
			     // stores ancestors, we can also use it
			     // to passively test if these are
			     // children we should be looking for.
			     var trels =
				 transitivity_graph.get_predicates(term_acc,
								   curr_acc);
			     if( ! bbop.core.is_empty(trels) ){
				 // Not children, so decide which of
				 // the returned edges is the best.
				 pred_id = anchor.dominant_relationship(trels);
			     }else{
				 // Probably children, so go ahead and
				 // try and pull the direct
				 // parent/child relation.
				 var drels = anchor.get_predicates(curr_acc,
								   term_acc);
				 pred_id = anchor.dominant_relationship(drels);
			     }
			 }

			 // Turn our old layout item into a new-info
			 // rich list.
			 bracket.push([curr_acc, label, pred_id]);
		     });
		// Sort alphanum and then re-add to list.
		bracket.sort(
		    function(a, b){
			if( a[1] < b[1] ){
			    return -1;
			}else if( a[1] > b[1] ){
			    return 1;
			}else{
			    return 0;
			}
		    });
		bracket_list.push(bracket);
	    });

	return bracket_list;
    };
};
bbop.core.extend(bbop.model.bracket.graph, bbop.model.graph);
/* 
 * Package: sugiyama.js
 * 
 * Namespace: bbop.layout.sugiyama
 * 
 * Purpose: Sugiyama system.
 * 
 * TODO: /Much/ better documentation. I have no idea what's going on
 * in there anymore...will try to recover what I can.
 * 
 * TODO: Matrix implementation and partition->matrix step need to be
 * tightened.
 *
 * TODO: Switch strange for-loops to bbop.core.each.
 *
 * BUG: need to check if there are no edges.
 * 
 * Actually, maybe there should be a separate render section, as this
 * is just a normal graph really?
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.layout == "undefined" ){ bbop.layout = {}; }
if ( typeof bbop.layout.sugiyama == "undefined" ){ bbop.layout.sugiyama = {}; }

// Speciality variables in the namespace.
//bbop.layout.sugiyama.DEBUG = true;
bbop.layout.sugiyama.DEBUG = false;
bbop.layout.sugiyama.iterations = 10;

///
/// Defined some special in-house objects for helping figure out
/// the layout.
///

// Id, level, and whether it is real or not.
bbop.layout.sugiyama.simple_vertex = function(in_id, is_virtual){

    var vid = in_id;
    this.is_virtual = false;
    this.level = null;
    
    if( is_virtual ){
	this.is_virtual = true;
    }
    
    this.id = function(){
	return vid;
    };  
};

// An edge. A pair of ids and virtual_p.
bbop.layout.sugiyama.simple_edge = function( sub, obj, is_virtual ){

    var subject = sub;
    var object = obj;
    this.is_virtual = false;
    //var predicate = pred;
    
    //var is_virtual = false;
    //if( in_type ){
    //  is_virtual = true; }
    
    if( is_virtual ){
	this.is_virtual = true;
    }
    
    this.subject = function(){
	return subject;
    };
    
    this.object = function(){
	return object;
    };
    
    this.id = function(){
	return subject + '^' + object;
    };
    
    //this.predicate = function(){
    //  return predicate; };
};

/*
 * Wrapper for the recursive partitioner and partition object.
 * 
 * Partitions the graph into a layer cake of nodes, adds in the
 * necessary virtual nodes to make path routing work.
 */
bbop.layout.sugiyama.partitioner = function(graph){
    //bbop.layout.sugiyama.partitioner = function(graph, rel){
    
    // Internal logger.
    var logger = new bbop.logger("Partitioner");
    logger.DEBUG = bbop.layout.sugiyama.DEBUG;
    function ll(str){ logger.kvetch(str); }
    // Warning logger.
    var yikes = new bbop.logger("Partitioner WARNING");
    function warn_me(str){ yikes.kvetch(str); }


    // Aliases.
    var each = bbop.core.each;

    // Make use lexical scoping.
    var first_seen_reference = {};
    var last_seen_reference = {};
    var vertex_set = {};
    var edge_set = {};
    var vertex_partition_set = {};
    var edge_partition_set = {};
    var logical_paths = [];
    var maximum_partition_width = 0;
    var number_of_partitions = 0;

    // Dump partition.
    this.dump = function(){

	// Dump vertex partitions.
	var num_parts = 0;
	for( var key in vertex_partition_set ){
	    num_parts++;
	}
	for( var i = 0; i < num_parts; i++ ){
	    ll('Vertex Partition ' + i + ':');

	    var curr_part = vertex_partition_set[ i ];
	    var out = [];
	    for( var j = 0; j < curr_part.length; j++ ){
		out.push('[' + curr_part[j].id() + ']');
	    }
	    ll(out.join(''));
	}

	// Dump edge partitions.
	num_parts = 0;
	for( var key in edge_partition_set ){
	    num_parts++;
	}
	for( var i = 0; i < num_parts; i++ ){
	    ll('Edge Partition ' + i + ':');
	    var curr_part = edge_partition_set[ i ];
	    var out = [];
	    for( var j = 0; j < curr_part.length; j++ ){
		out.push('[' + curr_part[j].id() + ']');
	    }
	    ll(out.join(''));
	}

	// Dump paths list.
	for( var i = 0; i < logical_paths.length; i++ ){
	    ll('Path ' + i + ':');
	    var out = [];
	    for( var l = 0; l < logical_paths[i].length; l++ ){
		out.push( logical_paths[i][l] );
	    }
	    ll(out.join(', '));
	}
    };

    //
    this.max_partition_width = function(){
	return maximum_partition_width;
    };

    // Return the number of partitions.
    this.number_of_vertex_partitions = function(){
	return number_of_partitions;
    };

    // Return a partition.
    this.get_vertex_partition = function(integer){
	return vertex_partition_set[ integer ];
    };

    // Return the number of partitions.
    this.number_of_edge_partitions = function(){
	var i = 0;
	for( var key in edge_partition_set ){ i++; }
	return i;
    };

    // Return a partition.
    this.get_edge_partition = function(integer){
	return edge_partition_set[ integer ];
    };

    // Return the number of paths.
    this.number_of_logical_paths = function(){
	return logical_paths.length;
    };

    // Return the paths list.
    //this.get_logical_paths = function(integer){
    this.get_logical_paths = function(integer){
	return logical_paths;
    };

    // // Define the partitioner. Recursively walk the graph. BFS.
    // //function recursivePartitioner(graph, node, relation, level){
    // function recursivePartitioner(graph, node, level){
	
    // 	var curr_level = level;
    // 	var next_level = level +1;

    // 	ll("Saw " + node.id() + " at level " + level + "!");

    // 	// Have we seen it before or is it new?
    // 	var was_seen = false;
    // 	if( ! vertex_set[ node.id() ] ){

    // 	    // Create new vertex and add to set.
    // 	    var new_vertex = new bbop.layout.sugiyama.simple_vertex(node.id());
    // 	    new_vertex.level = level;
    // 	    vertex_set[ new_vertex.id() ] = new_vertex;

    // 	    // Check the node in to the 'seen' references.
    // 	    first_seen_reference[ new_vertex.id() ] = level;
    // 	    last_seen_reference[ new_vertex.id() ] = level;

    // 	}else{

    // 	    if( first_seen_reference[ node.id() ] > level ){
    // 		first_seen_reference[ node.id() ] = level;
    // 	    }
    // 	    if( last_seen_reference[ node.id() ] < level ){
    // 		last_seen_reference[ node.id() ] = level;
    // 	    }

    // 	    was_seen = true;
    // 	}
	
    // 	// Get all the child nodes and down we go!
    // 	//var child_nodes = graph.getExtantChildren(node.id(), relation);
    // 	var child_nodes = graph.get_child_nodes(node.id());
    // 	// TODO: Better way?
    // 	//var child_nodes = graph.getChildren(node.id(), relation);
    // 	for( var i = 0; i < child_nodes.length; i++ ){
    // 	    // Add edge and descend.
    // 	    var new_edge =
    // 		new bbop.layout.sugiyama.simple_edge(child_nodes[i].id(),
    // 						    node.id());
    // 	    edge_set[ new_edge.id() ] = new_edge;

    // 	    // Do not recur on seen nodes.
    // 	    if( ! was_seen ){
    // 		//recursivePartitioner(graph, child_nodes[i], relation, level +1);
    // 		recursivePartitioner(graph, child_nodes[i], level +1);
    // 	    }
    // 	}
    // }
    
    // Detect a cycle by seeing if the ID in question appears in the
    // search history stack.
    // TODO/BUG: make this less hyper-dumb and/or slow.
    function _cycle_p(node, stack){
	var ret = false;

	var id = node.id();
	each(stack,
	     function(item){
		 if( item == id ){
		     ret = true;
		 }
	     });

	return ret;
    }

    // Add a new node to the global variables.
    function _new_node_at(bnode, level){

	ll("adding " + bnode.id() + " at level " + level + "!");

	// Create new vertex and add to set.
	var new_vertex = new bbop.layout.sugiyama.simple_vertex(bnode.id());
	new_vertex.level = level;
	vertex_set[ new_vertex.id() ] = new_vertex;
	
	// Check the node in to the 'seen' references.
	first_seen_reference[ new_vertex.id() ] = level;
	last_seen_reference[ new_vertex.id() ] = level;		 
    }

    // Define the partitioner. Recursively walk the graph. BFS.
    //function recursivePartitioner(graph, node, relation, level){
    function recursivePartitioner(graph, node, call_stack){
	
	var curr_level = call_stack.length -1;
	var next_level = curr_level +1;

	ll("recur on " + node.id() + " at level " + curr_level);

	// Get children and see where there are.
	//var child_nodes = graph.get_child_nodes(node.id(), relation);
	var child_nodes = graph.get_child_nodes(node.id());
	ll(node.id() + " has " + (child_nodes.length || 'no' ) + ' child(ren)');
	for( var i = 0; i < child_nodes.length; i++ ){
	    var cnode = child_nodes[i];

	    ll("looking at " + cnode.id());

	    if( _cycle_p(cnode, call_stack) ){
		ll('no update to ' + cnode.id() + ': cycle');
	    }else{

		// Add edges--safe since they're definition-based and will
		// clobber if they're already in.
		var new_edge =
		    new bbop.layout.sugiyama.simple_edge(cnode.id(), node.id());
		edge_set[ new_edge.id() ] = new_edge;

		// Nodes we have to be a little more careful with since
		// they're what we're using for traversal.
		if( ! vertex_set[ cnode.id() ] ){
		
		    // Create new vertex and add to set.
		    _new_node_at(cnode, next_level);
		    
		    // Since it is a new node, we traverse it.
		    ll('cs (a): ' + call_stack);
		    var new_cs = bbop.core.clone(call_stack);
		    ll('cs (b): ' + new_cs);
		    new_cs.push(cnode.id());
		    ll('cs (c): ' + new_cs);
		    recursivePartitioner(graph, cnode, new_cs);
		    
		}else{
		    
		    ll('to update ' + cnode.id() + ' level to ' + next_level +
		       '; fsr: '+ first_seen_reference[ cnode.id() ] +
		       '; lsr: '+ last_seen_reference[ cnode.id() ]);
		    
		    // Otherwise, just update the levels that we've seen
		    // the child at--do not descend.
		    if( first_seen_reference[ cnode.id() ] > next_level ){
			first_seen_reference[ cnode.id() ] = next_level;
		    }
		    if( last_seen_reference[ cnode.id() ] < next_level ){
			last_seen_reference[ cnode.id() ] = next_level;
			// LSR is also the level that things will
			// appear at, so update.
			// I believe node and simple node IDs are the same?
			vertex_set[ cnode.id() ].level = next_level;

			// Recur if the LSR has change--we need to
			// update all of the nodes below.
			ll('cs (a): ' + call_stack);
			var new_cs = bbop.core.clone(call_stack);
			ll('cs (b): ' + new_cs);
			new_cs.push(cnode.id());
			ll('cs (c): ' + new_cs);
			recursivePartitioner(graph, cnode, new_cs);
		    }

		    // ll('updated ' + cnode.id() + ' level to ' + next_level +
		    //    '; fsr: '+ first_seen_reference[ cnode.id() ] +
		    //    '; lsr: '+ last_seen_reference[ cnode.id() ]);
		}
	    }
	}
    }
    
    // Run the partitioner after getting the root values (or whatever)
    // bootstrapped in.
    //var roots = graph.get_root_nodes(rel);
    var roots = graph.get_root_nodes();
    if( roots.length > 0 ){
	//partitionerBootstrap(roots);
	for( var i = 0; i < roots.length; i++ ){
	    _new_node_at(roots[i], 0);
	    recursivePartitioner(graph, roots[i], [roots[i].id()]);
	}
    }else{
    	// If there is no root (think of a "top-level" cycle),
    	// a node should be picked randomly.
    	// TODO: Test this.
    	var a_node = graph.all_nodes()[0] || null;
    	if( ! a_node ){
    	    ll('warning: apparently the graph is empty');
    	    //throw new Error('apparently the graph is empty--stop it!');
    	}else{
	    _new_node_at(a_node, 0);
    	    recursivePartitioner(graph, a_node, [a_node.id()]);
    	}
    }

    // Now we have a listing of the first and last level that a node
    // appears at. We'll go through and make a proper ordering. We know
    // that the last seen reference is where the actual node will
    // appear. If there is a difference with the listing in the first
    // node reference, the difference will be made in virtual nodes.
    var v_id = 0;
    for( var key in edge_set ){
	var edge = edge_set[ key ];

	var difference = vertex_set[ edge.subject() ].level -
	    vertex_set[ edge.object() ].level;
	ll('diff for '+edge.subject()+' -> '+edge.object()+' = '+ difference);
	ll('   ' + vertex_set[ edge.subject() ].level + '-' +
	   vertex_set[ edge.object() ].level);

	// If there is a difference, create virtual nodes and
	// paths. Deleted used edges.
	var new_path = [];
	if( difference > 1 ){
	    
	    // Create a new chain of virtual nodes.
	    var current_subject = edge.object();
	    var current_object = null;
	    var current_level = vertex_set[ edge.object() ].level; 
	    new_path.push(edge.object());
	    for( var i = 1; i <= difference; i++ ){

		current_object = current_subject;
		current_level++;

		if( i != difference ){
		    // Make a virtual node.
		    var v_node_id = '_VN_' + v_id + '_';
		    v_id++;	
		    var new_v_node =
			new bbop.layout.sugiyama.simple_vertex(v_node_id, true);
		    new_v_node.level = current_level;
		    vertex_set[ new_v_node.id() ] = new_v_node;
		    current_subject = new_v_node.id();
		    new_path.push(new_v_node.id());
		}else{
		    // Last link and path step.
		    current_subject = edge.subject();
		    new_path.push(edge.subject());
		}

		// Make edge to virtual node.
		var new_edge =
		    new bbop.layout.sugiyama.simple_edge(current_subject,
							current_object, true);
		edge_set[ new_edge.id() ] = new_edge;	
	    }

	    // Since the node generator goes in reverse order.
	    new_path.reverse();

	    // Finally, delete the edge connecting these two--no longer needed.
	    delete( edge_set[ key ] );

	}else{
	    // Add the trival path.
	    new_path.push(edge.subject());
	    new_path.push(edge.object());
	}
	// Add our new path to the group.
	logical_paths.push(new_path);
    }

    // Sort the vertices into different partitions and count them.
    for( var key in vertex_set ){
	var vert = vertex_set[ key ];
	var lvl = vert.level;
	if( ! vertex_partition_set[ lvl ] ){
	    vertex_partition_set[ lvl ] = [];
	    number_of_partitions++; // Count the number of partitions.
	}
	vertex_partition_set[ lvl ].push(vert);
	// Count max width.
	if( vertex_partition_set[ lvl ].length > maximum_partition_width ){
	    maximum_partition_width = vertex_partition_set[ lvl ].length;
	}
    }

    // Sort the edges into different partitions. Made easier since the
    // vertices have already been sorted.
    for( var key in edge_set ){

	var edge = edge_set[ key ];
	var lvl = vertex_set[ edge.object() ].level;
	ll('l:' +lvl);
	if( ! edge_partition_set[ lvl ] ){
	    edge_partition_set[ lvl ] = [];
	}
	edge_partition_set[ lvl ].push(edge);
    }
};

// Takes arrays of vertices and edges as an argument. Edges must have
// the methods '.object()' and '.subject()' and Vertices must have
// method '.id()'.
bbop.layout.sugiyama.bmatrix = function(object_vertex_partition,
					subject_vertex_partition,
					edge_partition){
    
    // Internal logger.
    var logger = new bbop.logger("BMatrix");
    logger.DEBUG = bbop.layout.sugiyama.DEBUG;
    function ll(str){ logger.kvetch(str); }
    // Warning logger.
    var yikes = new bbop.logger("BMatrix WARNING");
    function warn_me(str){ yikes.kvetch(str); }

    var relation_matrix = {};
    // var object_vector = object_vertex_partition;
    // var subject_vector = subject_vertex_partition;
    var object_vector = object_vertex_partition || [];
    var subject_vector = subject_vertex_partition || [];
    // Still warn that there is an issue.
    if( ! object_vector || ! subject_vector ){
	warn_me('WARNING: We found an instance of: https://github.com/kltm/bbop-js/issues/23; using a workaround.');
    }

    for( var i = 0; i < edge_partition.length; i++ ){

	var obj_id = edge_partition[i].object();
	var sub_id = edge_partition[i].subject();

	//
	if( ! relation_matrix[ obj_id ] ){
	    relation_matrix[ obj_id ] = {}; }
	//if( ! relation_matrix[ sub_id ] ){
	//  relation_matrix[ sub_id ] = {}; }

	relation_matrix[ obj_id ][ sub_id ] = true;
	//relation_matrix[ sub_id ][ obj_id ] = false;
    }

    // DEBUG relation matrix:
    // BUG: subject _vector occasionally undefined
    for( var m = 0; m <= object_vector.length -1; m++ ){
	ll("obj: <<o: " + object_vector[m].id() + ">>"); }
    for( var n = 0; n <= subject_vector.length -1; n++ ){
	ll("sub: <<o: " + subject_vector[n].id() + ">>"); }
    for( ob in relation_matrix ){
	for( su in relation_matrix[ ob ] ){
	    ll("edge: <<o: " + ob + ", s: " + su + ">>");
	}
    }

    //
    function getObjectBarycenter(object){
	var weighted_number_of_edges = 0;
	var number_of_edges = 0;
	for( var s = 1; s <= subject_vector.length; s++ ){
	    if( relation_matrix[object.id()] &&
		relation_matrix[object.id()][subject_vector[s -1].id()]){
		weighted_number_of_edges += s;
		number_of_edges++;
	    }
	}
	// The '-1' is to offset the indexing.
	return ( weighted_number_of_edges / number_of_edges ) -1;
    };

    // Gets barycenter for column s.
    function getSubjectBarycenter(subject){

	var weighted_number_of_edges = 0;
	var number_of_edges = 0;
	for( var o = 1; o <= object_vector.length; o++ ){
	    if( relation_matrix[object_vector[o -1].id()] &&
		relation_matrix[object_vector[o -1].id()][subject.id()]){
		weighted_number_of_edges += o;
		number_of_edges++;
	    }
	}
	// The '-1' is to offset the indexing.
	return ( weighted_number_of_edges / number_of_edges ) -1;
    };

    // BUG: These damn things seem to reoder on equal--want no reorder
    // on equal. Reorder objects given B1 <= B2, where Bi is the
    // barycenter weight.
    this.barycentricObjectReorder = function(){  
	object_vector.sort(
	    function(a,b){
		return getObjectBarycenter(a)
		    - getObjectBarycenter(b);
	    });
    };

    // BUG: These damn things seem to reoder on equal--want no reorder
    // on equal. Reorder subjects given B1 <= B2, where Bi is the
    // barycenter weight.
    this.barycentricSubjectReorder = function(){
	subject_vector.sort(
	    function(a,b){
		return getSubjectBarycenter(a)
		    - getSubjectBarycenter(b);
	    });
    };
    
    // Display the stored matrix.
    this.dump = function(){
	
	var queue = [];
	var string = null;

	//ll('o:' + object_vector);
	//ll('s:' + subject_vector);

	// Print top row.
	for( var i = 0; i < subject_vector.length; i++ ){
	    queue.push(subject_vector[i].id());
	}
	string = queue.join('\t');
	ll('o\\s\t' + string );

	// Print remainder.
	for( var j = 0; j < object_vector.length; j++ ){
	    queue = [];
	    queue.push(object_vector[j].id());
	    //ll("_(o: " + object_vector[j].id() + ")");
	    for( var k = 0; k < subject_vector.length; k++ ){
		//ll("_(o: "+object_vector[j].id() +", s: "+subject_vector[k].id()+")");
		//ll("(j: " + j + " k: " + k + ")");
		if( relation_matrix[object_vector[j].id()] &&
		    relation_matrix[object_vector[j].id()][subject_vector[k].id()] ){
			queue.push('(1)');
		    }else{
			queue.push('(0)');
		    }
	    }
	    ll(queue.join('\t'));
	}
    };
};

// Takes a graph.
// Can be queried for the position of every node and edge.
// GraphLayout = {};
// GraphLayout.Sugiyama = function
bbop.layout.sugiyama.render = function(){
    //bbop.layout.graph.call(this);
    this._is_a = 'bbop.layout.sugiyama.render';

    // Get a good self-reference point.
    var anchor = this;

    // Internal logger.
    var logger = new bbop.logger("SuGR");
    logger.DEBUG = bbop.layout.sugiyama.DEBUG;
    function ll(str){ logger.kvetch(str); }
    // Warning logger.
    var yikes = new bbop.logger("SuGR WARNING");
    function warn_me(str){ yikes.kvetch(str); }

    //
    //this.layout = function(graph_in, rel){
    this.layout = function(graph_in){
    //this.layout = function(){
	
	///
	/// Step I: Make a proper hierarchy; partition the graph over
	/// 'is_a'.
	///
	
	//var partitions = new bbop.layout.sugiyama.partitioner(g, 'is_a');
	//var partitions = new bbop.layout.sugiyama.partitioner(graph_in, rel);
	var partitions = new bbop.layout.sugiyama.partitioner(graph_in);
	//var partitions = new bbop.layout.sugiyama.partitioner(anchor);

	// DEBUG:
	ll('Dump paritions:');
	partitions.dump();
	ll('');

	///
	/// Step II: Reduce number of crossings by vertex permutation.
	///

	var edge_partitions = [];
	var vertex_partitions = [];

	// BUG: Need to catch num_partitions < 2 Create an instatiation of
	// all of the matrix representations of the partitions.
	for( var i = 0; i < partitions.number_of_edge_partitions(); i++ ){
	    var epart = partitions.get_edge_partition(i);
	    if( ! epart ){
	    	throw new Error('null edge partition at level: ' + i);
	    }else{
		edge_partitions.push(epart);
	    }
	}

	//
	for( var i = 0; i < partitions.number_of_vertex_partitions(); i++ ){
	    var vpart = partitions.get_vertex_partition(i);
	    if( ! vpart ){
	    	throw new Error('null vertex partition at level: ' + i);
	    }else{
		vertex_partitions.push(vpart);
	    }
	}  
	
	//
	for( var i = 0; i < edge_partitions.length; i++ ){
	    var m = new bbop.layout.sugiyama.bmatrix(vertex_partitions[i],
						     vertex_partitions[i +1],
						     edge_partitions[i]);
	    
	    ll('Matrix: ' + i);
	    m.dump();
	    ll('');
	    
	    // TODO: Can increase the number of iterations--the paper doesn't
	    // really explain this.
	    for( var k = 0; k < bbop.layout.sugiyama.iterations; k++ ){
		m.barycentricObjectReorder();
		m.barycentricSubjectReorder();
	    }

	    ll('Matrix: ' + i);
	    m.dump();
	    ll('');
	}

	///
	/// Step III: give proper integer X and Y positions: suspend
	/// them in a matrix.
	///

	// Create matrix for calculating layout.
	var layout_matrix = [];
	for( var i = 0; i < vertex_partitions.length; i++ ){
	    layout_matrix.push(new Array(partitions.max_partition_width()));
	}
	
	// Populate matrix and register final locations of nodes for later.
	// TODO: Sugiyama method. Temporarily did naive method.
	var real_vertex_locations = [];
	var vertex_registry = {};
	var virtual_vertex_locations = []; // 
	var m = partitions.max_partition_width();
	for( var i = 0; i < vertex_partitions.length; i++ ){
	    var l = vertex_partitions[i].length;
	    for( var v = 0; v < l; v++ ){
		var locale = Math.floor( (v+1) * (m/l/2) );
		while( layout_matrix[i][locale] ){
		    locale++;
		}
		var vid = vertex_partitions[i][v].id();
		layout_matrix[i][locale] = vid;
		vertex_registry[ vid ] = {x: locale, y: i};
		if( ! vertex_partitions[i][v].is_virtual ){
		    real_vertex_locations.push({x: locale, y: i, id: vid});
		}else{
		    virtual_vertex_locations.push({x: locale, y: i, id: vid});
		}
		ll( vid + ', x:' + locale + ' y:' + i);
	    }
	}
	
	// Convert logical paths to actual paths.
	var logical_paths = partitions.get_logical_paths();
	var described_paths = [];
	for( var i = 0; i < logical_paths.length; i++ ){
	    var node_trans = [];
	    var waypoints = [];
	    for( var j = 0; j < logical_paths[i].length; j++ ){
		var cursor = logical_paths[i][j];
		node_trans.push(cursor);
		waypoints.push({x: vertex_registry[cursor].x,
				y: vertex_registry[cursor].y });
	    }
	    described_paths.push({'nodes': node_trans,
				  'waypoints': waypoints});
	}
	
	// Create a return array 
	// DEBUG:
	//   ll('Layout:');
	//   for( var i = 0; i < layout_matrix.length; i++ ){
	//     var out = [];
	//     for( var j = 0; j < layout_matrix[i].length; j++ ){
	//       out.push(layout_matrix[i][j]);
	//     }
	//     ll(out.join('\t'));
	//   }
	//   ll('');
	
	// Return this baddy to the world.
	return { nodes: real_vertex_locations,
		 virtual_nodes: virtual_vertex_locations,
		 paths: described_paths,
		 height: partitions.max_partition_width(),
		 width: partitions.number_of_vertex_partitions()};
    };
};
//bbop.core.extend(bbop.model.sugiyama.graph, bbop.model.graph);
/* 
 * Package: response.js
 * 
 * Namespace: bbop.rest.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST server. This is just an example pass-thru
 * handler that needs to be overridden (see subclasses).
 * 
 * You may note that things like status and status codes are not part
 * of the base response. The reason is is that not all methods of REST
 * in the environments that we use support them. For example: readURL
 * in rhino. For this reason, the "health" of the response is left to
 * the simple okay() function--just enought to be able to choose
 * between "success" and "failure" in the managers. To give a bit more
 * information in case of early error, there is message and
 * message_type.
 * 
 * Similarly, there are no toeholds in the returned data except
 * raw(). All data views and operations are implemented in the
 * subclasses.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }

/*
 * Constructor: response
 * 
 * Contructor for a REST query response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  in_data - the string returned from a request
 * 
 * Returns:
 *  rest response object
 */
bbop.rest.response = function(in_data){
    this._is_a = 'bbop.rest.response';

    // The raw incoming document.
    this._raw = in_data;

    // Cache for repeated calls to okay().
    this._okay = null;
    this._message = null;
    this._message_type = null;
};

/*
 * Function: raw
 * 
 * Returns the initial response object, whatever it was.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  object
 */
bbop.rest.response.prototype.raw = function(){
    return this._raw;
};

/*
 * Function: okay
 * 
 * Simple return verification of sane response from server.
 * 
 * This okay() caches its return value, so harder probes don't need to
 * be performed more than once.
 * 
 * Arguments:
 *  okay_p - *[optional]* setter for okay
 * 
 * Returns:
 *  boolean
 */
bbop.rest.response.prototype.okay = function(okay_p){

    // Optionally set from the outside.
    if( bbop.core.is_defined(okay_p) ){
	this._okay = okay_p;
    }

    //print('a: ' + this._okay);
    if( this._okay == null ){ // only go if answer not cached
	//print('b: ' + this._raw);
	if( ! this._raw || this._raw == '' ){
	    //print('c: if');
	    this._okay = false;
	}else{
	    //print('c: else');
	    this._okay = true;
	}
    }
    
    return this._okay;
};

/*
 * Function: message
 * 
 * A message that the response wants to let you know about its
 * creation.
 * 
 * Arguments:
 *  message - *[optional]* setter for message
 * 
 * Returns:
 *  message string
 */
bbop.rest.response.prototype.message = function(message){
    if( bbop.core.is_defined(message) ){
	this._message = message;
    }
    return this._message;
};

/*
 * Function: message_type
 * 
 * A message about the message (a string classifier) that the response
 * wants to let you know about its message.
 * 
 * Arguments:
 *  message_type - *[optional]* setter for message_type
 * 
 * Returns:
 *  message type string
 */
bbop.rest.response.prototype.message_type = function(message_type){
    if( bbop.core.is_defined(message_type) ){
	this._message_type = message_type;
    }
    return this._message_type;
};
/* 
 * Package: json.js
 * 
 * Namespace: bbop.rest.response.json
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST JSON server.
 * 
 * It will detect if the incoming response is a string, and if so, try
 * to parse it to JSON. Otherwise, if the raw return is already an
 * Object, we assume that somebody got to it before us (e.g. jQuery's
 * handling).
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }

/*
 * Constructor: json
 * 
 * Contructor for a REST JSON response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  json_data - the JSON object as a string (as returned from a request)
 * 
 * Returns:
 *  rest response object
 */
bbop.rest.response.json = function(json_data){
    bbop.rest.response.call(this);
    this._is_a = 'bbop.rest.response.json';

    // The raw incoming document.
    //this._raw_string = json_data_str;
    this._raw_string = null;
    this._okay = null;

    if( json_data ){

	if( bbop.core.what_is(json_data) == 'string' ){

	    // Try and parse out strings.
	    try {
		this._raw = bbop.json.parse(json_data);
		this._okay = true;
	    }catch(e){
		// Didn't make it, but still a string.
		this._raw = json_data;
		this._okay = false;
	    }

	}else if( bbop.core.what_is(json_data) == 'object' ||
		  bbop.core.what_is(json_data) == 'array' ){

	    // Looks like somebody else got here first.
	    this._raw = json_data;
	    this._okay = true;
	    
	}else{

	    // No idea what this thing is...
	    this._raw = null;
	    this._okay = null;
	}
    }
};
bbop.core.extend(bbop.rest.response.json, bbop.rest.response);

// /*
//  * Function: string
//  * 
//  * returns a string of the incoming response
//  * 
//  * Arguments:
//  *  n/a
//  * 
//  * Returns:
//  *  raw response string
//  */
// bbop.rest.response.json.prototype.string = function(){
//     return this._raw_string;
// };
/* 
 * Package: mmm.js
 * 
 * Namespace: bbop.rest.response.mmm
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from the GO Molecular Model Manager REST server JSON
 * responses.
 * 
 * It will detect if the incoming response is structured correctly and
 * give safe access to fields and properties.
 * 
 * It is not meant to be a model for the parts in the data section.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }

/*
 * Constructor: mmm
 * 
 * Contructor for a GO MMM REST JSON response object.
 * 
 * The constructor argument is an object or a string.
 * 
 * Arguments:
 *  raw_data - the JSON object as a string or object
 * 
 * Returns:
 *  response object
 */
bbop.rest.response.mmm = function(raw_data){
    bbop.rest.response.call(this);
    this._is_a = 'bbop.rest.response.mmm';

    // Add the required commentary, inconsistency, and data.
    this._commentary = null;
    this._data = null;

    // Start with the assumption that the response is bad, try and
    // prove otherwise.
    this.okay(false);

    // Raw will only be provided in that cases that it makes sense.
    this._raw = null;
    
    // If we have data coming in...
    if( ! raw_data ){
	
	this.message('empty response in handler');
	this.message_type('error');

    }else{

	// And it looks like something we might be able to deal with...
	var itsa = bbop.core.what_is(raw_data);
	if( itsa != 'string' && itsa != 'object' ){
	    
	    // No idea what this thing is...
	    this.message('bad argument type in handler');
	    this.message_type('error');

	}else{
	    
	    // Try to make the string an object.
	    if( itsa == 'string' ){
		try {
		    this._raw = bbop.json.parse(raw_data);
		}catch(e){
		    // Didn't make it--chuck it to create a signal.
		    this._raw = null;
		    this.message('handler could not parse string response');
		    this.message_type('error');
		}
	    }else{
		// Looks like somebody else got here first.
		this._raw = raw_data;
	    }

	    // If we managed to define some kind of raw incoming data
	    // that is, or has been parsed to, a model, probe it to
	    // see if it is structured correctly.
	    if( this._raw ){

		// Check required fields.
		var data = this._raw;
		// These must always be defined.
		if( data && data['message_type'] && data['message'] ){

		    var odata = data['data'] || null;
		    var cdata = data['commentary'] || null;

		    // If data, object or array.
		    if( odata && bbop.core.what_is(odata) != 'object' &&
			bbop.core.what_is(odata) != 'array' ){
			this.message('data not object');
			this.message_type('error');
		    }else{
			// If commentary, object.
			if( cdata && bbop.core.what_is(cdata) != 'object' ){
			    this.message('commentary not object');
			    this.message_type('error');
			}else{
			    // Looks fine then I guess.
			    this.okay(true);
			    this.message_type(data['message_type']);
			    this.message(data['message']);

			    // Add any additional fields.
			    if( cdata ){ this._commentary = cdata; }
			    if( odata ){ this._data = odata; }
			}
		    }
		}
	    }
	}
    }
};
bbop.core.extend(bbop.rest.response.mmm, bbop.rest.response);

/*
 * Function: commentary
 * 
 * Returns the commentary object (whatever that might be in any given
 * case).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of commentary object or null
 */
bbop.rest.response.mmm.prototype.commentary = function(){
    var ret = null;
    if( this._commentary ){
	ret = bbop.core.clone(this._commentary);
    }
    return ret;
};

/*
 * Function: data
 * 
 * Returns the data object (whatever that might be in any given
 * case). This grossly returns all response data, if any.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of data object or null
 */
bbop.rest.response.mmm.prototype.data = function(){
    var ret = null;
    if( this._data ){
	ret = bbop.core.clone(this._data);
    }
    return ret;
};

/*
 * Function: model_id
 * 
 * Returns the model id of the response.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbop.rest.response.mmm.prototype.model_id = function(){
    var ret = null;
    if( this._data && this._data['id'] ){
	ret = this._data['id'];
    }
    return ret;
};

/*
 * Function: inconsistent_p
 * 
 * Returns true or false on whether or not the returned model is
 * thought to be inconsistent. Starting assumption is that it is not.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  true or false
 */
bbop.rest.response.mmm.prototype.inconsistent_p = function(){
    var ret = false;
    if( this._data &&
	typeof(this._data['inconsistent_p']) !== 'undefined' &&
	this._data['inconsistent_p'] == true ){
	ret = true;
    }
    return ret;
};

/*
 * Function: facts
 * 
 * Returns a list of the facts in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.facts = function(){
    var ret = [];
    if( this._data && this._data['facts'] && 
	bbop.core.is_array(this._data['facts']) ){
	ret = this._data['facts'];
    }
    return ret;
};

/*
 * Function: properties
 * 
 * Returns a list of the properties in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.properties = function(){
    var ret = [];
    if( this._data && this._data['properties'] && 
	bbop.core.is_array(this._data['properties']) ){
	ret = this._data['properties'];
    }
    return ret;
};

/*
 * Function: individuals
 * 
 * Returns a list of the individuals in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.individuals = function(){
    var ret = [];
    if( this._data && this._data['individuals'] && 
	bbop.core.is_array(this._data['individuals']) ){
	ret = this._data['individuals'];
    }
    return ret;
};

/*
 * Function: relations
 * 
 * Returns a list of the relations found in the response. Likely not
 * to be there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.relations = function(){
    var ret = [];
    if( this._data && this._data['relations'] && 
	bbop.core.is_array(this._data['relations']) ){
	ret = this._data['relations'];
    }
    return ret;
};
/* 
 * Package: manager.js
 * 
 * Namespace: bbop.rest.manager
 * 
 * Generic BBOP manager for dealing with basic generic REST calls.
 * This specific one is designed to be overridden by its subclasses.
 * This one pretty much just uses its incoming resource string as the data.
 * Mostly for testing purposes.
 * 
 * Both a <bbop.rest.response> (or clean error data) and the manager
 * itself (this as anchor) should be passed to the callbacks.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }

/*
 * Constructor: manager
 * 
 * Contructor for the REST manager
 * 
 * Arguments:
 *  response_parser - the response handler class to use for each call
 * 
 * Returns:
 *  rest manager object
 * 
 * See also:
 *  <bbop.registry>
 */
bbop.rest.manager = function(response_handler){
    bbop.registry.call(this, ['success', 'error']);
    this._is_a = 'bbop.rest.manager';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    this._logger = new bbop.logger(this._is_a);
    //this._logger.DEBUG = true;
    this._logger.DEBUG = false;
    function ll(str){ anchor._logger.kvetch(str); }

    // Handler instance.
    this._response_handler = response_handler;

    // The URL to query.
    this._qurl = null;

    // The argument payload to deliver to the URL.
    this._qpayload = {};

    // The way to do the above.
    this._qmethod = null;

    // Whether or not to prevent ajax events from going.
    // This may not be usable, or applicable, to all backends.
    this._safety = false;

    /*
     * Function: debug
     * 
     * Turn on or off the verbose messages. Uses <bbop.logger>, so
     * they should come out everywhere.
     * 
     * Parameters: 
     *  p - *[optional]* true or false for debugging
     *
     * Returns: 
     *  boolean; the current state of debugging
     */
    this.debug = function(p){
	if( p == true || p == false ){
	    this._logger.DEBUG = p;
	    // TODO: add debug parameter a la include_highlighting
	}
	return this._logger.DEBUG;
    };

    // The main callback function called after a successful AJAX call in
    // the update function.
    this._run_success_callbacks = function(in_data){
	ll('run success callbacks...');
	//var response = anchor.(in_data);
	var response = new anchor._response_handler(in_data);
	anchor.apply_callbacks('success', [response, anchor]);
    };

    // This set is called when we run into a problem.
    this._run_error_callbacks = function(in_data){
	ll('run error callbacks...');
	var response = new anchor._response_handler(in_data);
	anchor.apply_callbacks('error', [response, anchor]);
    };

    /*
     * Function: resource
     *
     * The base target URL for our operations.
     * 
     * Parameters:
     *  url - *[optional]* update resource target with string
     *
     * Returns:
     *  the url as string (or null)
     */
    this.resource = function(url){
	if( bbop.core.is_defined(url) && 
	    bbop.core.what_is(url) == 'string' ){
	    anchor._qurl = url;
	}
	return anchor._qurl;
    };

    /*
     * Function: payload
     *
     * The information to deliver to the resource.
     * 
     * Parameters:
     *  payload - *[optional]* update payload information
     *
     * Returns:
     *  a copy of the current payload
     */
    this.payload = function(payload){
	if( bbop.core.is_defined(payload) && 
	    bbop.core.what_is(payload) == 'object' ){
	    anchor._qpayload = payload;
	}
	return bbop.core.clone(anchor._qpayload);
    };

    /*
     * Function: method
     *
     * The method to use to get the resource, as a string.
     * 
     * Parameters:
     *  method - *[optional]* update aquisition method with string
     *
     * Returns:
     *  the string or null
     */
    this.method = function(method){
	if( bbop.core.is_defined(method) && 
	    bbop.core.what_is(method) == 'string' ){
	    anchor._qmethod = method;
	}
	return anchor._qmethod;
    };

    /*
     * Function: action
     *
     * This method is the most fundamental operation. It should
     * combine the URL, payload, and method in the ways appropriate to
     * the subclass engine. This one merely combines the string.
     * 
     * The method argument is naturally ignored in this dummy class.
     * 
     * Parameters:
     *  url - *[optional]* update resource target with string
     *  payload - *[serially optional]* object to represent arguments
     *  method - *[serially optional]* (GET, POST, etc.)
     *
     * Returns:
     *  the combined URL argument as string
     * 
     * See also:
     *  <update>
     */
    this.action = function(url, payload, method){
	if( bbop.core.is_defined(url) ){ anchor.resource(url); }
	if( bbop.core.is_defined(payload) ){ anchor.payload(payload); }
	if( bbop.core.is_defined(method) ){ anchor.method(method); }

	// Since there is no AJAX/REST in our case, we just loop back
	// with the argument string.
	if( bbop.core.is_defined(anchor.resource()) ){
	    return anchor.update('success');
	}else{
	    return anchor.update('error');
	}
    };
};
bbop.core.extend(bbop.rest.manager, bbop.registry);

/*
 * Function: to_string
 *
 * Output writer for this object/class.
 * See the documentation in <core.js> on <dump> and <to_string>.
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbop.rest.manager.prototype.to_string = function (){
    return '[' + this._is_a + ']';
};

/*
 * Function: assemble
 *
 * Assemble the resource and arguments into a URL string.
 * 
 * May not be appropriate for all subclasses. Often used as a helper,
 * etc.
 * 
 * Parameters:
 *  n/a
 *
 * Returns:
 *  url string
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.rest.manager.prototype.assemble = function(){

    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	qurl = qurl + '?' + asm;
    }
    return qurl;
};

/*
 * Function: update
 *
 * The user code to select the type of update (and thus the type
 * of callbacks to be called on data return).
 * 
 * Parameters: 
 *  callback_type - callback type string; 'success' and 'error' (see subclasses)
 *
 * Returns:
 *  the query url
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.rest.manager.prototype.update = function(callback_type){

    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	qurl = qurl + '?' + asm;
    }

    // Callbacks accordingly.
    if( callback_type == 'success' ){
	this._run_success_callbacks(qurl);
    }else if( callback_type == 'error' ){
	this._run_error_callbacks(qurl);
    }else{
    	throw new Error("Unknown callback_type: " + callback_type);
    }
    
    //ll('qurl: ' + qurl);
    return qurl;
};
/* 
 * Package: rhino.js
 * 
 * Namespace: bbop.rest.manager.rhino
 * 
 * Rhino BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * This is a very simple subclass that does not get into the messiness
 * of errors and codes since we're using the trivial readURL method.
 * 
 * TODO/BUG: Does not handle "error" besides giving an "empty"
 * response.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: rhino
 * 
 * Contructor for the REST query manager; Rhino-style.
 * 
 * Be aware that this version is a synchronous call.
 * 
 * Arguments:
 *  response_handler
 * 
 * Returns:
 *  REST manager object
 * 
 * See also:
 *  <bbop.rest.manager>
 */
bbop.rest.manager.rhino = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.rhino';
};
bbop.core.extend(bbop.rest.manager.rhino, bbop.rest.manager);

/*
 * Function: update
 *
 *  See the documentation in <bbop/rest/manager.js> on update to get more
 *  of the story. This override function adds functionality to Rhino.
 *
 * Parameters: 
 *  callback_type - callback type string
 *
 * Returns:
 *  the query url (with any Rhino specific paramteters)
 * 
 * Also see:
 *  <fetch>
 */
bbop.rest.manager.rhino.prototype.update = function(callback_type){

    // 
    var qurl = this.assemble();

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw_str = readUrl(qurl); // in Rhino
    if( raw_str && raw_str != '' ){
	var response = new this._response_handler(raw_str);
	this.apply_callbacks(callback_type, [response, this]);
    }else{
	var response = new anchor._response_handler(null);
	this.apply_callbacks('error', [response, this]);
	//throw new Error('explody');
    }

    return qurl;
};

/*
 * Function: fetch
 *
 * This is the synchronous data getter for Rhino--probably your best
 * bet right now for scripting.
 * 
 * Parameters:
 *  n/a 
 *
 * Returns:
 *  a <bbop.rest.response> (or subclass) or null
 * 
 * Also see:
 *  <update>
 */
bbop.rest.manager.rhino.prototype.fetch = function(url, payload){
    
    var retval = null;

    // Update if necessary.
    if( url ){ this.resource(url); }
    if( payload ){ this.payload(payload); }

    var qurl = this.assemble();
    
    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw_str = readUrl(qurl); // in Rhino
    if( raw_str && raw_str != '' ){
	retval = new this._response_handler(raw_str);
    }else{
	retval = new anchor._response_handler(null);
	//this.apply_callbacks('error', ['no data', this]);
	//throw new Error('explody');
    }

    return retval;
};

/* 
 * Package: ringo.js
 * 
 * Namespace: bbop.rest.manager.ringo
 * 
 * RingoJS BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * TODO/BUG: Does not handle "error" besides giving an "empty"
 * response.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: ringo
 * 
 * Contructor for the REST query manager; RingoJS-style.
 * 
 * Be aware that this version is a synchronous call. Also be aware
 * that this assumes we're in a ringo environment so that the require
 * for commonjs is around.
 * 
 * Arguments:
 *  response_handler
 * 
 * Returns:
 *  REST manager object
 * 
 * See also:
 *  <bbop.rest.manager>
 */
bbop.rest.manager.ringo = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.ringo';

    // Grab an http client.
    this._http_client = require("ringo/httpclient");
};
bbop.core.extend(bbop.rest.manager.ringo, bbop.rest.manager);

/*
 * Function: update
 *
 *  See the documentation in <bbop.rest.manager.js> on update to get more
 *  of the story. This override function adds functionality to RingoJS.
 *
 * Parameters: 
 *  callback_type - callback type string
 *
 * Returns:
 *  the query url (with any RingoJS specific parameters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.rest.manager.ringo.prototype.update = function(callback_type){

    var anchor = this;
    var qurl = anchor.resource();
    //console.log('qurl: ' + qurl);

    // Grab the data from the server and pick the right callback group
    // accordingly.
    //anchor._callbacker = function(exchange){
    anchor._callbacker = function(data, status, contentType, exchange){
	// console.log('callback_type: ' + callback_type);
	// console.log('data: ' + data);
	// console.log('status: ' + status);
	// console.log('contentType: ' + contentType);
	// console.log('exchange: ' + exchange);

	var raw_str = exchange.content;
	//var raw_str = data;
	if( raw_str && raw_str != '' ){
	    var response = new anchor._response_handler(raw_str);
	    // console.log('response okay?: ' + response.okay());
	    anchor.apply_callbacks(callback_type, [response, this]);
	}else{
	    var response = new anchor._response_handler(null);
	    this.apply_callbacks('error', [response, this]);
	    //throw new Error('explody');
	}
    };
    // In RingoJS.
    var exchange = this._http_client.get(qurl, null, anchor._callbacker);
    // console.log('exchange.done: ' + exchange.done);

    return qurl;
};

// /*
//  * Function: fetch
//  *
//  * This is the synchronous data getter for RingoJS--probably your best
//  * bet right now for scripting.
//  * 
//  * NOTE:
//  * 
//  * Parameters:
//  *  url - url to get the data from
//  *
//  * Returns:
//  *  a <bbop.rest.response> or null
//  * 
//  * Also see:
//  *  <update>
//  */
// bbop.rest.manager.ringo.prototype.fetch = function(url){
    
//     var retval = null;

//     var qurl = this.resource(url);

//     // Grab the data from the server and pick the right callback group
//     // accordingly.
//     var exchange = this._http_client.get(qurl); // in RingoJS
//     // BUG/TODO: until I figure out sync.
//     var raw_str = exchange.content;
//     if( raw_str && raw_str != '' ){
// 	retval = new this._response_handler(raw_str);
//     }else{
// 	var response = new anchor._response_handler(null);
// 	this.apply_callbacks('error', [response, this]);
// 	//throw new Error('explody');
//     }

//     return retval;
// };

/* 
 * Package: node.js
 * 
 * Namespace: bbop.rest.manager.node
 * 
 * NodeJS BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * TODO/BUG: Does not handle "error" besides giving an "empty"
 * response.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: node
 * 
 * Contructor for the REST query manager; NodeJS-style.
 * 
 * This assumes we're in a node environment so that the require
 * for commonjs is around.
 * 
 * Arguments:
 *  response_handler
 * 
 * Returns:
 *  REST manager object
 * 
 * See also:
 *  <bbop.rest.manager>
 */
bbop.rest.manager.node = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.node';

    // Grab an http client.
    this._http_client = require('http');
    this._url_parser = require('url');
};
bbop.core.extend(bbop.rest.manager.node, bbop.rest.manager);

/*
 * Function: update
 *
 *  See the documentation in <bbop.rest.manager.js> on update to get more
 *  of the story. This override function adds functionality to NodeJS.
 *
 * Parameters: 
 *  callback_type - callback type string (so far unused)
 *
 * Returns:
 *  the query url (with any NodeJS specific parameters)
 */
bbop.rest.manager.node.prototype.update = function(callback_type){

    var anchor = this;

    // What to do if an error is triggered.
    function on_error(e) {
	console.log('problem with request: ' + e.message);
	var response = new anchor._response_handler(null);
	response.okay(false);
	response.message(e.message);
	response.message_type('error');
	anchor.apply_callbacks('error', [response, anchor]);
    }

    // Two things to do here: 1) collect data and 2) what to do with
    // it when we're done (create response).
    function on_connect(res){
	//console.log('STATUS: ' + res.statusCode);
	//console.log('HEADERS: ' + JSON.stringify(res.headers));
	res.setEncoding('utf8');
	var raw_data = '';
	res.on('data', function (chunk) {
		   //console.log('BODY: ' + chunk);
		   raw_data = raw_data + chunk;
	       });
	// Throw to .
	res.on('end', function () {
		   var response = new anchor._response_handler(raw_data);
		   if( response && response.okay() ){
		       anchor.apply_callbacks('success', [response, anchor]);
		   }else{
		       // Make sure that there is something there to
		       // hold on to.
		       if( ! response ){
			   response = new anchor._response_handler(null);
			   response.okay(false);
			   response.message_type('error');
			   response.message('null response');
		       }else{
			   response.message_type('error');
			   response.message('bad response');
		       }
		       anchor.apply_callbacks('error', [response, anchor]);
		   }
	       });
    }

    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    var args = '';
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	args = '?' + asm;
    }

    //qurl = 'http://amigo2.berkeleybop.org/cgi-bin/amigo2/amigo/term/GO:0022008/json';
    var final_url = qurl + args;

    // http://nodejs.org/api/url.html
    var purl = anchor._url_parser.parse(final_url);
    var req_opts = {
    	//'hostname': 'localhost',
    	//'path': '/cgi-bin/amigo2/amigo/term/GO:0022008/json',
	'port': 80,
	'method': 'GET'
    };
    // Tranfer the intersting bit over.
    bbop.core.each(['protocol', 'hostname', 'port', 'path'],
		   function(purl_prop){
		       if( purl[purl_prop] ){
			   req_opts[purl_prop] = purl[purl_prop];
		       }
		   });
    // And the method.
    var mth = anchor.method();
    if( mth && mth != 'get' ){
    	req_opts['method'] = mth;
    }
    var req = anchor._http_client.request(req_opts, on_connect);
    // var req = anchor._http_client.request(final_url, on_connect);

    req.on('error', on_error);
    
    // write data to request body
    //req.write('data\n');
    //req.write('data\n');
    req.end();
    
    return final_url;
};
/* 
 * Package: jquery.js
 * 
 * Namespace: bbop.rest.manager.jquery
 * 
 * TODO!
 * 
 * jQuery BBOP manager for dealing with actual ajax calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * This should still be able to limp along (no ajax and no error
 * parsing) even outside of a jQuery environment.
 * 
 * Use <use_jsonp> is you are working against a JSONP service instead
 * of a non-cross-site JSON service.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: jquery
 * 
 * Contructor for the jQuery REST manager
 * 
 * Arguments:
 *  response_handler
 * 
 * Returns:
 *  REST manager object
 * 
 * See also:
 *  <bbop.rest.manager>
 */
bbop.rest.manager.jquery = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.jquery';

    this._use_jsonp = false;
    this._jsonp_callback = 'json.wrf';
    this._headers = null;

    // Before anything else, if we cannot find a viable jQuery library
    // for use, we're going to create a fake one so we can still test
    // and work in a non-browser/networked environment.
    var anchor = this;
    anchor.JQ = new bbop.rest.manager.jquery_faux_ajax();
    try{ // some interpreters might not like this kind of probing
    	if( typeof(jQuery) !== 'undefined' ){
    	    //JQ = jQuery;
    	    anchor.JQ = jQuery.noConflict();
    	}
    }catch (x){
    }finally{
    	var got = bbop.core.what_is(anchor.JQ);
    	if( got && got == 'bbop.rest.manager.jquery_faux_ajax'){
    	}else{
    	    got = 'jQuery';
    	}
    	//ll('Using ' + got + ' for ajax calls.');
    }
};
bbop.core.extend(bbop.rest.manager.jquery, bbop.rest.manager);

/*
 * Function: use_jsonp
 *
 * Set the jQuery engine to use JSONP handling instead of the default
 * JSON. If set, the callback function to use will be given my the
 * argument "json.wrf" (like Solr), so consider that special.
 * 
 * Parameters: 
 *  use_p - *[optional]* external setter for 
 *
 * Returns:
 *  boolean
 */
bbop.rest.manager.jquery.prototype.use_jsonp = function(use_p){
    var anchor = this;
    if( bbop.core.is_defined(use_p) ){
	if( use_p == true || use_p == false ){
	    anchor._use_jsonp = use_p;
	}
    }
    return anchor._use_jsonp;
};

/*
 * Function: jsonp_callback
 *
 * Get/set the jQuery jsonp callback string to something other than
 * "json.wrf".
 * 
 * Parameters: 
 *  cstring - *[optional]* setter string
 *
 * Returns:
 *  string
 */
bbop.rest.manager.jquery.prototype.jsonp_callback = function(cstring){
    var anchor = this;
    if( bbop.core.is_defined(cstring) ){
	anchor._jsonp_callback = cstring;
    }
    return anchor._jsonp_callback;
};

/*
 * Function: headers
 *
 * Try and control the server with the headers.
 * 
 * Parameters: 
 *  header_set - *[optional]* hash of headers; jQuery internal default
 *
 * Returns:
 *  hash of headers
 */
bbop.rest.manager.jquery.prototype.headers = function(header_set){
    var anchor = this;
    if( bbop.core.is_defined(header_set) ){
	anchor._headers = header_set;
    }
    return anchor._headers;
};

/*
 * Function: update
 *
 *  See the documentation in <manager.js> on update to get more
 *  of the story. This override function adds functionality for
 *  jQuery.
 * 
 * Parameters: 
 *  callback_type - callback type string (so far unused)
 *
 * Returns:
 *  the query url (with the jQuery callback specific parameters)
 */
bbop.rest.manager.jquery.prototype.update = function(callback_type){

    var anchor = this;
    
    // Assemble request.
    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    var args = '';
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	args = '?' + asm;
    }
    var final_url = qurl + args;

    // The base jQuery Ajax args we need with the setup we have.
    var jq_vars = {
    	url: final_url,
    	dataType: 'json',
	headers: { "Content-Type": "application/javascript", "Accept": "application/javascript" },
    	type: "GET"
    };

    // If we're going to use JSONP instead of the defaults, set that now.
    if( anchor.use_jsonp() ){
	jq_vars['dataType'] = 'jsonp';
	jq_vars['jsonp'] = anchor._jsonp_callback;
    }
    if( anchor.headers() ){
    	jq_vars['headers'] = anchor.headers();
    }

    // What to do if an error is triggered.
    // Remember that with jQuery, when using JSONP, there is no error.
    function on_error(xhr, status, error) {
	var response = new anchor._response_handler(null);
	response.okay(false);
	response.message(error);
	response.message_type(status);
	anchor.apply_callbacks('error', [response, anchor]);
    }

    function on_success(raw_data, status, xhr){
	var response = new anchor._response_handler(raw_data);
	if( response && response.okay() ){
	    anchor.apply_callbacks('success', [response, anchor]);
	}else{
	    // Make sure that there is something there to
	    // hold on to.
	    if( ! response ){
		response = new anchor._response_handler(null);
		response.okay(false);
		response.message_type(status);
		response.message('null response');
	    }else{
		response.message_type(status);
		response.message('bad response');
	    }
	    //anchor.apply_callbacks('error', [response, anchor]);
	    //anchor.apply_callbacks('error', [raw_data, anchor]);
	    anchor.apply_callbacks('error', [response, anchor]);
	}
    }

    // Setup JSONP for Solr and jQuery ajax-specific parameters.
    jq_vars['success'] = on_success;
    jq_vars['error'] = on_error;
    //done: _callback_type_decider, // decide & run search or reset
    //fail: _run_error_callbacks, // run error callbacks
    //always: function(){} // do I need this?
    anchor.JQ.ajax(jq_vars);
    //anchor.JQ.ajax(final_url, jq_vars);
    
    return final_url;
};

/*
 * Namespace: bbop.rest.manager.jquery_faux_ajax
 *
 * Constructor: faux_ajax
 * 
 * Contructor for a fake and inactive Ajax. Used by bbop.rest.manager.jquery
 * in (testing) environments where jQuery is not available.
 * 
 * Returns:
 *  faux_ajax object
 */
bbop.rest.manager.jquery_faux_ajax = function (){
    this._is_a = 'bbop.rest.manager.jquery_faux_ajax';

    /*
     * Function: ajax
     *
     * Fake call to jQuery's ajax.
     *
     * Parameters: 
     *  args - whatever
     *
     * Returns:
     *  null
     */
    this.ajax = function(args){
	return null;
    };
};
/* 
 * Package: conf.js
 * 
 * Generic BBOP manager for dealing with gross GOlr configuration
 * and management.
 * 
 * Contains <bbop.golr.conf_field>, <bbop.golr.conf_class>, and
 * <bbop.golr.conf>.
 * 
 * TODO: better document all of this. Essentially, this is all for
 * getting data out of a JSONized version of the YAML files used to
 * drive the OWLTools-Solr parts of GOlr.
 */

// Module and namespace checking.
if( typeof bbop == "undefined" ){ var bbop = {}; }
if( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }

/*
 * Namespace: bbop.golr.conf_field
 * 
 * Constructor: conf_field
 * 
 * Contructor for a GOlr search field.
 * 
 * Arguments:
 *  field_conf_struct - JSONized config
 * 
 * Returns:
 *  conf_field object
 */
bbop.golr.conf_field = function (field_conf_struct){
    this._is_a = 'bbop.golr.conf_field';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    var logger = new bbop.logger(this._is_a);
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Capture search fields.
    this._field = field_conf_struct;

    /*
     * Function: display_name
     * 
     * The user-facing display name. Suitable for label or title
     * somewhere.
     * 
     * Returns:
     *  Display name string.
     */
    this.display_name = function(){
	return this._field['display_name'];
    };

    /*
     * Function: description
     * 
     * A longer description. Suitable for tooltips.
     * 
     * Returns:
     *  Description string.
     */
    this.description = function(){
	return this._field['description'];
    };

    /*
     * Function: id
     * 
     * The unique ID of this profile.
     * 
     * Returns:
     *  String.
     */
    this.id = function(){
	return this._field['id'];
    };

    /*
     * Function: searchable
     * 
     * Returns whether or not a string field has a shadow
     * "*_searchable" field defined that is suitable for dismax
     * searches. Defaults to false.
     * 
     * Returns:
     *  boolean
     */
    this.searchable = function(){
	var retval = false;
	if( this._field['searchable'] == 'true' ||
	    this._field['searchable'] == true ){
		retval = true;	
	    }
	return retval;
    };

    /*
     * Function: required
     * 
     * Returns whether or not this field is required. Defaults to
     * false.
     * 
     * Not of particular use.
     * 
     * Returns:
     *  Boolean.
     */
    this.required = function(){
	var retval = false;
	if( this._field['required'] == 'true' ||
	    this._field['required'] == true ){
		retval = true;	
	    }
	return retval;
    };

    /*
     * Function: is_multi
     * 
     * Using the "cardinality" entry, returns whether or not this
     * field is "single" (false) or "multi" (true). Defaults to false.
     * 
     * Returns:
     *  Boolean.
     */
    this.is_multi = function(){
	var retval = false;
	if( this._field['cardinality'] == 'multi' ){
	    retval = true;	
	}
	return retval;
    };

    /*
     * Function: is_fixed
     * 
     * Using the "property_type" entry, returns whether or not this
     * field is "dynamic" (false) or "fixed" (true). Defaults to false.
     * 
     * Not of particular use.
     * 
     * Returns:
     *  Boolean.
     */
    this.is_fixed = function(){
	var retval = false;
	if( this._field['property_type'] == 'fixed' ){
	    retval = true;	
	}
	return retval;
    };

    /*
     * Function: property
     * 
     * Returns the method of this field's generation in the loader.
     * 
     * Not of particular use.
     * 
     * Returns:
     *  String.
     */
    this.property = function(){
	var retval = '???';
	if( this._field['property'] ){
	    retval = this._field['property'];
	}
	return retval;
    };

    // TODO: ...
};

/*
 * Namespace: bbop.golr.conf_class
 *
 * Constructor: conf_class
 * 
 * Contructor for a GOlr search class.
 * 
 * Arguments:
 *  class_conf_struct - JSONized config
 * 
 * Returns:
 *  conf_class object
 */
bbop.golr.conf_class = function (class_conf_struct){
    this._is_a = 'bbop.golr.conf_class';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    var logger = new bbop.logger(this._is_a);
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Capture class and the component fields into variables.
    this._class = class_conf_struct;
    // this._fields = {};
    // bbop.core.each(this._class['fields'],
    // 		   function(item, index){
    // 		       var sf = new bbop.golr.conf_field(item);
    // 		       anchor._fields[sf.id()] = sf;
    // 		  });

    /*
     * Function: display_name
     * 
     * The user-facing display name. Suitable for label or title
     * somewhere.
     * 
     * Returns:
     *  Display name string.
     */
    this.display_name = function(){
	return this._class['display_name'];
    };

    /*
     * Function: description
     * 
     * A longer description. Suitable for tooltips.
     * 
     * Returns:
     *  Description string.
     */
    this.description = function(){
	return this._class['description'];
    };

    /*
     * Function: weight
     * 
     * The relative weight of this search class.
     * 
     * Returns:
     *  Integer.
     */
    this.weight = function(){
    	return parseInt(this._class['weight']) || 0;
    };

    /*
     * Function: id
     * 
     * The unique ID of this profile.
     * 
     * Returns:
     *  String.
     */
    this.id = function(){
	return this._class['id'];
    };

    /*
     * Function: searchable_extension
     * 
     * This returns the searchable extension used for this
     * class. There is a typical default, but it might be change in
     * namespace collisions, so it's better to just use this.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     * string
     */
    this.searchable_extension = function(){
    	//return this._class['searchable_extension'] || '_searchable';
    	return '_searchable';
    };

    /*
     * Function: get_field
     * 
     * Returns a search field by id string. Null otherwise.
     * 
     * Parameters:
     *  fid - a string id for the field
     * 
     * Returns:
     *  <bbop.golr.conf_field>
     */
    this.get_field = function(fid){
	var retval = null;
	if( this._class.fields_hash &&
	    this._class.fields_hash[fid] ){
		retval = new bbop.golr.conf_field(this._class.fields_hash[fid]);
	    }
	return retval;
    };

    /*
     * Function: get_fields
     * 
     * Return all of the fields in this search class.
     * 
     * Returns:
     *  Array of <bbop.golr.conf_field> (unordered).
     */
    this.get_fields = function(){
	var retval = [];
	if( this._class.fields_hash ){
	    bbop.core.each(this._class.fields_hash,
			   function(fid, struct){
			       var cf = new bbop.golr.conf_field(struct);
			       retval.push(cf);
			   });
	}
	return retval;
    };

    // Internal function to determine if the weight category that's
    // used by several functions is okay.
    this._munge_weight_category = function(weight_category){

	// Not defined or only the defined few.
	if( ! weight_category ){
	    throw new Error("Missing weight category");	
	}else if( weight_category != 'boost' &&
	    weight_category != 'result' &&
	    weight_category != 'filter' ){
	    throw new Error("Unknown weight category: " + weight_category);
	}

	return weight_category + '_weights';
    };

    /*
     * Function: get_weights
     * 
     * Get the various weights we need to run.
     * 
     * The weight category can be 'boost', 'result', or 'filter'.
     * 
     * Arguments:
     *  weight_category - string identifying the legal weight category
     * 
     * Returns:
     *  object of {field => weight, ...}
     */
    this.get_weights = function(weight_category){
	
	var rethash = {};

	// Only the defined few.
	weight_category = this._munge_weight_category(weight_category);

	// Collect the good bits.
	if( ! bbop.core.is_defined(this._class[weight_category]) ){
	    throw new Error("Missing weight category: " + weight_category);
	}else{
	    // Only work it if there is something there more than "".
	    var wcs = this._class[weight_category];
	    if( wcs && wcs != "" && wcs != " " ){
		var dfab = wcs;
		var fields = dfab.split(/\s+/);
		bbop.core.each(fields,
			       function(item, i){
				   var field_val = item.split(/\^/);
				   rethash[field_val[0]] =
				       parseFloat(field_val[1]);
			       });
	    }
	}

	return rethash;
    };

    /*
     * Function: field_order_by_weight
     * 
     * Returns an array of field ids ordered by weight.
     * 
     * The weight category can be 'boost', 'result', or 'filter'.
     * 
     * Arguments:
     * weight_category - string identifying the legal weight category
     * cutoff - *[optional]* if not defined, all listed fields in set returned
     * 
     * Returns:
     *  array like [field5, field4, ...]
     */
    this.field_order_by_weight = function(weight_category, cutoff){

    	var retset = [];

	var weights = this.get_weights(weight_category);

	// Add the ones that meet threshold (if there is one) to the
	// set.
	bbop.core.each(weights,
		       function(key, val){
			   if( cutoff ){
			       if( val >= cutoff ){
				   retset.push(key);			       
			       }
			   }else{
			       retset.push(key);			       
			   }
		      });

	// Order the set.
	retset.sort(function(a, b){
			return weights[b] - weights[a];
		    });

    	return retset;
    };
};

/*
 * Namespace: bbop.golr.conf
 *
 * Constructor: conf
 * 
 * Contructor for the GOlr query manager.
 * Why don't we just take bbop.golr.golr_meta as read? We want to
 * leave the door open to having multiple GOlrs running in the same area.
 * 
 * Arguments:
 *  golr_conf_var - JSized GOlr config
 * 
 * Returns:
 *  golr conf object
 * 
 */
bbop.golr.conf = function (golr_conf_var){
    this._is_a = 'bbop.golr.conf';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    var logger = new bbop.logger(this._is_a);
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Lightly check incoming arguments.
    // There could be a hash of pinned filters argument.
    if( ! golr_conf_var || typeof golr_conf_var != 'object' ){
	ll('ERROR: no proper golr conf var argument');
    }
    
    // Settle in the conf.
    this._golr_conf = golr_conf_var;

    // Process the conf classes into one spot.
    this._classes = {};
    bbop.core.each(anchor._golr_conf,
		  function(key, val){
		      var new_asp = new bbop.golr.conf_class(val);
		      anchor._classes[new_asp.id()] = new_asp;
		  });

    /*
     * Function: get_class
     * 
     * Returns a class info object by id string. Null otherwise.
     * 
     * Arguments:
     *  fid - TODO
     * 
     * Returns:
     *  bbop.golr.conf_class.
     */
    this.get_class = function(fid){
	var retval = null;
	if( this._classes &&
	    this._classes[fid] ){
		retval = this._classes[fid];
	    }
	return retval;
    };

    /*
     * Function: get_classes
     * 
     * Returns an array of all search classes.
     * 
     * Returns:
     *  Array of <bbop.golr.conf_class> (unordered).
     */
    this.get_classes = function(){
	var ret = [];
	bbop.core.each(anchor._classes,
		       function(key, val){
			   ret.push(val);
		       });
	return ret;
    };

    /*
     * Function: get_classes_by_weight
     * 
     * Returns an array of all search classes. Ordered by weight.
     * 
     * Returns:
     *  Array of <bbop.golr.conf_class>.
     */
    this.get_classes_by_weight = function(){
	var ret = this.get_classes();

	ret.sort(
	    function(cc1, cc2){
		var w1 = cc1.weight() || 0;
		var w2 = cc2.weight() || 0;
		return w2 - w1;
	    });

	return ret;
    };
};
/* 
 * Package: response.js
 * 
 * Namespace: bbop.golr.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a GOlr server (whereas <golr_conf> deals with the
 * reported configuration). This is not intended to do anything like
 * modeling the data in the store (<golr_manager>), but rather to deal
 * with things like checking for success, what paging would look like,
 * what parameters were passed, etc.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }

/*
 * Constructor: response
 * 
 * Contructor for a GOlr query response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  json_data - the JSON data (as object) returned from a request
 * 
 * Returns:
 *  golr response object
 */
bbop.golr.response = function(json_data){
    this._is_a = 'bbop.golr.response';

    // The raw incoming document.
    this._raw = json_data;

    // Cache for repeated calls to success().
    this._success = null;

    // Cache for repeated calls to get_doc* functions.
    // These are non-incremental indices--they are either full formed
    // (the first time they are hit) or they are null.
    this._doc_id2index = null;
    this._doc_index2_id = null;

    // Cache for repeated calls to resolve labels.
    // This cache is incremental--the more it's used the larger it gets.
    this._doc_label_maps = {}; // {<field_1>: <parsed_json_map_1>, ...}

    // For highlight stripping, I just want to compile this once.
    this._hl_regexp = new RegExp("\<\[\^\>\]\*\>", "g");

};

/*
 * Function: raw
 * 
 * returns a pointer to the initial response object
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  object
 */
bbop.golr.response.prototype.raw = function(){
    return this._raw;
};

/*
 * Function: success
 * 
 * Simple return verification of sane response from server.
 * 
 * Success caches its return value.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbop.golr.response.prototype.success = function(){

    if( this._success == null ){

	var robj = this._raw;
	if( robj &&
	    robj.responseHeader &&
	    typeof robj.responseHeader.status != 'undefined' &&
	    robj.responseHeader.status == 0 &&
	    robj.responseHeader.params &&
	    robj.response &&
	    typeof robj.response.numFound != 'undefined' &&
	    typeof robj.response.start != 'undefined' &&
	    typeof robj.response.maxScore != 'undefined' &&
	    robj.response.docs &&
	    robj.facet_counts &&
	    robj.facet_counts.facet_fields ){
		this._success = true;
	    }else{
		this._success = false;
	    }
    }

    return this._success;
};

/*
 * Function: callback_type
 * 
 * Return the callback type if it was specified in the query,
 * otherwise return null. For example "reset" and "response".
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string (or null)
 */
bbop.golr.response.prototype.callback_type = function(){
    var robj = this._raw;
    var retval = null;
    if( robj.responseHeader.params.callback_type &&
	typeof robj.responseHeader.params.callback_type != 'undefined' ){
	    retval = robj.responseHeader.params.callback_type;
	}
    return retval;
};

/*
 * Function: parameters
 * 
 * Get the parameter chunk--variable stuff we put in.
 * 
 * Pretty general, specialized functions are better.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  hash
 */
bbop.golr.response.prototype.parameters = function(){
    var robj = this._raw;
    return robj.responseHeader.params;
};

/*
 * Function: parameter
 * 
 * Get the parameter chunk--variable stuff we put in.
 * 
 * Pretty general, specialized functions are better.
 * 
 * Arguments:
 *  n/a
 *  key - string id for the wanted parameter
 * 
 * Returns:
 *  hash, string, whatever is there at that key (otherwise null)
 */
bbop.golr.response.prototype.parameter = function(key){
    var robj = this._raw;
    var retval = null;
    if( robj.responseHeader.params[key] && robj.responseHeader.params[key] ){
	retval = robj.responseHeader.params[key];
    }
    return retval;
};

/*
 * Function: row_step
 * 
 * Returns the number of rows requested (integer).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  integer
 */
bbop.golr.response.prototype.row_step = function(){	
    var robj = this._raw;
    return parseInt(robj.responseHeader.params.rows);
};

/*
 * Function: total_documents
 * 
 * Return the total number of documents found.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  integer
 */
bbop.golr.response.prototype.total_documents = function(){
    var robj = this._raw;
    return parseInt(robj.response.numFound);
};

/*
 * Function: start_document
 * 
 * Returns the start document for this response as an integer.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  integer
 */
bbop.golr.response.prototype.start_document = function(){
    var robj = this._raw;
    return parseInt(robj.response.start) + 1;
};

/*
 * Function: end_document
 * 
 * Returns the end document for this response as an integer.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  integer
 */
bbop.golr.response.prototype.end_document = function(){
    var robj = this._raw;
    return this.start_document() +
	parseInt(robj.response.docs.length) - 1;
};

/*
 * Function: packet
 * 
 * Return the packet number of the current response.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  integer or null (no packet defined)
 */
bbop.golr.response.prototype.packet = function(){
    var robj = this._raw;
    var retval = null;
    var pval = robj.responseHeader.params.packet;
    if( pval ){
	retval = parseInt(pval);
    }
    return retval;
};

/*
 * Function: paging_p
 * 
 * Whether or not paging is necessary with the given results set.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbop.golr.response.prototype.paging_p = function(){
    var robj = this._raw;
    var retval = false;
    if( this.total_documents() > this.row_step() ){
	retval = true;
    }
    return retval;
};

/*
 * Function: paging_previous_p
 * 
 * Whether or paging backwards is an option right now.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbop.golr.response.prototype.paging_previous_p = function(){
    // We'll take this as a proxy that a step was taken.
    // Remember: we offset the start_document by one for readability.
    var robj = this._raw;
    var retval = false;
    if( this.start_document() > 1 ){
	retval = true;
    }
    return retval;
};

/*
 * Function: paging_next_p
 * 
 * Whether or paging forwards is an option right now.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbop.golr.response.prototype.paging_next_p = function(){
    // We'll take this as a proxy that a step was taken.
    var robj = this._raw;
    var retval = false;
    if( this.total_documents() > this.end_document() ){
	retval = true;	
    }
    return retval;
};

/*
 * Function: documents
 * 
 * Returns an array of raw and unprocessed document hashes.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  hash
 */
bbop.golr.response.prototype.documents = function(){
    var robj = this._raw;
    return robj.response.docs;
};

/*
 * Function: get_doc
 * 
 * Returns a specified document, in its raw hash form.
 * 
 * Arguments:
 *  doc_id - document identifier either an id (first) or place in the array
 * 
 * Returns:
 *  document hash or null
 */
bbop.golr.response.prototype.get_doc = function(doc_id){

    var doc = null;
    var robj = this._raw;

    // First check if the document is available by position.
    var docs = robj.response.docs;
    if( docs && docs[doc_id] ){
	doc = docs[doc_id];
    }else{ // Not available by position, so lets see if we can get it by id.
	
	//print('in: ' + doc_id + ' _' + this._doc_id2index);

	// Build the doc index if it isn't there.
	var local_anchor = this;
	if( ! this._doc_id2index ){
	    //print('BUILD triggered on: ' + doc_id);
	    this._doc_id2index = {};
	    this._doc_index2id = {};
	    bbop.core.each(docs,
			   function(doc_item, doc_index){
			       var did = doc_item['id'];
			       //print('BUILD: ' + did + ' => ' + doc_index);
			       local_anchor._doc_id2index[did] = doc_index;
			       local_anchor._doc_index2id[doc_index] = did;
			   });
	}
	
	//print('pre-probe: ' + doc_id + ' _' + this._doc_id2index);

	// Try and probe it out.
	if( this._doc_id2index &&
	    bbop.core.is_defined(this._doc_id2index[doc_id]) ){
	    //print('PROBE: ' + doc_id);
	    var doc_i = this._doc_id2index[doc_id];
	    doc = docs[doc_i];
	}
    }

    return doc;
};

/*
 * Function: get_doc_field
 * 
 * Returns the value(s) of the requested fields.
 * 
 * Remember that determining whether the returned value is a string or
 * a list is left as an exercise for the reader when using this
 * function.
 * 
 * Arguments:
 *  doc_id - document identifier either an id (first) or place in the array
 *  field_id - the identifier of the field we're trying to pull
 * 
 * Returns:
 *  value or list of values
 */
bbop.golr.response.prototype.get_doc_field = function(doc_id, field_id){

    var ret = null;

    // If we found our doc, go ahead and start looking for the field.
    var doc = this.get_doc(doc_id);
    if( doc && bbop.core.is_defined(doc[field_id]) ){
	
	// We have an answer with this.
	ret = doc[field_id];
    }

    return ret;
};

/*
 * Function: get_doc_label
 * 
 * Tries to return a label for a document, field, and id combination.
 * 
 * WARNING: This function could be potentially slow on large datasets.
 * 
 * Arguments:
 *  doc_id - document identifier either an id (first) or place in the array
 *  field_id - the identifier of the field we're trying to pull
 *  item_id - *[optional]* the item identifier that we're trying to resolve; if the field in question is a string or a single-valued list (as opposed to a multi-values list), this argument is not necessary, but it wouldn't hurt either
 * 
 * Returns:
 *  null (not found) or string
 */
bbop.golr.response.prototype.get_doc_label = function(doc_id,field_id,item_id){

    var retval = null;

    var anchor = this;

    // If we found our doc, and confirmed that the field in question
    // exists in the doc, go ahead and start digging to resolve the id.
    var doc = this.get_doc(doc_id);
    if( doc && bbop.core.is_defined(doc[field_id]) ){
	
	// First try the '_label' extension.
	var ilabel = this.get_doc_field(doc_id, field_id + '_label');

	if( ilabel && bbop.core.what_is(ilabel) == 'string' ){
	    // It looks like the simple solution.
	    //print('trivial hit');
	    retval = ilabel; // Hit!
	}else if( ilabel && bbop.core.what_is(ilabel) == 'array' ){
	    
	    // Well, it's multi-valued, but id might just be the one.
	    var iid = this.get_doc_field(doc_id, field_id);
	    if( ilabel.length == 1 && iid &&
		bbop.core.what_is(iid) == 'array' &&
		iid.length == 1 ){
		    // Case of a single id trivially mapping to a
		    // single label.
		    //print('forced hit');
		    retval = ilabel[0]; // Hit!
	    }else{

		//print('need to probe');

		// Since we'll do this twice with different map
		// fields, a generic function to try and probe a JSON
		// string map (caching it along the way) for a label.
		function _map_to_try(doc_key, map_field, item_key){

		    var retlbl = null;

		    var map_str = anchor.get_doc_field(doc_key, map_field);

		    if( map_str && bbop.core.what_is(map_str) == 'string' ){

			// First, check the cache. If it's not there
			// add it.
			if( ! bbop.core.is_defined(anchor._doc_label_maps[doc_key]) ){
			    anchor._doc_label_maps[doc_key] = {};
			}
			if( ! bbop.core.is_defined(anchor._doc_label_maps[doc_key][map_field]) ){
			    // It looks like a map wasn't defined, so let's
			    // convert it into JSON now.
			    anchor._doc_label_maps[doc_key][map_field] =
				bbop.json.parse(map_str);
			}

			// Pull our map out of the cache.
			var map = anchor._doc_label_maps[doc_key][map_field];

			// Probe to see if we have anything in the map.
			if( map && map[item_key] ){
			    retlbl = map[item_key];
			}
		    }

		    return retlbl;
		}

		// Well, now we know that either we have to find a map
		// or the information isn't there. First try the
		// standard "_map".
		var mlabel = _map_to_try(doc_id, field_id + '_map', item_id);
		if( mlabel ){
		    //print('map hit');
		    retval = mlabel; // Hit!
		}else{
		    // If that didn't work, try again with
		    // "_closure_map".
		    var cmlabel =
			_map_to_try(doc_id, field_id + '_closure_map', item_id);
		    if( cmlabel ){
			//print('closure map hit');
			retval = cmlabel; // Hit!
		    }else{
			// If that didn't work, try again with
			// "_list_map".
			var lmlabel =
			    _map_to_try(doc_id, field_id +'_list_map', item_id);
			if( lmlabel ){
			    //print('list map hit');
			    retval = lmlabel; // Hit!
			}
		    }
		}
	    }
	}
    }

    return retval;
};

/*
 * Function: get_doc_highlight
 * 
 * Returns the highlighted value(s) of the requested fields.
 * 
 * WARNING: This function is a work in progress and will not return
 * multi-valued fields, just the first match it finds.
 * 
 * WARNING: This function could be potentially slow on large datasets.
 * 
 * Arguments:
 *  doc_id - document id
 *  field_id - the identifier of the field we're trying to pull
 *  item - the item that we're looking for the highlighted HTML for
 * 
 * Returns:
 *  string of highlight or null if nothing was found
 */
bbop.golr.response.prototype.get_doc_highlight = function(doc_id,field_id,item){

    var ret = null;
    var robj = this._raw;
    var hlre = this._hl_regexp;

    // See if we can find a highlighted version in the raw
    // response. First, see if the document is in the hilight section;
    // otherwise try and pull the id out first, then head for the
    // highlight section.
    var hilite_obj = null;
    if( robj.highlighting && robj.highlighting[doc_id] ){
	hilite_obj = robj.highlighting[doc_id];
    }else{
	var iid = this._doc_index2id[doc_id];
	if( iid ){
	    var new_doc = this.get_doc(iid);
	    var new_doc_id = new_doc['id'];
	    if( robj.highlighting && robj.highlighting[new_doc_id] ){
		hilite_obj = robj.highlighting[new_doc_id];
	    }
	}
    }

    // If we got a highlight object, see if the highlighted field is
    // there--search the different possibilities for what a highlight
    // field may be called.
    if( hilite_obj ){
	
	//print('here (field_id): ' + field_id);

	var ans = null;

	if( hilite_obj[field_id + '_label_searchable'] ){
	    ans = hilite_obj[field_id + '_label_searchable'];
	}

	if( ! ans ){
	    if( hilite_obj[field_id + '_label'] ){
		ans = hilite_obj[field_id + '_label'];
	    }	    
	}

	if( ! ans ){
	    if( hilite_obj[field_id + '_searchable'] ){
		ans = hilite_obj[field_id + '_searchable'];
	    }
	}

	if( ! ans ){
	    if( hilite_obj[field_id] ){
		//print('here (field_id): ' + field_id);
		ans = hilite_obj[field_id];
	    }
	}

	if( ans ){ // looks like I found a list of something

	    // Use only the first match.
	    var matches_p = false;
	    bbop.core.each(ans,
			   function(an){
			       if( ! matches_p ){
				   var stripped = an.replace(hlre, '');
				   //print('stripped: ' + stripped);
				   //print('item: ' + item);
				   if( item == stripped ){
				       matches_p = true;
				       ret = an;
				   }
			       }
			   });
	}
    }

    return ret;
};

// /*
//  * Function: facet_fields
//  * 
//  * Return a count sorted array of the response's facet fields and counts.
//  * 
//  * Arguments:
//  *  n/a
//  * 
//  * Returns:
//  *  list of string/integer doublets
//  */
// bbop.golr.response.prototype.facet_fields = function(){
//     var robj = this._raw;
//     return robj.facet_counts.facet_fields;
// };

/*
 * Function: facet_field_list
 * 
 * Return a count sorted array of the response's facet fields.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list of strings
 */
bbop.golr.response.prototype.facet_field_list = function(){
    var robj = this._raw;
    return bbop.core.get_keys(robj.facet_counts.facet_fields).sort();
};

/*
 * Function: facet_field
 * 
 * Return a count-sorted array of a facet field's response.
 * 
 * : [["foo", 60], ...]
 * 
 * Arguments:
 *  facet_name - name of the facet to examine
 * 
 * Returns:
 *  list of nested lists
 */
bbop.golr.response.prototype.facet_field = function(facet_name){
    var robj = this._raw;
    return robj.facet_counts.facet_fields[facet_name];
};

/*
 * Function: facet_counts
 * 
 * For a given facet field, return a hash of that field's items and
 * their counts.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  hash of facets to their integer counts
 */
bbop.golr.response.prototype.facet_counts = function(){

    var robj = this._raw;
    var ret_hash = {};

    var anchor = this;
    
    var each = bbop.core.each;
    var facet_field_list = this.facet_field_list();
    each(facet_field_list,
	 function(ffield){
	     
	     // Make sure the top field is present,
	     if( ! ret_hash[ffield] ){
		 ret_hash[ffield] = {};		
	     }

	     var facet_field_items = anchor.facet_field(ffield);
	     each(facet_field_items,
		  function(item, index){
		      var name = item[0];
		      var count = item[1];
		      ret_hash[ffield][name] = count;
		  });
	 });
    
    return ret_hash;
};

/*
 * Function: query
 * 
 * Return the raw query parameter "q".
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbop.golr.response.prototype.query = function(){
    var robj = this._raw;    
    var retval = null;
    
    if( robj.responseHeader.params && robj.responseHeader.params.q ){
	retval = robj.responseHeader.params.q;
    }
    
    return retval;
};

/*
 * Function: query_filters
 *
 * A sensible handling of the not-so-great format of "fq" returned by
 * Solr (fq can be irritating single value or irritating array, along
 * with things like "-" in front of values). Since plus and minus
 * filters are mutually exclusive, we have a return format like:
 * 
 * : {field1: {filter1: (true|false), ...}, ...}
 * 
 * Where the true|false value represents a positive (true) or negative
 * (false) filter.
 * 
 * Parameters:
 *  n/a
 *
 * Returns:
 *  a hash of keyed hashes
 */
bbop.golr.response.prototype.query_filters = function(){
    var robj = this._raw;    
    var ret_hash = {};
    var fq_list = this.parameter('fq');
    if( fq_list ){
	
	// Ensure that it's a list and not just a naked string (as can
	// sometimes happen).
	if( bbop.core.what_is(fq_list) == 'string'){
	    fq_list = [fq_list];
	}
	
	// Make the return fq more tolerable.
	var each = bbop.core.each;
	each(fq_list,
	     function(fq_item){
		 
		 // Split everything on colons. Field is the first
		 // one, and everything else joined back together is
		 // the value of the filter. Best if you think about
		 // the GO id and non-GO id cases.
		 var splits = fq_item.split(":");
		 var field = splits.shift();
		 var value = splits.join(":"); // GO 0022008 -> GO:0022008

		 // First let's just assume that we have a positive
		 // filter.
		 var polarity = true;
		 
		 // Check and see if the first value in our
		 // field is '-' or '+'. If so, edit it out, but
		 // change the polarity in the '-' case.
		 if( field.charAt(0) == '-' ){
		     polarity = false;
		     field = field.substring(1, field.length);
		 }else if( field.charAt(0) == '+' ){
		     field = field.substring(1, field.length);
		 }

		 // Ensure that there is a place in the return hash
		 // for us.
		 if( ! ret_hash[field] ){
		     ret_hash[field] = {};
		 }
		 
		 // I want just the first quote and the final quote
		 // gone from the value if they are matching quotes.
		 if( value.charAt(0) == '"' &&
		     value.charAt(value.length -1) == '"' ){
			 value = value.substring(1, value.length -1);
		     }
		 
		 // The final filter note.
		 ret_hash[field][value] = polarity;
		 
	     });
    }
    
    return ret_hash;
};
/* 
 * Package: manager.js
 * 
 * Namespace: bbop.golr.manager
 * 
 * Generic BBOP manager for dealing with gross GOlr configuration and
 * management. Remember, this is actually a "subclass" of
 * <bbop.registry>. The defined events for this registry are: "reset",
 * "search", and "error".
 * 
 *  reset - functions for initializing and resetting
 *  search - functions for receiving standard search results
 *  error - functions to call when something goes very wrong
 * 
 * Both <bbop.golr.response> (or clean error data) and the manager
 * itself (this as anchor) should be passed to the callbacks.
 * 
 * TODO/BUG: <set_query> and <set_default_query> should both take
 * strings or <bbop.logic> as arguments. Those, as well as <get_query>
 * and <get_query> should only return <bbop.logic>.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }

/*
 * Constructor: manager
 * 
 * Contructor for the GOlr query manager
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.registry>
 */
bbop.golr.manager = function (golr_loc, golr_conf_obj){
    //bbop.registry.call(this, ['reset', 'search', 'error']);
    bbop.registry.call(this, ['reset', 'search', 'error']);
    this._is_a = 'bbop.golr.manager';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    this._logger = new bbop.logger(this._is_a);
    //this._logger.DEBUG = true;
    this._logger.DEBUG = false;
    function ll(str){ anchor._logger.kvetch(str); }

    // To help keep requests from the past haunting us. Actually doing
    // something with this number is up to the UI.
    this.last_sent_packet = 0;
    //this.last_received_packet = 0;

    // Lightly check incoming arguments.
    // There should be a string url argument.
    // There could be a hash of pinned filters argument.
    if( ! golr_loc || ! golr_conf_obj ){
	ll('ERROR: no proper arguments');
    }
    if( typeof golr_loc != 'string' ){
	ll('ERROR: no proper golr url string argument');
    }
    if(	! golr_conf_obj._is_a || ! golr_conf_obj._is_a == 'bbop.golr.conf' ){
	    ll('ERROR: no proper bbop.golr.conf object argument');
	    throw new Error('boink! ' + bbop.core.what_is(golr_conf_obj) );
	}
    
    // Whether or not to prevent ajax events from going.
    // This may not be usable, or applicable, to all backends.
    this._safety = false;

    // Our default target url.
    this._solr_url = golr_loc;

    // Settle in the configurations.
    // this._golr_conf = new bbop.golr.conf(golr_conf_var);
    this._golr_conf = golr_conf_obj;

    // The current data batches that we are storing.
    this._batch_urls = [];
    this._batch_accumulator_func = function(){};
    this._batch_final_func = function(){};

    // The current state stack.
    this._excursions = [];

    // The current class/personality that we're using. It may be none.
    this._current_class = null;

    // Our (default) query and the real deal.
    this.fundamental_query = '*:*'; // cannot be changed
    this.default_query = '*:*'; // changable
    this.query = this.default_query; // current

    // Our (default) fl and whatever we have now.
    //this.default_fl = '*%2Cscore';
    this.default_fl = '*,score';
    this.current_fl = this.default_fl;

    // We remember defaults in the case of rows and start since they
    // are the core to any paging mechanisms and may change often.
    //this.default_rows = 25;
    //this.default_rows = 100;
    this.default_rows = 10;
    this.default_start = 0;
    this.current_rows = this.default_rows;
    this.current_start = this.default_start;

    // There is a reason for this...TODO: later (25+)
    this.default_facet_limit = 25;
    this.current_facet_limit = 25;
    // {facet_field_name: value, ...}
    this.current_facet_field_limits = {};
    // TODO: paging for facets;
    this.current_facet_offset = 25;
    this.current_facet_field_offsets = {};

    // Our default query args, with facet fields plugged in.
    this.query_variants =
	{
	    // Our default standard search type. This means we don't
	    // have to explicitly add fields to the search (although
	    // the query fields ('qf') are still necessary to make
	    // anything real happen).
	    defType: 'edismax',

	    // Things unlikely to be touched.
	    // There are unlikely to be messed with too much.
	    qt: 'standard',
	    indent: 'on',
	    wt: 'json',
	    //version: '2.2',
	    rows: anchor.current_rows,
	    start: anchor.current_start, // Solr is offset indexing
	    //fl: '*%2Cscore',
	    fl: anchor.default_fl,
    
	    // Deprecated: see query_filters
	    //fq: {},
	    
	    // Deprecated: see query_fields
	    //qf: {},
	    
	    // Deprecated: see query
	    //q: '*:*'

	    // Control of facets.
	    facet: 'true',
	    'facet.mincount': 1,
	    'facet.sort': 'count',
	    'json.nl': 'arrarr', // only in facets right now
	    'facet.limit': anchor.default_facet_limit
	    // TODO?: 'f.???.facet.limit': 50,
	    // TODO: 'json.nl': [flat|map|arrarr]

	    // Deprecated: see facet_fields
	    //'facet.field': []
	};

    // This is the 'qf' parameter. Although we keep it, it only needs
    // to be exposed when the query ('q') field is set.
    //this.query_fields = [];
    this.query_fields = {};

    // A richer way to handle the 'fq' query variant.
    // It should look like:
    // {<filter>: {<value>:{'sticky_p':(t|f), 'negative_p':(t|f)}, ...}}
    this.query_filters = {};

    // The engine for the facet.field list.
    this.facet_fields = {};

    /*
     * Function: debug
     * 
     * Turn on or off the verbose messages. Uses <bbop.logger>, so
     * they should come out everywhere.
     * 
     * Parameters: 
     *  p - *[optional]* true or false for debugging
     *
     * Returns: 
     *  boolean; the current state of debugging
     */
    this.debug = function(p){
	if( p == true || p == false ){
	    this._logger.DEBUG = p;
	    // TODO: add debug parameter a la include_highlighting
	}
	return this._logger.DEBUG;
    };

    /*
     * Function: lite
     * 
     * Limit the returns fields (the parameter "fl") to the ones
     * defined in the set of fields defined in results, label fields
     * if available (i.e. "_label", "_map" when "_label" is
     * multi=valued), and "score" and "id".
     * 
     * The default is "false".
     * 
     * Parameters: 
     *  use_lite_p - *[optional]* true or false, none just returns current
     *
     * Returns: 
     *  boolean; the current state of lite-ness
     */
    this.lite = function(use_lite_p){

	// Adjust the current state accordingly.
	if( use_lite_p == true || use_lite_p == false ){
	    if( use_lite_p == true ){
		
		// The actual collections and adjustment.
		// First, this only works if we have a personality, so
		// check to see if we have one.
		var per = anchor.get_personality();
		if( per ){
		    // Since we have a personality, collect all of the
		    // mentioned fields.
		    var field_collection = {};
		    var loop = bbop.core.each;
		    var union = bbop.core.merge;
		    var ccl = anchor._current_class;

		    // Fill field_collection with the fields
		    // in the given category.
		    //loop(['boost', 'result', 'filter'],
		    //loop(['result', 'filter'],
		    loop(['result'],
			 function(cat){
			     field_collection = 
				 union(field_collection, ccl.get_weights(cat));
			 });
		    
		    // Next, flatten into a list.
		    var flist = bbop.core.get_keys(field_collection);

		    // Now for all the fields in these categories, see
		    // if we can find additional "special" labels to
		    // go with them.
		    loop(flist,
		    	 function(flist_item){
			     loop(['_label'],
			     //loop(['_label', '_label_searchable'],
		    		   function(field_suffix){
				       var new_field = 
					   flist_item + field_suffix;
				       var nf_obj = ccl.get_field(new_field);
				       if( nf_obj ){
					   flist.push(new_field);

					   // There appears to be the
					   // thing label. If they are
					   // both multi-valued, then
					   // there will be a map as
					   // well.
					   if( nf_obj.is_multi() ){
					       flist.push(flist_item + '_map');
					   }
				       }
				   });
			 });


		    // Finally, set these fields (plus score) as the
		    // new return fields.
		    flist.push('score');
		    flist.push('id');
		    //anchor.current_fl = flist.join('%2C');
		    anchor.current_fl = flist.join(',');
		    anchor.set('fl', anchor.current_fl);
		}

	    }else{ // else false
		// Reset.
		anchor.current_fl = anchor.default_fl;
		anchor.set('fl', anchor.current_fl);
	    }
	}

	// Return the current state.
	var retval = false;
	if( anchor.default_fl != anchor.current_fl ){
	    retval = true;
	}
	return retval;
    };

    // An internal helper function to munge the name of a field into
    // the name of its corresponding facet field.
    function _field_to_facet_field(field){
	return 'f.' + field + '.facet.limit';
    }
    
    /*
     * Function: get_facet_limit
     * 
     * Get the limit for a specified facet or the global limit.
     * 
     * Parameters: 
     *  field - *[optional]* limit for a specific field; otherwise global value
     *
     * Returns: 
     *  integer or null
     */
    this.get_facet_limit = function(field){
	var retval = null;

	if( ! field ){
	    retval = anchor.current_facet_limit;
	}else{
	    var f = _field_to_facet_field(field);
	    var try_val = anchor.current_facet_field_limits[f];
	    if( bbop.core.is_defined(try_val) ){
		retval = try_val;
	    }
	}

	return retval;
    };

    /*
     * Function: set_facet_limit
     * 
     * Change the number of facet values returned per call.
     * The default is likely 25.
     * 
     * Just as in Solr, a -1 argument is how to indicate unlimted
     * facet returns.
     * 
     * This setting does not survive things like <resets_facet_limit>.
     * 
     * Parameters: 
     *  arg1 - (integer) set the global limit
     *
     * Parameters: 
     *  arg1 - (string) the name of the field to check
     *  arg2 - (integer) set the limit for this field
     *
     * Returns: 
     *  boolean on whether something was set
     */
    this.set_facet_limit = function(arg1, arg2){
	var retval = false;

	// Decide which form of the function we're using.
	if( ! bbop.core.is_defined(arg2) && 
	    bbop.core.what_is(arg1) == 'number' ){ // form one
		
		// Set
		var nlimit = arg1;
		anchor.current_facet_limit = nlimit;
		anchor.set('facet.limit', anchor.current_facet_limit);
		
		retval = true;
	
	}else if( bbop.core.is_defined(arg1) && 
		  bbop.core.is_defined(arg2) &&
		  bbop.core.what_is(arg1) == 'string' &&
		  bbop.core.what_is(arg2) == 'number' ){
		      
		      var field = _field_to_facet_field(arg1);
		      var limit = arg2;
		      anchor.current_facet_field_limits[field] = limit;
		      
		      retval = true;
	}

	return retval;
    };

    /*
     * Function: set_default_facet_limit
     * 
     * Permanently change the default number of facet values returned
     * per call. The default's default is likely 25.
     * 
     * Just as in Solr, a -1 argument is how to indicate unlimted
     * facet returns.
     * 
     * Parameters: 
     *  lim - (integer) set the global default limit
     *
     * Returns: 
     *  old default
     */
    this.set_default_facet_limit = function(lim){

	// Capture ret.
	var retval = anchor.default_facet_limit;

	// Set
	anchor.default_facet_limit = lim;
	//anchor.set('facet.limit', anchor.default_facet_limit);
		
	return retval;
    };

    /*
     * Function: reset_facet_limit
     * 
     * Either reset the global limit to the original (likely 25)
     * and/or remove the specified filter. Sets everything back to the
     * original values or whatever was set by
     * <set_default_facet_limit>.
     * 
     * Parameters: 
     *  field - *[optional]* remove limit for a field; otherwise all and global
     *
     * Returns: 
     *  boolean on whether something was reset
     */
    this.reset_facet_limit = function(field){
	var retval = false;

	if( ! bbop.core.is_defined(field) ){
	    // Eliminate all fields by blowing them away.
	    anchor.current_facet_limit = anchor.default_facet_limit;
	    anchor.set('facet.limit', anchor.current_facet_limit);
	    anchor.current_facet_field_limits = {};
	    retval = true;
	}else{ // eliminate just the one field
	    var f = _field_to_facet_field(field);
	    if( bbop.core.is_defined(anchor.current_facet_field_limits[f]) ){
		delete anchor.current_facet_field_limits[f];
		retval = true;
	    }
	}

	return retval;
    };

    /*
     * Function: get_results_count
     * 
     * Get the current number of results that will be returned.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  integer
     */
    this.get_results_count = function(field){
	return anchor.get('rows');
    };

    /*
     * Function: set_results_count
     * 
     * Change the number of result documents returned per call.
     * The default is likely 10.
     * 
     * Parameters: 
     *  count - (integer) set the global results count
     *
     * Returns:
     *  the count set
     */
    this.set_results_count = function(count){
	anchor.set('rows', count);
	anchor.current_rows = count;
	return anchor.current_rows;
    };

    /*
     * Function: reset_results_count
     * 
     * Reset the number of documents to their original setting, likely
     * 10.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the new count
     */
    this.reset_results_count = function(){
	anchor.set('rows', anchor.default_rows);
	anchor.current_rows = anchor.default_rows;
	return anchor.current_rows;
    };

    /*
     * Function: plist_to_property_hash
     *
     * Turn a plist to a hash containing the different properties that
     * can be defined for a query filter. Possible values are: '+'
     * (positive filter), '-' (negative filter), '*' (sticky filter),
     * '$' (transient). If mutually exclusive properties are defined
     * (e.g. both '+' and '-'), the last one will be used. Or, since
     * that is a call to silliness, let's say the behavior is
     * undefined.
     *
     * Parameters: 
     *  plist - *[optional]* a list of properties to apply to the filter
     *
     * Returns: 
     *  A hash version of the plist; otherwise, the default property hash
     */
    this.plist_to_property_hash = function(plist){

	// Let's start with the default values.
	var phash = {
	    //'positive_p': true,
	    'negative_p': false,
	    //'transient_p': true
	    'sticky_p': false
	};

	// If not defined, just return the default list.
	if( plist ){	    
	    bbop.core.each(plist,
			   function(item){
			       if( item == '+' ){
				   phash['negative_p'] = false;
				   //phash['positive_p'] = true;
			       }else if( item == '-' ){
				   phash['negative_p'] = true;
				   //phash['positive_p'] = false;
			       }else if( item == '*' ){
				   phash['sticky_p'] = true;
				   //phash['transient_p'] = false;
			       }else if( item == '$' ){
				   phash['sticky_p'] = false;
				   //phash['transient_p'] = true;
			       }
			   });
	}

	return phash;
    };

    /*
     * Function: add_query_filter_as_string
     *
     * Setter for query filters ('fq'). Acts as a 
     *
     * Parameters: 
     *  filter_string - filter (type) string (e.g. "-type:gene")
     *  plist - *[optional]* list of properties of the filter
     *
     * Returns: 
     *  (TODO) The current query filter hash.
     * 
     * See also:
     *  <add_query_filter>
     */
    this.add_query_filter_as_string = function(filter_string, plist){
	
	// Split the incoming filter string into its component parts.
	var f_v = bbop.core.first_split(':', filter_string);
	var fname = f_v[0];
	var fval = f_v[1];

	// Need to shuck the value from the quotes, as in load_url.
	fval = bbop.core.dequote(fval);

	//var props = plist || ['$'];
	var props = plist;

	// Only continue on sensible inputs.
	var ret = {};
	if( fname != '' && fval != '' ){

	    // Similar to the URL loader.
	    var lead_char = fname.charAt(0);
	    if( lead_char == '-' || lead_char == '+' ){
		props.push(lead_char);
		fname = fname.substr(1, fname.length -1);
	    }
	    
	    ret = this.add_query_filter(fname, fval, props);
	}

	return ret;
    };

    /*
     * Function: add_query_filter
     *
     * Setter for query filters ('fq').
     *
     * Parameters: 
     *  filter - filter (type) string
     *  value - filter value string (or TODO: defined logic hash)
     *  plist - *[optional]* list of properties of the filter
     *
     * Returns: 
     *  (TODO) The current query filter hash.
     * 
     * See also:
     *  <plist_to_property_hash>
     */
    this.add_query_filter = function(filter, value, plist){
	
	// Make sure we've defined the group.
	if( ! bbop.core.is_defined(this.query_filters[filter]) ){
	    this.query_filters[filter] = {};
	}

	this.query_filters[filter][value] = this.plist_to_property_hash(plist);
	
	//ll("Current state: " + bbop.core.dump(this.query_filters));

	return {}; // TODO
    };

    /*
     * Function: remove_query_filter
     *
     * Remover for query filters ('fq'), is a plist is specified, it
     * will only remove if all of the listed criteria are met.
     *
     * Parameters: 
     *  filter - filter (type) string
     *  value - filter value string (TODO: or defined logic hash)
     *  plist - *[optional]* list of properties of the filter
     *
     * Returns: 
     *  boolean (on success)
     */
    this.remove_query_filter = function(filter, value, plist){

	// Default return value.
	var retval = false;

	// Internal helper to delete a low level key, and then if the
	// top-level is empty, get that one too.
	function _full_delete(hash, key1, key2){
	    if( key1 && key2 && hash &&
		hash[key1] && hash[key1][key2] ){
		    delete hash[key1][key2];
		}
	    if( bbop.core.is_empty(hash[key1]) ){
		delete hash[key1];
	    }
	}

	// If we have a filter, a value, and it's there...
	if( filter && value &&
	    anchor.query_filters[filter] &&
	    anchor.query_filters[filter][value] ){

		// If no real plist hash been defined, just go ahead
		// and get rid of that. Otherwise, make sure that the
		// defined plist and the stored properties are the
		// same before deleting.
		if( ! plist || bbop.core.is_empty(plist) ){
		    _full_delete(anchor.query_filters, filter, value);
		    retval = true;
		}else{
		    
		    var filter_phash = anchor.query_filters[filter][value];
		    var in_phash = anchor.plist_to_property_hash(plist);
		    
		    if( bbop.core.is_same(filter_phash, in_phash) ){		
			_full_delete(anchor.query_filters, filter, value);
			retval = true;
		    }
		}
	    }

	return retval;
    };

    /*
     * Function: reset_query_filters
     *
     * Reset the query filters ('fq'); but leave sticky filters alone.
     *
     * Parameters: 
     *  n/a
     * 
     * Returns: 
     *  (TODO) The current query filter hash.
     */
    this.reset_query_filters = function(){

	// Drill down and delete all non-stickies.
	var loop = bbop.core.each;
	loop(anchor.query_filters,
	     function(filter, values){
		 //ll('filter: ' + filter);
		 loop(values,
		      function(value, props){
			  //ll('  value: ' + value);
			  var sticky_p = props['sticky_p'];
			  if( ! sticky_p ){
			      //ll('hit: ' + filter + ', ' + value);
			      anchor.remove_query_filter(filter, value);
			  }
		      });
	     });

	return {}; // TODO
    };

    /*
     * Function: get_query_filter_properties
     *
     * Get a hash representing a query filter ('fq').
     *
     * Parameters: 
     *  key - filter string (TODO: or defined logic hash)
     *
     * Returns: 
     *  The current query filter hash for key.
     */
    this.get_query_filter_properties = function(filter, value){

	// Default return value.
	var retobj = null;
	
	// If we have a key and it's there...
	var aqf = anchor.query_filters;
	if( filter && value && aqf[filter] && aqf[filter][value] ){
	    retobj =
		{
		    'filter' : filter,
		    'value' : value,
		    //'polarity': aqf[filter][value]['negative_p'],
		    'negative_p': aqf[filter][value]['negative_p'],
		    'sticky_p': aqf[filter][value]['sticky_p']
		};
	}

	return retobj;
    };

    /*
     * Function: get_query_filters
     *
     * Get a list of hashes representing the query filters ('fq'). The
     * return lists look like:
     *
     * : [{'filter': A, 'value': B, 'negative_p': C, 'sticky_p': D}, ...]
     *
     * Where A and B are strings and C and D are booleans.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  A list of the current query filter hashs.
     */
    this.get_query_filters = function(){

	var retlist = [];	
	var loop = bbop.core.each;
	loop(anchor.query_filters,
	     function(f, values){
		 loop(values,
		      function(v, props){
			  retlist.push(anchor.get_query_filter_properties(f,v));
		      });
	     });

	return retlist;
    };

    /*
     * Function: get_sticky_query_filters
     *
     * Get a list of hashes representing the current stucky query
     * filters ('fq'). See <get_query_filters> for a specification of
     * what the return type looks like.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  A list of the current sticky query filter hashs.
     * 
     * See also:
     *  <get_query_filters>
     */
    this.get_sticky_query_filters = function(){

	var retlist = [];	
	var loop = bbop.core.each;
	loop(anchor.query_filters,
	     function(f, values){
		 loop(values,
		      function(v, props){
			  var qfp = anchor.get_query_filter_properties(f,v);
			  if( qfp['sticky_p'] == true ){
			      retlist.push(qfp);			      
			  }
		      });
	     });

	return retlist;
    };

    // A little extra thing that we might need sometimes.
    this.query_extra = null;

    // Spaces can cause problems in URLs in some environments.
    //final_qurl = final_qurl.replace(/ /g, '%20');
    // Convert the URL into something more usable.
    // Because we internally use %09 as a special case, make sure
    // we don't double-up on it.
    this._query_encode = function(str_to_encode){

	var fs1 = encodeURI(str_to_encode);
	var fs2 = fs1.replace(/\%2509/g, '%09');

	var final_encoding = fs2;
	return final_encoding;
    };

    // The callback function called after a successful AJAX
    // intialization/reset call. First it runs some template code,
    // then it does all of the callbacks.
    this._run_reset_callbacks = function(json_data){
	ll('run reset callbacks...');
	var response = new bbop.golr.response(json_data);
	anchor.apply_callbacks('reset', [response, anchor]);
    };

    // The main callback function called after a successful AJAX call in
    // the update function.
    this._run_search_callbacks = function(json_data){
	ll('run search callbacks...');
	var response = new bbop.golr.response(json_data);
	anchor.apply_callbacks('search', [response, anchor]);
    };

    // This set is called when we run into a problem.
    this._run_error_callbacks = function(json_data){
	ll('run error callbacks...');
	var response = new bbop.golr.response(json_data);
	anchor.apply_callbacks('error', [response, anchor]);
    };

    /*
     * Function: filter_list_to_assemble_hash
     *
     * Get all of our query filter variables and try and make
     * something of them that <get_assemble> can understand.
     *
     * Sticky doesn't matter here, but negativity does. However, we
     * can be pretty naive since the hashing should have already taken
     * out mutually exclusive dupes.
     * 
     * The argument is a list of query filter properties, as returned
     * by <get_query_filters> and <get_sticky_query_filters>.
     *
     * Parameters:
     *  flist - a list of query filter properties (see above)
     *
     * Returns:
     *  hash of filter names to value lists
     * 
     * See also:
     *  <get_query_filters>
     *  <get_sticky_query_filters>
     */
    this.filter_list_to_assemble_hash = function(flist){
	var h = {};
	bbop.core.each(flist,
		       function(filter_property){

			   // Grab only the properties that affect the
			   // URL.
			   var filter = filter_property['filter'];
			   var value = filter_property['value'];
			   var negative_p = filter_property['negative_p'];

			   // We need to alter at the filter level.
			   if( negative_p ){
			       filter = '-' + filter;
			   }

			   // Make sure it is defined.
			   if( ! bbop.core.is_defined(h[filter]) ){
			       h[filter] = [];
			   }
			   h[filter].push(value);
		       });
	return h;
    };

    /*
     * Function: sensible_query_p
     * 
     * Simply ask the manager if a free text query ('q') makes sense
     * at this point.
     * 
     * This currently means that the query text ('q') is three (3) or
     * longer and that query fields ('qf') are defined.
     * 
     * This is an overridable opinion of the manager.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  boolean
     */
    this.sensible_query_p = function(qfs){
	var retval = false;
	var q = anchor.get_query();
	var qf = anchor.query_field_set();
	if( q && q.length >= 3 && qf && ! bbop.core.is_empty(qf) ){
	    retval = true;
	}
	return retval;
    };

    /*
     * Function: last_packet_sent
     *
     * It is up to the UI to do something interesting with this number.
     * 
     * Also remember that this number only rises through calls to
     * <update> or one of its wrappers. Calls to <get_query_url> and
     * the like will not affect this number.
     * 
     * Parameters:
     *  n/a 
     *
     * Returns:
     *  integer
     * 
     * See also:
     *  <update>
     */
    this.last_packet_sent = function(){
    	return anchor.last_sent_packet;
    };

    /*
     * Function: clear
     *
     * Clear all non-sticky query parameters to get back to a more
     * "original" state.
     * 
     * Not to be confused with <reset>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  n/a
     */
    this.clear = function(){

	// Reset 'q'.
	anchor.query = anchor.default_query;

	// Reset 'fq', all but sticky.
	anchor.reset_query_filters();
    };

    /*
     * Function: reset
     *
     * Manually trigger the "reset" chain of events.
     *
     * This is a curried wrapper for <update> and should be preferred
     * over a direct call to update.
     *
     * Note to be confused with <clear>.
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <update>
     */
    this.reset = function(){
	return anchor.update('reset');
    };

    /*
     * Function: search
     *
     * Trigger the "search" chain of events.
     * Takes a field-keyed hash of bbop.logics as an argument.
     * 
     * This is a curried wrapper for <update> and should be preferred
     * over a direct call to update.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <update>
     */
    this.search = function(){
	return anchor.update('search');
    };

    /*
     * Function: page
     *
     * Re-trigger the "search" chain of events, but with the variables
     * set for a different section of the results.
     * 
     * Note that this operates independently of any impossibilites in
     * the results--just how such paging would look and
     * triggering. Ths UI should handle impossibilities and the like.
     * 
     * This is a wrapper for <update> and should be preferred over a
     * direct call to update.
     * 
     * Parameters: 
     *  rows - the number of rows to return
     *  start - the offset of the rows to return
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <update>
     */
    this.page = function(rows, start){
	anchor.set('rows', rows);
	anchor.set('start', start);
	return anchor.update('search', rows, start);
    };

    /*
     * Function: page_first
     *
     * Currently a convenience alias for <search>. Think about it--it
     * makes sense.
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  n/a
     * 
     * See also:
     *  <page>
     */
    this.page_first = anchor.search;
    
    /*
     * Function: page_previous
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <page>
     */
    this.page_previous = function(){
	var do_rows = anchor.get_page_rows();
	var do_offset = anchor.get_page_start() - do_rows;
	return anchor.page(do_rows, do_offset);
    };
    
    /*
     * Function: page_next
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  the query url (with the jQuery callback specific parameters)
     *
     * Returns:
     *  n/a
     * 
     * See also:
     *  <page>
     */
    this.page_next = function(){
	var do_rows = anchor.get_page_rows();
	var do_offset = anchor.get_page_start() + do_rows;
	return anchor.page(do_rows, do_offset);
    };
    
    /*
     * Function: page_last
     * 
     * Trigger search on last page parameters.
     * 
     * Since the manager has no idea about what is actually being
     * returned, the real world number of total documents needs to be
     * added as an argument.
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  total_document_count - integer for the total number of docs found
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <page>
     */
    this.page_last = function(total_document_count){
	var do_rows = anchor.get_page_rows();
	var mod = total_document_count % do_rows;
	var do_offset = total_document_count - mod;
	// ll("page_last: " + total_document_count + " " +
	//    do_rows + " " + mod + " " + do_offset);
	var ret = null;
	if( mod == 0 ){
	    ret = anchor.page(do_rows, do_offset - do_rows);
	}else{
	    ret = anchor.page(do_rows, do_offset);
	}
	return ret;
    };

    /*
     * Function: get_page_rows
     *
     * Return the number of rows the manager is currently set
     * to. Useful as an argument to <page>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  integer; the number of rows the manager is currently set to
     * 
     * See also:
     *  <page>
     */
    this.get_page_rows = function(){
	return anchor.get('rows');
    };

    /*
     * Function: get_page_start
     *
     * Return the rows offset the manager is currently set to. Useful
     * as an argument to <page>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  integer; the offset the manager is currently set to
     * 
     * See also:
     *  <page>
     */
    this.get_page_start = function(){
	return anchor.get('start');
    };

    /*
     * Function: add_query_field
     * 
     * Add a new query field to the query. 
     * 
     * This does not go through and expand into searchable fields, for
     * that see: <query_field_set>.
     *
     * Parameters: 
     *  qf - the query field to add
     *  boost - *[optional]* defaults to 1.0
     *
     * Returns:
     *  true or false on whether or not it is a new field
     * 
     * See also:
     *  <query_field_set>
     */
    this.add_query_field = function(qf, boost){
	
	var retval = false;

	// Make sure that some boost is there.
	if( ! bbop.core.is_defined(boost) ){
	    boost = 1.0;
	}

	// Check.
	if( ! bbop.core.is_defined(anchor.query_fields[qf]) ){
	    retval = true;
	}

	// Add.
	anchor.query_fields[qf] = boost;

	return retval;
    };

    /*
     * Function: query_field_set
     *
     * Bulk getter/setter for the query fields--the fields that are
     * searched (and by what weight) when using a query ('q' or
     * set_query(), i.e. the 'qf' field).
     * 
     * This will always use searchable fields if possible,
     * automatically replacing the non-searchable versions (I can't
     * think of any reason to use non-searchable versions unless you
     * want your searches to not work) if a personality is set. If no
     * personality is set, it will just use the arguments as-is.
     * 
     * The argument replaces the current set.
     *
     * The qfs argument should be a hash like:
     * 
     *  {'field01': value01, ...}
     * 
     * Parameters: 
     *  qfs - *[optional]* query fields to set
     *
     * Returns:
     *  the current query_fields array (e.g. ["field01^value01", ...])
     */
    this.query_field_set = function(qfs){

	// Covenience.
	var loop = bbop.core.each;
	var cclass = anchor._current_class;

	// Only do something if we have a query field set.
	if( qfs ){
	    
	    // Only do the probing if a personality has been set.
	    if( cclass ){

		// Get the current searchable extension string from
		// the personality class.
		//var s_ext = cclass.searchable_extension();
		// Actually, we're going to make this non-variable.
		var s_ext = '_searchable';

		// Probe the input to see if there are any searchable
		// alternatives to try, use those instead.
		var searchable_qfs = {};
		loop(qfs,
	    	     function(filter, value){
			 // If the probe fails, just put in
			 // whatever is there.
			 var cfield = cclass.get_field(filter);
			 if( cfield && cfield.searchable() ){
			     //ll('filter/value:');
			     var new_f = filter + s_ext;
			     searchable_qfs[new_f] = value;
			 }else{
			     searchable_qfs[filter] = value;
			 }
	    	     });
		qfs = searchable_qfs;
	    }	    

	    // Overwrite the current.
	    anchor.query_fields = qfs;
	}
	
	// Using the original information, convert them to the
	// proper output format.
	var output_format = [];
	loop(anchor.query_fields,
	     function(filter, value){
		 output_format.push(filter + '^' + value);
	     });
	return output_format;
    };

    /*
     * Function: facets
     *
     * Bulk getter/setter for facets (technically 'facet.field').
     *
     * Parameters: 
     *  key - *[optional]* facet to add to the facet list
     *
     * Parameters: 
     *  list - *[optional]* list to replace the current list with
     *
     * Returns:
     *  the current facets hash.
     */
    this.facets = function(list_or_key){
	if( list_or_key ){
	    if( bbop.core.what_is(list_or_key) != 'array' ){
		// Arrayify it.
		list_or_key = [list_or_key];
	    }else{
		// When there is a list, we are replacing the whole
		// thing, so let's just poof it out of existance.
		anchor.facet_fields = {};
	    }
	    bbop.core.each(list_or_key,
			   function(item){
			       anchor.facet_fields[item] = true;
			   });
	}
	return bbop.core.get_keys(anchor.facet_fields);
    };

    /*
     * Function: set_default_query
     *
     * Setter for the default query for the query variable ('q').
     * 
     * Call <reset_query> if you want to affect query immediately.
     * 
     * Parameters: 
     *  new_default_query - new default query string (or TODO: <bbop.logic>)
     *
     * Returns:
     *  the current setting of default query for ('q')
     */
    this.set_default_query = function(new_default_query){
	anchor.default_query = new_default_query;
	return anchor.default_query;
    };

    // /*
    //  * Function: set_first_run_query
    //  *
    //  * Setter for a first run query.  Normally, when <reset_query>, or
    //  * related method, is executed, we reset back to the default
    //  * query. This method sets a one time variable so a non empty
    //  * value can be used for the first reset.
    //  * 
    //  * Call <reset_query> if you want to affect query immediately.
    //  * 
    //  * Parameters: 
    //  *  first_run_query - query_string (or TODO: <bbop.logic>)
    //  *
    //  * Returns:
    //  *  the current setting of default query for ('q')
    //  */
    // this.set_first_run_query = function(first_run_query){
    // 	anchor.default_query = new_default_query;
    // 	return anchor.default_query;
    // };

    /*
     * Function: reset_default_query
     *
     * Reset the default query back to "*:*".
     * 
     * Call <reset_query> if you want to affect query immediately.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  the current setting of default query ('q')
     */
    this.reset_default_query = function(){
	anchor.default_query = anchor.fundamental_query;
	return anchor.default_query;
    };

    /*
     * Function: set_query
     *
     * Setter for the query variable ('q').
     * 
     * Parameters: 
     *  new_query - new value for the query string (or TODO: <bbop.logic>)
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_comfy_query>
     */
    this.set_query = function(new_query){
	anchor.query = new_query;
	return anchor.query;
    };

    /*
     * Function: set_comfy_query
     *
     * A specialized setter for the query variable ('q'), as follows:
     *
     * If the input is all alphanum or space, the input is
     * tokenized. The last token, if it is at least three characters,
     * gets a wildcard '*'.
     * 
     * This might be a more comfortable way to search for most naive
     * (non-power user) interfaces.
     * 
     * Parameters: 
     *  new_query - new value for the query string (or TODO: <bbop.logic>)
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_query>
     */
    this.set_comfy_query = function(new_query){

	var comfy_query = new_query;

	// Check that there is something there.
	if( new_query && new_query.length && new_query.length > 0 ){

	    // That it is alphanum+space-ish
	    var alphanum = new RegExp(/^[a-zA-Z0-9 ]+$/);
	    if( alphanum.test(new_query) ){
	    
		// Break it into tokens and get the last.
		var tokens = new_query.split(new RegExp('\\s+'));
		var last_token = tokens[tokens.length -1];
		//ll('last: ' + last_token);
		
		// If it is three or more, add the wildcard.
		if( last_token.length >= 3 ){
		    tokens[tokens.length -1] = last_token + '*';

		    // And join it all back into our comfy query.
		    comfy_query = tokens.join(' ');
		}
	    }
	}

	// Kick it back to the normal set_query.
	return anchor.set_query(comfy_query);
    };

    /*
     * Function: set_id
     *
     * A limited setter, removing whatever else is on query. This is
     * for when you want to lock into one (unique) document by id
     * (essentially 'q=id:"foo"'). All other query operations behave
     * as they should around it.
     * 
     * Parameters: 
     *  new_id - string id
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_ids>
     */
    this.set_id = function(new_id){
	anchor.query = 'id:' + bbop.core.ensure(new_id, '"');
	return anchor.query;
    };

    /*
     * Function: set_ids
     *
     * Like <set_id>, a limited setter. It removes whatever else is on
     * query and replaces it with something like:
     * 
     * : gm.get_download_url(['id', 'score'], {'entity_list':['GO:1', 'GO:2']})
     * : http://golr.berkeleybop.org/select?defType=edismax&qt=standard&indent=on&wt=csv&rows=1000&start=0&fl=id,score&facet=true&facet.mincount=1&facet.sort=count&json.nl=arrarr&facet.limit=25&csv.encapsulator=&csv.separator=%09&csv.header=false&csv.mv.separator=%7C&q=id:(%22GO:1%22%20OR%20%22GO:2%22)
     * 
     * This is for when you want to lock into a set of documents. All
     * other query operations behave as they should around it.
     * 
     * Parameters: 
     *  id_list - a list of ids to search for
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_ids>
     */
    this.set_ids = function(id_list){

	var fixed_list = [];
	bbop.core.each(id_list,
		       function(item){
			   fixed_list.push(bbop.core.ensure(item, '"'));
		       });

	var base_id_list = '(' + fixed_list.join(' OR ') + ')';

	anchor.query = 'id:' + base_id_list;
	return anchor.query;
    };

    /*
     * Function: get_query
     *
     * Getter for the query variable ('q').
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of extra
     */
    this.get_query = function(){
	return anchor.query;
    };

    /*
     * Function: get_default_query
     *
     * Getter for what the query variable 'q' will be set to on a
     * <reset_query>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of the default query
     */
    this.get_default_query = function(){
	return anchor.default_query;
    };

    /*
     * Function: get_fundamental_query
     *
     * Getter for what the query variable 'q' will be set to on a
     * <reset_default_query>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of the fundamental default query
     */
    this.get_fundamental_query = function(){
	return anchor.fundamental_query;
    };

    /*
     * Function: get_query
     *
     * Getter for the query variable ('q').
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of extra
     */
    this.get_query = function(){
	return anchor.query;
    };

    /*
     * Function: reset_query
     *
     * Remove/reset the query variable ('q'); this set it back to the
     * default query.
     *
     * Parameters:
     *  none
     *
     * Returns:
     *  the current value of query
     * 
     * Also see:
     *  <set_default_query>
     *  <reset_default_query>
     */
    this.reset_query = function(){
	anchor.query = anchor.default_query;
	ll('reset query to default: ' + anchor.query);
	return anchor.query;
    };

    /*
     * Function: set_extra
     *
     * Setter for the internal string variable to be appended to the
     * end of a query. For special use cases only (e.g. extend
     * functionality of the API safely).
     * 
     * Parameters: 
     *  new_extra - *[optional]* new value for the extras string
     *
     * Returns:
     *  the current setting of extra
     */
    this.set_extra = function(new_extra){
	anchor.query_extra = new_extra;
	return anchor.query_extra;
    };

    /*
     * Function: get_extra
     *
     * Getter for the internal string variable to be appended
     * to the end of a query.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of extra
     */
    this.get_extra = anchor.set_extra;

    /*
     * Function: remove_extra
     *
     * Remove/reset the extra bit.
     *
     * Parameters:
     *  none
     *
     * Returns:
     *  ""
     */
    this.remove_extra = function(){
	anchor.query_extra = "";
	return anchor.query_extra;
    };

    /*
     * Function: set
     *
     * Set an internal variable for the query. The internal variables
     * are typically things like 'qt', 'indent', etc.--things that you
     * might set and forget a while. It does /not/ include highly
     * dynamic variables (like callback and packet) or querying
     * variables like 'q' and 'fq'; for those you need to use the API.
     *
     * Parameters: 
     *  key - the name of the parameter to change
     *  new_val - what you want the new value to be
     *
     * Returns:
     *  n/a
     */
    this.set = function(key, new_val){
	anchor.query_variants[key] = new_val;
    };

    /*
     * Function: get
     *
     * Get an internal variable for the query.
     *
     * See <set> for the kinds of parameters that can be read.
     * 
     * Parameters: 
     *  key - the name of the parameter to get
     *
     * Returns:
     *  The found value of the key.
     */
    this.get = function(key){
	return anchor.query_variants[key];
    };

    /*
     * Function: unset
     *
     * Unset (remove) an internal variable for the query. Only usable on certain types of 
     * 
     * Only use is you really know what you're doing.
     *
     * Parameters: 
     *  key - the name of the parameter to unset/remove
     *
     * Returns:
     *  boolean; true false on whether the key was found
     */
    this.unset = function(key){
	var retval = false;

	if( bbop.core.is_defined(anchor.query_variants[key]) ){
	    retval = true;
	    delete anchor.query_variants[key];
	}

	return retval;
    };

    /*
     * Function: include_highlighting
     *
     * Turn hilighting on or off (with true or false).
     * 
     * This essentially adds the parameters to the query string to
     * make sure that basic highlighting on the search is returned.
     * 
     * It starts off as false. The optional html_elt_str argument
     * defaults to:
     *  : <em class="hilite">
     *
     * Parameters: 
     *  hilite_p - *[optional]* boolean
     *  html_elt_str - *[serially optional]* the HTML element string to use
     *
     * Returns:
     *  either false or the current string being used for the return element
     */
    this.include_highlighting = function(hilite_p, html_elt_str){
	var retval = false;

	if( bbop.core.is_defined(hilite_p) &&
	    (hilite_p == true || hilite_p == false) ){
	    if( hilite_p == true ){

		// Set the default string if necessary.
		if( ! html_elt_str ){ html_elt_str = '<em class="hilite">'; }

		// Set the parameters.
		anchor.set('hl', 'true');
		anchor.set('hl.simple.pre', html_elt_str);

		// And the retval is not longer false.
		retval = html_elt_str;

	    }else{
		
		// Unset the parameters.
		anchor.unset('hl');
		anchor.unset('hl.simple.pre');
	    }

	}else{
	    // Otherwise, just discover the current state and return
	    // it.
	    var cl_tmp = anchor.get('hl.simple.pre');
	    if( bbop.core.is_defined(cl_tmp) ){
		retval = cl_tmp;
	    }
	}

	return retval;
    };

    /*
     * Function: set_personality
     *
     * While we are always contacting the same Solr instance, we
     * sometimes want to have different weights, facets, etc. This
     * function allows us to use the pre-set ones defined in the
     * constructor configuration argument.
     * 
     * Currently, this only sets the 'facet.field' internal variable.
     *
     * Parameters: 
     *  personality_id - string
     *
     * Returns:
     *  Will return false if personality doesn't exist
     */
    this.set_personality = function(personality_id){
	var retval = false;

	// This sets the facet.field internal variable.
	var cclass = anchor._golr_conf.get_class(personality_id);
	if( cclass ){

	    // Remember what our personality is.
	    // WARNING: this line must go before the query_field_set
	    // line below, or else we won't get the "smart" search.
	    this._current_class = cclass;

	    // Set the facets for our class.
	    anchor.facets(cclass.field_order_by_weight('filter'));

	    // Set the query field weights ('qf') necessary to make
	    // queries run properly.
	    anchor.query_field_set(cclass.get_weights('boost'));
	    
	    // Show that we did indeed set a personality.
	    retval = true;
	}

	return retval;
    };

    /*
     * Function: get_personality
     *
     * Returns the current personality, null if none.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  Returns the current personality as a string, null if none is set
     */
    this.get_personality = function(){
	var retval = null;

	if( bbop.core.is_defined(anchor._current_class) &&
	    bbop.core.what_is(anchor._current_class) == 'bbop.golr.conf_class'){
	    retval = anchor._current_class.id();
	}

	return retval;
    };

    /*
     * Function: get_query_url
     *
     * Get the current invariant state of the manager returned as a
     * encoded URL string (using encodeURI()).
     * 
     * This means the URL for the current query to the GOlr store, but
     * without extra information about packets, callbacks, and the
     * like.
     * 
     * This is generally appropriate for getting data, but maybe not
     * for things like high-speed autocomplete where races can
     * occur. For those, you might want to consider <update> or
     * <search>.
     *
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  URL string
     * 
     * Also see:
     *  <update>, <search>
     */
    this.get_query_url = function(){

	// Structure of the necessary invariant parts.	
	var qurl = anchor._solr_url + 'select?';

	// Filters to assemble.
	var assemf = anchor.get_query_filters();
	var fq = anchor.filter_list_to_assemble_hash(assemf);

	// Add all of our different specialized hashes.
	var things_to_add = [
	    //bbop.core.get_assemble(anchor.query_invariants),
	    //bbop.core.get_assemble(anchor.query_facets),
	    bbop.core.get_assemble(anchor.query_variants),
	    bbop.core.get_assemble(anchor.current_facet_field_limits),
	    //bbop.core.get_assemble({'fq': anchor.query_sticky_filters}),
	    bbop.core.get_assemble({'fq': fq}),
	    bbop.core.get_assemble({'facet.field':
				    bbop.core.get_keys(anchor.facet_fields)}),
	    bbop.core.get_assemble({'q': anchor.query}),
	    anchor.query_extra
	];
	// Add query_fields ('qf') iff query ('q') is set and it is
	// not length 0.
	if( anchor.query &&
	    anchor.query.length &&
	    anchor.query.length != 0 &&
	    anchor.query != anchor.fundamental_query ){
		var in_qf =
		    bbop.core.get_assemble({'qf': anchor.query_field_set()});
		things_to_add.push(in_qf);
	    }
	
	// Assemble the assemblies into a single URL, throw out
	// everything that seems like it isn't real to keep the URL as
	// clean a possible.
	var filtered_things = 
	    bbop.core.pare(things_to_add,
			   function(item, index){
			       var retval = true;
			       if( item && item != '' ){
				   retval = false;
			       }
			       return retval;
			   });

	var final_qurl = qurl + filtered_things.join('&');
	final_qurl = anchor._query_encode(final_qurl);
	ll('qurl: ' + final_qurl);
    	return final_qurl;
    };

    /*
     * Function: push_excursion
     *
     * Save the current state of the manager--data and sticky filter
     * information--onto an internal stack. Batch information is not
     * stored.
     * 
     * Useful for gettinginto a state, doing something else, then
     * returning to the original state.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  the number of items on the excursion stack
     * 
     * Also see:
     *  <get_query_url>
     *  <pop_excursion>
     */
    this.push_excursion = function(){
	
	var now = {
	    // Save current state (data).
	    data_url: anchor.get_query_url(),
	    // Save current state (session).
	    session: {
		// Get the sticky filters.
		sticky_filters: anchor.get_sticky_query_filters()
	    }
	};

	// Save.
	anchor._excursions.push(now);

	// ...
    	return anchor._excursions.length;
    };

    /*
     * Function: pop_excursion
     *
     * Return to a previously pushed state. Batch items are not
     * recovered.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  boolean on whether a state was recovered
     * 
     * Also see:
     *  <get_query_url>
     *  <gpush_excursion>
     */
    this.pop_excursion = function(){
	
	var retval = false;

	var then = anchor._excursions.pop();
	if( then ){
	    retval = true;

	    // Recover data state.
	    var then_data_url = then['data_url'];
	    anchor.load_url(then_data_url);

	    // Recover the session state.
	    var then_session_stickies = then['session']['sticky_filters'];
	    // Add the sticky filters.
	    bbop.core.each(then_session_stickies,
			   function(sticky){
			       var flt = sticky['filter'];
			       var fvl = sticky['value'];
			       var fpl = [];
			       if( sticky['negative_p'] == true ){
				   fpl.push('-');
			       }
			       if( sticky['sticky_p'] == true ){
				   fpl.push('*');
			       }
			       anchor.add_query_filter(flt, fvl, fpl);
			   });	    
	}

    	return retval;
    };

    /*
     * Function: get_download_url
     *
     * Get the current invariant state of the manager returned as a
     * URL string.
     * 
     * This differs from <get_query_url> in that the generated string
     * is intended for text-processing uses rather than computerized
     * searching uses. The idea where is to create a TSV file for
     * downloading and consumption.
     * 
     * Instead of downloading all of the results, a limited listed set
     * can be downloaded using entity_list, which identifies documents by id.
     * 
     * The optional argument hash looks like:
     *  rows - the number of rows to return; defaults to: 1000
     *  encapsulator - how to enclose whitespace fields; defaults to: ""
     *  separator - separator between fields; defaults to: "%09" (tab)
     *  header - whether or not to show headers; defaults to: "false"
     *  mv_separator - separator for multi-valued fields; defaults to: "|"
     *  entity_list - list of specific download items in results; default null
     * 
     * With the entity list, keep in mind that null and an empty list
     * are handled in pretty much the same way--they are an indication
     * that we are going after nothing specific, and so all results
     * are game.
     * 
     * Parameters:
     *  field_list - a list of fields to return
     *  in_arg_hash - *[optional]* additional optional arguments
     * 
     * Returns:
     *  URL string
     * 
     * Also see:
     *  <get_query_url>
     */
    this.get_download_url = function(field_list, in_arg_hash){
	
	// Save current state.
	anchor.push_excursion();

	// Deal with getting arguments in properly.
	var default_hash =
	    {
		rows : 1000,
		encapsulator : '',
		separator : "%09",
		header : 'false',
		mv_separator : "|",
		entity_list : []
	    };
	var arg_hash = bbop.core.fold(default_hash, in_arg_hash);

	// Make the changes we want.
	anchor.set('wt', 'csv');
	anchor.set('start', 0);
	anchor.set('fl', field_list.join(','));
	anchor.set('rows', arg_hash['rows']);
	anchor.set('csv.encapsulator', arg_hash['encapsulator']);
	anchor.set('csv.separator', arg_hash['separator']);
	anchor.set('csv.header', arg_hash['header']);
	anchor.set('csv.mv.separator', arg_hash['mv_separator']);

	// A little more tricky, jimmy the entity list into the query
	// if it's viable.
	var entity_list = arg_hash['entity_list'];
	if( bbop.core.is_defined(entity_list) &&
	    bbop.core.is_array(entity_list) &&
	    entity_list.length > 0 ){
		anchor.set_ids(entity_list);
	}

	// Get url.
	var returl = anchor.get_query_url();

	// Reset the old state.
	anchor.pop_excursion();

    	return returl;
    };

    /*
     * Function: get_filter_query_string
     *
     * Get the current state of the manager, as defined by the current
     * gross filter set--query, sticky filters, and standard filters--
     * returned as a URL query string (sans the '?').
     * 
     * This differs from <get_query_url> and <get_state_url> in that
     * the generated string is intended for applications that may want
     * just enough information to recover filter state when the
     * personality, and other types of information, are already
     * known. It is intended to be part of a light RESTy bookmarking
     * mechanism in larger application.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  query string for current filters (sans the '?')
     * 
     * Also see:
     *  <get_query_url>
     *  <get_state_url>
     */
    this.get_filter_query_string = function(){
	
	// // Save current state.
	// anchor.push_excursion();

	var q = anchor.get_query();

	// Get the filters and sort them into sticky and "normal"
	// sets.
	var filters = anchor.get_query_filters();
	var std_filters = [];
	var sticky_filters = [];
	bbop.core.each(filters,
		       function(filter){
			   if( filter['sticky_p'] ){
			       sticky_filters.push(filter);
			   }else{
			       std_filters.push(filter);
			   }
		       });

	var fq = anchor.filter_list_to_assemble_hash(std_filters);
	var sfq = anchor.filter_list_to_assemble_hash(sticky_filters);

	var things_to_add = [];
	if( q ){
	    things_to_add.push(bbop.core.get_assemble({'q': q}));
	}
	if( ! bbop.core.is_empty(fq) ){
	    things_to_add.push(bbop.core.get_assemble({'fq': fq}));
	}
	if( ! bbop.core.is_empty(sfq) ){
	    things_to_add.push(bbop.core.get_assemble({'sfq': sfq}));
	}
	    
	// // Reset the old state.
	// anchor.pop_excursion();

	var final_qstr = things_to_add.join('&');
	final_qstr = anchor._query_encode(final_qstr);
    	return final_qstr;
    };

    /*
     * Function: get_state_url
     *
     * Get the current invariant state of the manager, plus the
     * current personality as a parameter, returned as a URL string.
     * 
     * This differs from <get_query_url> in that the generated string
     * is intended for applications that may want a little more
     * information and hinting over just what the current search
     * is. This method essentially parameterizes some of the "hidden
     * state" of the manager.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  URL string
     * 
     * Also see:
     *  <get_query_url>
     */
    this.get_state_url = function(){
	
	// Save current state.
	anchor.push_excursion();

	// Make the changes we want. First, physically set the
	// "personality", then set pins for jump-in recovery.
	anchor.set('personality', anchor.get_personality());

	// Explicitly set sticky pins for later recovery.
	// Do this pretty much exactly like we do for get_query_url().
	var sticky_filters = anchor.get_sticky_query_filters();
	var sfq = anchor.filter_list_to_assemble_hash(sticky_filters);
	anchor.set('sfq', sfq);
	
	// Get url.
	var returl = anchor.get_query_url();

	// Reset the old state.
	anchor.pop_excursion();

    	return returl;
    };

    /*
     * Function: load_url
     *
     * Makes a a best attempt to recover the state of a manager from
     * the clues left in a data url. This can also (and probably
     * should) be thought of as a "load bookmark"
     * function. Theoretically, you should even be able to use
     * "bookmarks" from alien installations.
     * 
     * Note that while this recovers enough to get the same data,
     * certain "session"/"preference" type things that are not encoded
     * in the url (e.g. filter stickiness, the contents of batch
     * queues, non-default base queries, etc.) will not be replayed
     * and must be recovered or guessed on an app by app basis..
     * 
     * Warning: this currently only replays a small subset of possible
     * parameters. Currently: personality, q, fq, ???. In the future,
     * this should no all non-session information.
     * 
     * Warning: Because there is more to bookmarks than just the major
     * stuff, variants not supplied in the bookmark will be removed.
     * 
     * This returns true if the parameter portions of the new and
     * bookmark urls match. However, this is often not the case--think
     * shifting personalities, etc.
     * 
     * Parameters:
     *  url - A URL string generated by a manager's get_query_url (or similar)
     * 
     * Returns:
     *  boolean
     */
    this.load_url = function(url){

	var loop = bbop.core.each;

	// // Some Regexps that would be nice to just compile once.
	// var regexp_url_space = /\%20/g; // '%20' == ' '
	// var regexp_url_quote = /\%22/g; // '%22' == '"'
	// var regexp_url_left_paren = /\%28/g; // '%28' == '('
	// var regexp_url_right_paren = /\%29/g; // '%29' == ')'

	// We are assuming that we are consuming our own URLs from
	// get_query_url(), so we start by attempting to decode it
	// (TODO: need a tab watch here)?
	var decoded_url = decodeURI(url);

	// Break down url.
	var in_params = bbop.core.url_parameters(decoded_url);

	// First, look for the personality setting and invoke it if
	// it's there--it will dominate unless we take care of it first.
	// Also note the all the keys that we see (for later erasure
	// of excess).
	var seen_params = {};
	loop(in_params,
	     function(ip){
		 var key = ip[0];
		 var val = ip[1];
		 if( key == 'personality' && val && val != '' ){
		     anchor.set_personality(val);
		 }
		 seen_params[key] = true;
	     });
	
	// Now cycle through the the parameters again and invoke the
	// appropriate functions to bring them in line.
	var sticky_cache = {};
	loop(in_params,
	     function(ip){
		 var key = ip[0];
		 var val = ip[1];
		 if( bbop.core.is_defined(val) && val != '' ){
		     if( key == 'personality' ){
			 // Already did it, skip.
		     }else if( key == 'q' ){
			 anchor.set_query(val);
		     }else if( key == 'fq' || key == 'sfq' ){
			 // Split the fq (or sfq) parameter.
			 var fnv = bbop.core.first_split(':', val);
			 var fname = fnv[0];
			 var fval = fnv[1];
			 //ll('HERE: fname: ' + fname);
			 //ll('HERE: fval: ' + fval);
			 if( fname && fval ){

			     var plist = [];

			     // Remove leading sign on a filter and
			     // add it to the plist.
			     var lead_char = fname.charAt(0);
			     if( lead_char == '-' || lead_char == '+' ){
				 plist.push(lead_char);
				 fname = fname.substr(1, fname.length -1);
			     }

			     // // TODO: 
			     // // If the fval looks like it has not been
			     // // decoded (like from a URL-safe
			     // // bookmark), go ahead and do so.
			     // fval = fval.replace(regexp_url_space, ' ');
			     // fval = fval.replace(regexp_url_quote, '"');
			     // fval = fval.replace(regexp_url_left_paren, '(');
			     // fval = fval.replace(regexp_url_right_paren,')');

			     // Do not allow quotes in--they will be
			     // added by the assembler.
			     fval = bbop.core.dequote(fval);

			     // Make it sticky it it came in on "sfq".
			     // Note if this is the sticky form.
			     var skey = fname + '^' + fval;
			     if( key == 'sfq' ){
				 sticky_cache[skey] = true;
				 plist.push('*');
			     }

			     // Add the query filter properly, but
			     // only if we have not already added the
			     // sticky form (prevent clobbering).
			     if( ! bbop.core.is_defined(sticky_cache[skey]) ||
				 key == 'sfq'){
				 anchor.add_query_filter(fname, fval, plist);
				 
			     }
			 }
		     }else if( key == 'qf' ){
			 // qf is handles a little strangely...
			 var foo = bbop.core.first_split('^', val);
			 //ll('qf: key: '+ key +', val: '+ val +', foo: '+ foo);
			 anchor.add_query_field(foo[0], foo[1]);
		     }else if( key == 'facet.field' ){
		      	 anchor.facets(val);
		     }else if( key == 'start' || key == 'rows' ){
			 // Numbers need to be handled carefully.
			 if( bbop.core.what_is(val) == 'string' ){
			     val = parseFloat(val);
			 }
		      	 anchor.set(key, val);
		     }else{
			 // This one catches all of the non-special
			 // parameters and resets them using .set().
			 anchor.set(key, val);
			 // if( key == 'fq' ){
			 //     throw new Error("OI");			     
			 // }
		     }
		 }
	     });

	// Now go through and remove all of the query variant
	// parameters that were not seen in the bookmark.
	loop(anchor.query_variants,
	     function(key, val){
		 if( ! bbop.core.is_defined(seen_params[key]) ){
		     anchor.unset(key);
		 }
	     });

	// Produce our own url from what we've done. If the parameters
	// match with the incoming argument's return true.
	var curr_url = anchor.get_query_url();
	var curr_params = bbop.core.url_parameters(curr_url);
	var differences = 0;
	if( in_params.length == curr_params.length ){
	    loop(in_params,
		 function(in_p, i){
		     var curr_p = curr_params[i];
		     if( in_p.length == curr_p.length ){
			 if( in_p.length == 1 ){
			     if( in_p[0] == curr_p[0] ){
				 // match!
			     }else{
				 differences++;
			     }
			 }else if( in_p.length == 2 ){
			     if( in_p[0] == curr_p[0] && in_p[1] == curr_p[1] ){
				 // match!
			     }else{
				 differences++;
			     }
			 }
		     }else{
			 differences++;
		     }
		 });
	}else{
	    differences++;
	}

	// Tally the differences and decides if they're the same.
	var retval = false;
	if( differences == 0 ){
	    retval = true;
	}
    	return retval;
    };

    /*
     * Function: add_to_batch
     *
     * "Save" the current manager state to run later in serial batch
     * mode.
     * 
     * The actual job of running these batches is left to the
     * implementation of the sub-managers; probably in "run_batch".
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  state url
     */
    this.add_to_batch = function(){
	var qurl = anchor.get_query_url();
	anchor._batch_urls.push(qurl);
    	return qurl;
    };

    /*
     * Function: batch_urls
     *
     * Return a pointer to the current batch urls.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  array
     */
    this.batch_urls = function(){
    	return anchor._batch_urls;
    };

    /*
     * Function: next_batch_url
     *
     * Return the next data to be processed, removing it from the
     * batch queue in the process.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  state url or null
     */
    this.next_batch_url = function(){
    	return anchor._batch_urls.shift() || null;
    };

    /*
     * Function: reset_batch
     *
     * Clear the currently queued data batch.
     * 
     * The actual job of running these batches is left to the
     * implementation of the sub-managers; probably in "run_batch".
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  the number of items cleared
     */
    this.reset_batch = function(){
	var num = anchor._batch_urls.length;
	anchor._batch_urls = [];
    	return num;
    };
};
bbop.core.extend(bbop.golr.manager, bbop.registry);

/*
 * Function: to_string
 *
 * Output writer for this object/class.
 * See the documentation in <core.js> on <dump> and <to_string>.
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbop.golr.manager.prototype.to_string = function (){
    return '<' + this._is_a + '>';
};

/*
 * Function: update
 *
 * The user code to select the type of update (and thus the type
 * of callbacks to be called on data return).
 * 
 * This mechanism adds a couple of variables over other methods
 * for bookkeeping: packet (incremented every time) and callback_type.
 * 
 * The currently recognized callback types are "reset" (for when you
 * are starting or starting over) and "search" (what you typically
 * want when you get new data) and "error" for when something went
 * wrong. But only "search" and "reset" manipulate the system.
 * 
 * If rows or start are not set, they will both be reset to their
 * initial values--this is to allow for paging on "current"
 * results and then getting back to the business of searching with
 * as little fuss as possible. Because of things like this, one
 * should avoid calling this directly whenever possible and prefer
 * simpler functionality of the wrapper methods: <search>,
 * <reset>, and <page>.
 * 
 * Parameters: 
 *  callback_type - callback type string; 'search', 'reset' and 'error'
 *  rows - *[optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with the jQuery callback specific parameters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.prototype.update = function(callback_type, rows, start){

    //function ll(s){ this._logger.kvetch(s); }

    // Handle paging in this main section by resetting to
    // the defaults if rows and offset are not explicitly
    // defined.
    if( ! bbop.core.is_defined(rows) || ! bbop.core.is_defined(start) ){
    	this.set('rows', this.current_rows);
    	this.set('start', this.current_start);
    }
    
    // Our bookkeeping--increment packet.
    this.last_sent_packet = this.last_sent_packet + 1;
    
    // Necessary updated query variants.
    var update_query_variants = {
    	packet: this.last_sent_packet,
    	callback_type: callback_type
    };
    var update_qv = bbop.core.get_assemble(update_query_variants);
    
    // Structure of the necessary invariant parts.	
    //var qurl = this.get_query_url();
    var qurl = null;
    
    // Conditional merging of the remaining variant parts.
    if( callback_type == 'reset' ){
	
    	// Take everything back to the initial state--this means
    	// resetting the query and removing all non-sticky
    	// filters.
	
    	// Reset and do completely open query.
    	//ll('reset assembly');
	
    	// Save the q vals, do a fundamental get, then reset to
    	// what we had.
    	//var tmp_save = this.get_query();
    	//this.reset_default_query();
    	this.reset_query();
    	this.reset_query_filters();
    	qurl = this.get_query_url();
    	qurl = qurl + '&' + update_qv;
    	//this.set_query(tmp_save);
	
    }else if( callback_type == 'search' ){
	
    	//ll('search assembly');
    	qurl = this.get_query_url();
    	qurl = qurl + '&' + update_qv;
	
    }else{
    	throw new Error("Unknown callback_type: " + callback_type);
    }
    
    //ll('qurl: ' + qurl);
    return qurl;
};
/* 
 * Package: preload.js
 * 
 * Namespace: bbop.golr.manager.preload
 * 
 * Preload BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.golr.manager>.
 * 
 * This is synchronous.
 * 
 * This is mostly for testing purposes.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }
if ( typeof bbop.golr.manager == "undefined" ){ bbop.golr.manager = {}; }

/*
 * Constructor: preload
 * 
 * Contructor for the GOlr query manager.
 * 
 * Allows preloading of the returned document.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.golr.manager>
 */
bbop.golr.manager.preload = function (golr_loc, golr_conf_obj){
    bbop.golr.manager.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.golr.manager.preload';

    // The only property to add.
    this._bgm_load = null;
};
bbop.core.extend(bbop.golr.manager.preload, bbop.golr.manager);

/*
 * Function: load
 *
 * Parameters: 
 *  thing - what to send to the callbacks
 *
 * Returns:
 *  n/a
 */
bbop.golr.manager.preload.prototype.load = function(thing){
    this._bgm_load = thing;    
};

/*
 * Function: update
 *
 *  See the documentation in <golr_manager.js> on update to get more
 *  of the story. This override function adds a trigger that can be
 *  preloaded with results. Really only for testing.
 *
 * Parameters: 
 *  callback_type - callback type string
 *  rows - *[serially optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.preload.prototype.update = function(callback_type,
						      rows, start){
    // Get "parents" url first.
    var parent_update = bbop.golr.manager.prototype.update;
    var qurl = parent_update.call(this, callback_type, rows, start);

    // 
    var logger = new bbop.logger(this._is_a);
    //this._logger = new bbop.logger(this._is_a);
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var json_data = this._bgm_load;    
    if( bbop.core.is_defined(json_data) ){
	var response = new bbop.golr.response(json_data);
	this.apply_callbacks(callback_type, [response, this]);
    }else{
	this.apply_callbacks('error', ['unparsable json data', this]);
    }

    return qurl;
};
/* 
 * Package: jquery.js
 * 
 * Namespace: bbop.golr.manager.jquery
 * 
 * jQuery BBOP manager for dealing with actual ajax calls. Remember,
 * this is actually a "subclass" of <bbop.golr.manager>.
 * 
 * This should still be able to limp along (no ajax and no error
 * parsing) even outside of a jQuery environment.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }
if ( typeof bbop.golr.manager == "undefined" ){ bbop.golr.manager = {}; }

/*
 * Constructor: jquery
 * 
 * Contructor for the GOlr query manager
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.golr.manager>
 */
bbop.golr.manager.jquery = function (golr_loc, golr_conf_obj){
    bbop.golr.manager.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.golr.manager.jquery';
    
    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger helper.
    function ll(str){ anchor._logger.kvetch(str); }

    // Before anything else, if we cannot find a viable jQuery library
    // for use, we're going to create a fake one so we can still test
    // and work in a non-browser/networked environment.
    anchor.JQ = new bbop.golr.faux_ajax();
    try{ // some interpreters might not like this kind of probing
    	if( typeof(jQuery) !== 'undefined' ){
    	    //JQ = jQuery;
    	    anchor.JQ = jQuery.noConflict();
    	}
    }catch (x){
    }finally{
    	var got = bbop.core.what_is(anchor.JQ);
    	if( got && got == 'bbop.golr.faux_ajax'){
    	}else{
    	    got = 'jQuery';
    	}
    	ll('Using ' + got + ' for Ajax calls.');
    }

    // The base jQuery Ajax args we need with the setup we have.
    anchor.jq_vars = {
	//url: qurl,
	type: "GET",
	dataType: 'jsonp',
	jsonp: 'json.wrf'
    };

    // We'll override the original with something that actually speaks
    // jQuery. This is the function that runs where there is an AJAX
    // error during an update. First it has to run some template code,
    // then it does all of the callbacks.
    this._run_error_callbacks = function(result, status, error) {

    	ll('Failed server request: '+ result +', '+ status +', '+ error);
    	//ll('Failed (a): '+ bbop.core.what_is(status));
    	//ll('Failed (b): '+ bbop.core.dump(status));
		
    	var clean_error = "unknown error";

    	// Get the error out (clean it) if possible.
    	var jreq = result.responseText;
    	var req = anchor.JQ.parseJSON(jreq); // TODO/BUG: this must be removed
    	if( req && req['errors'] && req['errors'].length > 0 ){
    	    var in_error = req['errors'][0];
    	    ll('ERROR:' + in_error);
    	    // Split on newline if possible to get
    	    // at the nice part before the perl
    	    // error.
    	    var reg = new RegExp("\n+", "g");
    	    var clean_error_split =
    		in_error.split(reg);
    	    clean_error = clean_error_split[0];
    	}else if( bbop.core.what_is(error) == 'string' &&
    		  error.length > 0){
    	    clean_error = error;
    	}else if( bbop.core.what_is(status) == 'string' &&
    		  status.length > 0){
    	    clean_error = status;
    	}
	
    	// Run all against registered functions.
    	ll('run error callbacks...');
    	anchor.apply_callbacks('error', [clean_error, anchor]);
    };

    // Try and decide between a reset callback and a search callback.
    // This is useful since jQuery doesn't have a natural way to do
    // that within the callbacks.
    this._callback_type_decider = function(json_data){
    	ll('in callback type decider...');

	var response = new bbop.golr.response(json_data);

    	// 
    	if( ! response.success() ){
    	    throw new Error("Unsuccessful response from golr server!");
    	}else{
    	    var cb_type = response.callback_type();
    	    ll('okay response from server, will probe type...: ' + cb_type);
    	    if( cb_type == 'reset' ){
    		anchor._run_reset_callbacks(json_data);
    	    }else if( cb_type == 'search' ){
    		anchor._run_search_callbacks(json_data);
    	    }else{
    		throw new Error("Unknown callback type!");
    	    }
    	}
    };

    /*
     * Function: safety
     *
     * Getter/setter for the trigger safety.
     * 
     * If the safety is on, ajax events controlled by the manager will
     * not occur. The default if off (false).
     * 
     * Parameters: 
     *  safety_on_p - boolean
     *
     * Returns:
     *  boolean
     */
    this.safety = function(safety_on_p){
	if( bbop.core.is_defined(safety_on_p) ){
	    anchor._safety = safety_on_p;
	}
	return anchor._safety;
    };
};
bbop.core.extend(bbop.golr.manager.jquery, bbop.golr.manager);

/*
 * Function: update
 *
 *  See the documentation in <golr_manager.js> on update to get more
 *  of the story. This override function adds functionality for
 *  jQuery.
 * 
 * You can prevent the triggering of ajax with the <safety>
 * method.
 *
 * Parameters: 
 *  callback_type - callback type string
 *  rows - *[serially optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with the jQuery callback specific parameters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.jquery.prototype.update = function(callback_type,
						     rows, start){
    
    // Get "parents" url first.
    var parent_update = bbop.golr.manager.prototype.update;
    var qurl = parent_update.call(this, callback_type, rows, start);
    
    // Only actually trigger if the safety is off (default).
    if( ! this.safety() ){
	
	//ll('try: ' + qurl);
	//widgets.start_wait('Updating...');
	
	// Setup JSONP for Solr and jQuery ajax-specific parameters.
	this.jq_vars['success'] = this._callback_type_decider; // decide & run
	this.jq_vars['error'] = this._run_error_callbacks; // run error cbs
	//done: _callback_type_decider, // decide & run search or reset
	//fail: _run_error_callbacks, // run error callbacks
	//always: function(){} // do I need this?
	this.JQ.ajax(qurl, this.jq_vars);
    }
    
    return qurl;
};

/*
 * Function: run_batch
 *
 * A distant cousin of <update>.
 * Designed to "serially" get data from a server for
 * certain types of data crunching routines.
 * 
 * Why would you want this? Lets say there are ten distinct things
 * that you want from the server. Coordinating and collating them all
 * without annoying the server or going insane is hard in an
 * asynchronous environment.
 *
 * Parameters: 
 *  accumulator_func - the function that collects
 *  final_func - the function to run on completion
 *
 * Returns:
 *  the number of batch items run
 */
bbop.golr.manager.jquery.prototype.run_batch = function(accumulator_func,
							final_func){

    var anchor = this;

    // Set the various callbacks internally so we can get back at them
    // when we lose our stack during the ajax.
    if( accumulator_func ){ this._batch_accumulator_func = accumulator_func; }
    if( final_func ){ this._batch_final_func = final_func; }

    // Look at how many states are left.
    var qurl = anchor.next_batch_url();
    if( qurl ){
	    
	// Generate a custom callback function that will start
	// this process (next_generator) again--continue the cycle.
	var next_cycle = function(json_data){
	    var response = new bbop.golr.response(json_data);
	    anchor._batch_accumulator_func.apply(anchor, [response, anchor]);
	    anchor.run_batch();
	};
	
	// Put this custom callback on success.
	anchor.jq_vars['success'] = next_cycle;
	anchor.jq_vars['error'] = anchor._run_error_callbacks;
	anchor.JQ.ajax(qurl, anchor.jq_vars);
    }else{
	anchor._batch_final_func.apply(anchor);
    }
};

/*
 * Function: fetch
 *
 * A cousin of <update>, but is made to avoid all of the usual
 * callback functions (except error) and just run the single function
 * from the argument.
 * 
 * Why would you want this? Sometimes you need just a little data
 * without updating the whole interface or whatever.
 *
 * Parameters: 
 *  run_func - the function to run on completion
 *
 * Returns:
 *  n/a
 */
bbop.golr.manager.jquery.prototype.fetch = function(run_func){

    // ...
    var anchor = this;
    var qurl = anchor.get_query_url();
    anchor._run_func = run_func;
    anchor.jq_vars['success'] =
	function(json_data){
	    var response = new bbop.golr.response(json_data);
	    anchor._run_func(response);   
	};
    anchor.jq_vars['error'] = anchor._run_error_callbacks;
    anchor.JQ.ajax(qurl, anchor.jq_vars);
};

/*
 * Namespace: bbop.golr.faux_ajax
 *
 * Constructor: faux_ajax
 * 
 * Contructor for a fake and inactive Ajax. Used by bbop.golr.manager.jquery
 * in (testing) environments where jQuery is not available.
 * 
 * Returns:
 *  faux_ajax object
 */
bbop.golr.faux_ajax = function (){
    this._is_a = 'bbop.golr.faux_ajax';

    /*
     * Function: ajax
     *
     * Fake call to jQuery's ajax.
     *
     * Parameters: 
     *  args - whatever
     *
     * Returns:
     *  null
     */
    this.ajax = function(args){
	return null;
    };
    /*
     * Function: parseJSON
     *
     * Fake call to jQuery's parseJSON.
     *
     * Parameters: 
     *  args - whatever--they are ignored
     *
     * Returns:
     *  ""
     */
    this.parseJSON = function(args){
	return "";
    };
};
/* 
 * Package: rhino.js
 * 
 * Namespace: bbop.golr.manager.rhino
 * 
 * Rhino BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.golr.manager>.
 * 
 * This may be madness.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }
if ( typeof bbop.golr.manager == "undefined" ){ bbop.golr.manager = {}; }

/*
 * Constructor: rhino
 * 
 * Contructor for the GOlr query manager; Rhino-style.
 * 
 * Beware that this version is a synchronous call.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.golr.manager>
 */
bbop.golr.manager.rhino = function (golr_loc, golr_conf_obj){
    bbop.golr.manager.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.golr.manager.rhino';
};
bbop.core.extend(bbop.golr.manager.rhino, bbop.golr.manager);

/*
 * Function: update
 *
 *  See the documentation in <golr_manager.js> on update to get more
 *  of the story. This override function adds functionality to Rhino.
 *
 * Parameters: 
 *  callback_type - callback type string
 *  rows - *[serially optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with any Rhino specific paramteters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.rhino.prototype.update = function(callback_type,
						    rows, start){
    // Get "parents" url first.
    var parent_update = bbop.golr.manager.prototype.update;
    var qurl = parent_update.call(this, callback_type, rows, start);

    // 
    var logger = new bbop.logger(this._is_a);
    //this._logger = new bbop.logger(this._is_a);
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw = readUrl(qurl); // in Rhino
    var json_data = null;
    if( raw && raw != '' ){
	json_data = JSON.parse(raw);
	if( json_data ){
	    var response = new bbop.golr.response(json_data);
	    this.apply_callbacks(callback_type, [response, this]);
	}else{
	    this.apply_callbacks('error', ['unparsable data', this]);
	}
    }else{
	this.apply_callbacks('error', ['no data', this]);
    }

    return qurl;
};

/*
 * Function: fetch
 *
 * This is the synchronous data getter for Rhino--probably your best
 * bet right now for scripting.
 * 
 * Parameters:
 *  n/a 
 *
 * Returns:
 *  <bbop.golr.response> or null
 * 
 * Also see:
 *  <update>
 */
bbop.golr.manager.rhino.prototype.fetch = function(){
    
    var qurl = this.get_query_url();

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw = readUrl(qurl); // in Rhino
    var json_data = null;
    var retval = null;
    if( raw && raw != '' ){
	json_data = JSON.parse(raw);
	if( json_data ){
	    var response = new bbop.golr.response(json_data);
	    retval = response;
	}
    }

    return retval;
};

/* 
 * Package: ringo.js
 * 
 * Namespace: bbop.golr.manager.ringo
 * 
 * Ringo BBOP manager for dealing with remote GOlr calls. Remember,
 * this is actually a "subclass" of <bbop.golr.manager>.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }
if ( typeof bbop.golr.manager == "undefined" ){ bbop.golr.manager = {}; }

/*
 * Constructor: ringo
 * 
 * Contructor for the GOlr query manager; Ringo flavor. YMMV.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.golr.manager>
 */
bbop.golr.manager.ringo = function (golr_loc, golr_conf_obj){

    // We are a registry like this:
    bbop.golr.manager.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.golr.manager.ringo';

    // Grab the http client.
    this._http_client = require("ringo/httpclient");
};
bbop.core.extend(bbop.golr.manager.ringo, bbop.golr.manager);

/*
 * Function: update
 *
 *  See the documentation in <golr_manager.js> on update to get more
 *  of the story. This override function adds functionality to Ringo.
 *
 * Parameters: 
 *  callback_type - callback type string
 *  rows - *[serially optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with any Ringo specific paramteters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.ringo.prototype.update = function(callback_type,
						    rows, start){
    // Get "parents" url first.
    var parent_update = bbop.golr.manager.prototype.update;
    var qurl = parent_update.call(this, callback_type, rows, start);

    // // 
    // var logger = new bbop.logger(this._is_a);
    // //this._logger = new bbop.logger(this._is_a);
    // logger.DEBUG = true;
    // function ll(str){ logger.kvetch(str); }

    var anchor = this;
    
    // Grab the data from the server and pick the right callback group
    // accordingly.
    anchor._callbacker = function(data, status, contentType, exchange){

	// 
	var raw_str = exchange.content;
	var json_data = null;
	if( raw_str && raw_str != '' ){
	    json_data = JSON.parse(raw_str);
	    if( json_data ){
		var response = new bbop.golr.response(json_data);
		anchor.apply_callbacks(callback_type, [response, this]);
	    }else{
		this.apply_callbacks('error', ['unparsable data', this]);
	    }
	}else{
	    this.apply_callbacks('error', ['no data', this]);
	}
    };
    var exchange = this._http_client.get(qurl, null, anchor._callbacker);
    
    return qurl;
};
/* 
 * Package: nodejs.js
 * 
 * Namespace: bbop.golr.manager.nodejs
 * 
 * NodeJS BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.golr.manager>.
 * 
 * This may be madness.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }
if ( typeof bbop.golr.manager == "undefined" ){ bbop.golr.manager = {}; }

/*
 * Constructor: nodejs
 * 
 * Contructor for the GOlr query manager; NodeJS flavor. YMMV.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.golr.manager>
 */
bbop.golr.manager.nodejs = function (golr_loc, golr_conf_obj){
//function GOlrManager(in_args){
    // We are a registry like this:
    bbop.golr.manager.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.golr.manager.nodejs';

    // Get a good self-reference point.
    //var anchor = this;

    // Per-manager logger.
    //this._ll = ll;

    // //
    // ll('Alive.');

};
bbop.core.extend(bbop.golr.manager.nodejs, bbop.golr.manager);

/*
 * Function: update
 *
 *  See the documentation in <golr_manager.js> on update to get more
 *  of the story. This override function adds functionality to NodeJS.
 *
 * Parameters: 
 *  callback_type - callback type string
 *  rows - *[serially optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with any NodeJS specific paramteters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.nodejs.prototype.update = function(callback_type,
						     rows, start){
    // Get "parents" url first.
    var parent_update = bbop.golr.manager.prototype.update;
    var qurl = parent_update.call(this, callback_type, rows, start);

    // 
    var logger = new bbop.logger(this._is_a);
    //this._logger = new bbop.logger(this._is_a);
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    var anchor = this;
    this.last = null;
    
    //
    function on_error(e) {
	console.log('problem with request: ' + e.message);
    }
    function on_connect(res){
	//console.log('STATUS: ' + res.statusCode);
	//console.log('HEADERS: ' + JSON.stringify(res.headers));
	res.setEncoding('utf8');
	var raw_data = '';
	res.on('data', function (chunk) {
		   //console.log('BODY: ' + chunk);
		   raw_data = raw_data + chunk;
	       });
	// Parse JS and call callback_type callbacks.
	res.on('end', function () {
		   var json_data = JSON.parse(raw_data);
		   anchor.last = json_data;
		   var response = new bbop.golr.response(json_data);
		   anchor.apply_callbacks(callback_type, [response, anchor]);
	       });
    }
    //debugger;
    // WARNING: This should actually be passed in by the context.
    var http = require('http');
    var req = http.request(qurl, on_connect);
    req.on('error', on_error);
    
    // write data to request body
    //req.write('data\n');
    //req.write('data\n');
    req.end();
    
    return qurl;
};
/*
 * Package: clickable_object.js
 * 
 * Namespace: bbop.widget.display.clickable_object
 * 
 * BBOP object to produce a clickable image or a clickable text span,
 * both producing something that can give its id for later clickable
 * actions.
 * 
 * This is a method, not a constructor.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Method: clickable_object
 * 
 * Generator for a clickable object.
 * 
 * TODO: May eventually expand it to include making a jQuery button.
 * 
 * Arguments:
 *  label - *[optional]* the text to use for the span or label (defaults to '')
 *  source - *[optional]* the URL source of the image (defaults to '')
 *  id - *[optional]* the id for the object (defaults to generate_id: true)
 * 
 * Returns:
 *  bbop.html.span or bbop.html.image
 */
bbop.widget.display.clickable_object = function(label, source, id){
    //this._is_a = 'bbop.widget.display.clickable_object';
    //var anchor = this;
    // // Per-UI logger.
    // var logger = new bbop.logger();
    // logger.DEBUG = true;
    // function ll(str){ logger.kvetch('W (clickable_object): ' + str); }

    // Default args.
    if( ! label ){ label = ''; }
    if( ! source ){ source = ''; }

    // Decide whether we'll use an incoming id or generate our own.
    var args = {};
    if( id ){
	args['id'] = id;
    }else{
	args['generate_id'] = true;
    }

    // Figure out an icon or a label.
    var obj = null;
    if( source == '' ){
	obj = new bbop.html.span(label, args);
    }else{
	args['src'] = source;
	args['title'] = label;
	obj = new bbop.html.image(args);
    }

    return obj;
};
/*
 * Package: text_buttom_sim.js
 * 
 * Namespace: bbop.widget.display.text_button_sim
 * 
 * BBOP object to produce a clickable text span, that in conjunction with the local CSS, should make an awfully button looking creature.
 * 
 * It uses the class: "bbop-js-text-button-sim".
 * 
 * Note: this is a method, not a constructor.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Method: text_button_sim
 * 
 * Generator for a text span for use for buttons.
 * 
 * Arguments:
 *  label - *[optional]* the text to use for the span or (defaults to 'X')
 *  title - *[optional]* the hover text (defaults to 'X')
 *  id - *[optional]* the id for the object (defaults to generate_id: true)
 *  add_attrs - *[optional]* more attributes to be folded in to the span as hash
 * 
 * Returns:
 *  bbop.html.span
 */
bbop.widget.display.text_button_sim = function(label, title, id, add_attrs){
    
    // Default args.
    if( ! label ){ label = 'X'; }
    if( ! title ){ title = 'X'; }
    if( ! add_attrs ){ add_attrs = {}; }
    
    // Decide whether we'll use an incoming id or generate our own.
    var args = {
	'class': "bbop-js-text-button-sim",
	'title': title
    };
    if( id ){
	args['id'] = id;
    }else{
	args['generate_id'] = true;
    }

    // Addtional optional atrributes and overrides.    
    args = bbop.core.merge(args, add_attrs);

    var obj = new bbop.html.span(label, args);    
    return obj;
};
/*
 * Package: button_templates.js
 * 
 * Namespace: bbop.widget.display.button_templates
 * 
 * Template generators for various button "templates" that can be fed
 * into the <search_pane> widget.
 * 
 * These templates foten have functions that manipulate the
 * environment outside, such as window.*, etc. Be aware and look at
 * the code carefully--there is a reason they're in the
 * widgets/display area.
 * 
 * Note: this is a collection of methods, not a constructor/object.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }
if ( typeof bbop.widget.display.button_templates == "undefined" ){ bbop.widget.display.button_templates = {}; }

/*
 * Method: field_download
 * 
 * Generate the template for a simple download button.
 * 
 * Arguments:
 *  label - the text to use for the hover
 *  count - the number of items to download
 *  fields - the field to download
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.field_download = function(label,
							       count,
							       fields){
    var dl_props = {
	'entity_list': null,
	'rows': count
    };
    var field_download_button =
	{
	    label: label,
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-document',
	    click_function_generator: function(manager){
		return function(event){
		    var dialog_props = {
			title: 'Download',
			buttons: {
			    'Download': function(){
				//alert('download');
				dl_props['entity_list'] =
				    manager.get_selected_items();
				var raw_gdl =
				    manager.get_download_url(fields, dl_props);
				window.open(raw_gdl, '_blank');
				//jQuery(this).dialog('destroy');
    				jQuery(this).remove();
			    },
			    'Cancel': function(){
				//jQuery(this).dialog('destroy');
    				jQuery(this).remove();
			    }
			}
		    };
		    new bbop.widget.dialog('<h4>Download (up to ' + count + ')</h4><p>You may download up to ' + count + ' lines in a new window. If your request is large or if the the server busy, this may take a while to complete--please be patient.</p>',
					   dialog_props);
		    //window.open(raw_gdl, '_blank');
		};
	    }
	};
    return field_download_button;
};

/*
 * Method: restmark
 * 
 * Generate the template for a simple bookmark button with pop-up.
 * 
 * Arguments:
 *  linker - the linker to be used for this bookmarking
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.restmark = function(linker){
    
    var bookmark_button =
	{
	    label: 'Show URL/bookmark',
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-link',
	    click_function_generator: function(manager){
		return function(event){
		    //alert('GAF download: ' + manager.get_query_url());
		    //alert('URL: ' + manager.get_query_url());
		    var raw_restmark = manager.get_filter_query_string();
		    // var a_args = {
		    // 	// Since we're using the whole URI as a
		    // 	// parameter, we use the heavy hitter on top
		    // 	// of the already encoded URI.
		    // 	id: encodeURIComponent(raw_bookmark),
		    // 	label: 'this search'
		    // };
		    //  linker.anchor(a_args, 'search', curr_personality)

		    var restmark_anchor =
			'<a href="?' + raw_restmark + '">this search</a>';

		    new bbop.widget.dialog('<p>Bookmark for: ' + restmark_anchor + '.</p><p>Please be aware that <strong>this bookmark does not save properties</strong> like currently selected items.</p><p>The AmiGO 2 bookmarking method may change in the future: at this point, <strong>it is intended as a temporary method</strong> (days, not weeks or months) of allowing the reruning of searches using a link.</p>',
					   {'title': 'Bookmark'});
		};
	    }
	};
    return bookmark_button;
};

/*
 * Method: bookmark
 * 
 * Generate the template for a simple bookmark (for search) button
 * with pop-up.
 * 
 * Arguments:
 *  linker - the linker to be used for this bookmarking
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.bookmark = function(linker){
    
    var bookmark_button =
	{
	    label: 'Show URL/bookmark',
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-link',
	    click_function_generator: function(manager){
		return function(event){
		    //alert('GAF download: ' + manager.get_query_url());
		    //alert('URL: ' + manager.get_query_url());
		    var raw_bookmark = manager.get_state_url();
		    var curr_personality = manager.get_personality();
		    var a_args = {
			// Since we're using the whole URI as a
			// parameter, we use the heavy hitter on top
			// of the already encoded URI.
			id: encodeURIComponent(raw_bookmark),
			label: 'this search'
		    };
		    
		    new bbop.widget.dialog('<p>Bookmark for: ' + linker.anchor(a_args, 'search', curr_personality) + '</p><p>Please be aware that <strong>this bookmark does not save properties</strong> like currently selected items.</p><p>The AmiGO 2 bookmarking method may change in the future: at this point, <strong>it is intended as a temporary method</strong> (days, not weeks or months) of allowing the reruning of searches using a link.</p>',
					   {'title': 'Bookmark'});
		};
	    }
	};
    return bookmark_button;
};

/*
 * Method: send_fields_to_galaxy
 * 
 * Generate the template for a button that sends fields to a Galaxy
 * instance.
 * 
 * Arguments:
 *  label - the text to use for the hover
 *  count - the number of items to download
 *  fields - the field to download
 *  galaxy - the url to the galaxy instance we're sending to
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.send_fields_to_galaxy = function(label,
								      count,
								      fields,
								      galaxy){
    var dl_props = {
	'entity_list': null,
	'rows': count
    };
    var galaxy_button =
	{
	    label: label,
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-mail-closed',
	    click_function_generator: function(manager){
		return function(event){
		    
		    // If we have something, construct a form
		    if( ! galaxy || galaxy == "" ){
			alert('Sorry: could not find a usable Galaxy.');
		    }else{
			// We have a galaxy, so let's try and kick out
			// to it. Cribbing form POST from Gannet.
			var bval = '1 field';
			if( fields && fields.length > 1 ){
			    bval = fields.length + ' fields';
			}
			var input_su =
			    new bbop.html.input({name: 'submit',
						 type: 'submit',
						 value: bval});
			var input_um =
			    new bbop.html.input({name: 'URL_method',
						 type: 'hidden',
						 value: 'get'});

			// See GAF download button for more info.
			dl_props['entity_list'] = manager.get_selected_items();
			var raw_gdl =
			    manager.get_download_url(fields, dl_props);
			var input_url =
			    new bbop.html.input({name: 'URL',
						 type: 'hidden',
						 value: raw_gdl});

			var form =
			    new bbop.html.tag('form',
					      {
						  id: 'galaxyform',
						  name: 'galaxyform',
						  method: 'POST',
						  target: '_blank',
						  action: galaxy
					      },
					      [input_su, input_um, input_url]
					     );
			
			// Finally, bang out what we've constructed in
			// a form.
			new bbop.widget.dialog('Export to Galaxy: ' +
					       form.to_string());
		    }
		};
	    }
	};

  return galaxy_button;
};

/*
 * Method: open_facet_matrix
 * 
 * Generate the template for a button that sends the user to the
 * facet_matrix page with the current manager state and two facets.
 * 
 * TODO: The facet_matrix link should be handled by the linker, not
 * manually using the app_base info.
 * 
 * Arguments:
 *  gconf - a copy of the <golr_conf> for the currrent setup
 *  instance_data - a copy of an amigo.data.server() for app_base info
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.open_facet_matrix = function(gconf,
								  instance_data){

    // Aliases.
    var loop = bbop.core.each;

    var facet_matrix_button =
	{
	    label: 'Use a matrix to compare document counts for two facets (limit 50 on each axis).',
	    diabled_p: false,
	    text_p: false,
	    //icon: 'ui-icon-caret-2-e-w',
	    icon: 'ui-icon-calculator',
	    click_function_generator: function(manager){
		return function(event){
		    
		    // 
		    var pers = manager.get_personality();
		    var class_conf = gconf.get_class(pers);
		    if( class_conf ){
			
			var filter_list = 
			    class_conf.field_order_by_weight('filter');

			// Get a list of all the facets that we can
			// compare.
			var facet_list_1 = [];
			loop(filter_list,
			     function(filter_id, findex){
				 var cf = class_conf.get_field(filter_id);
				 var cname = cf.display_name();
				 var cid = cf.id();
				 var pset = [cname, cid];

				 // Make sure the first one is
				 // checked.
				 if( findex == 0 ){ pset.push(true); }

				 facet_list_1.push(pset);
			     });
			// We need two though.
			var facet_list_2 = bbop.core.clone(facet_list_1);

			// Stub sender.
			var lss_args = {
			    title: 'Select facets to compare',
			    blurb: 'This dialog will launch you into a tool in another window where you can examine the document counts for two selected facets in a matrix (grid) view.',
			    list_of_lists: [facet_list_1, facet_list_2],
			    title_list: ['Facet 1', 'Facet 2'],
			    action: function(selected_args){
				var f1 = selected_args[0] || '';
				var f2 = selected_args[1] || '';
				var jmp_state = manager.get_state_url();
				var mngr = encodeURIComponent(jmp_state);
				var jump_url = instance_data.app_base() +
				    '/facet_matrix?'+
				    [
					'facet1=' + f1,
					'facet2=' + f2,
					'manager=' + mngr
				    ].join('&');
				window.open(jump_url, '_blank');
			    }};
			new bbop.widget.list_select_shield(lss_args);
		    }
		};
	    }
	};
    return facet_matrix_button;
};

/*
 * Method: flexible_download
 * 
 * Generate the template for a button that gives the user a DnD and
 * reorderable selector for how they want their tab-delimited
 * downloads.
 * 
 * Arguments:
 *  label - the text to use for the hover
 *  count - the number of items to be downloadable
 *  start_fields - ordered list of the initially selected fields 
 *  personality - the personality (id) that we want to work with
 *  gconf - a copy of the <golr_conf> for the currrent setup
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.flexible_download = function(label, count,
								  start_fields,
								  personality,
								  gconf){

    var dl_props = {
	'entity_list': null,
	'rows': count
    };

    // Aliases.
    var loop = bbop.core.each;
    var hashify = bbop.core.hashify;

    var flexible_download_button =
	{
	    label: label,
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-circle-arrow-s',
	    click_function_generator: function(manager){

		return function(event){
		    
		    var class_conf = gconf.get_class(personality);
		    if( class_conf ){
			
			// First, a hash of our default items so we
			// can check against them later to remove
			// those items from the selectable pool.
			// Then convert the list into a more
			// interesting data type.
			var start_hash = hashify(start_fields);
			var start_list = [];
			loop(start_fields,
			     function(field_id, field_index){
				 var cf = class_conf.get_field(field_id);
				 var cname = cf.display_name();
				 var cid = cf.id();
				 var pset = [cname, cid];
				 start_list.push(pset);
			     });

			// Then get an ordered list of all the
			// different values we want to show in
			// the pool list.
			var pool_list = [];
			var all_fields = class_conf.get_fields();
			loop(all_fields,
			     function(field, field_index){
				 var field_id = field.id();
				 if( start_hash[field_id] ){
				     // Skip if already in start list.
				 }else{
				     var cname = field.display_name();
				     var cid = field.id();
				     var pset = [cname, cid];
				     pool_list.push(pset);
				 }
			     });

			// To alphabetical.
			pool_list.sort(function(a, b){
					   var av = a[0];
					   var bv = b[0];
					   var val = 0;
					   if( av < bv ){
					       return -1;
					   }else if( av > bv){
					       return 1;
					   }
					   return val;
				       });

			// Stub sender.
			var dss_args = {
			    title: 'Select the fields to download (up to ' + count + ')',
			    blurb: '<p><strong>Drag and drop</strong> the desired fields <strong>from the left</strong> column (available pool) <strong>to the right</strong> (selected fields). You may also reorder them.</p><p>Download up to ' + count + ' lines in a new window by clicking <strong>Download</strong>. If your request is large or if the the server busy, this may take a while to complete--please be patient.</p>',
			    //blurb: 'By clicking "Download" at the bottom, you may download up to ' + count + ' lines in your browser in a new window. If your request is large or if the the server busy, this may take a while to complete--please be patient.',
			    pool_list: pool_list,
			    selected_list: start_list,
			    action_label: 'Download',
			    action: function(selected_items){
			    	dl_props['entity_list'] =
			    	    manager.get_selected_items();
			    	var raw_gdl =
			    	    manager.get_download_url(selected_items,
			    				     dl_props);
			    	window.open(raw_gdl, '_blank');
			    }};
			new bbop.widget.drop_select_shield(dss_args);
		    }
		};
	    }
	};
    return flexible_download_button;
};
/*
 * Package: results_table_by_class_conf.js
 * 
 * Namespace: bbop.widget.display.results_table_by_class_conf
 * 
 * Subclass of <bbop.html.tag>.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Function: results_table_by_class_conf
 *
 * Using a conf class and a set of data, automatically populate and
 * return a results table.
 *  
 * Parameters:
 *  class_conf - a <bbop.golr.conf_class>
 *  golr_resp - a <bbop.golr.response>
 *  linker - a linker object; see <amigo.linker> for more details
 *  handler - a handler object; see <amigo.handler> for more details
 *  elt_id - the element id to attach it to
 *  selectable_p - *[optional]* whether to create checkboxes (default true)
 *
 * Returns:
 *  <bbop.html.table> filled with results
 */
bbop.widget.display.results_table_by_class = function(cclass,
						      golr_resp,
						      linker,
						      handler,
						      elt_id,
						      selectable_p){
    //bbop.html.tag.call(this, 'div');
    //var amigo = new bbop.amigo();

    // Temp logger.
    var logger = new bbop.logger();
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch('RTBCC: ' + str); }

    // Conveience aliases.
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    // The context we'll deliver to
    var display_context = 'bbop.widgets.search_pane';

    // Only want to compile once.
    var ea_regexp = new RegExp("\<\/a\>", "i"); // detect an <a>
    var br_regexp = new RegExp("\<br\ \/\>", "i"); // detect a <br />

    // Sort out whether we want to display checkboxes. Also, give life
    // to the necessary variables if they will be called upon.
    var add_selectable_p = false;
    var select_column_id = null;
    var select_item_name = null;
    if( is_defined(selectable_p) && selectable_p == true ){
	add_selectable_p = true;

	// Special id and names for optional select column.
	var local_mangle = bbop.core.uuid();
	select_column_id = 'rtbcc_select_' + local_mangle;
	select_item_name = 'rtbcc_select_name_' + local_mangle;
    }

    /*
     * Function: item_name
     *
     * Return a string of the name attribute used by the checkboxes if
     * we selected for checkboxes to be displayed.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  string or null if displaying checkboxes was false
     */
    this.item_name = function(){	
	return select_item_name;
    };

    /*
     * Function: toggle_id
     *
     * Return a string of the id of the checkbox in the header if we
     * selected for checkboxes to be displayed.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  string or null if displaying checkboxes was false
     */
    this.toggle_id = function(){	
	return select_column_id;
    };

    // Now take what we have, and wrap around some expansion code
    // if it looks like it is too long.
    var trim_hash = {};
    var trimit = 100;
    function _trim_and_store( in_str ){

	var retval = in_str;

	//ll("T&S: " + in_str);

	// Skip if it is too short.
	//if( ! ea_regexp.test(retval) && retval.length > (trimit + 50) ){
	if( retval.length > (trimit + 50) ){
	    //ll("T&S: too long: " + retval);

	    // Let there be tests.
	    var list_p = br_regexp.test(retval);
	    var anchors_p = ea_regexp.test(retval);

	    var tease = null;
	    if( ! anchors_p && ! list_p ){
		// A normal string then...trim it!
		//ll("\tT&S: easy normal text, go nuts!");
		tease = new bbop.html.span(bbop.core.crop(retval, trimit, ''),
					   {'generate_id': true});
	    }else if( anchors_p && ! list_p ){
		// It looks like it is a link without a break, so not
		// a list. We cannot trim this safely.
		//ll("\tT&S: single link so cannot work on!");
	    }else{
		//ll("\tT&S: we have a list to deal with");
		
		var new_str_list = retval.split(br_regexp);
		if( new_str_list.length <= 3 ){
		    // Let's just ignore lists that are only three
		    // items.
		    //ll("\tT&S: pass thru list length <= 3");
		}else{
		    //ll("\tT&S: contruct into 2 plus tag");
		    var new_str = '';
		    new_str = new_str + new_str_list.shift();
		    new_str = new_str + '<br />';
		    new_str = new_str + new_str_list.shift();
		    tease = new bbop.html.span(new_str, {'generate_id': true});
		}
	    }

	    // If we have a tease, assemble the rest of the packet
	    // to create the UI.
	    if( tease ){
		//ll("T&S: tease: " + tease.to_string());
		
		// Setup the text for tease and full versions.
		// var more_b = new bbop.html.span('<b>[more...]</b>',
		// 				{'generate_id': true});
		// var full = new bbop.html.span(retval,
		// 			      {'generate_id': true});
		// var less_b = new bbop.html.span('<b>[less]</b>',
		// 				{'generate_id': true});
		var bgen = bbop.widget.display.text_button_sim;
		var more_b = new bgen('more...', 'Display the complete list');
		var full = new bbop.html.span(retval,
					      {'generate_id': true});
		var less_b = new bgen('less', 'Display the truncated list');
		
		// Store the different parts for later activation.
		var tease_id = tease.get_id();
		var more_b_id = more_b.get_id();
		var full_id = full.get_id();
		var less_b_id = less_b.get_id();
		trim_hash[tease_id] = 
		    [tease_id, more_b_id, full_id, less_b_id];
		
		// New final string.
		retval = tease.to_string() + " " +
		    more_b.to_string() + " " +
		    full.to_string() + " " +
		    less_b.to_string();
	    }
	}

	return retval;
    }

    // Create a locally mangled checkbox.
    function _create_select_box(val, id, name){
	if( ! is_defined(name) ){
	    name = select_item_name;	    
	}
	
	var input_attrs = {
	    'value': val,
	    'name': name,
	    'type': 'checkbox'
	};
	if( is_defined(id) ){
	    input_attrs['id'] = id;
	}
	var input = new bbop.html.input(input_attrs);
	return input;
    }

    ///
    /// Render the headers.
    ///

    // Start with score, and add the others by order of the class
    // results_weights field.
    // var headers = ['score'];
    // var headers_display = ['Score'];
    var headers = [];
    var headers_display = [];
    if( add_selectable_p ){
	// Hint for later.
	headers.push(select_column_id);

	// Header select for selecting all.
	var hinp = _create_select_box('', select_column_id, '');
	//headers_display.push('All ' + hinp.to_string());
	headers_display.push(hinp.to_string());
    }
    var results_order = cclass.field_order_by_weight('result');
    each(results_order,
	 function(fid){
	     // Store the raw headers/fid for future use.
	     headers.push(fid);
	     // Get the headers into a presentable state.
	     var field = cclass.get_field(fid);
	     if( ! field ){ throw new Error('conf error: not found:' + fid); }
	     //headers_display.push(field.display_name());
	     var fdname = field.display_name();
	     var fdesc = field.description() || '???';
	     var head_span_attrs = {
		 // TODO/NOTE: to make the tooltip work properly, since the
		 // table headers are being created each time,
		 // the tooltop initiator would have to be called after
		 // each pass...I don't know that I want to do that.
		 //'class': 'bbop-js-ui-hoverable bbop-js-ui-tooltip',
		 'class': 'bbop-js-ui-hoverable',
		 'title': fdesc
	     };
	     // More aggressive link version.
	     //var head_span = new bbop.html.anchor(fdname, head_span_attrs);
	     var head_span = new bbop.html.span(fdname, head_span_attrs);
	     headers_display.push(head_span.to_string());
	 });

    ///
    /// Render the documents.
    ///

    // Some of what we'll do for each field in each doc (see below).
    // var ext = cclass.searchable_extension();
    function _process_entry(fid, iid, doc){

	var retval = '';
	var did = doc['id'];

	// BUG/TODO: First see if the filed will be multi or not.
	// If not multi, follow the first path. If multi, break it
	// down and try again.

	// Get a label instead if we can.
	var ilabel = golr_resp.get_doc_label(did, fid, iid);
	if( ! ilabel ){
	    ilabel = iid;
	}

	// Extract highlighting if we can from whatever our "label"
	// was.
	var hl = golr_resp.get_doc_highlight(did, fid, ilabel);

	// See what kind of link we can create from what we got.
	var ilink = linker.anchor({id: iid, label: ilabel, hilite: hl}, fid);
	
	ll('processing: ' + [fid, ilabel, iid].join(', '));
	//ll('ilink: ' + ilink);

	// See what we got, in order of how much we'd like to have it.
	if( ilink ){
	    retval = ilink;
	}else if( ilabel ){
	    retval = ilabel;
	}else{
	    retval = iid;
	}

	return retval;
    }

    // Cycle through and render each document.
    // For each doc, deal with it as best we can using a little
    // probing. Score is a special case as it is not an explicit
    // field.
    var table_buff = [];
    var docs = golr_resp.documents();
    each(docs,
	 function(doc){
	     
	     // Well, they had better be in here, so we're
	     // just gunna cycle through all the headers/fids.
	     var entry_buff = [];
	     each(headers,
		  function(fid){
		      // Detect out use of the special selectable
		      // column and add a special checkbox there.
		      if( fid == select_column_id ){
			  // Also
			  var did = doc['id'];
			  var dinp = _create_select_box(did);
			  entry_buff.push(dinp.to_string());
		      }else if( fid == 'score' ){
			  // Remember: score is also
			  // special--non-explicit--case.
			  var score = doc['score'] || 0.0;
			  score = bbop.core.to_string(100.0 * score);
			  entry_buff.push(bbop.core.crop(score, 4) + '%');
		      }else{
			  
			  // Not "score", so let's figure out what we
			  // can automatically.
			  var field = cclass.get_field(fid);
			  
			  // Make sure that something is there and
			  // that we can iterate over whatever it
			  // is.
			  var bits = [];
			  if( doc[fid] ){
			      if( field.is_multi() ){
				  //ll("Is multi: " + fid);
				  bits = doc[fid];
			      }else{
				  //ll("Is single: " + fid);
				  bits = [doc[fid]];
			      }
			  }
			  
			  // Render each of the bits.
			  var tmp_buff = [];
			  each(bits,
			       function(bit){
				   
				   // The major difference that we'll have here
				   // is between standard fields and special
				   // handler fields. If the handler
				   // resolves to null, fall back onto
				   // standard.
				   ll('! B:'+ bit +', F:'+ fid +
				      ', D:'+ display_context);
				   var out = handler.dispatch(bit, fid,
							      display_context);
				   if( is_defined(out) && out != null ){
				       // Handler success.
				       tmp_buff.push(out);
				   }else{
				       // Standard output.   
				       out = _process_entry(fid, bit, doc);
				       //ll('out: ' + out);
				       tmp_buff.push(out);
				   }
			       });
			  // Join it, trim/store it, push to to output.
			  var joined = tmp_buff.join('<br />');
			  entry_buff.push(_trim_and_store(joined));
		      }
		  });
	     table_buff.push(entry_buff);
	 });
	
    // Add the table to the DOM.
    var final_table =
	new bbop.html.table(headers_display, table_buff,
			    {'class': 'bbop-js-search-pane-results-table'});
    jQuery('#' + elt_id).append(bbop.core.to_string(final_table));
    
    // Add the roll-up/down events to the doc.
    each(trim_hash,
	 function(key, val){
	     var tease_id = val[0];
	     var more_b_id = val[1];
	     var full_id = val[2];
	     var less_b_id = val[3];
	     
	     // Initial state.
	     jQuery('#' + full_id ).hide();
	     jQuery('#' + less_b_id ).hide();
	     
	     // Click actions to go back and forth.
	     jQuery('#' + more_b_id ).click(
		 function(){
		     jQuery('#' + tease_id ).hide();
		     jQuery('#' + more_b_id ).hide();
		     jQuery('#' + full_id ).show('fast');
		     jQuery('#' + less_b_id ).show('fast');
		 });
	     jQuery('#' + less_b_id ).click(
		 function(){
		     jQuery('#' + full_id ).hide();
		     jQuery('#' + less_b_id ).hide();
		     jQuery('#' + tease_id ).show('fast');
		     jQuery('#' + more_b_id ).show('fast');
		 });
	 });

    //return final_table;
};
//bbop.widget.display.results_table_by_class.prototype = new bbop.html.tag;
/*
 * Package: two_column_layout.js
 * 
 * Namespace: bbop.widget.display.two_column_layout
 * 
 * Reusable object to create a two-column layout.
 * 
 * Subclass of <bbop.html.tag>.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Constructor: two_column_layout
 *
 * Produce a div containing a CSS hardwired two-column layout.
 * These are currently hardwired to:
 * 
 * : 'class': 'twocol-leftcolumn', 'style': 'margin-top: -15px;'
 * : 'class': 'twocol-content', 'style': 'margin-left: 26em; margin-top: -15px;'
 * 
 * Parameters:
 *  col1 - the string or <bbop.html> object for the left column
 *  col2 - the string or <bbop.html> object for the right column
 *
 * Returns:
 *  <bbop.html.tag> subclass
 */
bbop.widget.display.two_column_layout = function (col1, col2){
    bbop.html.tag.call(this, 'div', {'class': 'twocol-wrapper'});

    // Left (control) side.
    this._two_column_stack_left =
	new bbop.html.tag('div',
			  {'class': 'twocol-leftcolumn',
			   'style': 'margin-top: -15px;'},
			  col1);
    this.add_to(this._two_column_stack_left);

    // Right (display) side.
    this._two_column_stack_right =
	new bbop.html.tag('div',
			  {'class': 'twocol-content',
			   'style': 'margin-left: 26em; margin-top: -15px;'},
			  col2);
    this.add_to(this._two_column_stack_right);
};
bbop.widget.display.two_column_layout.prototype = new bbop.html.tag;

/*
 * Package: filter_shield.js
 * 
 * Namespace: bbop.widget.display.filter_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing shield
 * to support very large filter selection in the live search/search
 * pane genre.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Constructor: filter_shield
 * 
 * Contructor for the bbop.widget.display.filter_shield object.
 * 
 * Support for <bbop.widget.search_pane> by way of
 * <bbop.widget.display.live_search>
 * 
 * Arguments:
 *  spinner_img_src - *[optional]* optional source of a spinner image to use
 *  wait_msg - *[optional]* the wait message to use; may be a string or bbop.html; defaults to "Waiting..."
 * 
 * Returns:
 *  self
 */
bbop.widget.display.filter_shield = function(spinner_img_src, wait_msg){

    this._is_a = 'bbop.widget.display.filter_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (filter_shield): ' + str); }

    // Determine wait_msg, if any.
    if( ! wait_msg ){
	wait_msg = 'Waiting...';
    }else{
	// pass it through
    }

    // Variables that we'll need to keep.
    var is_open_p = false;
    var parea = new bbop.html.tag('div', {'generate_id': true});
    var pmsg = new bbop.html.tag('div', {'generate_id': true}, wait_msg);
    parea.add_to(pmsg);

    var div = new bbop.html.tag('div', {'generate_id': true}, parea);
    var pmsg_id = pmsg.get_id();
    //var pbar_id = pbar.get_id();
    var div_id = div.get_id();
    var diargs = {
	modal: true,
	draggable: false,
	width: 800,
	height: 600,
	close:
	function(){
	    // TODO: Could maybe use .dialog('destroy') instead?
	    jQuery('#' + div_id).remove();
	}	    
    };

    /*
     * Function: start_wait
     * 
     * Render an unpopulated modal shield with some kind of waiting
     * element. This is to act as a block for the IO if
     * desired--calling this before .draw() is not required (as
     * .draw() will call it anyways if you haven't).
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.start_wait = function(){

	// Mark that we've finally opened it.
	is_open_p = true;

	// Append div to body.
	jQuery('body').append(div.to_string());	

	// If we have an image source specified, go ahead and add it to
	// the waiting display before popping it open.
	if( spinner_img_src && spinner_img_src != '' ){
	    var s = new bbop.widget.spinner(parea.get_id(), spinner_img_src);
	}

	// Pop open the dialog.
	var dia = jQuery('#' + div_id).dialog(diargs);
    };

    /*
     * Function: draw
     * 
     * Render a temporary modal filter shield.
     * 
     * Arguments:
     *  field_name - the name (id) of the filter field to display
     *  filter_list - a list of [[filter_id, filter_count], ...]
     *  manager - the manager that we'll use for the callbacks
     * 
     * Returns:
     *  n/a
     */
    this.draw = function(field_name, filter_list, manager){
	//ll(doc['id']);

	// Open the shield if it is not already open.
	if( ! is_open_p ){
	    anchor.open();
	}

	var txt = 'No filters...';
	var tbl = new bbop.html.table(null, null, {'generate_id': true});
	var button_hash = {};
	var each = bbop.core.each; // conveience
	var bgen = bbop.widget.display.text_button_sim;
	each(filter_list,
 	     function(field){
		 var fname = field[0];
		 var fcount = field[1];

		 var b_plus = new bgen('+', 'Add positive filter');
		 var b_minus = new bgen('-', 'Add negative filter');
		 button_hash[b_plus.get_id()] =
		     [field_name, fname, fcount, '+'];
		 button_hash[b_minus.get_id()] =
		     [field_name, fname, fcount, '-'];

		 tbl.add_to([fname, '(' + fcount + ')',
			     b_plus.to_string(),
			     b_minus.to_string()]);
	     });
	txt = tbl.to_string();

	// Create a filter slot div.
	
	// Add filter slot and table text to div.
	jQuery('#' + div_id).empty();
	var fdiv = new bbop.html.tag('div', {'generate_id': true});
	jQuery('#' + div_id).append(fdiv.to_string());	
	jQuery('#' + div_id).append(txt);

	// Apply the filter to the table.
	var ft = null;
	if( spinner_img_src && spinner_img_src != '' ){
	    ft = bbop.widget.filter_table(fdiv.get_id(), tbl.get_id(),
					  spinner_img_src, null);
	}else{
	    ft = bbop.widget.filter_table(fdiv.get_id(), tbl.get_id(), null);
	}

	// Okay, now introducing a function that we'll be using a
	// couple of times in our callbacks. Given a button id (from
	// a button hash) and the [field, filter, count, polarity]
	// values from the props, make a button-y thing an active
	// filter.
	function filter_select_live(button_id, create_time_button_props){
	    var in_polarity = create_time_button_props[3];

	    // Decide on the button graphical elements.
	    var b_ui_icon = 'ui-icon-plus';
	    if( in_polarity == '-' ){
		b_ui_icon = 'ui-icon-minus';
	    }
	    var b_ui_props = {
		icons: { primary: b_ui_icon},
		text: false
	    };

	    // Create the button and immediately add the event.
	    jQuery('#' + button_id).click(
		function(){
		    var tid = jQuery(this).attr('id');
		    var call_time_button_props = button_hash[tid];
		    var call_field = call_time_button_props[0];	 
		    var call_filter = call_time_button_props[1];
		    //var in_count = button_props[2];
		    var call_polarity = call_time_button_props[3];
		    
		    // Change manager, fire, and close the dialog.
		    manager.add_query_filter(call_field, call_filter,
			  		     [call_polarity]);
		    manager.search();
		    jQuery('#' + div_id).remove();
		});
	}

	// Now let's go back and add the buttons, styles,
	// events, etc. in the main accordion section.
	each(button_hash, filter_select_live);

    };

};
/*
 * Package: live_search.js
 * 
 * Namespace: bbop.widget.display.live_search
 * 
 * AmiGO object to draw various UI elements that have to do with things
 * dealing with a fully faceted searcher/browser.
 * 
 * It is probably not particularly useful directly, but rather used as
 * the framework for more specialized interfaces.
 * 
 * See Also:
 *  <search_pane.js>
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Constructor: live_search
 * 
 * Contructor for the bbop.widget.display.live_search object.
 * 
 * Arguments:
 *  interface_id - string id of the div to build on
 *  conf_class - <bbop.golr.conf_class> for hints and other settings
 * 
 * Returns:
 *  BBOP GOlr UI object
 */
bbop.widget.display.live_search = function(interface_id, conf_class){

    var anchor = this;
    var each = bbop.core.each;
    
    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = false;
    //logger.DEBUG = true;
    function ll(str){ logger.kvetch('UI (search): ' + str); }

    // There should be a string interface_id argument.
    // The class configuration we'll be using to hint and build.
    this.interface_id = interface_id;
    this.class_conf = conf_class;

    // Somebody will probably set these externally at some point.
    this.linker = new bbop.linker();
    this.handler = new bbop.handler();
   
    // We need strong control of the displayed buttons since we're
    // going to make them a dynamic (post-setup) resource.
    //this.button_definitions = button_defs;
    this.button_definitions = [];

    // Get the user interface hook and remove anything that was there.
    var ui_div_id = this.interface_id;
    jQuery('#' + ui_div_id).empty();

    // Mangle everything around this unique id so we don't collide
    // with other instances on the same page.
    var mangle = ui_div_id + '_ui_element_' + bbop.core.uuid() + '_';

    // Render a control section into HTML. This includes the accordion
    // and current filter sections.
    var ui_controls_section_id = mangle + 'ui-controls-wrapper';
    var controls_div = new bbop.html.tag('div', {'id': ui_controls_section_id});
    //jQuery('#' + ui_div_id).append(controls_div.to_string());

    // Render a results section into HTML. The includes the results
    // table and the results meta-info sections.
    var ui_results_section_id = mangle + 'ui-results-wrapper';
    var results_div = new bbop.html.tag('div', {'id': ui_results_section_id});
    //jQuery('#' + ui_div_id).append(results_div.to_string());

    // A dynamic handle (set when rendering results) of the select
    // column control id and item group name.
    var ui_results_selection_control_id = null;
    var ui_results_selection_item_name = null;
    var show_checkboxes_p = false;

    // Add the sections to a two column layout and add that into the
    // main ui div.
    var two_col_div =
	new bbop.widget.display.two_column_layout(controls_div, results_div);
    jQuery('#' + ui_div_id).append(two_col_div.to_string());

    // Main div id hooks to the easily changable areas of the two
    // column display.
    var ui_meta_div_id = mangle + 'meta-id';
    var ui_user_button_div_id = mangle + 'user-button-id';
    var ui_results_table_div_id = mangle + 'results-table-id';
    var ui_count_control_div_id = mangle + 'count_control-id';
    var ui_sticky_filters_div_id = mangle + 'sticky_filters-id';
    var ui_current_filters_div_id = mangle + 'current_filters-id';
    var ui_query_input_id = mangle + 'query-id';
    var ui_clear_query_span_id = mangle + 'clear-query-id';
    var ui_clear_user_filter_span_id = mangle + 'clear-user-filter-id';

    // Globally declared (or not) icons.
    var ui_spinner_search_source = '';
    var ui_spinner_shield_source = '';
    var ui_spinner_shield_message = null;
    var ui_icon_positive_label = '';
    var ui_icon_positive_source = '';
    var ui_icon_negative_label = '';
    var ui_icon_negative_source = '';
    var ui_icon_remove_label = '';
    var ui_icon_remove_source = '';

    // The spinner, if it exists, needs to be accessible by everybody
    // and safe to use.
    var spinner = null;
    function _spinner_gen(elt_id){
	var spinner_args = {
	    //timeout: 5,
	    //timeout: 500,
	    timeout: 10,
	    //classes: 'bbop-widget-search_pane-spinner',
	    visible_p: false
	};
	spinner = new bbop.widget.spinner(elt_id,
					  ui_spinner_search_source,
					  spinner_args);
    }
    function _spin_up(){
	if( spinner ){
	    spinner.start_wait();
	}
    }
    function _spin_down(){
	if( spinner ){
	    spinner.finish_wait();
	}
    }

    // Additional id hooks for easy callbacks. While these are not as
    // easily changable as the above, we use them often enough and
    // across functions to have a hook.
    var accordion_div_id = mangle + 'filter-accordion-id';
    
    // These pointers are used in multiple functions (e.g. both
    // *_setup and *_draw).
    var filter_accordion_widget = null;
    //var current_filters_div = null;

    /*
     * Function: show_checkboxes_p
     *
     * External function to show the item checkboxes in the use interface.
     * 
     * Parameters:
     *  new_setting - *[optional]* show or not; defaults to false
     *
     * Returns:
     *  true/false--the current state of showing the select boxes
     */
    this.show_checkboxes_p = function(new_setting){
	if( bbop.core.is_defined(new_setting) ){
	    if( new_setting ){
		show_checkboxes_p = true;
	    }else{
		show_checkboxes_p = false;		
	    }
	}

	return show_checkboxes_p;
    };

    /*
     * Function: set_linker
     *
     * Set the linker to be used when creating links.
     * If not set, a null function is used.
     * 
     * Parameters:
     *  linker - the linker function to be used
     *
     * Returns:
     *  true/false on whether it was properly set
     */
    this.set_linker = function(linker){

	var retval = false;

	if( bbop.core.is_defined(linker) ){
		anchor.linker = linker;
		retval = true;
	}

	return retval;
    };

    /*
     * Function: set_handler
     *
     * Set the handler to be used when dealing with displaying special fields.
     * If not set, a null function is used.
     * 
     * Parameters:
     *  handler - the handler function to be used
     *
     * Returns:
     *  true/false on whether it was properly set
     */
    this.set_handler = function(handler){

	var retval = false;

	if( bbop.core.is_defined(handler) ){
		anchor.handler = handler;
		retval = true;
	}

	return retval;
    };

    /*
     * Function: selected_name
     *
     * External function to show give the name of the input name group
     * for the selectable items in the checkboxes (if they are being
     * used). Null otherwise.
     * 
     * Keep in mind that this variable changes every times that the
     * results table refreshes.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  string or null
     */
    this.selected_name = function(){
	return ui_results_selection_item_name;
    };

    /*
     * Function: setup_query
     *
     * Setup the free text query display under contructed tags for
     * later population.
     * 
     * If no icon_clear_source is defined, icon_clear_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  label_str - *[optional]* string or bbop.html for input label
     *  icon_clear_label - *[optional]* string or bbop.html for clear icon
     *  icon_clear_source - *[optional]* string to define the src of img 
     *
     * Returns:
     *  n/a
     */
    this.setup_query = function(label_str, icon_clear_label, icon_clear_source){
	ll('setup_query for: ' + ui_query_input_id);

	// Some defaults.
	if( ! label_str ){ label_str = ''; }
	if( ! icon_clear_label ){ icon_clear_label = ''; }
	if( ! icon_clear_source ){ icon_clear_source = ''; }
	
	// The incoming label.
	var query_label_attrs = {
	    'class': 'bbop-js-search-pane-query-label'
	};
	var query_label_div =
	    new bbop.html.tag('div', query_label_attrs, label_str);

	// The text area.
	var ta_args = {
	    'id': ui_query_input_id,
	    'rows': '1',
	    'class': 'bbop-js-search-pane-textarea'
	};
	var query_area = new bbop.html.tag('textarea', ta_args);

	// Figure out an icon or a label.
	var clear_query_obj =
	    bbop.widget.display.clickable_object(icon_clear_label,
						 icon_clear_source,
						 ui_clear_query_span_id);
	// And a div to put it in.
	var clear_div_attrs = {
	    'class': 'bbop-js-search-pane-clear-button',
	    'generate_id': true
	};
	var clear_div =
	    new bbop.html.tag('div', clear_div_attrs, clear_query_obj);	

	// General container div.
	var gen_div_attrs = {
	    'generate_id': true
	};
	var gen_div = new bbop.html.tag('div', gen_div_attrs);

	// Add to display.
	query_label_div.add_to(clear_div.to_string());
	gen_div.add_to(query_label_div.to_string());
	gen_div.add_to(query_area.to_string());
	jQuery('#' + ui_controls_section_id).append(gen_div.to_string());
    };

    // /*
    //  * Function: setup_count_control
    //  *
    //  * Setup the results count control for later use. This is a kind
    //  * of semi-permanent structure like the accordion.
    //  * 
    //  * Parameters:
    //  *  n/a
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.setup_count_control = function(manager){
    // 	ll('setup_count_control for: ' + ui_query_input_id);
	
    // 	// Create inputs (the current order is important for proper
    // 	// for/id creation).
    // 	var cinputs = [];
    // 	each([10, 25, 50, 100],
    // 	     function(num, cindex){
    // 		 // Create and store the option.
    // 		 var sel_input_attrs = {
    // 		     'generate_id': true,
    // 		     'value': num
    // 		 };
    // 		 var sel_input =
    // 		     new bbop.html.tag('option', sel_input_attrs, num);
    // 		 var sel_input_id = sel_input.get_id();
    // 		 cinputs.push(sel_input);
    // 	     });
    // 	// Option container div.
    // 	var sel_attrs = {
    // 	    'id': ui_count_control_div_id
    // 	};
    // 	var sel = new bbop.html.tag('select', sel_attrs, cinputs);

    // 	// Create a text label.
    // 	var sel_label = new bbop.html.tag('label', {},
    // 					  'Results count&nbsp;&nbsp;');

    // 	// Container div.
    // 	var sel_div_attrs = {
    // 	    'generate_id': true,
    // 	    'class': 'bbop-js-search-pane-results-count'
    // 	};
    // 	var sel_div = new bbop.html.tag('div', sel_div_attrs);

    // 	// Assemble these elements into the UI.
    // 	sel_div.add_to(sel_label);
    // 	sel_div.add_to(sel);
    // 	jQuery('#' + ui_controls_section_id).append(sel_div.to_string());
    // };

    /*
     * Function: setup_sticky_filters
     *
     * Setup sticky filters display under contructed tags for later
     * population. The seeding information is coming in through the
     * GOlr conf class.
     * 
     * Add in the filter state up here.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  n/a
     */
    this.setup_sticky_filters = function(){
    
	ll('setup_sticky_filters UI for class configuration: ' +
	   this.class_conf.id());

	var sticky_filters_attrs = {
	    'id': ui_sticky_filters_div_id,
	    'class': 'bbop-js-search-pane-sticky-filters'
	};
	var sticky_filters_div =
	    new bbop.html.tag('div', sticky_filters_attrs,
			      "No applied sticky filters.");

	// Add the output to the page.
	var sticky_filters_str = sticky_filters_div.to_string();
	jQuery('#' + ui_controls_section_id).append(sticky_filters_str);
    };

    /*
     * Function: setup_current_filters
     *
     * Setup current filters display under contructed tags for later
     * population. The seeding information is coming in through the
     * GOlr conf class.
     * 
     * Add in the filter state up here.
     * 
     * If no icon_reset_source is defined, icon_reset_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  icon_remove_label - *[optional]* string or bbop.html for remove icon
     *  icon_remove_source - *[optional]* string to define the src of img 
     *
     * Returns:
     *  n/a
     */
    this.setup_current_filters = function(icon_remove_label,icon_remove_source){
	ll('setup_current_filters UI for class configuration: ' +
	   this.class_conf.id());

	// Set the class variables for use when we do the redraws.
	if( icon_remove_label ){ ui_icon_remove_label = icon_remove_label; }
	if( icon_remove_source ){ ui_icon_remove_source = icon_remove_source; }

	// Create the placeholder.
	var current_filters_div =
	    new bbop.html.tag('div', {'id': ui_current_filters_div_id},
			      "No applied user filters.");

	// Add the output to the page.
	var curr_filters_str = current_filters_div.to_string();
	jQuery('#' + ui_controls_section_id).append(curr_filters_str);
    };

    /*
     * Function: setup_accordion
     *
     * Setup the accordion skeleton under contructed tags for later
     * population. The seeding information is coming in through the
     * GOlr conf class.
     * Start building the accordion here. Not an updatable part.
     * 
     * If no icon_*_source is defined, icon_*_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  icon_positive_label - *[optional]* string or bbop.html for positive icon
     *  icon_positive_source - *[optional]* string to define the src of img 
     *  icon_negative_label - *[optional]* string or bbop.html for positive icon
     *  icon_negative_source - *[optional]* string to define the src of img 
     *  spinner_shield_source - *[optional]* string to define the src of img 
     *  spinner_shield_message - *[optional]* string or bbop.html for message 
     *
     * Returns: 
     *  n/a
     */
    this.setup_accordion = function(icon_positive_label, icon_positive_source,
				    icon_negative_label, icon_negative_source,
				    spinner_shield_source,
				    spinner_shield_message){
	
	ll('setup_accordion UI for class configuration: ' +
	   this.class_conf.id());

	// Set the class variables for use when we do the redraws.
	if( spinner_shield_source ){
	    ui_spinner_shield_source = spinner_shield_source; }
	if( spinner_shield_message ){
	    ui_spinner_shield_message = spinner_shield_message; }
	if( icon_positive_label ){
	    ui_icon_positive_label = icon_positive_label; }
	if( icon_positive_source ){
	    ui_icon_positive_source = icon_positive_source; }
	if( icon_negative_label ){
	    ui_icon_negative_label = icon_negative_label; }
	if( icon_negative_source ){
	    ui_icon_negative_source = icon_negative_source; }

	var filter_accordion_attrs = {
	    id: accordion_div_id
	};
	filter_accordion_widget = // heavy lifting by special widget
	    new bbop.html.accordion([], filter_accordion_attrs, true);

	// Add the sections with no contents as a skeleton to be
	// filled by draw_accordion.
	var field_list = this.class_conf.field_order_by_weight('filter');
	each(field_list,
	     function (in_field){
		 ll('saw field: ' + in_field);
		 var ifield = anchor.class_conf.get_field(in_field);
		 var in_attrs = {
		     id: in_field,
		     label: ifield.display_name(),
		     description: ifield.description()
		 };
		 filter_accordion_widget.add_to(in_attrs, '', true);
	     });
	
	// Add the output from the accordion to the page.
	var accordion_str = filter_accordion_widget.to_string();
	jQuery('#' + ui_controls_section_id).append(accordion_str);

	// Add the jQuery accordioning.
	var jqacc_attrs = {
	    clearStyle: true,
	    heightStyle: 'content',
	    collapsible: true,
	    active: false
	};
	jQuery("#" + accordion_div_id).accordion(jqacc_attrs);
    };

    /*
     * Function: setup_results
     *
     * Setup basic results table using the class conf. For actual
     * results rendering, see .draw_results. While there is a meta
     * block supplied, its use is optional.
     * 
     * Argument hash entries:
     *  meta - draw the meta-results; defaults to false
     *  spinner_source - the source of the image to use for the activity spinner
     * 
     * Parameters:
     *  hash; see above for details
     *
     * Returns:
     *  n/a
     */
    this.setup_results = function(args){

	ll('setup_results UI for class configuration: ' + this.class_conf.id());
	
	// Decide whether or not to add the meta div.
	var add_meta_p = false;
	if( args && args['meta'] && args['meta'] == true ){
	    add_meta_p = true;
	}
	// Get the spinner source and set it globally, if there is
	// one.
	var add_spinner_p = false;
	if( args && args['spinner_source'] && args['spinner_source'] != '' ){
	    ui_spinner_search_source = args['spinner_source'];
	    add_spinner_p = true;
	}

	// <div id="results_block" class="block">
	// <h2>Found entities</h2>
	// <div id="load_float"></div>
	// <div id="meta_results">
	// <div id="results_div">
	var block = new bbop.html.tag('div', {'class': 'block'});

	// Add header section.
	var hargs = {
	    generate_id: true,
	    'class': 'bbop-widget-search_pane-spinner-element'
	};
	//var header = new bbop.html.tag('h2', hargs, 'Found entities&nbsp;');
	var header = new bbop.html.tag('h4', hargs, 'Found entities&nbsp;');
	block.add_to(header);

	// If wanted, add meta to display queue.
	if( add_meta_p ){	    
	    var meta_attrs = {
		'id': ui_meta_div_id
	    };
	    var meta = new bbop.html.tag('div', meta_attrs);
	    block.add_to(meta);
	}

	// Add results section.
	var results = new bbop.html.tag('div', {'id': ui_results_table_div_id});
	block.add_to(results);

	jQuery('#' + ui_results_section_id).append(block.to_string());

	// If wanted, add initial render of meta.
	if( add_meta_p ){	    
	    ll('Add meta UI div');
	    jQuery('#' + ui_meta_div_id).empty();
	    var init_str = 'Performing initial search, please wait...';
	    jQuery('#' + ui_meta_div_id).append(init_str);

	    // Optionally, if we have defined the image source, add
	    // the image to the initial waiting.
	    if( ui_spinner_search_source && ui_spinner_search_source != '' ){
		var init_spin_str = '&nbsp;<img src="' +
		    ui_spinner_search_source + '" alt="[waiting]" ' +
		    'class="bbop-js-spinner"/>';
		jQuery('#' + ui_meta_div_id).append(init_spin_str);
	    }

	}

	// Now that the block is added, we can add the spinner to our
	// larger context. Safe access functions defined elsewhere.
	if( add_spinner_p ){
	    _spinner_gen(header.get_id());
	}
    };

    /*
     * Function: draw_user_buttons
     *
     * (Re)draw the user-defined buttons in the meta information area.
     * Will naturally fail if there is no meta div that has been
     * nested with the user button element.
     * 
     * Parameters:
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_user_buttons = function(manager){
	function _button_rollout(button_def_hash){
	    var default_hash =
    		{
		    label : 'n/a',
		    disabled_p : false,
		    text_p : false,
		    icon : 'ui-icon-help',
		    click_function_generator :
		    function(){
			return function(){
			    alert('No callback defined for this button--' +
				  'the generator may have been empty!');
			};
		    }
    		};
	    var folding_hash = button_def_hash || {};
	    var arg_hash = bbop.core.fold(default_hash, folding_hash);
	    
	    var label = arg_hash['label'];
	    var disabled_p = arg_hash['disabled_p'];
	    var text_p = arg_hash['text_p'];
	    var icon = arg_hash['icon'];
	    var click_function_generator =
		arg_hash['click_function_generator'];
	    
	    var b = new bbop.html.button(label, {'generate_id': true});
	    jQuery('#' + ui_user_button_div_id).append(b.to_string());
	    var b_props = {
		icons: { primary: icon},
		disabled: disabled_p,
		text: text_p
	    };
	    var click_fun = click_function_generator(manager);
	    jQuery('#' + b.get_id()).button(b_props).click(click_fun);
	}

	// Check that we're not about to do the impossible.
	if( ! jQuery('#' + ui_user_button_div_id) ){
	    alert('cannot refresh buttons without a place to draw them');
	}else{
	    jQuery('#' + ui_user_button_div_id).empty();
	    jQuery('#' + ui_user_button_div_id).empty();
	    bbop.core.each(anchor.button_definitions, _button_rollout);
	}
    };

    /*
     * Function: draw_meta
     *
     * Draw meta results. Includes selector for drop down.
     * 
     * (Re)draw the count control with the current information in the
     * manager. This also tries to set the selector to the response
     * number (to keep things in sync), unbinds any current "change"
     * event, and adds a new change event.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_meta = function(response, manager){
	
	ll('draw_meta for: ' + ui_meta_div_id);

	///
	/// Section 1: the numbers display.
	///

	// Collect numbers for display.
	var total_c = response.total_documents();
	var first_d = response.start_document();
	var last_d = response.end_document();

	// Draw meta; the current numbers and page--the same for
	// every type of return.
	jQuery('#' + ui_meta_div_id).empty();
	if( total_c == 0 ){
	    jQuery('#' + ui_meta_div_id).append('No results found.');
	}else{

	    // A div for the literal meta results and the count
	    // selector next to them.
	    var mdiv_attrs = {
	    };
	    var mdiv = new bbop.html.tag('div', mdiv_attrs);

	    // The literal return metadata.
	    var dmeta_attrs = {
		'class': 'bbop-js-search-pane-meta'
	    };
	    var dmeta = new bbop.html.tag('div', dmeta_attrs);
	    dmeta.add_to('Total: ' + total_c +
			 '; showing ' + first_d +
			 '-' + last_d);
	    mdiv.add_to(dmeta);

	    ///
	    /// Section 2: results count.
	    ///

	    // Create inputs (the current order is important for proper
	    // for/id creation).
	    var cinputs = [];
	    each([10, 25, 50, 100],
		 function(num, cindex){
		     // Create and store the option.
		     var sel_input_attrs = {
			 'generate_id': true,
			 'value': num
		     };
		     var sel_input =
			 new bbop.html.tag('option', sel_input_attrs, num);
		     var sel_input_id = sel_input.get_id();
		     cinputs.push(sel_input);
		 });
	    // Option container div.
	    var sel_attrs = {
		'id': ui_count_control_div_id
	    };
	    var sel = new bbop.html.tag('select', sel_attrs, cinputs);
	    
	    // Create a text label.
	    var sel_label_attrs = {
		// 'generate_id': true,
		// 'class': 'bbop-widget-search_pane-spinner-element'
	    };
	    var sel_label = new bbop.html.tag('label', sel_label_attrs,
					      'Results count&nbsp;&nbsp;');
	    
	    // Container div.
	    var sel_div_attrs = {
		'generate_id': true,
		'class': 'bbop-js-search-pane-results-count'
	    };
	    var sel_div = new bbop.html.tag('div', sel_div_attrs);
	    
	    // Assemble these elements into the UI.
	    sel_div.add_to(sel_label);
	    sel_div.add_to(sel);
	    mdiv.add_to(sel_div);

	    // Render out the last two sections.
	    jQuery('#' + ui_meta_div_id).append(mdiv.to_string());
	    
	    ///
	    /// Section 3: results count activity, setting.
	    ///

	    // First, unbind so we don't accidentally trigger with any
	    // changes and don't pile up event handlers.
	    jQuery('#' + ui_count_control_div_id).unbind('change');

	    // Next, pull out the number of rows requested.
	    var step = response.row_step();
	    
	    // Set the value to the number.
	    jQuery('#' + ui_count_control_div_id).val(step);
	    
	    // Finally, reactivate the event handler on the select.
	    jQuery('#' + ui_count_control_div_id).change(
		function(event, ui){
		    var sv = jQuery('#' + ui_count_control_div_id).val();
		    if( bbop.core.is_defined(sv) ){
			// Convert to a number.
			var si = parseInt(sv);
			
			// Set manager and to the search.
			manager.set_results_count(si);
			manager.search();
			// We are now searching--show it.
			_spin_up();
		    }
		});

	    ///
	    /// Section 4: the paging buttons.
	    ///
	    
	    var bdiv_attrs = {
		'generate_id': true
	    };
	    var bdiv = new bbop.html.tag('div', bdiv_attrs);
	    jQuery('#' + ui_meta_div_id).append(bdiv.to_string());
	    var bdiv_id = bdiv.get_id();

	    // Now add the raw buttons to the interface, and after this,
	    // activation and adding events.
	    var b_first = new bbop.html.button('First', {'generate_id': true});
	    //jQuery('#' + ui_meta_div_id).append(b_first.to_string());
	    jQuery('#' + bdiv_id).append(b_first.to_string());
	    var b_back = new bbop.html.button('Prev', {'generate_id': true});
	    //jQuery('#' + ui_meta_div_id).append(b_back.to_string());
	    jQuery('#' + bdiv_id).append(b_back.to_string());
	    var b_forward = new bbop.html.button('Next', {'generate_id': true});
	    //jQuery('#' + ui_meta_div_id).append(b_forward.to_string());
	    jQuery('#' + bdiv_id).append(b_forward.to_string());
	    var b_last = new bbop.html.button('Last', {'generate_id': true});
	    //jQuery('#' + ui_meta_div_id).append(b_last.to_string());
	    jQuery('#' + bdiv_id).append(b_last.to_string());

	    // Do the math about what buttons to activate.
	    var b_first_disabled_p = false;
	    var b_back_disabled_p = false;
	    var b_forward_disabled_p = false;
	    var b_last_disabled_p = false;
	    
	    // Only activate paging if it is necessary to the returns.
	    if( ! response.paging_p() ){
		b_first_disabled_p = true;
		b_back_disabled_p = true;
		b_forward_disabled_p = true;
		b_last_disabled_p = true;
	    }
	    
	    // Don't activate back on the first page.
	    if( ! response.paging_previous_p() ){
		b_first_disabled_p = true;
		b_back_disabled_p = true;
	    }
	    
	    // Don't activate next on the last page.
	    if( ! response.paging_next_p() ){
		b_forward_disabled_p = true;
		b_last_disabled_p = true;
	    }
	    
	    // First page button.
	    var b_first_props = {
		icons: { primary: "ui-icon-seek-first"},
		disabled: b_first_disabled_p,
		text: false
	    };
	    jQuery('#' + b_first.get_id()).button(b_first_props).click(
		function(){
		    // Cheat and trust reset by proxy to work.
		    manager.page_first(); 
		    // We are now searching--show it.
		    _spin_up();
		});
	    
	    // Previous page button.
	    var b_back_props = {
		icons: { primary: "ui-icon-seek-prev"},
		disabled: b_back_disabled_p,
		text: false
	    };
	    jQuery('#' + b_back.get_id()).button(b_back_props).click(
		function(){
		    manager.page_previous();
		    // We are now searching--show it.
		    _spin_up();
		});
	    
	    // Next page button.
	    var b_forward_props = {
		icons: { primary: "ui-icon-seek-next"},
		disabled: b_forward_disabled_p,
		text: false
	    };
	    jQuery('#' + b_forward.get_id()).button(b_forward_props).click(
		function(){
		    manager.page_next();
		    // We are now searching--show it.
		    _spin_up();
		});
	    
	    // Last page button.
	    var b_last_props = {
		icons: { primary: "ui-icon-seek-end"},
		disabled: b_last_disabled_p,
		text: false
	    };
	    jQuery('#' + b_last.get_id()).button(b_last_props).click(
		function(){
		    // A little trickier.
		    manager.page_last(total_c);
		    // We are now searching--show it.
		    _spin_up();
		});
	    
	    ///
	    /// Section 5: the button_definition buttons.
	    ///

	    // Spacer.	    
	    // jQuery('#' + ui_meta_div_id).append('&nbsp;&nbsp;&nbsp;' +
	    // 					'&nbsp;&nbsp;&nbsp;');
	    jQuery('#'+ bdiv_id).append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');

	    // (R)establish the user button div to the end of the meta
	    // retults.
	    var ubuttons = new bbop.html.tag('span',
					     {'id': ui_user_button_div_id});
	    //jQuery('#' + ui_meta_div_id).append(ubuttons.to_string());
	    jQuery('#' + bdiv_id).append(ubuttons.to_string());

	    // Add all of the defined buttons after the spacing.
	    anchor.draw_user_buttons(manager);
	}
    };

    // Detect whether or not a keyboard event is ignorable.
    function _ignorable_event(event){

	var retval = false;

	if( event ){
	    var kc = event.keyCode;
	    if( kc ){
		if( kc == 39 || // right
                    kc == 37 || // left
                    kc == 32 || // space
                    kc == 20 || // ctl?
                    kc == 17 || // ctl?
                    kc == 16 || // shift
                    //kc ==  8 || // delete
                    kc ==  0 ){ // super
			ll('ignorable key event: ' + kc);
			retval = true;
		    }
            }
	}
	return retval;
    }

    /*
     * Function: draw_query
     *
     * Draw the query widget. This function makes it active
     * as well.
     * 
     * Clicking the reset button will reset the query to ''.
     * 
     * NOTE: Since this is part of the "persistant" interface (i.e. it
     * does not get wiped after every call), we make sure to clear the
     * event listeners when we redraw the function to prevent them from
     * building up.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_query = function(response, manager){

    	ll('draw_query for: ' + ui_query_input_id);

	// Add a smartish listener.
	jQuery('#' + ui_query_input_id).unbind('keyup');
	jQuery('#' + ui_query_input_id).keyup(
	    function(event){

		// If we're left with a legitimate event, handle it.
		if( ! _ignorable_event(event) ){

		    // Can't ignore it anymore, so it goes into the
		    // manager for testing.
		    var tmp_q = manager.get_query();
		    var input_text = jQuery(this).val();
		    manager.set_query(input_text);

		    // If the manager feels like it's right, trigger.
		    if( manager.sensible_query_p() ){
			ll('keeping set query: ' + input_text);
			// Set the query to be more "usable" just
			// before triggering (so the tests can't be
			// confused by our switch).
			manager.set_comfy_query(input_text);
			manager.search();

			// We are now searching--show it.
			_spin_up();
		    }else{
			ll('rolling back query: ' + tmp_q);		    
			manager.set_query(tmp_q);
		    }
		}
	    });

	// Now reset the clear button and immediately set the event.
	jQuery('#' + ui_clear_query_span_id).unbind('click');
	jQuery('#' + ui_clear_query_span_id).click(
	    function(){
		manager.reset_query();
		//anchor.set_query_field(manager.get_query());
		anchor.set_query_field('');
		manager.search();
		// We are now searching--show it.
		_spin_up();
	    });
    };

    /*
     * Function: reset_query
     *
     * Simply reset the query and then redraw (rebind) the query.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     * 
     * See:
     *  <draw_query>
     */
    this.reset_query = function(response, manager){

    	ll('reset_query for: ' + ui_query_input_id);

	// Reset manager back to the default.
	manager.reset_query();

	anchor.draw_query(response, manager);
    };

    /*
     * Function: draw_sticky_filters
     *
     * (Re)draw the information on the sticky filter set.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_sticky_filters = function(response, manager){
    
	ll('draw_sticky_filters for: ' + ui_div_id);

	// Add in the actual HTML for the pinned filters and buttons.
	var sticky_query_filters = manager.get_sticky_query_filters();
	ll('sticky filters: ' + bbop.core.dump(sticky_query_filters));
	var fq_list_tbl =
	    new bbop.html.table(['', 'Your search is pinned to these filters'],
				[],
			       	{'class': 'bbop-js-search-pane-filter-table'});
	// [{'filter': A, 'value': B, 'negative_p': C, 'sticky_p': D}, ...]
	each(sticky_query_filters,
	     function(fset){

		 //
		 var sfield = fset['filter'];
		 var sfield_val = fset['value'];

		 // Boolean value to a character.
		 var polarity = fset['negative_p'];
		 var polstr = '+';
		 if( polarity ){ polstr = '-'; }

		 // Generate a button with a unique id.
		 var label_str = polstr + ' ' + sfield + ':' + sfield_val;
		 fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
				     sfield + ': ' + sfield_val]);
	     });
	
	// Either add to the display, or display the "empty" message.
	var sfid = '#' + ui_sticky_filters_div_id;
	jQuery(sfid).empty();
	if( sticky_query_filters.length == 0 ){
	    jQuery(sfid).append("No sticky filters.");
	}else{
	    // Attach to the DOM...
	    jQuery(sfid).append(fq_list_tbl.to_string());
	}
    };

    /*
     * Function: draw_current_filters
     *
     * (Re)draw the information on the current filter set.
     * This function makes them active as well.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_current_filters = function(response, manager){
    
	ll('draw_current_filters for: ' + ui_div_id);

	///
	/// Add in the actual HTML for the filters and buttons. While
	/// doing so, tie a unique id to the filter--we'll use that
	/// later on to add buttons and events to them.
	///

	// First, we need to make the filter clear button for the top
	// of the table.
	var b_cf =
	    new bbop.widget.display.text_button_sim('X', 
						    'Clear all user filters',
						    ui_clear_user_filter_span_id);

	var in_query_filters = response.query_filters();
	//var sticky_query_filters = manager.get_sticky_query_filters();
	ll('filters: ' + bbop.core.dump(in_query_filters));
	var fq_list_tbl =
	    new bbop.html.table(['', 'User filters', b_cf.to_string()],
				[],
			       	{'class': 'bbop-js-search-pane-filter-table'});
	var has_fq_p = false; // assume there are no filters to begin with
	var button_hash = {};
	each(in_query_filters,
	     function(field, field_vals){
		 each(field_vals,
		      function(field_val, polarity){

			  // Make note of stickiness, skip adding if sticky.
			  var qfp =
			      manager.get_query_filter_properties(field,
								  field_val);
			  if( ! qfp || qfp['sticky_p'] == false ){
			  
			      // Note the fact that we actually have a
			      // query filter to work with and display.
			      has_fq_p = true;

			      // Boolean value to a character.
			      var polstr = '-';
			      if( polarity ){ polstr = '+'; }

			      // Generate a button with a unique id.
			      var label_str = polstr+' '+ field +':'+field_val;

			      // Argh! Real jQuery buttons are way too slow!
			      // var b = new bbop.html.button('remove filter',
			      // 		  {'generate_id': true});

			      // Is the "button" a span or an image?
			      var b = bbop.widget.display.clickable_object(
				  ui_icon_remove_label,
				  ui_icon_remove_source,
				  null); // generate_id

			      // Tie the button it to the filter for
			      // jQuery and events attachment later on.
			      var bid = b.get_id();
			      button_hash[bid] = [polstr, field, field_val];
			  
			      //ll(label_str +' '+ bid);
			      //fq_list_tbl.add_to(label_str +' '+ b.to_string());
			      fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
						  field + ': ' + field_val,
						  b.to_string()]);
			      //label_str +' '+ b.to_string());
			  }
		      });
	     });

	// Either add to the display, or display the "empty" message.
	var cfid = '#' + ui_current_filters_div_id;
	jQuery(cfid).empty();
	if( ! has_fq_p ){
	    jQuery(cfid).append("No current user filters.");
	}else{

	    // With this, the buttons will be attached to the
	    // DOM...
	    jQuery(cfid).append(fq_list_tbl.to_string());
	    
	    // First, lets add the reset for all of the filters.
	    jQuery('#' + b_cf.get_id()).click(
		function(){
       		    manager.reset_query_filters();
       		    manager.search();
		    // We are now searching--show it.
		    _spin_up();
		}		
	    );

	    // Now let's go back and add the buttons, styles,
	    // events, etc. to the filters.
	    each(button_hash,
		 function(button_id){
		     var bid = button_id;

		     // // Get the button.
		     // var bprops = {
		     // 	 icons: { primary: "ui-icon-close"},
		     // 	 text: false
		     // };
		     // Create the button and immediately add the event.
		     //jQuery('#' + bid).button(bprops).click(
		     jQuery('#' + bid).click(
			 function(){
			     var tid = jQuery(this).attr('id');
			     var button_props = button_hash[tid];
			     var polstr = button_props[0];
			     var field = button_props[1];
			     var value = button_props[2];

			     // Change manager and fire.
			     // var lstr = polstr +' '+ field +' '+ value;
			     // alert(lstr);
			     // manager.remove_query_filter(field,value,
			     // 				 [polstr, '*']);
			     manager.remove_query_filter(field, value);
			     manager.search();
			     // We are now searching--show it.
			     _spin_up();
			 });
		 });
	}
    };

    /*
     * Function: draw_accordion
     *
     * (Re)draw the information in the accordion controls/filters.
     * This function makes them active as well.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_accordion = function(response, manager){
    
	ll('draw_accordion for: ' + ui_div_id);

	// Make sure that accordion has already been inited.
	if( typeof(filter_accordion_widget) == 'undefined' ){
	    throw new Error('Need to init accordion to use it.');
	}

	// We'll need this in a little bit for calculating when to
	// display the "more" option for the field filters.
	var real_facet_limit = manager.get_facet_limit();
	var curr_facet_limit = real_facet_limit -1; // the facets we'll show

	// We want this so we can filter out any facets that have the
	// same count as the current response total--these facets are
	// pretty much information free.
	var total_docs = response.total_documents();

	// A helper function for when no filters are
	// displayed.
	function _nothing_to_see_here(in_field){
	    var section_id = filter_accordion_widget.get_section_id(in_field);
	    jQuery('#' + section_id).empty();
	    jQuery('#' + section_id).append('Nothing to filter.');
	}

	// Hash where we collect our button information.
	// button_id -> [source, filter, count, polarity];
	var button_hash = {};

	// And a hash to store information to be able to generate the
	// complete filter shields.
	// span_id -> filter_id
	var overflow_hash = {};

	// Cycle through each facet field; all the items in each,
	// create the lists and buttons (while collectong data useful
	// in creating the callbacks) and put them into the accordion.
	each(response.facet_field_list(),
	     function(in_field){

		 var facet_bd = response.facet_field(in_field);
		 if( bbop.core.is_empty(facet_bd) ){
		     
		     // No filters means nothing in the box.
		     _nothing_to_see_here(in_field);

		 }else{
		     
		     // Create ul lists of the facet contents.
		     var tbl_id = mangle + 'filter-list-' + in_field;
		     var facet_list_tbl_attrs = {
			 id: tbl_id
		     };

		     var facet_list_tbl =
			 new bbop.html.table([], [], facet_list_tbl_attrs);
		     
		     ll("consider:" + in_field + ": " +
			response.facet_field(in_field).length);

		     // BUG/TODO:
		     // Count the number of redundant (not shown)
		     // facets so we can at least give a face to this
		     // bug/problem.
		     // Also filter out "empty filters".
		     var redundant_count = 0;
		     // Now go through and get filters and counts.
		     var good_count = 0; // only count when good
		     var overflow_p = false; // true when at 24 -> 25
		     each(response.facet_field(in_field),
			  function(ff_field, ff_index){

			      // Pull out info early so we can test it
			      // for information content.
			      var f_name = ff_field[0];
			      var f_count = ff_field[1];
			      
			      // ll(in_field + ": " + f_name + ": " +
			      // 	 [f_count,
			      // 	  total_docs,
			      // 	  ff_index,
			      // 	  good_count,
			      // 	  redundant_count,
			      // 	  real_facet_limit].join(', '));
			      			      
			      // TODO: The field is likely redundant
			      // (BUG: not always true in closures),
			      // so eliminate it.
			      if( f_count == total_docs ){
				  //ll("\tnothing here");
				  redundant_count++;
			      }else if( ! f_name || f_name == "" ){
				  // Straight out skip if it is an
				  // "empty" facet field.
			      }else if( ff_index < real_facet_limit -1 ){
				  //ll("\tgood row");
				  good_count++;

				  // Create buttons and store them for later
				  // activation with callbacks to
				  // the manager.
				  var b_plus =
				      bbop.widget.display.clickable_object(
					  ui_icon_positive_label,
					  ui_icon_positive_source,
					  null); // generate_id
				  var b_minus =
				      bbop.widget.display.clickable_object(
					  ui_icon_negative_label,
					  ui_icon_negative_source,
					  null); // generate_id
				  
				  // Store in hash for later keying to
				  // event.
				  button_hash[b_plus.get_id()] =
				      [in_field, f_name, f_count, '+'];
				  button_hash[b_minus.get_id()] =
				      [in_field, f_name, f_count, '-'];
				  
				  // // Add the label and buttons to the
				  // // appropriate ul list.
				  //facet_list_ul.add_to(
				  // fstr,b_plus.to_string(),
				  //   b_minus.to_string());
				  // Add the label and buttons to the table.
				  facet_list_tbl.add_to([f_name,
							 '('+ f_count+ ')',
							 b_plus.to_string(),
							 b_minus.to_string()
							]);
			      }
			
			      // This must be logically separated from
			      // the above since we still want to show
			      // more even if all of the top 25 are
			      // redundant.
			      if( ff_index == real_facet_limit -1 ){
				  // Add the more button if we get up to
				  // this many facet rows. This should
				  // only happen on the last possible
				  // iteration.
				  
				  overflow_p = true;
				  //ll( "\tadd [more]");
				  
				  // Since this is the overflow item,
				  // add a span that can be clicked on
				  // to get the full filter list.
				  //ll("Overflow for " + in_field);
				  var bgn = bbop.widget.display.text_button_sim;
				  var b_over =
				      new bgn('more...',
					      'Display the complete list');
				  facet_list_tbl.add_to([b_over.to_string(),
				  			 '', '']);
				  overflow_hash[b_over.get_id()] = in_field;
			      }
			  });

		     // There is a case when we have filtered out all
		     // avilable filters (think db source).
		     if( good_count == 0 && ! overflow_p ){
			 _nothing_to_see_here(in_field);
		     }else{
			 // Otherwise, now add the ul to the
			 // appropriate section of the accordion in
			 // the DOM.
			 var sect_id =
			     filter_accordion_widget.get_section_id(in_field);
			 jQuery('#' + sect_id).empty();

			 // TODO/BUG:
			 // Give warning to the redundant facets.
			 var warn_txt = null;
			 if( redundant_count == 1 ){
			     warn_txt = "field is";
			 }else if( redundant_count > 1 ){
			     warn_txt = "fields are";
			 }
			 if( warn_txt ){
			     jQuery('#' + sect_id).append(
				 "<small> The top (" + redundant_count +
				     ") redundant " + warn_txt + " not shown" +
				     "</small>");
							  
			 }

			 // Add facet table.
			 var final_tbl_str = facet_list_tbl.to_string();
			 jQuery('#' + sect_id).append(final_tbl_str);
		     }
		 }
	     });

	// Okay, now introducing a function that we'll be using a
	// couple of times in our callbacks. Given a button id (from
	// a button hash) and the [field, filter, count, polarity]
	// values from the props, make a button-y thing an active
	// filter.
	function filter_select_live(button_id, create_time_button_props){
	    //var bid = button_id;
	    //var in_field = create_time_button_props[0];	 
	    //var in_filter = create_time_button_props[1];
	    //var in_count = create_time_button_props[2];
	    var in_polarity = create_time_button_props[3];

	    // Decide on the button graphical elements.
	    var b_ui_icon = 'ui-icon-plus';
	    if( in_polarity == '-' ){
		b_ui_icon = 'ui-icon-minus';
	    }
	    var b_ui_props = {
		icons: { primary: b_ui_icon},
		text: false
	    };

	    // Create the button and immediately add the event.
	    //jQuery('#' + button_id).button(b_ui_props).click(
	    jQuery('#' + button_id).click(
		function(){
		    var tid = jQuery(this).attr('id');
		    var call_time_button_props = button_hash[tid];
		    var call_field = call_time_button_props[0];	 
		    var call_filter = call_time_button_props[1];
		    //var in_count = button_props[2];
		    var call_polarity = call_time_button_props[3];
		    
		    // Change manager and fire.
		    // var bstr =call_field+' '+call_filter+' '+call_polarity;
		    // alert(bstr);
		    manager.add_query_filter(call_field, call_filter,
			  		     [call_polarity]);
		    manager.search();
		    // We are now searching--show it.
		    _spin_up();
		});
	}

	// Now let's go back and add the buttons, styles,
	// events, etc. in the main accordion section.
	each(button_hash, filter_select_live);

	// Next, tie the events to the "more" spans.
	each(overflow_hash,
	     function(button_id, filter_name){
		 jQuery('#' + button_id).click(

		     // On click, set that one field to limitless in
		     // the manager, setup a shield, and wait for the
		     // callback.
		     function(){

			 // Recover the field name.
			 var tid = jQuery(this).attr('id');
			 var call_time_field_name = overflow_hash[tid];
			 //alert(call_time_field_name);

			 // Set the manager to no limit on that field and
			 // only rturn the information that we want.
			 manager.set_facet_limit(0);
			 manager.set_facet_limit(call_time_field_name, -1);
			 var curr_row = manager.get('rows');
			 manager.set('rows', 0);

			 // Create the shield and pop-up the
			 // placeholder.
			 var fs = bbop.widget.display.filter_shield;
			 var filter_shield = new fs(ui_spinner_shield_source,
						    ui_spinner_shield_message); 
			 filter_shield.start_wait();

			 // Open the populated shield.
			 function draw_shield(resp){

			    // ll("shield what: " + bbop.core.what_is(resp));
			    // ll("shield resp: " + bbop.core.dump(resp));

			     // First, extract the fields from the
			     // minimal response.
			     var fina = call_time_field_name;
			     var flist = resp.facet_field(call_time_field_name);

			     // Draw the proper contents of the shield.
			     filter_shield.draw(fina, flist, manager);
			 }
			 manager.fetch(draw_shield);

			 // Reset the manager to more sane settings.
			 manager.reset_facet_limit();
			 manager.set('rows', curr_row);
		     });
	     });

	ll('Done current accordion for: ' + ui_div_id);
    };

    /*
     * Function: draw_results
     *
     * Draw results using hints from the golr class configuration.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_results = function(response, manager){
	
	ll('draw_results for: ' + ui_results_table_div_id);

	//ll('final_table a: ' + final_table._is_a);
	//ll('final_table b: ' + final_table.to_string);
	//ll('final_table c: ' + final_table.to_string());

	// Clear whatever is there.
	var urtdi = ui_results_table_div_id;
	jQuery('#' + urtdi).empty();

	// Display product when not empty.
	var docs = response.documents();
	if( ! bbop.core.is_empty(docs) ){
	    var final_table = new bbop.widget.display.results_table_by_class(
		anchor.class_conf,
		response,
		anchor.linker,
		anchor.handler,
		urtdi,
		show_checkboxes_p);

	    // Capture the current name state of the control and
	    // group.
	    ui_results_selection_control_id = final_table.toggle_id();
	    ui_results_selection_item_name = final_table.item_name();

	    // Since we already added to the DOM in the final_table
	    // instantiation above, go ahead and locally add the group
	    // toggle if the checkboxes are defined.
	    if( ui_results_selection_control_id &&
		ui_results_selection_item_name ){
		    jQuery('#' + ui_results_selection_control_id).click(
			function(){
			    var cstr = 'input[id=' +
				ui_results_selection_control_id +
				']';
			    var nstr = 'input[name=' +
				ui_results_selection_item_name +
				']';
			    if( jQuery(cstr).prop('checked') ){
				jQuery(nstr).prop('checked', true);
			    }else{
				jQuery(nstr).prop('checked', false);
			    }
			});
	    }
	}

	// Our search obviously came back.
	_spin_down();

	// If it looks like we enabled the checkboxes, go ahead and
	// activate the group toggle for them.
	
    };

    /*
     * Function: draw_error
     *
     * Somehow report an error to the user.
     * 
     * Parameters:
     *  error_message - a string(?) describing the error
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_error = function(error_message, manager){
	ll("draw_error: " + error_message);
	alert("Runtime error: " + error_message);
	_spin_down();
    };

    /*
     * Function: set_buttons
     *
     * Set the list of buttons for display by changing the button
     * definition hash list.
     * 
     * If no buttons are set, the list is cleared.
     * 
     * Parameters:
     *  button_def_list - *[optional]*
     *
     * Returns:
     *  n/a
     */
    this.set_buttons = function(button_def_list){
	if( ! button_def_list ){
	    button_def_list = [];
	}
	ll("changing buttons: to " + button_def_list.length +
	   " from " + anchor.button_definitions.length);
	anchor.button_definitions = button_def_list;
    };

    /*
     * Function: set_query_field
     *
     * Set the text in the search query field box.
     * 
     * If no query is set, the field is cleared.
     * 
     * Parameters:
     *  query - *[optional]* string
     *
     * Returns:
     *  true or false on whether the task was accomplished
     */
    this.set_query_field = function(query){
	var retval = false;
	if( ! query ){
	    query = '';
	}
	if( jQuery('#' + ui_query_input_id) ){
	    ll("changing query search field: to " + query);
	    jQuery('#' + ui_query_input_id).val(query);
	    //jQuery('#' + ui_query_input_id).keyup();
	    retval = true;
	}
	return retval;
    };
};
/*
 * Package: spinner.js
 * 
 * Namespace: bbop.widget.spinner
 * 
 * BBOP object to produce a self-constructing/self-destructing
 * spinner. It can display various spinner/throbber images and can
 * have a set timeout to deal with annoying servers and exotic race
 * conditions.
 * 
 * The class of the spinner image is "bbop-widget-spinner".
 * 
 * Visibility is controlled by the application and removal of
 * "bbop-js-spinner-hidden".
 * 
 * This is a completely self-contained UI.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: spinner
 * 
 * Contructor for the bbop.widget.spinner object.
 * 
 * A trivial invocation might be something like:
 * : var s = new bbop.widget.spinner("inf01", "http://localhost/amigo2/images/waiting_ajax.gif");
 * : s.hide();
 * : s.show();
 * 
 * Or, in a slightly different use case:
 * 
 * : var s = new bbop.widget.spinner("inf01", "http://localhost/amigo2/images/waiting_ajax.gif", {'timout': 5});
 * : s.start_wait();
 * 
 * The optional hash arguments look like:
 *  timeout - the number of seconds to wait before invoking <clear_waits>; 0 indicates waiting forever; defaults to 5
 *  visible_p - whether or not the spinner is visible on initialization; true|false; defaults to true
 *  classes - a string of space-separated classes that you want added to the spinner image
 * 
 * Arguments:
 *  host_elt_id - string id of the place to place the widget
 *  img_src - the URL for the image to use in the spinner
 *  argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.spinner = function(host_elt_id, img_src, argument_hash){
    
    this._is_a = 'bbop.widget.spinner';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = false;
    //logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (spinner): ' + str); }

    // Our argument default hash.
    var default_hash = {
	'timeout': 5,
	'visible_p': true,
	'classes': ''
    };
    var folding_hash = argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Spin out arguments.
    var timeout = arg_hash['timeout'];
    var visible_p = arg_hash['visible_p'];
    var classes = arg_hash['classes'];

    ///
    /// Part 1: Append the image into the given element id.
    ///

    // Use the incoming arguments to help determine the default
    // classes on the element.'
    var spinner_classes = ['bbop-js-spinner'];
    if( ! visible_p ){
	spinner_classes.push('bbop-js-spinner-hidden');
    }
    if( classes && classes != '' ){
	spinner_classes.push(classes);
    }

    // Create new element.
    var spinner_elt =
	new bbop.html.image({'generate_id': true,
			     'src': img_src,
			     'title': "Please wait...",
			     'class': spinner_classes.join(' '),
			     'alt': "(waiting...)"});
    var spinner_elt_id = spinner_elt.get_id();

    // Append img to end of given element.
    jQuery('#' + host_elt_id).append(spinner_elt.to_string());
    
    ///
    /// Part 2: Dynamic display management.
    ///

    // Counts and accounting.
    var current_waits = 0;
    var timeout_queue = [];

    /*
     * Function: show
     * 
     * Show the spinner if it is hidden (regardless of current waits).
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.show = function(){
	ll("show");
	jQuery('#' + spinner_elt_id).removeClass('bbop-js-spinner-hidden');	

	// If the timeout is defined, push a timer onto
	// the queue.
	function _on_timeout(){
	    anchor.finish_wait();
	}
	if( timeout > 0 ){
	    setTimeout(_on_timeout, (timeout * 1000));
	}
	// foo=setTimeout(function(){}, 1000);
	// clearTimeout(foo);
    };

    /*
     * Function: hide
     * 
     * Hide the spinner if it is showing (regardless of current waits).
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.hide = function(){
	ll("hide");
	jQuery('#' + spinner_elt_id).addClass('bbop-js-spinner-hidden');	
    };

    /*
     * Function: start_wait
     * 
     * Displays the initial spinner if it is not already displayed and
     * adds one to the wait count.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.start_wait = function(){

	ll("Start outstanding waits: " + current_waits);

	// 
	if( current_waits == 0 ){
	    anchor.show();
	}

	current_waits++;
    };

    /*
     * Function: finish_wait
     * 
     * Removes one from the wait count and hides the spinner if the
     * number of outstanding waits has reached zero.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.finish_wait = function(){

	ll("Finish outstanding waits: " + current_waits);

	// Stay at least at 0--we might have stragglers or incoming
	// after a reset.
	if( current_waits > 0 ){
	    current_waits--;	    
	}

	// Gone if we are not waiting for anything.
	if( current_waits == 0 ){
	    anchor.hide();
	}
    };

    /*
     * Function: clear_waits
     * 
     * Hides the spinner and resets all the waiting counters. Can be
     * used during things like server errors or collisions.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.clear_waits = function(){
	current_waits = 0;
	anchor.hide();
    };
};
/*
 * Package: filter_table.js
 * 
 * Namespace: bbop.widget.filter_table
 * 
 * Create a dynamic filter for removing rows from a table (where the
 * rows are inside of a tbody).
 * 
 * The repaint_func argument takes the table id as its argument. If a
 * function is not specified, the default function will do nothing.
 */

// YANKED: ...apply the classes "even_row" and "odd_row" to the table.

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Method: filter_table
 * 
 * The table needs to keep the row information in a tbody, not just at
 * the top level.
 * 
 * Arguments:
 *  elt_id - the element to inject the filter into
 *  table_id - the table that we will operate on
 *  img_src - *[optional]* img source URL for the spinner image (defaults to no spinner)
 *  repaint_func - the repaint function to run after filtering (see above)
 *  label - *[optional]* the label to use for the filter
 * 
 * Returns:
 *  n/a
 */
bbop.widget.filter_table = function(elt_id, table_id, img_src,
				    repaint_func, label){
    this._is_a = 'bbop.widget.filter_table';

    var anchor = this;
    
    var logger = new bbop.logger();
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    ll('init filter_table in ' + elt_id + ' for ' + table_id);

    // Sort out spinner image source.
    anchor.img_src = null;
    if( img_src ){
	anchor.img_src = img_src;
    }

    // Sort out repaint function.
    anchor.repaint_func = 
    	function (tid){};	
    // function (tid){
    //     jQuery('table#' + tid + ' tr:even').attr('class', 'even_row');
    //     jQuery('table#' + tid + ' tr:odd').attr('class', 'odd_row');
    // };
    if( repaint_func ){
    	anchor.repaint_func = repaint_func;
    }

    // Sort out label.
    anchor.label = 'Filter:';
    if( label ){
	anchor.label = label;
    }

    ll('finished args');

    // Create a label, input field, and a clear button.
    var input_attrs = {
	'type': 'text',
	'class': 'form-control bbop-js-filter-table-input',
	'value': '',
	'generate_id': true
    };
    var input = new bbop.html.input(input_attrs);

    var lbl_attrs = {
	'for': input.get_id(),
	'generate_id': true
    };
    var lbl = new bbop.html.tag('label', lbl_attrs, anchor.label);

    var clear_button_attrs ={
	'type': 'button',
	'class': 'btn btn-danger',
	'title': 'Clear filter',
	'generate_id': true
    };
    var clear_button =
	//new bbop.widget.display.text_button_sim('&times;', 'Clear filter');
	new bbop.html.button('&times;', clear_button_attrs);

    var cont_attrs = {
	'class': 'form-inline'
    };
    var cont = new bbop.html.tag('div', cont_attrs, [lbl, input,
						     clear_button]);

    ll('widget gen done');

    // And add them to the DOM at the location.
    jQuery('#' + elt_id).empty();
    jQuery('#' + elt_id).append(cont.to_string());

    // Also, attach a spinner.
    var spinner = null;
    if( anchor.img_src ){
	jQuery('#' + elt_id).append('&nbsp;&nbsp;');
	spinner = new bbop.widget.spinner(elt_id, anchor.img_src,
					 {
					     visible_p: false
					 });
    }
    
    ll('widget addition done');

    // Make the clear button active.
    jQuery('#' + clear_button.get_id()).click(
	function(){
	    ll('click call');
	    if( spinner ){ spinner.show(); }
            jQuery('#' + input.get_id()).val('');
	    trs.show();
	    // Recolor after filtering.
	    anchor.repaint_func(table_id);
	    if( spinner ){ spinner.hide(); }
	});

    // Cache information about the table.
    var trs = jQuery('#' + table_id + ' tbody > tr');
    var tds = trs.children();

    // Make the table filter active.
    jQuery('#' + input.get_id()).keyup(
	function(){

	    if( spinner ){ spinner.show(); }

            var stext = jQuery(this).val();

	    ll('keyup call: (' + stext + '), ' + trs);

	    if( ! bbop.core.is_defined(stext) || stext == "" ){
		// Restore when nothing found.
		trs.show();
	    }else{
		// Want this to be insensitive.
		stext = stext.toLowerCase();

		// All rows (the whole table) gets hidden.
		trs.hide();

		// jQuery filter to match element contents against
		// stext.
		function _match_filter(){
		    var retval = false;
		    var lc = jQuery(this).text().toLowerCase();
		    if( lc.indexOf(stext) >= 0 ){
			retval = true;
		    }
		    return retval;
		}

		// If a td has a match, the parent (tr) gets shown.
		// Or: show only matching rows.
		tds.filter(_match_filter).parent("tr").show();
            }

	    // Recolor after filtering.
	    anchor.repaint_func(table_id);

	    if( spinner ){ spinner.hide(); }
	});
};
/*
 * Package: browse.js
 * 
 * Namespace: bbop.widget.browse
 * 
 * BBOP object to draw various UI elements that have to do with
 * autocompletion.
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: browse
 * 
 * Contructor for the bbop.widget.browse object.
 * 
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * While everything in the argument hash is technically optional,
 * there are probably some fields that you'll want to fill out to make
 * things work decently. The options for the argument hash are:
 * 
 *  topology_graph_field -  the field for the topology graph
 *  transitivity_graph_field - the field for the transitivity graph
 *  info_button_callback - functio to call when info clicked, gets doc
 *  base_icon_url - the url base that the fragments will be added to
 *  image_type - 'gif', 'png', etc.
 *  current_icon - the icon fragment for the current term
 *  info_icon - the icon fragment for the information icon
 *  info_alt - the alt text and title for the information icon
 * 
 * The basic formula for the icons is: base_icon_url + '/' + icon +
 * '.' + image_type; then all spaces are turned to underscores and all
 * uppercase letters are converted into lowercase letters.
 * 
 * The functions for the callbacks look like function(<term acc>,
 * <json data for the specific document>){}. If no function is given,
 * an empty function is used.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  interface_id - string id of the element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.browse = function(golr_loc, golr_conf_obj, interface_id,
			      in_argument_hash){

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('B (widget): ' + str); }

    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.browse';
    // ll("what_is (post: this.update): " + bbop.core.what_is(this.update));

    // 
    var anchor = this;
    var loop = bbop.core.each;
    
    // Our argument default hash.
    var default_hash =
	{
	    'topology_graph_field' : 'topology_graph_json',
	    'transitivity_graph_field' : 'transitivity_graph_json',
	    //'transitivity_graph_field' : 'regulates_transitivity_graph_json',
	    'info_button_callback' : function(){},
	    'base_icon_url' : null,
	    'image_type' : 'gif',
	    'current_icon' : 'this',
	    'info_icon' : 'info',
	    'info_alt' : 'Click for more information.'
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // There should be a string interface_id argument.
    this._interface_id = interface_id;
    this._info_button_callback = arg_hash['info_button_callback'];
    var topo_graph_field = arg_hash['topology_graph_field'];
    var trans_graph_field = arg_hash['transitivity_graph_field'];
    var base_icon_url = arg_hash['base_icon_url'];
    var image_type = arg_hash['image_type'];
    var current_icon = arg_hash['current_icon'];
    var info_icon = arg_hash['info_icon'];
    var info_alt = arg_hash['info_alt'];
   
    // The current acc that we are interested in.
    this._current_acc = null;

    // Successful callbacks call draw_rich_layout.
    anchor.register('search', 'do', draw_rich_layout);

    // Recursively draw a rich layout using nested uls.
    function draw_rich_layout(resp){
	
	///
	/// Get the rich layout from the returned document if
	/// possible. Note the use of JSON, supplied by jQuery,
	/// instead of out internal method bbop.json.parse.
	///
	var doc = resp.documents()[0];

	var topo_graph = new bbop.model.bracket.graph();
	topo_graph.load_json(JSON.parse(doc[topo_graph_field]));

	var trans_graph = new bbop.model.graph();
	trans_graph.load_json(JSON.parse(doc[trans_graph_field]));

	//ll('to: ' + doc['topology_graph']);
	//ll('tr: ' + doc['transitivity_graph']);
	//ll('ro: ' + anchor._current_acc);
	//ll('g: ' + topo_graph.get_parent_nodes(anchor._current_acc));
	var rich_layout = topo_graph.rich_bracket_layout(anchor._current_acc,
							 trans_graph);
	//ll("rl: " + bbop.core.dump(rich_layout));

	///
	/// Next, produce the raw HTML skeleton.
	/// TODO: Keep a cache of the interesting ids for adding
	/// events later.
	///

	// I guess we'll just start by making the list.
	var tl_attrs = {
	    'class': 'bbop-js-ui-browse'
	};
	var top_level = new bbop.html.list([], tl_attrs);

	// Store the navigation anf info buttons.
	var nav_button_hash = {};
	var info_button_hash = {};

	// Cycle down through the brackets, adding spaces every time
	// we go down another level.
	var spacing = '&nbsp;&nbsp;&nbsp;&nbsp;';
	var spaces = spacing;
	loop(rich_layout, // for every level
	     function(layout_level){
		 loop(layout_level, // for every item at this level
		      function(level_item){			  

			  var nid = level_item[0];
			  var lbl = level_item[1];
			  var rel = level_item[2];
			  
			  // For various sections, decide to run image
			  // (img) or text code depending on whether
			  // or not it looks like we have a real URL.
			  var use_img_p = true;
			  if( base_icon_url == null || base_icon_url == '' ){
			      use_img_p = false;
			  }

			  // Clickable acc span.
			  // No images, so the same either way. Ignore
			  // it if we're current.
			  var nav_b = null;
			  if(anchor._current_acc == nid){
			      var inact_attrs = {
				  'class': 'bbop-js-text-button-sim-inactive',
				  'title': 'Current term.'
			      };
			      nav_b = new bbop.html.span(nid, inact_attrs);
			  }else{
			      var tbs = bbop.widget.display.text_button_sim;
			      var bttn_title =
				  'Reorient neighborhood onto this node (' +
				  nid + ').';
			      nav_b = new tbs(nid, bttn_title);
			      nav_button_hash[nav_b.get_id()] = nid;
			  }

			  // Clickable info span. A little difference
			  // if we have images.
			  var info_b = null;
			  if( use_img_p ){
			      // Do the icon version.
			      var imgsrc = bbop.core.resourcify(base_icon_url,
								info_icon,
								image_type);
			      info_b =
				  new bbop.html.image({'alt': info_alt,
						       'title': info_alt,
				  		       'src': imgsrc,
				  		       'generate_id': true});
			  }else{
			      // Do a text-only version.
			      info_b =
				  new bbop.html.span('<b>[i]</b>',
						     {'generate_id': true});
			  }
			  info_button_hash[info_b.get_id()] = nid;

			  // "Icon". If base_icon_url is defined as
			  // something try for images, otherwise fall
			  // back to this text ick.
			  var icon = null;
			  if( use_img_p ){
			      // Do the icon version.
			      var ialt = '[' + rel + ']';
			      var isrc = null;
			      if(anchor._current_acc == nid){
				  isrc = bbop.core.resourcify(base_icon_url,
			      				      current_icon,
							      image_type);
			      }else{
				  isrc = bbop.core.resourcify(base_icon_url,
			      				      rel, image_type);
			      }
			      icon =
				  new bbop.html.image({'alt': ialt,
						       'title': rel,
				  		       'src': isrc,
				  		       'generate_id': true});
			  }else{
			      // Do a text-only version.
			      if(anchor._current_acc == nid){
				  icon = '[[->]]';
			      }else if( rel && rel.length && rel.length > 0 ){
				  icon = '[' + rel + ']';
			      }else{
				  icon = '[???]';
			      }
			  }

			  // Stack the info, with the additional
			  // spaces, into the div.
			  top_level.add_to(spaces,
					   icon,
					   nav_b.to_string(),
					   lbl,
					   info_b.to_string());
		      }); 
		 spaces = spaces + spacing;
	     }); 

	// Add the skeleton to the doc.
	jQuery('#' + anchor._interface_id).empty();
	jQuery('#' + anchor._interface_id).append(top_level.to_string());

	///
	/// Finally, attach any events to the browser HTML doc.
	///

	// Navigation.
	loop(nav_button_hash,
	     function(button_id, node_id){

		 jQuery('#' + button_id).click(
		     function(){
			 var tid = jQuery(this).attr('id');
			 var call_time_node_id = nav_button_hash[tid];
			 //alert(call_time_node_id);
			 anchor.draw_browser(call_time_node_id);
		     });
	     });

	// Information.
	loop(info_button_hash,
	     function(button_id, node_id){

		 jQuery('#' + button_id).click(
		     function(){
			 var tid = jQuery(this).attr('id');
			 var call_time_node_id = info_button_hash[tid];
			 var call_time_doc = resp.get_doc(call_time_node_id);
			 anchor._info_button_callback(call_time_node_id,
						      call_time_doc);
		     });
	     });
    }
	
    /*
     * Function: draw_browser
     * 
     * Bootstraps the process.
     * 
     * Parameters:
     *  term_acc - acc of term we want to have as the term of interest
     * 
     * Returns
     *  n/a
     */
    //bbop.widget.browse.prototype.draw_browser = function(term_acc){
    // this._current_acc = term_acc;
    // this.set_id(term_acc);
    // this.update('search');
    this.draw_browser = function(term_acc){
	anchor._current_acc = term_acc;
	anchor.set_id(term_acc);
	anchor.update('search');
    };
    
};
bbop.core.extend(bbop.widget.browse, bbop.golr.manager.jquery);
/*
 * Package: search_box.js
 * 
 * Namespace: bbop.widget.search_box
 * 
 * BBOP object to draw various UI elements that have to do with
 * autocompletion.
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: search_box
 * 
 * Contructor for the bbop.widget.search_box object.
 * 
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * The function for the callback argument should either accept a
 * JSONized solr document representing the selected item or null
 * (nothing found).
 * 
 * While everything in the argument hash is technically optional,
 * there are probably some fields that you'll want to fill out to make
 * things work decently. The options for the argument hash are:
 * 
 *  fill_p - whether or not to fill the input with the val on select(default true)
 *  label_template - string template for dropdown, can use any document field
 *  value_template - string template for selected, can use any document field
 *  minimum_length - wait for this many characters to start (default 3)
 *  list_select_callback - function takes a json solr doc on dropdown selection
 * 
 * To get a better idea on how to use the templates, see the demo page
 * at http://cdn.berkeleybop.org/jsapi/bbop-js/demo/index.html and
 * read the documentation for <bbop.template>.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  interface_id - string id of the element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.search_box = function(golr_loc,
				  golr_conf_obj,
				  interface_id,
				  in_argument_hash){
    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.search_box';

    // Aliases.
    var anchor = this;
    var loop = bbop.core.each;
    
    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (auto): ' + str); }

    // Our argument default hash.
    var default_hash =
	{
	    'fill_p': true,
	    'label_template': '{{id}}',
	    'value_template': '{{id}}',
	    'minimum_length': 3, // wait for three characters or more
	    'list_select_callback': function(){}
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // There should be a string interface_id argument.
    this._interface_id = interface_id;
    this._fill_p = arg_hash['fill_p'];
    this._list_select_callback = arg_hash['list_select_callback'];
    var label_tt = new bbop.template(arg_hash['label_template']);
    var value_tt = new bbop.template(arg_hash['value_template']);
    var minlen = arg_hash['minimum_length'];

    // The all-important argument hash. See:
    // http://jqueryui.com/demos/autocomplete/#method-widget
    var auto_args = {
	minLength: minlen,
	// Function for a successful data hit.
	// The data getter, which is making it all more complicated
	// than it needs to be...we need to close around those
	// callback hooks so we have to do it inplace here.
	source: function(request_data, response_hook) {
	    anchor.jq_vars['success'] = function(json_data){
		var retlist = [];
		var resp = new bbop.golr.response(json_data);
		if( resp.success() ){
		    loop(resp.documents(),
			 function(doc){

			     // First, try and pull what we can out of our
			     var lbl = label_tt.fill(doc);

			     // Now the same thing for the return/value.
			     var val = value_tt.fill(doc);

			     // Add the discovered items to the return
			     // save.
			     var item = {
				 'label': lbl,
				 'value': val,
				 'document': doc
			     };
			     retlist.push(item);
			 });
		}
		response_hook(retlist);
	    };

	    // Get the selected term into the manager and fire.
	    //anchor.set_query(request_data.term);
	    anchor.set_comfy_query(request_data.term);
	    anchor.JQ.ajax(anchor.get_query_url(), anchor.jq_vars);
	},
	// What to do when an element is selected.
	select: function(event, ui){

	    // Prevent default selection input filling action (from
	    // jQuery UI) when non-default marked.
	    if( ! anchor._fill_p ){
		event.preventDefault();		
	    }

	    var doc_to_apply = null;
	    if( ui.item ){
		doc_to_apply = ui.item.document;
	    }

	    // Only do the callback if it is defined.
	    if( bbop.core.is_defined(anchor._list_select_callback) ){
		anchor._list_select_callback(doc_to_apply);
	    }
	}
    };

    // Set the ball rolling (attach jQuery autocomplete to doc).
    jQuery('#' + anchor._interface_id).autocomplete(auto_args);


    /*
     * Function: destroy
     * 
     * Remove the autocomplete and functionality from the DOM.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.destroy = function(){
	jQuery('#' + anchor._interface_id).autocomplete('destroy');
    };

    /*
     * Function: content
     * 
     * Get the current text contents of the search box.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  string
     */
    this.content = function(){
	return jQuery('#' + anchor._interface_id).val();
    };

};
bbop.core.extend(bbop.widget.search_box, bbop.golr.manager.jquery);
/*
 * Package: dialog.js
 * 
 * Namespace: bbop.widget.dialog
 * 
 * BBOP object to produce a self-constructing/self-destructing
 * jQuery popup dialog.
 * 
 * This is a completely self-contained UI.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: dialog
 * 
 * Contructor for the bbop.widget.dialog object.
 * 
 * The optional hash arguments look like:
 * 
 * Arguments:
 *  item - string or bbop.html to display.
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.dialog = function(item, in_argument_hash){
    
    this._is_a = 'bbop.widget.dialog';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (dialog): ' + str); }

    // Our argument default hash.
    var default_hash = {
	//modal: true,
	//draggable: false,
	width: 300, // the jQuery default anyways
	title: '',
	buttons: null,
	close:
	function(){
	    // TODO: Could maybe use .dialog('destroy') instead?
	    jQuery('#' + div_id).remove();
	}
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Not an argument for the dialog, so remove it.
    var title = arg_hash['title'];
    delete arg_hash['title'];

    ///
    /// Actually draw.
    ///

    // Coerce our argument into a string.
    var str = item || 'Nothing here...';
    if( bbop.core.what_is(item) != 'string' ){
	str = item.to_string();
    }

    // Create new div.
    var div = new bbop.html.tag('div', {'generate_id': true, title: title});
    var div_id = div.get_id();

    // Append div to end of body.
    jQuery('body').append(div.to_string());
    
    // Add text to div.
    jQuery('#' + div_id).append(str);
    
    // Boink!
    var dia = jQuery('#' + div_id).dialog(arg_hash);
};
/*
 * Package: term_shield.js
 * 
 * Namespace: bbop.widget.term_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * information shield.
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: term_shield
 * 
 * Contructor for the bbop.widget.term_shield object.
 * 
 * This is (sometimes) a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * To actually do much useful, you should set the personality of the
 * widget.
 * 
 * The optional hash arguments look like:
 * 
 *  linker - a "linker" object
 *  width - defaults to 700
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server; not needed if local
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.term_shield = function(golr_loc, golr_conf_obj, in_argument_hash){
    
    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.term_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (term_shield): ' + str); }

    // Our argument default hash.
    var default_hash = {
	'linker_function': function(){},
	'width': 700
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var width = arg_hash['width'];
    var linker = arg_hash['linker_function'];

    // Draw a locally help Solr response doc.
    function _draw_local_doc(doc){
	
	//ll(doc['id']);

	var personality = anchor.get_personality();
	var cclass = golr_conf_obj.get_class(personality);

	var txt = 'Nothing here...';
	if( doc && cclass ){

	    var tbl = new bbop.html.table();
	    var results_order = cclass.field_order_by_weight('result');
	    var each = bbop.core.each; // convenience
	    each(results_order,
		 function(fid){
		     // 
		     var field = cclass.get_field(fid);
		     var val = doc[fid];

		     // Determine if we have a list that we're working
		     // with or not.
		     if( field.is_multi() ){

			 if( val ){
			     val = val.join(', ');
			 }else{
			     val = 'n/a';
			 }

		     }else{

			 // When handling just the single value, see
			 // if we can link out the value.
			 var link = null;
			 if( val ){
			     //link = linker.anchor({id: val});
			     //link = linker.anchor({id: val}, 'term');
			     link = linker.anchor({id: val}, fid);
			     if( link ){ val = link; }
			 }else{
			     val = 'n/a';
			 }
		     }

		     tbl.add_to([field.display_name(), val]);
		 });
	    txt = tbl.to_string();
	}

	// Create div.
	var div = new bbop.html.tag('div', {'generate_id': true});
	var div_id = div.get_id();

	// Append div to body.
	jQuery('body').append(div.to_string());

	// Add text to div.
	jQuery('#' + div_id).append(txt);

	// Modal dialogify div; include self-destruct.
	var diargs = {
	    modal: true,
	    draggable: false,
	    width: width,
	    close:
	    function(){
		// TODO: Could maybe use .dialog('destroy') instead?
		jQuery('#' + div_id).remove();
	    }	    
	};
	var dia = jQuery('#' + div_id).dialog(diargs);
    }

    // Get a doc by id from a remote server then display it when it
    // gets local.
    // TODO: spinner?
    function _draw_remote_id(id_string){
	function _process_resp(resp){
	    var doc = resp.get_doc(0);
	    _draw_local_doc(doc);
	}
	anchor.register('search', 'do', _process_resp);
	anchor.set_id(id_string);
	//ll('FOO: ' + id_string);
	anchor.search();
    }

    /*
     * Function: draw
     * 
     * Render a temporary modal information shield. 
     * 
     * Arguments:
     *  item - either a document id or a Solr-returned document
     * 
     * Returns:
     *  n/a
     */
    this.draw = function(item){
    // Call the render directly if we already have a document,
    // otherwise, if it seems like a string (potential id), do a
    // callback on it and pull the doc out.
	if( bbop.core.what_is(item) == 'string' ){
	    _draw_remote_id(item);
	}else{
	    _draw_local_doc(item);
	}
    };
    
};
bbop.core.extend(bbop.widget.term_shield, bbop.golr.manager.jquery);
/*
 * Package: list_select_shield.js
 * 
 * Namespace: bbop.widget.list_select_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * information shield.
 * 
 * A simple invocation could be:
 * 
 * : new bbop.widget.list_select_shield({title: 'foo', blurb: 'explanation', list_of_lists: [[['a', 'b'], ['c', 'd', true]], [[1, 2], [3, 4]]], title_list: ['title 1', 'title 2'], action: function(selected_args){ alert(selected_args.join(', '));}})
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: list_select_shield
 * 
 * Contructor for the bbop.widget.list_select_shield object.
 * 
 * The purpose of this object to to create a popup that 1) display
 * multiple lists for the user to select from and 2) triggers an
 * action (by function argument) to act on the list selections.
 * 
 * The "list_of_lists" argument is a list of lists structured like:
 * : [[[label, value, nil|true|false], ...], ...]
 * 
 * Items that are true will appear as pre-checked when the lists come
 * up.
 * 
 * The "action" argument is a function that takes a list of selected
 * values.
 * 
 * The argument hash looks like:
 *  title - *[optional]* the title to be displayed 
 *  blurb - *[optional]* a text chunk to explain the point of the action
 *  title_list - a list of titles/explanations for the lists
 *  list_of_lists - a list of lists (see above)
 *  action - *[optional] * the action function to be triggered (see above, defaults to no-op)
 *  width - *[optional]* width as px integer (defaults to 800)
 * 
 * Arguments:
 *  in_argument_hash - hash of arguments (see above)
 * 
 * Returns:
 *  self
 */
bbop.widget.list_select_shield = function(in_argument_hash){    
    this._is_a = 'bbop.widget.list_select_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (list_select_shield): ' + str); }

    // Aliases.
    var each = bbop.core.each;
    var uuid = bbop.core.uuid;
    
    // Our argument default hash.
    var default_hash = {
	'title': '',
	'blurb': '',
	'title_list': [],
	'list_of_lists': [],
	'action': function(){},
	'width': 800
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var title = arg_hash['title'];
    var blurb = arg_hash['blurb'];
    var title_list = arg_hash['title_list'];
    var list_of_lists = arg_hash['list_of_lists'];
    var action = arg_hash['action'];
    var width = arg_hash['width'];

    // Cache the group names as we go so we can pull them out later
    // when we scan for checked items.
    var group_cache = [];
    function _draw_radio_list(list){

	var list_cache = [];
	var rdo_grp = 'bbop_js_lss_' + uuid();
	group_cache.push(rdo_grp);

	each(list,
	     function(item){

		 var lbl = item[0];
		 var val = item[1];
		 var ckt = item[2] || false;

		 //ll('lbl: ' + lbl);
		 //ll('val: ' + val);
		 //ll('ckt: ' + ckt);

		 // Radio button.	 
		 var rdo_attrs = {
		     'generate_id': true,
		     'name': rdo_grp,
		     'type': 'radio',
		     'value': val
		 };
		 if( ckt ){
		     rdo_attrs['checked'] = 'checked';
		 }
		 var rdo = new bbop.html.input(rdo_attrs);
		 //ll('rdo: ' + rdo.to_string());

		 // Label for it.
		 var rdo_lbl_attrs = {
		     'for': rdo.get_id()
		 };
		 var rdo_lbl = new bbop.html.tag('label', rdo_lbl_attrs,
						 '&nbsp;' + lbl);
		 //ll('rdo_lbl: ' + rdo_lbl.to_string());

		 // And a span to capture both.
		 var rdo_span_attrs = {
		 };
		 var rdo_span = new bbop.html.span('', rdo_span_attrs);
		 //ll('rdo_span (1): ' + rdo_span.to_string());
		 rdo_span.add_to(rdo);
		 //ll('rdo_span (2): ' + rdo_span.to_string());
		 rdo_span.add_to(rdo_lbl);
		 //ll('rdo_span (3): ' + rdo_span.to_string());

		 // Now /this/ goes into the list.
		 list_cache.push(rdo_span);
	     });

	// Now we have a list of all the items, put them into a UL
	// element.
	var ul_list_attrs = {
	    'generate_id': true,
	    'class': 'bbop-js-ui-list-select-shield-list'
	};
	var ul_list = new bbop.html.list(list_cache, ul_list_attrs);

	// ...and send it back.
	return ul_list;
    }

    // Append super container div to body.
    var div = new bbop.html.tag('div', {'generate_id': true});
    var div_id = div.get_id();
    jQuery('body').append(div.to_string());

    // Add title and blurb to div.
    jQuery('#' + div_id).append('<p>' + blurb + '</p>');

    // Add the table of lists to div.
    var cont_table_attrs = {
	'class': 'bbop-js-ui-list-select-shield-table'
    };
    var tbl = new bbop.html.table(title_list, [], cont_table_attrs);
    var lol_cache = []; // not funny: list of lists
    each(list_of_lists,
	 function(sub_list){
	     lol_cache.push(_draw_radio_list(sub_list));
	 });
    tbl.add_to(lol_cache);
    jQuery('#' + div_id).append(tbl.to_string());

    // Finally, add a clickable button to that calls the action
    // function. (Itself embedded in a container div to help move it
    // around.)
    var cont_div_attrs = {
	'class': 'bbop-js-ui-dialog-button-right',
	'generate_id': true
    };
    var cont_div = new bbop.html.tag('div', cont_div_attrs);
    var cont_btn_attrs = {
	//'class': 'bbop-js-ui-dialog-button-right'
    };
    var cont_btn = new bbop.widget.display.text_button_sim('Continue',
							   'Click to continue',
							   null,
							   cont_btn_attrs);
    cont_div.add_to(cont_btn);
    jQuery('#' + div_id).append(cont_div.to_string());

    // Since we've technically added the button, back it clickable
    // Note that this is very much radio button specific.
    jQuery('#' + cont_btn.get_id()).click(
	function(){
	    // Jimmy values out from above by cycling over the
	    // collected groups.
	    var selected = [];
	    each(group_cache,
		 function(gname){
		     var find_str = 'input[name=' + gname + ']';
		     var val = null;
		     jQuery(find_str).each(
			 function(){
			     if( this.checked ){
				 val = jQuery(this).val();
			     }
			     // }else{
			     // 	 selected.push(null);
			     //}
			 });
		     selected.push(val);
		 });

	    // Calls those values with our action function.
	    action(selected);

	    // And destroy ourself.
	    jQuery('#' + div_id).remove();
	});

    // Modal dialogify div; include self-destruct.
    var diargs = {
	'title': title,
	'modal': true,
	'draggable': false,
	'width': width,
	'close':
	function(){
	    // TODO: Could maybe use .dialog('destroy') instead?
	    jQuery('#' + div_id).remove();
	}	    
    };
    var dia = jQuery('#' + div_id).dialog(diargs);
};
/*
 * Package: drop_select_shield.js
 * 
 * Namespace: bbop.widget.drop_select_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing DnD
 * selection and ordering shield.
 * 
 * A simple invocation could be:
 * 
 * : new bbop.widget.drop_select_shield({title: 'foo', blurb: 'explanation', pool_list: [['a', 'b'], ['c', 'd']], selected_list [['a', 'b']], action: function(selected_items){ alert(selected_items.join(', '));}})
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: drop_select_shield
 * 
 * Contructor for the bbop.widget.drop_select_shield object.
 * 
 * The purpose of this object to to create a popup that 1) displays a
 * drag selectable and reorderable list of items and 2) define an
 * action (by function argument) to act on the selection.
 * 
 * The list arguments take the form of: ["label", "id"].
 * 
 * The "action" argument is a function that takes a list of selected
 * ids.
 * 
 * The argument hash looks like:
 *  title - *[optional]* the title to be displayed 
 *  blurb - *[optional]* a text chunk to explain the point of the action
 *  pool_list - a list of lists (see above)
 *  selected_list - a list of lists (see above)
 *  action_label - *[optional] * defaults to "Select"
 *  action - *[optional] * the action function to be triggered (see above, defaults to no-op)
 *  width - *[optional]* width as px integer (defaults to 800)
 * 
 * Arguments:
 *  in_argument_hash - hash of arguments (see above)
 * 
 * Returns:
 *  self
 */
bbop.widget.drop_select_shield = function(in_argument_hash){    
    this._is_a = 'bbop.widget.drop_select_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (drop_select_shield): ' + str); }

    // Aliases.
    var each = bbop.core.each;
    var uuid = bbop.core.uuid;
    
    // Our argument default hash.
    var default_hash = {
	'title': '',
	'blurb': '',
	'pool_list': [],
	'selected_list': [],
	'action_label': 'Select',
	'action': function(){},
	'width': 800
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var title = arg_hash['title'];
    var blurb = arg_hash['blurb'];
    var pool_list = arg_hash['pool_list'];
    var selected_list = arg_hash['selected_list'];
    var action_label = arg_hash['action_label'];
    var action = arg_hash['action'];
    var width = arg_hash['width'];

    // Create a random class that we'll use as a connector later.
    var rclass = 'bbop-js-ui-dss-rclass-'+ bbop.core.randomness(20);

    // Get the pool and selected lists into html form for loading into
    // the frame table.
    var li_attrs = {
	'class': 'ui-state-default bbop-js-ui-hoverable'
	//'class': 'bbop-js-ui-hoverable'
    };
    var ul_src_list_attrs = {
    	'generate_id': true,
	'class': 'bbop-js-ui-drop-select-shield ' + rclass
    };
    var pool_ul_list = new bbop.html.list([], ul_src_list_attrs);
    each(pool_list,
    	 function(item){	     
    	     var lbl = item[0];
    	     var val = item[1];
    	     //ll('lbl: ' + lbl);
    	     //ll('val: ' + val);
	     li_attrs['value'] = val;
	     var cntnt = '' +
		 '<span class="ui-icon ui-icon-arrow-4"></span> ' +
		 '' + lbl + ' (' + val + ')' + 
		 '';
	     var li_elt = new bbop.html.tag('li', li_attrs, cntnt);
	     pool_ul_list.add_to(li_elt);
    	 });
    var ul_target_list_attrs = {
    	'generate_id': true,
	'class':
	'bbop-js-ui-drop-select-shield bbop-js-ui-drop-select-shield-target ' +
	    rclass
    };
    var selected_ul_list = new bbop.html.list([], ul_target_list_attrs);
    each(selected_list,
    	 function(item){
    	     var lbl = item[0];
    	     var val = item[1];
    	     //ll('lbl: ' + lbl);
    	     //ll('val: ' + val);
	     li_attrs['value'] = val;
	     var cntnt = '' +
		 '<span class="ui-icon ui-icon-arrow-4"></span> ' +
		 '' + lbl + ' (' + val + ')' + 
		 '';
	     var li_elt = new bbop.html.tag('li', li_attrs, cntnt);
	     selected_ul_list.add_to(li_elt);
    	 });

    // Append super container div to body.
    var div = new bbop.html.tag('div', {'generate_id': true});
    var div_id = div.get_id();
    jQuery('body').append(div.to_string());

    // Add title and blurb to div.
    jQuery('#' + div_id).append('<p>' + blurb + '</p>');

    // Add the table frame to the div.
    var tbl = new bbop.html.table(['Available pool', 'Selected fields'],
				  [[pool_ul_list, selected_ul_list]],
				  {'class':
				   'bbop-js-ui-drop-select-shield-frame'});
    jQuery('#' + div_id).append(tbl.to_string());

    // Make the lists operable.
    var pul_id = pool_ul_list.get_id();
    var sul_id = selected_ul_list.get_id();
    jQuery('#'+pul_id+',#'+sul_id ).sortable(
	{connectWith: '.' + rclass}
    ).disableSelection();

    // Helper function to pull the values.
    // Currently, JQuery adds a lot of extra non-attributes li
    // tags when it creates the DnD, so filter those out to
    // get just the fields ids.
    function _get_selected(){
    	var ret_list = [];
	var selected_strings =
	    jQuery('#'+ sul_id).sortable('toArray', {'attribute': 'value'});
    	each(selected_strings,
    	     function(in_thing){
		 if( in_thing && in_thing != '' ){
		     ret_list.push(in_thing);
		 }
	     });
	return ret_list;
    }

    // Buttons for final dialog.
    var mod_buttons = {};
    mod_buttons[action_label] =
    	function(event){
    	    var final_selected = _get_selected();

    	    // Calls those values with our action function.
    	    action(final_selected);

    	    // And destroy ourself.
    	    jQuery('#' + div_id).remove();
    	};
    mod_buttons['Cancel'] =
	function(event, selected_items){
    	    jQuery('#' + div_id).remove();
	};

    // Modal dialogify div; include self-destruct.
    var diargs = {
	'title': title,
	'modal': true,
	'draggable': false,
	'width': width,
	'buttons': mod_buttons,
	'close':
	function(){
	    //jQuery(this).dialog('destroy');
	    jQuery(this).remove();
	}	    
    };
    var dia = jQuery('#' + div_id).dialog(diargs);    
};
/*
 * Package: search_pane.js
 * 
 * Namespace: bbop.widget.search_pane
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * general filtering search tool for an index. This is a completely
 * self-contained UI and manager.
 * 
 * The function ".establish_display()" must be run *after* an initial
 * personality is set. Also, in many use cases, you'll want to have a
 * line like the following before running ".establish_display()":
 * sp_widget.add_query_filter('document_category', 'annotation',
 * ['*']);
 * 
 * Also, establish_display() literally just establishes the physical
 * presence of the display. To actually populate it with data once you
 * start, a seeding call to the .reset() or .search() is necessary.
 * 
 * The search pane will display one less filter row than is set with
 * .set_facet_limit(), it will use this runover to decide whether or
 * not to display the "more" option for the filters.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: search_pane
 * 
 * Contructor for the bbop.widget.search_pane object.
 * 
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * Sticky filters (see manager documentation) are "hidden" from the
 * user in all displays.
 * 
 * The optional hash arguments look like:
 * 
 *  linker - the linker to be used; null function otherwise
 *  handler - special field handler to be used; null function otherwise
 *  show_filterbox_p - show currents filters and accordion (default true)
 *  show_pager_p - show the results pager (default true)
 *  show_checkboxes_p - show/enable the item select checkboxes (default true)
 *  spinner_search_source - source for the spinner used during typical searching
 *  spinner_shield_source - source for the spinner used shield waiting
 *  spinner_shield_message - message to display on the spinner shield while waiting
 *  icon_clear_label - (default: text button based on 'X')
 *  icon_clear_source - (default: '')
 *  icon_reset_label - (default: text button based on 'X')
 *  icon_reset_source - (default: '')
 *  icon_positive_label - (default: text button based on '+')
 *  icon_positive_source - (default: '')
 *  icon_negative_label - (default: text button based on '-')
 *  icon_negative_source - (default: '')
 *  icon_remove_label - (default: text button based on 'X')
 *  icon_remove_source - (default: '')
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server; not needed if local
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  interface_id - string id of the element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.search_pane = function(golr_loc, golr_conf_obj, interface_id,
				   in_argument_hash){

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('SP (widget): ' + str); }    

    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.search_pane';
    // ll("what_is (post: this.update): " + bbop.core.what_is(this.update));

    // ...
    var anchor = this;

    // We need to keep a handle on the live_search ui component so we
    // can manipulate the buttons after the fact.
    this.ui = null;
    this.user_buttons = [];

    // It's also good to know if the display has actually been
    // established yet (e.g. the user-defined buttons being added
    // before can have the redraw not happen, since there is nothing
    // there yet and they will be draw naturally when the display
    // finally is.
    this.established_p = false;

    // A special set for a single run after the first reset.
    this.initial_reset_p = true;
    this.initial_reset_callback =
	function(response, manager){ ll('empty first run'); };

    // Our argument default hash.
    function _button_wrapper(str, title){
	var b = new bbop.widget.display.text_button_sim(str, title, '');
	return b.to_string();
    }
    var default_hash =
    	{
    	    //'layout_type' : 'two-column',
	    'linker': new bbop.linker(),
	    'handler': new bbop.handler(),
    	    'show_searchbox_p' : true,
    	    'show_filterbox_p' : true,
    	    'show_pager_p' : true,
    	    'show_checkboxes_p' : true,
    	    'spinner_search_source' : '',
    	    'spinner_shield_source' : '',
    	    'spinner_shield_message' : null,
	    'icon_clear_label': _button_wrapper('X', 'Clear text from query'),
	    'icon_clear_source': '',
	    'icon_reset_label': _button_wrapper('!','Reset user query filters'),
	    'icon_reset_source': '',
	    'icon_positive_label': _button_wrapper('+', 'Add positive filter'),
	    'icon_positive_source': '',
	    'icon_negative_label': _button_wrapper('-', 'Add negative filter'),
	    'icon_negative_source': '',
	    'icon_remove_label':_button_wrapper('X','Remove filter from query'),
	    'icon_remove_source': ''
    	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Pull args into variables.
    //var base_icon_url = arg_hash['base_icon_url'];
    //var image_type = arg_hash['image_type'];
    //var layout_type = arg_hash['layout_type'];
    var linker = arg_hash['linker'];
    var handler = arg_hash['handler'];
    var show_searchbox_p = arg_hash['show_searchbox_p'];
    var show_filterbox_p = arg_hash['show_filterbox_p'];
    var show_pager_p = arg_hash['show_pager_p'];
    var show_checkboxes_p = arg_hash['show_checkboxes_p'];
    var spinner_search_source = arg_hash['spinner_search_source'];
    var spinner_shield_source = arg_hash['spinner_shield_source'];
    var spinner_shield_message = arg_hash['spinner_shield_message'];
    var icon_clear_label = arg_hash['icon_clear_label'];
    var icon_clear_source = arg_hash['icon_clear_source'];
    var icon_reset_label = arg_hash['icon_reset_label'];
    var icon_reset_source = arg_hash['icon_reset_source'];
    var icon_positive_label = arg_hash['icon_positive_label'];
    var icon_positive_source = arg_hash['icon_positive_source'];
    var icon_negative_label = arg_hash['icon_negative_label'];
    var icon_negative_source = arg_hash['icon_negative_source'];
    var icon_remove_label = arg_hash['icon_remove_label'];
    var icon_remove_source = arg_hash['icon_remove_source'];

    /*
     * Function: establish_display
     * 
     * Completely redraw the display.
     * 
     * Required to display after setting up the manager.
     * 
     * Also may be useful after a major change to the manager to reset
     * it.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.establish_display = function(){
	
    	// Blow away whatever was there completely.
    	jQuery('#' + interface_id).empty();

    	// Can only make a display if there is a set
    	// personality--there is no general default and it is an
    	// error.
    	var personality = anchor.get_personality();
    	var cclass = golr_conf_obj.get_class(personality);
    	if( ! personality || ! cclass ){
    	    ll('ERROR: no usable personality set');
    	    throw new Error('ERROR: no useable personality set');
    	}

    	///
    	/// Setup UI and bind it to events.
    	///
	
	anchor.ui = new bbop.widget.display.live_search(interface_id, cclass);
	// And add the correct handlers.
	anchor.ui.set_linker(linker);
	anchor.ui.set_handler(handler);

	// Try to add any buttons that we have loafing around into the
	// initial setup.
	anchor.ui.set_buttons(anchor.user_buttons);

	// IF want to show the checkboxes, get them in now.
	if( show_checkboxes_p ){
	    anchor.ui.show_checkboxes_p(true);
	}

	///
    	/// Things to do on every reset event. Essentially re-draw
    	/// everything.
	///

    	if( show_searchbox_p ){ // conditionally display search box stuff
    	    anchor.register('reset', 'reset_query', anchor.ui.reset_query, -1);
	}
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.register('reset', 'sticky_first',
    			    anchor.ui.draw_sticky_filters, -1);
    	    anchor.register('reset', 'curr_first',
    			    anchor.ui.draw_current_filters, -1);
    	    anchor.register('reset', 'accordion_first',
    			    anchor.ui.draw_accordion, -1);
    	}
    	// We're always showing meta and results.
    	anchor.register('reset', 'meta_first', anchor.ui.draw_meta, -1);
    	anchor.register('reset', 'results_first', anchor.ui.draw_results, -1);
	
	// Finally, we're going to add a first run behavior here.
	// We'll wrap the user-defined function into a 
	function _initial_runner(response, manager){
	    // I can't just remove the callback from the register
	    // after the first run because it would be reconstituted
	    // every time it was reset (established).
	    if( anchor.initial_reset_p ){
		anchor.initial_reset_p = false;
		anchor.initial_reset_callback(response, manager);
		//ll('unregister: ' + anchor.unregister('reset', 'first_run'));
	    }
	}
    	anchor.register('reset', 'initial_reset', _initial_runner, -100);

	///
    	/// Things to do on every search event.
	///

    	if( show_searchbox_p ){ // conditionally display search box stuff
	    // TODO: I worry a little about this being rebound after
	    // every keyboard event, but rationally, considering the
	    // rebinds and redraws that are happening down in the
	    // accordion, that seems a little silly.
    	    anchor.register('search', 'draw_query', anchor.ui.draw_query, -1);
	}
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.register('search','sticky_filters_std',
    			    anchor.ui.draw_sticky_filters);
    	    anchor.register('search','curr_filters_std',
    			    anchor.ui.draw_current_filters);
    	    anchor.register('search', 'accordion_std',
			    anchor.ui.draw_accordion);
    	}
    	// These will always be updated after a search.
    	anchor.register('search', 'meta_usual', anchor.ui.draw_meta);
    	anchor.register('search', 'results_usual', anchor.ui.draw_results);
	
    	// Things to do on an error.
    	anchor.register('error', 'results_unusual', anchor.ui.draw_error);	
	
    	// Setup the gross frames for the filters and results.
    	if( show_searchbox_p ){ // conditionally display search box stuff
    	    anchor.ui.setup_query('Free-text filtering',
				  icon_clear_label,
				  icon_clear_source);
	}
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.ui.setup_sticky_filters();
    	    anchor.ui.setup_current_filters(icon_remove_label,
					    icon_remove_source);
    	    anchor.ui.setup_accordion(icon_positive_label,
				      icon_positive_source,
				      icon_negative_label,
				      icon_negative_source,
				      spinner_shield_source,
				      spinner_shield_message);
	}
    	anchor.ui.setup_results({'meta': show_pager_p,
				 'spinner_source': spinner_search_source});
	
    	// // Start the ball with a reset event.
    	//anchor.reset();

	// The display has been established.
	anchor.established_p = true;
    };

    /*
     * Function: get_selected_items
     * 
     * The idea is to return a list of the items selected (with
     * checkboxes) in the display. This means that there are three
     * possibilities. 1) We are not using checkboxes or the display
     * has not been established, so we return null; 2) no or all items
     * have been selected, so we get back an empty list (all == none
     * in our view); 3) a subset list of strings (ids).
     * 
     * NOTE: Naturally, does not function until the display is established.
     * 
     * Parameters:
     *  n/a
     *
     * Returns
     *  string list or null
     */
    this.get_selected_items = function(){
	var retval = null;

	// 
	var gname = anchor.ui.selected_name();
	if( gname ){
	    retval = [];

	    // Cycle through and pull out the values of the checked
	    // ones.
	    var total_count = 0;
	    var nstr = 'input[name=' + gname + ']';
	    jQuery(nstr).each(
		function(){
		    if( this.checked ){
			var val = jQuery(this).val();
			retval.push(val);
		    }
		    total_count++;
		});

	    // If we are selecting all of the items on this page, that
	    // is the same as not selecting any in our world, so reset
	    // and warn.
	    if( total_count > 0 && total_count == retval.length ){
		alert('You can "select" all of the items on a results page by not selecting any (all being the default). This will also get your results processed faster and cause significantly less overhead on the servers.');
		retval = [];
	    }	    
	}

	return retval;
    };

    /*
     * Function: add_button
     * 
     * Add a user-defined button to the display.
     * 
     * NOTE: Does not function until the display is established.
     * 
     * Parameters:
     *  button_definition_hash - ""
     *
     * Returns
     *  n/a
     */
    this.add_button = function(button_definition_hash){
	// Add to our locally stored buttons.
	anchor.user_buttons.push(button_definition_hash);

	if( anchor.established_p && anchor.ui ){
	    anchor.ui.set_buttons(anchor.user_buttons);
	    anchor.ui.draw_user_buttons(anchor);	    
	}
    };

     /*
     * Function: clear_buttons
     * 
     * Remove all user-defined buttons from the display.
     * 
     * NOTE: Does not function until the display is established.
     * 
     * Parameters:
     *  n/a
     *
     * Returns
     *  n/a
     */
    this.clear_buttons = function(){
	// Clear our locally stored buttons.
	anchor.user_buttons = [];

	if( anchor.established_p && anchor.ui ){
	    anchor.ui.set_buttons(anchor.user_buttons);
	    anchor.ui.draw_user_buttons(anchor);	    
	}
    };

    /*
     * Function: set_query_field_text
     * 
     * Push text into the search box. Does not affect the state of the
     * manager in any way.
     * 
     * NOTE: Does not function until the display is established.
     * 
     * Parameters:
     *  query - the text to put into the search box
     *
     * Returns
     *  true or false on whether the task was accomplished
     */
    this.set_query_field_text = function(query){
	var retval = false;	
	if( anchor.established_p && anchor.ui ){
	    retval = anchor.ui.set_query_field(query);
	}
	return retval;
    };

    /*
     * Function: set_initial_reset_callback
     * 
     * Add a callback to be run after the initial reset is finished.
     * 
     * Parameters:
     *  response - the usual
     *  manager - the usual
     *
     * Returns
     *  n/a
     */
    this.set_initial_reset_callback = function(callback){
	anchor.initial_reset_callback = callback;
    };

    // // Now let's run the above function as the initializer.
    // anchor.establish_display();
};
bbop.core.extend(bbop.widget.search_pane, bbop.golr.manager.jquery);
/*
 * Package: live_filters.js
 * 
 * Namespace: bbop.widget.live_filters
 * 
 * BBOP JS object to allow the live probing of a GOlr personality.
 * 
 * Very much like a separated accordion and filter from the search
 * pane.
 * 
 * This is a Bootstrap 3 widget.
 * 
 * TODO/BUG: Needs a wait spinner to something.
 * 
 * See Also:
 *  <search_pane.js>
 *  <live_search.js>
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: live_filters
 * 
 * Contructor for the bbop.widget.live_filters object.
 * 
 * Interactively explore a search personality with no direct side
 * effects.
 *
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  interface_id - string id of the element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.live_filters = function(golr_loc, golr_conf_obj,
				    interface_id, in_argument_hash){
    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.live_filters';

    var anchor = this;
    var each = bbop.core.each;
    
    // TODO/BUG: Remove the need for these.
    var ui_icon_positive_label = '&plus;';
    var ui_icon_positive_source = null;
    var ui_icon_negative_label = '&minus;';
    var ui_icon_negative_source = null;
    var ui_icon_remove_label = '&minus;';
    var ui_icon_remove_source = null;
    var ui_spinner_shield_source = null;
    var ui_spinner_shield_message = '';

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = false;
    //logger.DEBUG = true;
    function ll(str){ logger.kvetch('LF: ' + str); }

    ///
    /// Deal with incoming arguments.
    ///

    this._class_conf = golr_conf_obj;

    // Our argument default hash.
    var default_hash =
	{
	    'meta_label': 'Documents:&nbsp;',
	    'display_meta_p': true,
	    'display_free_text_p': true,
	    'free_text_placeholder': 'Free-text filter',
	    'display_accordion_p': true,
	    'minimum_free_text_length': 3, // wait for three characters or more
	    'on_update_callback': function(){}
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    // 
    this._interface_id = interface_id;
    this._display_meta_p = arg_hash['display_meta_p'];
    this._meta_label = arg_hash['meta_label'];
    this._display_free_text_p = arg_hash['display_free_text_p'];
    this._free_text_placeholder = arg_hash['free_text_placeholder'];
    this._display_accordion_p = arg_hash['display_accordion_p'];
    this._minimum_free_text_length = arg_hash['minimum_free_text_length'];
    this._on_update_callback = arg_hash['on_update_callback'];

    ///
    /// Prepare the interface and setup the div hooks.
    ///

    anchor._established_p = false;

    // Mangle everything around this unique id so we don't collide
    // with other instances on the same page.
    var ui_div_id = this._interface_id;
    var mangle = ui_div_id + '_ui_element_' + bbop.core.uuid() + '_';

    // Main div id hooks to the easily changable areas of the display.
    var container_div_id = mangle + 'container-id';
    // Meta hooks.
    var meta_div_id = mangle + 'meta-id';
    var meta_count_id = mangle + 'meta-count-id';
    var meta_wait_id = mangle + 'meta-wait-id';
    // Query hooks
    var query_input_div_id = mangle + 'query-id';
    // Sticky hooks.
    var sticky_filters_div_id = mangle + 'sticky_filters-id';
    var sticky_title_id = mangle + 'sticky_filters-title-id';
    var sticky_content_id = mangle + 'sticky_filters-content-id';
    // Current hooks.
    var current_filters_div_id = mangle + 'current_filters-id';
    var current_title_id = mangle + 'current_filters-title-id';
    var current_content_id = mangle + 'current_filters-content-id';
    var clear_user_filter_span_id = mangle + 'clear-user-filter-id';
    // Accordion hooks.
    var filters_div_id = mangle + 'ui-filters-wrapper';
    var clear_query_span_id = mangle + 'clear-query-id';
    // var ui_user_button_div_id = mangle + 'user-button-id';
    // var ui_results_table_div_id = mangle + 'results-table-id';
    // var ui_count_control_div_id = mangle + 'count_control-id';

    // Blow away whatever was there completely.
    // Render a control section into HTML. This includes the accordion
    // and current filter sections.
    // Get the user interface hook and remove anything that was there.
    var container_div = new bbop.html.tag('div', {'id': container_div_id});
    jQuery('#' + ui_div_id).empty();
    jQuery('#' + ui_div_id).append(container_div.to_string());

    // // Globally declared (or not) icons.
    // var ui_spinner_search_source = '';
    // var ui_spinner_shield_source = '';
    // var ui_spinner_shield_message = null;
    // var ui_icon_positive_label = '';
    // var ui_icon_positive_source = '';
    // var ui_icon_negative_label = '';
    // var ui_icon_negative_source = '';
    // var ui_icon_remove_label = '';
    // var ui_icon_remove_source = '';

    // // The spinner, if it exists, needs to be accessible by everybody
    // // and safe to use.
    // var spinner = null;
    // function _spinner_gen(elt_id){
    // 	var spinner_args = {
    // 	    //timeout: 5,
    // 	    //timeout: 500,
    // 	    timeout: 10,
    // 	    //classes: 'bbop-widget-search_pane-spinner',
    // 	    visible_p: false
    // 	};
    // 	spinner = new bbop.widget.spinner(elt_id,
    // 					  ui_spinner_search_source,
    // 					  spinner_args);
    // }

    // // Additional id hooks for easy callbacks. While these are not as
    // // easily changable as the above, we use them often enough and
    // // across functions to have a hook.
    // var accordion_div_id = mangle + 'filter-accordion-id';
    
    // // These pointers are used in multiple functions (e.g. both
    // // *_setup and *_draw).
    var filter_accordion_widget = null;
    var spinner_div = null;
    // //var current_filters_div = null;

    function _spin_up(){
    	if( spinner_div ){
	    jQuery('#' + spinner_div.get_id()).removeClass('hidden');
	    jQuery('#' + spinner_div.get_id()).addClass('active');
    	}
    }
    function _spin_down(){
    	if( spinner_div ){
	    jQuery('#' + spinner_div.get_id()).addClass('hidden');
	    jQuery('#' + spinner_div.get_id()).removeClass('active');
    	}
    }

    /*
     * Function: establish_display
     * 
     * Completely redraw the display.
     * 
     * Required to display after setting up the manager.
     * 
     * Also may be useful after a major change to the manager to reset
     * it.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.establish_display = function(){
	
    	// Can only make a display if there is a set
    	// personality--there is no general default and it is an
    	// error.
    	var personality = anchor.get_personality();
    	var cclass = golr_conf_obj.get_class(personality);
    	if( ! personality || ! cclass ){
    	    ll('ERROR: no usable personality set');
    	    throw new Error('ERROR: no useable personality set');
    	}

    	///
    	/// Setup the UI base.
    	///
	
	// Holder for things like spinner and current number of
	// results.
	this.setup_meta = function(){
	    ll('setup_meta for: ' + meta_div_id);
	    
	    // Count area.
	    var ms_attrs = {
		id: meta_count_id,
		//'class': 'label label-default pull-right'
		//'class': 'label label-default'
		'class': 'badge'
	    };
	    var ms = new bbop.html.tag('span', ms_attrs, 'n/a');

	    // Get a progress bar assembled.
	    var inspan = new bbop.html.tag('span', {'class': 'sr-only'}, '...');
	    var indiv = new bbop.html.tag('div', {'class': 'progress-bar',
						  'role': 'progressbar',
						  'aria-valuenow': '100',
						  'aria-valuemin': '0',
						  'aria-valuemax': '100',
						  'style': 'width: 100%;'},
					  inspan);
	    spinner_div =
		new bbop.html.tag('div',
				  {'generate_id': true,
				   'class':
				   'progress progress-striped active pull-right',
				   'style': 'width: 3em;'},
				  indiv);

	    // The container area; add in the label and count.
	    var mdiv_args = {
		'class': 'well well-sm',
		'id': meta_div_id
	    };
	    var mdiv = new bbop.html.tag('div', mdiv_args,
					 [this._meta_label, ms, spinner_div]);
	    
	    jQuery('#' + container_div.get_id()).append(mdiv.to_string());
	};
	if( this._display_meta_p ){
	    this.setup_meta();
	}

	// Setup the free text query display under contructed tags for
	// later population.
	// 
	// If no icon_clear_source is defined, icon_clear_label will be
	// used as the defining text.
	this.setup_query = function(){
	    ll('setup_query for: ' + query_input_div_id);
	    
	    // // Some defaults.
	    // if( ! label_str ){ label_str = ''; }
	    // // if( ! icon_clear_label ){ icon_clear_label = ''; }
	    // // if( ! icon_clear_source ){ icon_clear_source = ''; }
	    
	    // The incoming label.
	    var query_label_attrs = {
		//'class': 'bbop-js-search-pane-query-label'
	    };
	    var query_label_div = new bbop.html.tag('div', query_label_attrs);
	    
	    // The text area.
	    var ta_args = {
		//'class': 'bbop-js-search-pane-textarea',
		'placeholder': this._free_text_placeholder,
		'class': 'form-control bbop-js-live-filters-textarea',
		//'style': 'height: 1em;',
		'rows': '1',
		'id': query_input_div_id
	    };
	    var query_area = new bbop.html.tag('textarea', ta_args);
	    
	    // Figure out an icon or a label.
	    var clear_query_obj =
		//bbop.widget.display.clickable_object(icon_clear_label);
		bbop.widget.display.clickable_object(null);
	    
	    // And a div to put it in.
	    var clear_div_attrs = {
		//'class': 'bbop-js-search-pane-clear-button',
		'generate_id': true
	    };
	    var clear_div =
		new bbop.html.tag('div', clear_div_attrs, clear_query_obj);	
	    
	    // General container div.
	    // NOTE/TODO: this is just a half panel--just wanted spacing.
	    var gen_div_attrs = {
		'class': 'panel panel-default',
		'generate_id': true
	    };
	    var gen_div = new bbop.html.tag('div', gen_div_attrs);
	    
	    // Add to display.
	    query_label_div.add_to(clear_div.to_string());
	    gen_div.add_to(query_label_div.to_string());
	    gen_div.add_to(query_area.to_string());
	    
	    jQuery('#' + container_div.get_id()).append(gen_div.to_string());
	};
	if( this._display_free_text_p ){
	    this.setup_query();
	}

	// Setup sticky filters display under contructed tags for later
	// population. The seeding information is coming in through the
	// GOlr conf class.
	this.setup_sticky_filters = function(){    
    	    ll('setup_sticky_filters UI for class configuration: ' +
	       cclass.id());
	    
    	    // var stitle_attrs = {
    	    // 	'class': 'panel panel-heading',
    	    // 	'id': sticky_title_id
    	    // };
    	    // var stitle =
    	    // 	new bbop.html.tag('div', stitle_attrs,
	    // 			  'No applied sticky filters');

    	    var scont_attrs = {
    		'class': 'panel-body',
    		'id': sticky_content_id
    	    };
    	    var scont =
    		new bbop.html.tag('div', scont_attrs,
				  'No applied sticky filters');

    	    var sticky_filters_attrs = {
    		'class': 'panel panel-default',
    		'id': sticky_filters_div_id
    	    };
    	    var sticky_filters_div =
    		//new bbop.html.tag('div', sticky_filters_attrs, [stitle, scont]);
    		new bbop.html.tag('div', sticky_filters_attrs, scont);
	    
    	    // Add the output to the page.
    	    var sticky_filters_str = sticky_filters_div.to_string();
	    jQuery('#' + container_div.get_id()).append(sticky_filters_str);
	};	
	// Setup current filters display under contructed tags for later
	// population. The seeding information is coming in through the
	// GOlr conf class.
	// 
	// Add in the filter state up here.
	// 
	// If no icon_reset_source is defined, icon_reset_label will be
	// used as the defining text.
	this.setup_current_filters = function(){
    	    ll('setup_current_filters UI for class configuration: ' +
	       cclass.id());
	    
    	    var ccont_attrs = {
    		'class': 'panel-body',
    		'id': current_content_id
    	    };
    	    var ccont =
    		new bbop.html.tag('div', ccont_attrs,
				  'No applied user filters');

    	    var current_filters_attrs = {
    		'class': 'panel panel-default',
    		'id': current_filters_div_id
    	    };
    	    var current_filters_div =
    		//new bbop.html.tag('div', current_filters_attrs, [stitle, scont]);
    		new bbop.html.tag('div', current_filters_attrs, ccont);
	    
    	    // Add the output to the page.
    	    var current_filters_str = current_filters_div.to_string();
	    jQuery('#' + container_div.get_id()).append(current_filters_str);
	};
	// Setup the accordion skeleton under contructed tags for later
	// population. The seeding information is coming in through the
	// GOlr conf class.
	// Start building the accordion here. Not an updatable part.
	// 
	// If no icon_*_source is defined, icon_*_label will be
	// used as the defining text.
	this.setup_accordion = function(){
    	    ll('setup_accordion UI for class configuration: ' +
    	       cclass.id());
	    
    	    var filter_accordion_attrs = {
    		id: filters_div_id
    	    };
    	    filter_accordion_widget = // heavy lifting by special widget
    	    new bbop.html.collapsible([], filter_accordion_attrs);
	    
    	    // Add the sections with no contents as a skeleton to be
    	    // filled by draw_accordion.
    	    var field_list = cclass.field_order_by_weight('filter');
    	    each(field_list,
    		 function(in_field){
    		     ll('saw field: ' + in_field);
    		     var ifield = cclass.get_field(in_field);
    		     var in_attrs = {
    			 id: in_field,
    			 label: ifield.display_name(),
    			 description: ifield.description()
    		     };
    		     filter_accordion_widget.add_to(in_attrs, '', true);
    		 });
	
    	    // Add the output from the accordion to the page.
    	    var accordion_str = filter_accordion_widget.to_string();
    	    jQuery('#' + container_div_id).append(accordion_str);
	};
	if( this._display_accordion_p ){
	    this.setup_current_filters();
	    this.setup_sticky_filters();
	    this.setup_accordion();
	}

    	///
    	/// Define the drawing callbacks, as well as the action hooks.
    	///
	
	/*
	 * Function: draw_meta
	 *
	 * Draw meta results. Includes selector for drop down.
	 * 
	 * (Re)draw the count control with the current information in the
	 * manager. This also tries to set the selector to the response
	 * number (to keep things in sync), unbinds any current "change"
	 * event, and adds a new change event.
	 * 
	 * Parameters:
	 *  response - the <bbop.golr.response> returned from the server
	 *  manager - <bbop.golr.manager> that we initially registered with
	 *
	 * Returns:
	 *  n/a
	 */
	this.draw_meta = function(response, manager){
	    
    	    ll('draw_meta for: ' + meta_div_id);

    	    // Collect numbers for display.
    	    var total_c = response.total_documents();

    	    // Draw meta; the current numbers and page--the same for
    	    // every type of return.
	    // var ms_attrs = {
	    // 	//'class': 'label label-default pull-right'
	    // 	'class': 'label label-default'
	    // };
	    // var ms = new bbop.html.tag('div', ms_attrs, total_c);
    	    jQuery('#' + meta_count_id).empty();
    	    jQuery('#' + meta_count_id).append(total_c);
    	    // if( total_c == 0 ){
    	    // 	jQuery('#' + meta_div_id).append('No results found.');
    	    // }else{
	    // }
    	    // jQuery('#' + meta_div_id).append(ms.to_string());
	};
	if( this._display_meta_p ){
    	    anchor.register('search', 'meta_first', this.draw_meta, -1);
	}

	// Detect whether or not a keyboard event is ignorable.
	function _ignorable_event(event){

    	    var retval = false;

    	    if( event ){
    		var kc = event.keyCode;
    		if( kc ){
    		    if( kc == 39 || // right
			kc == 37 || // left
			kc == 32 || // space
			kc == 20 || // ctl?
			kc == 17 || // ctl?
			kc == 16 || // shift
			//kc ==  8 || // delete
			kc ==  0 ){ // super
    			    ll('ignorable key event: ' + kc);
    			    retval = true;
    			}
		}
    	    }
    	    return retval;
	}

	/*
	 * Function: draw_query
	 *
	 * Draw the query widget. This function makes it active
	 * as well.
	 * 
	 * Clicking the reset button will reset the query to ''.
	 * 
	 * NOTE: Since this is part of the "persistant" interface (i.e. it
	 * does not get wiped after every call), we make sure to clear the
	 * event listeners when we redraw the function to prevent them from
	 * building up.
	 * 
	 * Parameters:
	 *  response - the <bbop.golr.response> returned from the server
	 *  manager - <bbop.golr.manager> that we initially registered with
	 *
	 * Returns:
	 *  n/a
	 */
	this.draw_query = function(response, manager){
    	    ll('draw_query for: ' + query_input_div_id);

    	    // Add a smartish listener.
    	    jQuery('#' + query_input_div_id).unbind('keyup');
    	    jQuery('#' + query_input_div_id).keyup(
    		function(event){

    		    // If we're left with a legitimate event, handle it.
    		    if( ! _ignorable_event(event) ){

    			// Can't ignore it anymore, so it goes into the
    			// manager for testing.
    			var tmp_q = manager.get_query();
    			var input_text = jQuery(this).val();
    			manager.set_query(input_text);

    			// If the manager feels like it's right, trigger.
    			if( manager.sensible_query_p() ){
    			    ll('keeping set query: ' + input_text);
    			    // Set the query to be more "usable" just
    			    // before triggering (so the tests can't be
    			    // confused by our switch).
    			    manager.set_comfy_query(input_text);
    			    manager.search();

    			    // We are now searching--show it.
    			    _spin_up();
    			}else{
    			    ll('rolling back query: ' + tmp_q);		    
    			    manager.set_query(tmp_q);
    			}
    		    }
    		});

    	    // Now reset the clear button and immediately set the event.
    	    jQuery('#' + clear_query_span_id).unbind('click');
    	    jQuery('#' + clear_query_span_id).click(
    		function(){
    		    manager.reset_query();
    		    //anchor.set_query_field(manager.get_query());
    		    anchor.set_query_field('');
    		    manager.search();
    		    // We are now searching--show it.
    		    _spin_up();
    		});
	};
	if( this._display_free_text_p ){
    	    anchor.register('search', 'query_first', this.draw_query, 0);
	}
	
	/*
	 * Function: draw_accordion
	 *
	 * (Re)draw the information in the accordion controls/filters.
	 * This function makes them active as well.
	 * 
	 * Parameters:
	 *  response - the <bbop.golr.response> returned from the server
	 *  manager - <bbop.golr.manager> that we initially registered with
	 *
	 * Returns:
	 *  n/a
	 */
	this.draw_accordion = function(response, manager){	    
    	    ll('draw_accordion for: ' + filters_div_id);

	    //
    	    // Make sure that accordion has already been inited.
    	    if( typeof(filter_accordion_widget) == 'undefined' ){
    		throw new Error('Need to init accordion widget to use it.');
    	    }

    	    // We'll need this in a little bit for calculating when to
    	    // display the "more" option for the field filters.
    	    var real_facet_limit = manager.get_facet_limit();
    	    var curr_facet_limit = real_facet_limit -1; // the facets we'll show

    	    // We want this so we can filter out any facets that have the
    	    // same count as the current response total--these facets are
    	    // pretty much information free.
    	    var total_docs = response.total_documents();

    	    // A helper function for when no filters are
    	    // displayed.
    	    function _nothing_to_see_here(in_field){
    		var section_id =
		    filter_accordion_widget.get_section_id(in_field);
    		jQuery('#' + section_id).empty();
    		jQuery('#' + section_id).append('Nothing to filter.');
    	    }

    	    // Hash where we collect our button information.
    	    // button_id -> [source, filter, count, polarity];
    	    var button_hash = {};

    	    // And a hash to store information to be able to generate the
    	    // complete filter shields.
    	    // span_id -> filter_id
    	    var overflow_hash = {};

    	    // Cycle through each facet field; all the items in each,
    	    // create the lists and buttons (while collectong data useful
    	    // in creating the callbacks) and put them into the accordion.
    	    each(response.facet_field_list(),
    		 function(in_field){

    		     var facet_bd = response.facet_field(in_field);
    		     if( bbop.core.is_empty(facet_bd) ){
			 
    			 // No filters means nothing in the box.
    			 _nothing_to_see_here(in_field);

    		     }else{
			 
    			 // Create ul lists of the facet contents.
    			 var tbl_id = mangle + 'filter-list-' + in_field;
    			 var facet_list_tbl_attrs = {
			     'class': 'table table-hover table-striped table-condensed',
    			     'id': tbl_id
    			 };

    			 var facet_list_tbl =
    			     new bbop.html.table([], [], facet_list_tbl_attrs);
			 
    			 ll("consider:" + in_field + ": " +
    			    response.facet_field(in_field).length);

    			 // BUG/TODO:
    			 // Count the number of redundant (not shown)
    			 // facets so we can at least give a face to this
    			 // bug/problem.
    			 // Also filter out "empty filters".
    			 var redundant_count = 0;
    			 // Now go through and get filters and counts.
    			 var good_count = 0; // only count when good
    			 var overflow_p = false; // true when at 24 -> 25
    			 each(response.facet_field(in_field),
    			      function(ff_field, ff_index){

    				  // Pull out info early so we can test it
    				  // for information content.
    				  var f_name = ff_field[0];
    				  var f_count = ff_field[1];
				  
    				  // ll(in_field + ": " + f_name + ": " +
    				  // 	 [f_count,
    				  // 	  total_docs,
    				  // 	  ff_index,
    				  // 	  good_count,
    				  // 	  redundant_count,
    				  // 	  real_facet_limit].join(', '));
			      	  
    				  // TODO: The field is likely redundant
    				  // (BUG: not always true in closures),
    				  // so eliminate it.
    				  if( f_count == total_docs ){
    				      //ll("\tnothing here");
    				      redundant_count++;
    				  }else if( ! f_name || f_name == "" ){
    				      // Straight out skip if it is an
    				      // "empty" facet field.
    				  }else if( ff_index < real_facet_limit -1 ){
    				      //ll("\tgood row");
    				      good_count++;

    				      // Create buttons and store them for later
    				      // activation with callbacks to
    				      // the manager.
    				      var b_plus =
    					  new bbop.html.button(
    					      ui_icon_positive_label,
					      {
						  'generate_id': true,
						  'type': 'button',
						  'class':
						  'btn btn-success btn-xs'
					      });
    				      var b_minus =
    					  new bbop.html.button(
    					      ui_icon_negative_label,
					      {
						  'generate_id': true,
						  'type': 'button',
						  'class':
						  'btn btn-danger btn-xs'
					      });
				      
    				      // Store in hash for later keying to
    				      // event.
    				      button_hash[b_plus.get_id()] =
    					  [in_field, f_name, f_count, '+'];
    				      button_hash[b_minus.get_id()] =
    					  [in_field, f_name, f_count, '-'];
				      
    				      // // Add the label and buttons to the
    				      // // appropriate ul list.
    				      //facet_list_ul.add_to(
    				      // fstr,b_plus.to_string(),
    				      //   b_minus.to_string());
    				      // Add the label and buttons to the table.
    				      facet_list_tbl.add_to([f_name,
    							     '('+ f_count+ ')',
    							     b_plus.to_string(),
    							     b_minus.to_string()
    							    ]);
    				  }
				  
    				  // This must be logically separated from
    				  // the above since we still want to show
    				  // more even if all of the top 25 are
    				  // redundant.
    				  if( ff_index == real_facet_limit -1 ){
    				      // Add the more button if we get up to
    				      // this many facet rows. This should
    				      // only happen on the last possible
    				      // iteration.
				      
    				      overflow_p = true;
    				      //ll( "\tadd [more]");
				      
    				      // Since this is the overflow item,
    				      // add a span that can be clicked on
    				      // to get the full filter list.
    				      //ll("Overflow for " + in_field);
    				      var b_over = new bbop.html.button(
    					  'more...',
					  {
					      'generate_id': true,
					      'type': 'button',
					      'title':
					      'Display the complete list',
					      'class':
					      'btn btn-primary btn-xs'
					  });
    				      facet_list_tbl.add_to([b_over.to_string(),
    				  			     '', '']);
    				      overflow_hash[b_over.get_id()] = in_field;
    				  }
    			      });

    			 // There is a case when we have filtered out all
    			 // avilable filters (think db source).
    			 if( good_count == 0 && ! overflow_p ){
    			     _nothing_to_see_here(in_field);
    			 }else{
    			     // Otherwise, now add the ul to the
    			     // appropriate section of the accordion in
    			     // the DOM.
    			     var sect_id =
    				 filter_accordion_widget.get_section_id(in_field);
    			     jQuery('#' + sect_id).empty();

    			     // TODO/BUG:
    			     // Give warning to the redundant facets.
    			     var warn_txt = null;
    			     if( redundant_count == 1 ){
    				 warn_txt = "field is";
    			     }else if( redundant_count > 1 ){
    				 warn_txt = "fields are";
    			     }
    			     if( warn_txt ){
    				 jQuery('#' + sect_id).append(
    				     "<small> The top (" + redundant_count +
    					 ") redundant " + warn_txt + " not shown" +
    					 "</small>");
				 
    			     }

    			     // Add facet table.
    			     var final_tbl_str = facet_list_tbl.to_string();
    			     jQuery('#' + sect_id).append(final_tbl_str);
    			 }
    		     }
    		 });

    	    // Okay, now introducing a function that we'll be using a
    	    // couple of times in our callbacks. Given a button id (from
    	    // a button hash) and the [field, filter, count, polarity]
    	    // values from the props, make a button-y thing an active
    	    // filter.
    	    function filter_select_live(button_id, create_time_button_props){
    		//var bid = button_id;
    		//var in_field = create_time_button_props[0];	 
    		//var in_filter = create_time_button_props[1];
    		//var in_count = create_time_button_props[2];
    		var in_polarity = create_time_button_props[3];

    		// Decide on the button graphical elements.
    		var b_ui_icon = 'ui-icon-plus';
    		if( in_polarity == '-' ){
    		    b_ui_icon = 'ui-icon-minus';
    		}
    		var b_ui_props = {
    		    icons: { primary: b_ui_icon},
    		    text: false
    		};

    		// Create the button and immediately add the event.
    		//jQuery('#' + button_id).button(b_ui_props).click(
    		jQuery('#' + button_id).click(
    		    function(){
    			var tid = jQuery(this).attr('id');
    			var call_time_button_props = button_hash[tid];
    			var call_field = call_time_button_props[0];	 
    			var call_filter = call_time_button_props[1];
    			//var in_count = button_props[2];
    			var call_polarity = call_time_button_props[3];
			
    			// Change manager and fire.
    			// var bstr =call_field+' '+call_filter+' '+call_polarity;
    			// alert(bstr);
    			manager.add_query_filter(call_field, call_filter,
    			  			 [call_polarity]);
    			manager.search();
    			// We are now searching--show it.
    			_spin_up();
    		    });
    	    }

    	    // Now let's go back and add the buttons, styles,
    	    // events, etc. in the main accordion section.
    	    each(button_hash, filter_select_live);

    	    // Next, tie the events to the "more" spans.
    	    each(overflow_hash,
    		 function(button_id, filter_name){
    		     jQuery('#' + button_id).click(

    			 // On click, set that one field to limitless in
    			 // the manager, setup a shield, and wait for the
    			 // callback.
    			 function(){

    			     // Recover the field name.
    			     var tid = jQuery(this).attr('id');
    			     var call_time_field_name = overflow_hash[tid];
    			     //alert(call_time_field_name);

    			     // Set the manager to no limit on that field and
    			     // only rturn the information that we want.
    			     manager.set_facet_limit(0);
    			     manager.set_facet_limit(call_time_field_name, -1);
    			     var curr_row = manager.get('rows');
    			     manager.set('rows', 0);

    			     // Create the shield and pop-up the
    			     // placeholder.
    			     var fs = bbop.widget.display.filter_shield;
    			     var filter_shield = new fs(ui_spinner_shield_source,
    							ui_spinner_shield_message); 
    			     filter_shield.start_wait();

    			     // Open the populated shield.
    			     function draw_shield(resp){

    				 // ll("shield what: " + bbop.core.what_is(resp));
    				 // ll("shield resp: " + bbop.core.dump(resp));

    				 // First, extract the fields from the
    				 // minimal response.
    				 var fina = call_time_field_name;
    				 var flist = resp.facet_field(call_time_field_name);

    				 // Draw the proper contents of the shield.
    				 filter_shield.draw(fina, flist, manager);
    			     }
    			     manager.fetch(draw_shield);

    			     // Reset the manager to more sane settings.
    			     manager.reset_facet_limit();
    			     manager.set('rows', curr_row);
    			 });
    		 });

    	    ll('Done current accordion for: ' + filters_div_id);
	};

	/*
	 * Function: draw_current_filters
	 *
	 * (Re)draw the information on the current filter set.
	 * This function makes them active as well.
	 * 
	 * Parameters:
	 *  response - the <bbop.golr.response> returned from the server
	 *  manager - <bbop.golr.manager> that we initially registered with
	 *
	 * Returns:
	 *  n/a
	 */
	this.draw_current_filters = function(response, manager){	
		ll('draw_current_filters for: ' + current_filters_div_id);

		///
		/// Add in the actual HTML for the filters and buttons. While
		/// doing so, tie a unique id to the filter--we'll use that
		/// later on to add buttons and events to them.
		///

		// First, we need to make the filter clear button for the top
		// of the table.
		var b_cf = new bbop.html.button('&times;',
						{
		     				    'type': 'button',
						    'id':
						    clear_user_filter_span_id,
						    'class':
						    'btn btn-danger btn-xs',
						    'title':
						    'Clear all user filters'
						});

		var in_query_filters = response.query_filters();
		//var sticky_query_filters = manager.get_sticky_query_filters();
		ll('filters: ' + bbop.core.dump(in_query_filters));
		var fq_list_tbl =
		    new bbop.html.table(['', 'User filters', b_cf.to_string()],
					[],
//				       	{'class': 'bbop-js-search-pane-filter-table'});
				       	{'class': 'table table-hover table-striped table-condensed'});
		var has_fq_p = false; // assume there are no filters to begin with
		var button_hash = {};
		each(in_query_filters,
		     function(field, field_vals){
			 each(field_vals,
			      function(field_val, polarity){

				  // Make note of stickiness, skip adding if sticky.
				  var qfp =
				      manager.get_query_filter_properties(field,
									  field_val);
				  if( ! qfp || qfp['sticky_p'] == false ){
	
				      // Note the fact that we actually have a
				      // query filter to work with and display.
				      has_fq_p = true;

				      // Boolean value to a character.
				      var polstr = '&minus;';
				      if( polarity ){ polstr = '&plus;'; }


				      // Argh! Real jQuery buttons are way too slow!
				      // var b = new bbop.html.button('remove filter',
				      // 		  {'generate_id': true});

				      // Generate a button with a unique id.
				      var b = new bbop.html.button(
					  ui_icon_remove_label,
					  {
					      'generate_id': true,
					      'type': 'button',
					      'title': 'Remove filter',
					      'class':
					      'btn btn-danger btn-xs'
					  });

				      // Tie the button it to the filter for
				      // jQuery and events attachment later on.
				      var bid = b.get_id();
				      button_hash[bid] = [polstr, field, field_val];
	
				      //ll(label_str +' '+ bid);
				      //fq_list_tbl.add_to(label_str +' '+ b.to_string());
				      fq_list_tbl.add_to(['<strong>'+ polstr +'</strong>',
							  field + ': ' + field_val,
							  b.to_string()]);
				      //label_str +' '+ b.to_string());
				  }
			      });
		     });

		// Either add to the display, or display the "empty" message.
		var cfid = '#' + current_content_id;
		jQuery(cfid).empty();
		if( ! has_fq_p ){
		    jQuery(cfid).append("No current user filters.");
		}else{

		    // With this, the buttons will be attached to the
		    // DOM...
		    jQuery(cfid).append(fq_list_tbl.to_string());
	
		    // First, lets add the reset for all of the filters.
		    jQuery('#' + b_cf.get_id()).click(
			function(){
	   		    manager.reset_query_filters();
	   		    manager.search();
			    // We are now searching--show it.
			    _spin_up();
			}		
		    );

		    // Now let's go back and add the buttons, styles,
		    // events, etc. to the filters.
		    each(button_hash,
			 function(button_id){
			     var bid = button_id;

			     // // Get the button.
			     // var bprops = {
			     // 	 icons: { primary: "ui-icon-close"},
			     // 	 text: false
			     // };
			     // Create the button and immediately add the event.
			     //jQuery('#' + bid).button(bprops).click(
			     jQuery('#' + bid).click(
				 function(){
				     var tid = jQuery(this).attr('id');
				     var button_props = button_hash[tid];
				     var polstr = button_props[0];
				     var field = button_props[1];
				     var value = button_props[2];

				     // Change manager and fire.
				     // var lstr = polstr +' '+ field +' '+ value;
				     // alert(lstr);
				     // manager.remove_query_filter(field,value,
				     // 				 [polstr, '*']);
				     manager.remove_query_filter(field, value);
				     manager.search();
				     // We are now searching--show it.
				     _spin_up();
				 });
			 });
		}
	};

	/*
	 * Function: draw_sticky_filters
	 *
	 * (Re)draw the information on the sticky filter set.
	 * 
	 * Parameters:
	 *  response - the <bbop.golr.response> returned from the server
	 *  manager - <bbop.golr.manager> that we initially registered with
	 *
	 * Returns:
	 *  n/a
	 */
	this.draw_sticky_filters = function(response, manager){	    
    	    ll('draw_sticky_filters for: ' + sticky_filters_div_id);

    	    // Add in the actual HTML for the pinned filters and buttons.
    	    var sticky_query_filters = manager.get_sticky_query_filters();
    	    ll('sticky filters: ' + bbop.core.dump(sticky_query_filters));
    	    var fq_list_tbl =
    		new bbop.html.table(['', 'Your search is pinned to these filters'],
    				    [],
    			       	    {'class': 'table table-hover table-striped table-condensed'});
    	    // [{'filter': A, 'value': B, 'negative_p': C, 'sticky_p': D}, ...]
    	    each(sticky_query_filters,
    		 function(fset){

    		     //
    		     var sfield = fset['filter'];
    		     var sfield_val = fset['value'];

    		     // Boolean value to a character.
    		     var polarity = fset['negative_p'];
    		     var polstr = '&minus;';
    		     if( polarity ){ polstr = '&plus;'; }

    		     // Generate a button with a unique id.
    		     var label_str = polstr + ' ' + sfield + ':' + sfield_val;
    		     fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
    					 sfield + ': ' + sfield_val]);
    		 });
	    
    	    // Either add to the display, or display the "empty" message.
    	    //var sfid = '#' + sticky_filters_div_id;
    	    var sfid = '#' + sticky_content_id;
    	    jQuery(sfid).empty();
    	    if( sticky_query_filters.length == 0 ){
    		jQuery(sfid).append("No sticky filters.");
    	    }else{
    		// Attach to the DOM...
    		jQuery(sfid).append(fq_list_tbl.to_string());
    	    }
	};

	if( this._display_accordion_p ){
    	    anchor.register('search', 'accrdn_first', this.draw_accordion, 1);
    	    anchor.register('search', 'current_first',
			    this.draw_current_filters, 2);
    	    anchor.register('search', 'sticky_first',
			    this.draw_sticky_filters, 3);
	}

	/*
	 * Function: draw_error
	 *
	 * Somehow report an error to the user.
	 * 
	 * Parameters:
	 *  error_message - a string(?) describing the error
	 *  manager - <bbop.golr.manager> that we initially registered with
	 *
	 * Returns:
	 *  n/a
	 */
	this.draw_error = function(error_message, manager){
    	    ll("draw_error: " + error_message);
    	    alert("Runtime error: " + error_message);
    	    _spin_down();
	};
    	anchor.register('error', 'error_first', this.draw_error, 0);

	// 
	function spin_down_wait(){
	    _spin_down();
	}
    	anchor.register('search', 'donedonedone', spin_down_wait, -100);

	///
    	// /// Things to do on every reset event. Essentially re-draw
    	// /// everything.
	// ///

    	// if( show_searchbox_p ){ // conditionally display search box stuff
    	//     anchor.register('reset', 'reset_query', anchor.ui.reset_query, -1);
	// }
    	// if( show_filterbox_p ){ // conditionally display filter stuff
    	//     anchor.register('reset', 'sticky_first',
    	// 		    anchor.ui.draw_sticky_filters, -1);
    	//     anchor.register('reset', 'curr_first',
    	// 		    anchor.ui.draw_current_filters, -1);
    	//     anchor.register('reset', 'accordion_first',
    	// 		    anchor.ui.draw_accordion, -1);
    	// }
    	// // We're always showing meta and results.
    	// anchor.register('reset', 'meta_first', anchor.ui.draw_meta, -1);
    	// anchor.register('reset', 'results_first', anchor.ui.draw_results, -1);
	
	// // Finally, we're going to add a first run behavior here.
	// // We'll wrap the user-defined function into a 
	// function _initial_runner(response, manager){
	//     // I can't just remove the callback from the register
	//     // after the first run because it would be reconstituted
	//     // every time it was reset (established).
	//     if( anchor.initial_reset_p ){
	// 	anchor.initial_reset_p = false;
	// 	anchor.initial_reset_callback(response, manager);
	// 	//ll('unregister: ' + anchor.unregister('reset', 'first_run'));
	//     }
	// }
    	// anchor.register('reset', 'initial_reset', _initial_runner, -100);

	// ///
    	// /// Things to do on every search event.
	// ///

    	// if( show_searchbox_p ){ // conditionally display search box stuff
	//     // TODO: I worry a little about this being rebound after
	//     // every keyboard event, but rationally, considering the
	//     // rebinds and redraws that are happening down in the
	//     // accordion, that seems a little silly.
    	//     anchor.register('search', 'draw_query', anchor.ui.draw_query, -1);
	// }
    	// if( show_filterbox_p ){ // conditionally display filter stuff
    	//     anchor.register('search','sticky_filters_std',
    	// 		    anchor.ui.draw_sticky_filters);
    	//     anchor.register('search','curr_filters_std',
    	// 		    anchor.ui.draw_current_filters);
    	//     anchor.register('search', 'accordion_std',
	// 		    anchor.ui.draw_accordion);
    	// }
    	// // These will always be updated after a search.
    	// anchor.register('search', 'meta_usual', anchor.ui.draw_meta);
    	// anchor.register('search', 'results_usual', anchor.ui.draw_results);
	
    	// // Things to do on an error.
    	// anchor.register('error', 'results_unusual', anchor.ui.draw_error);	
	
    	// // Setup the gross frames for the filters and results.
    	// if( show_searchbox_p ){ // conditionally display search box stuff
    	//     anchor.ui.setup_query('Free-text filtering',
	// 			  icon_clear_label,
	// 			  icon_clear_source);
	// }
    	// if( show_filterbox_p ){ // conditionally display filter stuff
    	//     anchor.ui.setup_sticky_filters();
    	//     anchor.ui.setup_current_filters(icon_remove_label,
	// 				    icon_remove_source);
    	//     anchor.ui.setup_accordion(icon_positive_label,
	// 			      icon_positive_source,
	// 			      icon_negative_label,
	// 			      icon_negative_source,
	// 			      spinner_shield_source,
	// 			      spinner_shield_message);
	// }
    	// anchor.ui.setup_results({'meta': show_pager_p,
	// 			 'spinner_source': spinner_search_source});
	
    	// Start the ball with a reset event.
    	anchor.search();

	// The display has been established.
	anchor._established_p = true;
    };

    // /*
    //  * Function: reset_query
    //  *
    //  * Simply reset the query and then redraw (rebind) the query.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  * 
    //  * See:
    //  *  <draw_query>
    //  */
    // this.reset_query = function(response, manager){

    // 	ll('reset_query for: ' + ui_query_input_id);

    // 	// Reset manager back to the default.
    // 	manager.reset_query();

    // 	anchor.draw_query(response, manager);
    // };

    // /*
    //  * Function: set_query_field
    //  *
    //  * Set the text in the search query field box.
    //  * 
    //  * If no query is set, the field is cleared.
    //  * 
    //  * Parameters:
    //  *  query - *[optional]* string
    //  *
    //  * Returns:
    //  *  true or false on whether the task was accomplished
    //  */
    // this.set_query_field = function(query){
    // 	var retval = false;
    // 	if( ! query ){
    // 	    query = '';
    // 	}
    // 	if( jQuery('#' + ui_query_input_id) ){
    // 	    ll("changing query search field: to " + query);
    // 	    jQuery('#' + ui_query_input_id).val(query);
    // 	    //jQuery('#' + ui_query_input_id).keyup();
    // 	    retval = true;
    // 	}
    // 	return retval;
    // };
};
bbop.core.extend(bbop.widget.live_filters, bbop.golr.manager.jquery);
/*
 * Package: repl.js
 * 
 * Namespace: bbop.widget.repl
 * 
 * A self-contained flexible REPL to use as a base to explore the BBOP
 * environment that you setup.
 * 
 * This is a completely self-contained UI and manager.
 * 
 * WARNING: This widget cannot display any kind of HTML tags in the
 * log.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: repl
 * 
 * Contructor for the bbop.widget.repl object.
 * 
 * The in_argument_hash has the following options.
 * 
 *  buffer_id - the id of the evaluation buffer textarea (default: null/random)
 *  cli_id - the id of the CLI textarea (default: null/random)
 *  display_initial_commands_p - (default true)
 * 
 * If you do not specify ids for the inputs, random ones will be
 * generated.
 * 
 * Arguments:
 *  interface_id - string id of the element to build on
 *  initial_commands - a list of initial commands to feed the interpreter
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.repl = function(interface_id, initial_commands, in_argument_hash){
    this._is_a = 'bbop.widget.repl';

    // Aliases.
    var anchor = this;
    var loop = bbop.core.each;
    
    // Our argument default hash.
    var default_hash =
	{
	    'buffer_id': null,
	    'cli_id': null,
	    'display_initial_commands_p': true
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var in_buffer_id = arg_hash['buffer_id'];
    var in_cli_id = arg_hash['cli_id'];
    var display_initial_commands_p = arg_hash['display_initial_commands_p'];

    // Get no commands if nothing else.
    var init_buffer = initial_commands || [];
    
    // The main div we'll work with.
    var repl_id = interface_id;
    jQuery('#' + repl_id).empty();

    // Save our CLI history as we go.
    var history_pointer = 0;
    var history_list = [''];

    ///
    /// Setup the HTML and layout on the page.
    ///

    // Env into work buffer.
    var command_buffer_args = {'rows': '12', cols:'80'};
    if( in_buffer_id ){
	command_buffer_args['id'] = in_buffer_id;
    }else{
	command_buffer_args['generate_id'] = true;
    }
    var command_buffer = new bbop.html.tag('textarea', command_buffer_args,
					   init_buffer.join("\n"));	
    jQuery('#' + repl_id).append(command_buffer.to_string());
    
    jQuery('#' + repl_id).append('<br />');

    // Command buffer eval button.
    var command_buffer_button = new bbop.html.button('Evaluate buffer',
	    				   {'generate_id': true});
    jQuery('#' + repl_id).append(command_buffer_button.to_string());

    // Clear buffer button.
    var clear_buffer_button = new bbop.html.button('Clear buffer',
	    					   {'generate_id': true});
    jQuery('#' + repl_id).append(clear_buffer_button.to_string());

    // Clear log button.
    var clear_log_button = new bbop.html.button('Clear log',
	    					{'generate_id': true});
    jQuery('#' + repl_id).append(clear_log_button.to_string());

    jQuery('#' + repl_id).append('<br />');

    // Log (+ clear botton).
    // //var logging_console_id = 'bbop-logger-console-text';
    // var logging_console_id = 'bbop-logger-console-textarea';
    // var logging_console = new bbop.html.tag('textarea',
    // 					    {'rows': '7', cols:'80',
    // 					     'readonly': 'readonly',
    // 					     'id': logging_console_id});
    var logging_console_id = 'bbop-logger-console-html';
    var logging_console = new bbop.html.tag('div',
    					    {'id': logging_console_id,
					     'class': 'nowrap',
    					     'style': 'height: 7em; width: 40em; border: 1px solid #888888; overflow: auto;'});
    jQuery('#' + repl_id).append(logging_console.to_string());

    //jQuery('#' + repl_id).append('<br />');

    // A usage message.
    var cli_msg = new bbop.html.tag('span', {},
				    "[eval: return; ctrl+up/down: history]:");
    jQuery('#' + repl_id).append(cli_msg.to_string());
    jQuery('#' + repl_id).append('<br />');

    // Command line.
    var command_line_args = {'rows': '1', cols:'80'};
    if( in_cli_id ){
	command_line_args['id'] = in_cli_id;
    }else{
	command_line_args['generate_id'] = true;
    }
    var command_line = new bbop.html.tag('textarea', command_line_args);
    jQuery('#' + repl_id).append(command_line.to_string());

    ///
    /// Core helper functions.
    ///

    // Per-UI logger. Notice that we waited until after the log div
    // was added to run this to make sure we bind to the right spot.
    var rlogger = new bbop.logger();
    rlogger.DEBUG = true;
    //function log(str){ rlogger.kvetch('repl (pre): ' + str); }
    function log(str){ rlogger.kvetch(str); }

    // Advance the log to the bottom.
    function _advance_log_to_bottom(){
    	// var cons = jQuery('#' + logging_console_id);
    	// var foo = cons.scrollTop(cons[0].scrollHeight);	
    };

    // Eval!
    function _evaluate(to_eval){

	var retval = null;
	var retval_str = '';
	var okay_p = true;

	try{
	    // If we get through this, things have gone well.
	    // Global eval actually kind of tricky:
	    //  http://perfectionkills.com/global-eval-what-are-the-options/
	    //var ret = eval(to_eval);
	    //var ret = jQuery.globalEval(to_eval);
	    retval = window.eval(to_eval);
	    if( bbop.core.is_defined(retval) ){
		//log('// in def if');
		if( bbop.core.what_is(retval) == 'string' ){
		    // // log('// in str if');
		    // retval_str = retval;
		    // // var gt_re = new RegExp("/\>/", "gi");
		    // // var lt_re = new RegExp("/\</", "gi");
		    // retval_str.replace(">", "&gt;");
		    // retval_str.replace("<", "&lt;");
		    // //retval_str = '<pre>' + retval_str + '</pre>';
		    // // log('// end: (' + retval_str + ')');
		    // retval_str = '<code>' + retval_str + '</code>';
		    // retval_str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		    retval_str = '"' + retval + '"';
		}else{
		    retval_str = retval; // worth a try at least
		}
	    }else{
		// Maybe undefined, but probably just no return value.
		//retval_str = '[undefined]';
		retval_str = '';
	    }
	}catch (x){
	    // Bad things happened.
	    retval = null;
	    retval_str = '[n/a]';
	    okay_p = false;
	}

	return [retval, retval_str, okay_p];
    }

    // Update the CLI to the current point in the history.
    function _update_cli(){

	var item = history_list[history_pointer];
	jQuery('#' + command_line.get_id()).val(item);
	//log('// [history]: ' + item);
	//log('// history: '+history_pointer+', '+history_list.length);
	//_advance_log_to_bottom();
    }

    ///
    /// Build callbacks.
    ///
    
    // A lot of cases for button presses when reading from the command
    // line.
    function read_cli(event){

	var which = event.which;
	var ctrl_p = event.ctrlKey;
	//log('cli: ' + which + ', ' + ctrl_p);

	if ( which == 13 ) { // return
	    
	    // Stop events.
	    event.preventDefault();
	    
	    // Get and ensure nice JS, wipe CLI clean.
	    var to_eval = jQuery('#' + command_line.get_id()).val();
	    if( to_eval != '' ){
		jQuery('#' + command_line.get_id()).val('');
		
		// Enter the new command into our history and bump the
		// index to the last thing pushed on.
		history_list.pop(); // pop the empty ''
		history_list.push(to_eval);
		history_list.push(''); // push new empty ''
		history_pointer = history_list.length -1;
		//log('// history: '+history_pointer+', '+history_list.length);
		
		// Log, eval, log.
		to_eval = bbop.core.ensure(to_eval, ';', 'back');
		log(to_eval);
		var evals = _evaluate(to_eval);
		log('// ' + evals[1]);
		_advance_log_to_bottom();

		return false;
	    }
	}else if( ctrl_p && which == 38 ){ // ctrl + up

	    // Stop stuff?
	    event.preventDefault();

	    if( history_pointer == 0 ){
		_update_cli();
	    }else if( history_pointer > 0 ){
		history_pointer--;
		_update_cli();
	    }

	    return false;

	}else if( ctrl_p && which == 40 ){ // ctrl + down

	    // Stop stuff?
	    event.preventDefault();

	    if( history_pointer < history_list.length -1 ){
		history_pointer++;
		_update_cli();
	    }

	    return false;
	}

	return true;
    }
    jQuery('#' + command_line.get_id()).keydown(read_cli);

    // Bind buffer eval.
    function read_buffer(){
	var to_eval = jQuery('#' + command_buffer.get_id()).val();
	if( to_eval != '' ){
	    log('// Evaluating buffer...');
	    var evals = _evaluate(to_eval);
	    log('// ' + evals[1]);
	    _advance_log_to_bottom();
	}
    }
    var cbbid = '#' + command_buffer_button.get_id();
    var command_buffer_button_props = {
	icons: { primary: "ui-icon-play"},
	disabled: false,
	text: true
    };    
    jQuery(cbbid).button(command_buffer_button_props).click(read_buffer);

    // Bind buffer clear.
    function clear_buffer(){
	//jQuery('#' + logging_console_id).val('');
	//alert('to clear: ' + command_buffer.get_id());
	// FF, at least, does something weird here and empty() does
	// not always work--doubling seems to be file.
	jQuery('#' + command_buffer.get_id()).val('');
	//jQuery('#' + command_buffer.get_id()).empty();
    }
    var cbuid = '#' + clear_buffer_button.get_id();
    var clear_buffer_button_props = {
	icons: { primary: "ui-icon-trash"},
	disabled: false,
	text: true
    };
    jQuery(cbuid).button(clear_buffer_button_props).click(clear_buffer);

    // Bind log clear.
    function clear_log(){
	//jQuery('#' + logging_console_id).val('');
	jQuery('#' + logging_console_id).empty();
    }
    var clbid = '#' + clear_log_button.get_id();
    var clear_log_button_props = {
	icons: { primary: "ui-icon-trash"},
	disabled: false,
	text: true
    };
    jQuery(clbid).button(clear_log_button_props).click(clear_log);

    ///
    /// Bootstrap session.
    ///

    // Evaluate what we initially put in the command buffer.
    jQuery(cbbid).click(); // run the stuff in the buffer
    if( display_initial_commands_p == false ){ // maybe make it disappear
	clear_buffer();
	clear_log();
    }
    log('// [Session start.]');

    ///
    /// External use methods.
    ///

    /*
     * Function: get_id
     * 
     * Get the id of different components in the REPL.
     * 
     * Currently supported arguments are:
     *  - 'buffer'
     * 
     * Arguments:
     *  str - the item you want to check
     * 
     * Returns:
     *  string or null
     */
    this.get_id = function(str){

	var retval = null;

	if( str ){
	    if( str == 'buffer' ){
		retval = command_buffer.get_id();
	    }
	}

	return retval;
    };

    /*
     * Function: replace_buffer_text
     * 
     * Replace the buffer text with new text.
     * 
     * Arguments:
     *  str - the new text for the command buffer
     * 
     * Returns:
     *  n/a
     */
    this.replace_buffer_text = function(str){
	clear_buffer();
	//jQuery('#' + command_buffer.get_id()).append(str);
	jQuery('#' + command_buffer.get_id()).val(str);
    };

    /*
     * Function: advance_log_to_bottom
     * 
     * Can't be bothered to check now, but this needs to be done
     * separately from the log because of an initial race condition.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.advance_log_to_bottom = function(){
	_advance_log_to_bottom();
    };

    /*
     * Function: destroy
     * 
     * Remove the autocomplete and functionality from the DOM.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.destroy = function(){
	jQuery('#' + anchor._interface_id).val('');
    };

};
////////////
////
//// bbop.widget.phylo_old
////
//// Purpose: Extend the model to be handy for a (phylo)tree.
//// 
//// WARNING: This functionality is deprecated.
////
//// Width is determined by used div width (style).
//// 
//// Taken name spaces:
////    bbop.widget.phylo_old.*
////
//// TODO: better selection of displayable text
//// TODO: get parser so we can start really checking/use.
//// TODO: make things non-interactive during visible == false?
//// TODO: font and text placement
//// TODO: better text alignment
//// TODO: floating right-hand text (see PAINT)
//// TODO: some "speed-up" refactoring?
////
//// OKAY: FF, Safari, Chrome, Opera
//// TODO: IE a little wonky, but not too bad--easy fix?
////
//// Required:
////    Rafael
////    bbop.core
////    bbop.model
////    bbop.model.tree
////
//////////


// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.phylo_old == "undefined" ){ bbop.widget.phylo_old = {}; }

///
/// PNodes (phylonode) object.
///

// Render out.
// Actually, use this to wrap graph abstraction.
bbop.widget.phylo_old.renderer = function (element_id, info_box_p){

    // Logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    var elt_id = element_id;

    var renderer_context = this;

    // Properties that can be manipulated externally.
    //this.animation_time = 100;
    this.animation_time = 200;
    //this.animation_time = 1000; // for debug
    //this.use_animation = true;
    this.use_animation = false;

    // These first two defaults will be overwritten on display.
    this.box_width = 60;
    this.box_height = 30;

    // Internal-only variables.
    this._render_frame_width = 800;
    this._render_interal_width = this._render_frame_width;
    this._render_frame_height = 600;
    this._render_internal_height = this._render_height;
    //this._node_labels = {};
    //this._node_hover_labels = {};
    //this._edge_labels = {};
    //this._floating_labels = {};

    ///
    /// Functions to handle internal graph management.
    ///
    
    var node_cache_hash = {};
    this._graph = new bbop.model.tree.graph();

    //
    this.add_node = function(node){
	var nid = node.id();
	node_cache_hash[nid] = node;
	this._graph.add_node(node);
    };	

    //
    //this.add_edge = function(nid1, nid2, dist){
    this.add_edge = function(edge){

	var retval = false;

	var n1 = node_cache_hash[edge.subject_id()];
	var n2 = node_cache_hash[edge.object_id()];
	if( n1 && n2 ){
	    this._graph.add_edge(edge);
	    retval = true;	    
	}

	return retval;
    };

    ///
    /// ...
    ///

    // Init: context, label, x-coord, y-coord.
    graph_pnode = function(context, label, px, py, internal_p){

	var pnode_box_width = renderer_context.box_width;
	var pnode_box_height = renderer_context.box_height;

	// Color and size definitions.
	var text_offset_x = pnode_box_width / 2.0;
	var text_offset_y = pnode_box_height / 2.0;
	this.base_node_color = "#00f";

	// Variations if an internal node.
	if( internal_p ){
	    pnode_box_width = pnode_box_width / 2.0;
	    pnode_box_width = 2.0;
	    //pnode_box_height = 2.0;
	    text_offset_x = (pnode_box_width / 2.0);
	}

	// Future visibility.    
	this.visible = true;
	
	// For advanced tree use.
	this.open = true;
	
	// Coloration and style attributes.
	this.shape_base_attr = {
	    "fill": this.base_node_color,
	    "fill-opacity": 0.05,
	    "opacity": 1.0,
	    "stroke": this.base_node_color,
	    "stroke-width": 2,
	    "title": "This is " + label,
	    "cursor": "move"
	};
	this.shape_highlight_attr = {
	    "fill": this.base_node_color,
	    "fill-opacity": 0.5,
	    "opacity": 1.0,
	    "stroke": this.base_node_color,
	    "stroke-width": 3
	};
	this.shape_dim_attr = {
	    "fill": this.base_node_color,
	    "fill-opacity": 0.0,
	    "opacity": 0.5,
	    "stroke": this.base_node_color,
	    "stroke-width": 1
	};
	this.shape_invisible_attr = {
	    "fill": "#000",
	    "fill-opacity": 0.0,
	    "opacity": 0.0,
	    "stroke": "#000",
	    "stroke-width": 0
	};
	// Text in node.
	this.text_base_attr = {
	    //"fill-opacity": 1.0,
	    "opacity" : 1.0,
	    "font-size" : 10
	};
	//this.text_highlight_attr = {"fill-opacity": 1.0, "font-size" : 12};
	this.text_highlight_attr = {
	    //"fill-opacity": 1.0,
	    "opacity" : 1.0,
	    "font-size" : 10
	};
	this.text_dim_attr = {
	    //"fill-opacity": 0.2,
	    "opacity" : 0.2,
	    "font-size" : 10
	};
	this.text_invisible_attr = {
	    //"fill-opacity": 0.0,
	    "opacity" : 0.0,
	    "font-size" : 10
	};

	// Draw out initial node.
	this._context = context;

	this._text = // NOTE: text is *centered* at this point.
	this._context.text(px + text_offset_x, py + text_offset_y, label);
	this._text.toBack(); // make sure it's behind the boxes
	this._shape = this._context.rect(px, py,
					 pnode_box_width, pnode_box_height,
					 2);

	// Proxy properties and functions.
	// This is so wrong, but feels so good...proxy most things through
	// shape.
	this.id = this._shape.id; // Use the shape's UID as our UID.
	this.getBBox = function(){
	    return this._shape.getBBox.call(this._shape);
	};
	// Semi-proxy.
	this.shape_attr = function(arg){
	    return this._shape.attr.call(this._shape, arg);
	};

	// Add to the object the initial position.
	this._start_shape_y = this._shape.attr("y");
	this._start_text_y = this._text.attr("y");

	// Setup shape attributes.
	this._shape.attr(this.shape_base_attr);
    };
    // Call first when you want to move.
    graph_pnode.prototype.update_position = function(){
	this._start_shape_y = this._shape.attr("y");
	this._start_text_y = this._text.attr("y");
    };
    // Move.
    graph_pnode.prototype.move_y = function(arg){
	var d_shape = this._start_shape_y + arg;
	var d_text = this._start_text_y + arg;
	this._shape.attr.call(this._shape, {"y": d_shape});
	this._text.attr.call(this._text, {"y": d_text});
    };
    // Event handler proxies for underlying shapes (text ignored).
    graph_pnode.prototype.drag = function(mv_func,start_func,end_func){
	this._shape.drag(mv_func, start_func, end_func);
    };
    graph_pnode.prototype.dblclick = function(handler){
	this._shape.dblclick.call(this._shape, handler);
    };
    graph_pnode.prototype.mouseover = function(handler){
	this._shape.mouseover.call(this._shape, handler);
    };
    graph_pnode.prototype.mouseout = function(handler){
	this._shape.mouseout.call(this._shape, handler);
    };

    graph_pnode.prototype.update = function(message){

	//
	var shape_attr_to_apply = this.shape_base_attr;
	var text_attr_to_apply = this.text_base_attr;

	// 
	if( this.visible == false ){
	    shape_attr_to_apply = this.shape_invisible_attr;
	    text_attr_to_apply = this.text_invisible_attr;
	}else if( message == 'highlight' ){
	    shape_attr_to_apply = this.shape_highlight_attr;
	    text_attr_to_apply = this.text_highlight_attr;
	}else if( message == 'dim' ){
	    shape_attr_to_apply = this.shape_dim_attr;
	    text_attr_to_apply = this.text_dim_attr;
	}

	// Change border on whether or not it's "opened".
	if( this.open == false ){
	    shape_attr_to_apply['stroke'] = "#070";
	}else{
    	    shape_attr_to_apply['stroke'] = this.base_node_color;	
	}

	// Render with whatever filtered through.
	if( renderer_context.use_animation ){
	    this._shape.animate.call(this._shape,
				     shape_attr_to_apply,
				     renderer_context.animation_time);
	    this._shape.animate.call(this._text,
				     text_attr_to_apply,
				     renderer_context.animation_time);	
	}else{
	    this._shape.attr(shape_attr_to_apply);
	    this._text.attr(text_attr_to_apply);
	}
    };


    ///
    /// Define the edges (connections) to be used for drawing.
    /// Connection (between two pnodes) object.
    ///

    // Init: context, shape, shape, and "distance" representation
    // (optional).
    graph_connection = function(context, obj1, obj2, dist_rep){

	//this.context = context;

	// These need to be set right away for path calculation.    
	this.from = obj1;
	this.to = obj2;

	this.id = this.from.id + '_id_invariant_' + this.to.id;

	// Get path.
	var path_info = this.get_path_between_info();
	var path = path_info['path'];
	var cp = path_info['center_point'];

	// ll("conn: cp: (" + cp[0] + ", " + cp[1] + ")");

	// Future visibility.
	this.visible = true;

	var base_edge_color = "#030";
	var base_edge_width = "3";
	var highlight_edge_color = "#00f";
	var highlight_edge_width = "5";
	var invisible_edge_color = "#000";
	var invisible_edge_width = "0";

	this.edge_base_attr = {
	    "stroke": base_edge_color,
     	    "stroke-width": base_edge_width,
	    "fill": "none",
	    "opacity": 1.0,
	    "fill-opacity": 0.0
	};
	this.edge_highlight_attr = {
	    "stroke": highlight_edge_color,
     	    "stroke-width": highlight_edge_width,
	    "fill": "none",
	    "opacity": 1.0,
	    "fill-opacity": 0.0
	};
	this.edge_dim_attr = {
	    "stroke": base_edge_color,
     	    "stroke-width": 1,
	    "fill": "none",
	    "opacity": 0.5,
	    "fill-opacity": 0.0
	};
	this.edge_invisible_attr = {
	    "stroke": invisible_edge_color,
     	    "stroke-width": invisible_edge_width,
	    "fill": "none",
	    "opacity": 0.0,
	    "fill-opacity": 0.0
	};
	// // As connections.
	// this.text_base_attr = {"fill-opacity": 1.0, "font-size" : 10};
	// this.text_highlight_attr = {"fill-opacity": 1.0, "font-size" : 10};
	// this.text_dim_attr = {"fill-opacity": 0.2, "font-size" : 10};
	// this.text_invisible_attr = {"fill-opacity": 0.0, "font-size" : 10};
	// Highlight-only.
	this.text_base_attr = {
	    "opacity": 0.0,
	    "font-size" : 10
	};
	//this.text_highlight_attr = {"fill-opacity": 1.0, "font-size" : 12};
	this.text_highlight_attr = {
	    "opacity": 1.0,
	    "font-size" : 10
	};
	this.text_dim_attr = {
	    "opacity": 0.0,
	    "font-size" : 10
	};
	this.text_invisible_attr = {
	    "opacity": 0.0,
	    "font-size" : 10
	};

	// Build up text at path centerpoint.
	this.text = null;
	if( dist_rep ){
	    this.text = context.text(cp[0], (cp[1] + 10), dist_rep);
	    this.text.toBack(); // make sure it's behind the boxes
	    this.text.attr(this.text_base_attr);	
	}

	// Colors and lines.
	this.line = context.path(path);
	this.line.attr(this.edge_base_attr);
    };
    // Update line graphic.
    graph_connection.prototype.update = function(message){

	// Get path.
	var path_info = this.get_path_between_info();
	var path = path_info['path'];

	// Update line position.
	this.line.attr({path: path});

	// Update line graphics on message.
	var line_attr_to_apply = null;
	if( this.visible == false ){
	    line_attr_to_apply = this.edge_invisible_attr;
	}else if( message == 'highlight' ){
	    line_attr_to_apply = this.edge_highlight_attr;
	}else if( message == 'dim' ){
	    line_attr_to_apply = this.edge_dim_attr;
	}else{
	    line_attr_to_apply = this.edge_base_attr;
	}

	// Render with whatever filtered through.
	if( renderer_context.use_animation ){	
	    this.line.animate.call(this.line,
				   line_attr_to_apply,
				   renderer_context.animation_time);
	}else{
	    this.line.attr(line_attr_to_apply);
	}

	// Update text position.
	var text_attr_to_apply = null;
	if( this.text ){
	    var cp = path_info['center_point'];
	    this.text.attr({"x": cp[0], "y": (cp[1] + 10)});

	    // Update graphics graphics on message.
	    if( this.visible == false ){
		text_attr_to_apply = this.text_invisible_attr;
	    }else if( message == 'highlight' ){
		text_attr_to_apply = this.text_highlight_attr;
	    }else if( message == 'dim' ){
		text_attr_to_apply = this.text_dim_attr;
	    }else{
		text_attr_to_apply = this.text_base_attr;
	    }

	    // Render with whatever filtered through.
	    if( renderer_context.use_animation ){	
		this.text.animate.call(this.text,
				       text_attr_to_apply,
				       renderer_context.animation_time);
	    }else{
		this.text.attr(text_attr_to_apply);
	    }
	}
    };
    // // Generate path from between the two internally stored objects.
    // graph_connection.prototype.get_path_between_info = function(){

    // 	var bb1 = this.from.getBBox();
    // 	var bb2 = this.to.getBBox();

    // 	//ll("bb1.width: " + bb1.width);
    // 	//ll("bb1.x: " + bb1.x + ", bb1.y: " + bb1.y);
    // 	//ll("bb1.width: "+ bb1.width +", bb1.height: "+ bb1.height);

    // 	var p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
    // 		 {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
    // 		 {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
    // 		 {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
    // 		 {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
    // 		 {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
    // 		 {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
    // 		 {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}];
    // 	var d = {};
    // 	var dis = [];
    // 	for (var i = 0; i < 4; i++) {
    //         for (var j = 4; j < 8; j++) {
    // 		var dx = Math.abs(p[i].x - p[j].x);
    // 		var dy = Math.abs(p[i].y - p[j].y);
    // 		if ((i == j - 4) ||
    // 		    (((i != 3 && j != 6) || p[i].x < p[j].x) &&
    // 		     ((i != 2 && j != 7) || p[i].x > p[j].x) &&
    // 		     ((i != 0 && j != 5) || p[i].y > p[j].y) &&
    // 		     ((i != 1 && j != 4) || p[i].y < p[j].y))) {
    //                 dis.push(dx + dy);
    //                 d[dis[dis.length - 1]] = [i, j];
    // 		}
    //         }
    // 	}
    // 	var res = null;
    // 	if (dis.length == 0) {
    //         res = [0, 4];
    // 	}else{
    //         res = d[Math.min.apply(Math, dis)];
    // 	}
    // 	var x1 = p[res[0]].x;
    // 	var y1 = p[res[0]].y;
    // 	var x2 = p[res[1]].x;
    // 	var y2 = p[res[1]].y;
    // 	var dx = Math.max(Math.abs(x1 - x2) / 2, 10);
    // 	var dy = Math.max(Math.abs(y1 - y2) / 2, 10);
    // 	return {"path": [
    // 		    "M", x1.toFixed(3), y1.toFixed(3),
    // 		    "L", x1.toFixed(3), y2.toFixed(3),
    // 		    "L", x2.toFixed(3), y2.toFixed(3)
    // 		].join(","),
    // 		// "center_point": [(x1.toFixed(3) + x1.toFixed(3)),
    // 		// 		     (y1.toFixed(3) + y2.toFixed(3))]
    // 		"center_point": [(x1 + x2) / 2.0, (y2)]
    // 	       };
    // };

    // Generate path from between the two internally stored objects.
    graph_connection.prototype.get_path_between_info = function(){

	var bb1 = this.from.getBBox();
	var bb2 = this.to.getBBox();

	//ll("bb1.width: " + bb1.width);
	//ll("bb1.x: " + bb1.x + ", bb1.y: " + bb1.y);
	//ll("bb1.width: "+ bb1.width +", bb1.height: "+ bb1.height);

	var p =
	    [
		// bb1: middle-top
		{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
		// bb1: middle-bottom
		{x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
		// bb1: left-middle
		{x: bb1.x - 1, y: bb1.y + bb1.height / 2},
		// bb1: right-middle
		{x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
		// bb2: middle-top
		//{x: bb2.x + bb2.width / 2, y: bb2.y - 1},
		{x: bb2.x - 1, y: bb2.y + bb2.height / 2},
		// bb2: middle-bottom
		//{x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
		{x: bb2.x - 1, y: bb2.y + bb2.height / 2},
		// bb2: left-middle
		{x: bb2.x - 1, y: bb2.y + bb2.height / 2},
		// bb2: right-middle
		//{x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}
		{x: bb2.x - 1, y: bb2.y + bb2.height / 2}
	    ];
	var d = {};
	var dis = [];
	for (var i = 0; i < 4; i++) { // for bb1
            for (var j = 4; j < 8; j++) { // for bb2
		var dx = Math.abs(p[i].x - p[j].x);
		var dy = Math.abs(p[i].y - p[j].y);
		if ((i == j - 4) ||
    		    (((i != 3 && j != 6) || p[i].x < p[j].x) &&
    		     ((i != 2 && j != 7) || p[i].x > p[j].x) &&
    		     ((i != 0 && j != 5) || p[i].y > p[j].y) &&
    		     ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                    dis.push(dx + dy);
                    d[dis[dis.length - 1]] = [i, j];
		}
            }
	}
	var res = null;
	if (dis.length == 0) {
            res = [0, 4];
	}else{
            res = d[Math.min.apply(Math, dis)];
	}
	var x1 = p[res[0]].x;
	var y1 = p[res[0]].y;
	var x2 = p[res[1]].x;
	var y2 = p[res[1]].y;
	//var dx = Math.max(Math.abs(x1 - x2) / 2, 10);
	//var dy = Math.max(Math.abs(y1 - y2) / 2, 10);
	return {"path": [
    		    "M", x1.toFixed(3), y1.toFixed(3),
    		    "L", x1.toFixed(3), y2.toFixed(3),
    		    "L", x2.toFixed(3), y2.toFixed(3)
		].join(","),
		// "center_point": [(x1.toFixed(3) + x1.toFixed(3)),
		// 		     (y1.toFixed(3) + y2.toFixed(3))]
		"center_point": [(x1 + x2) / 2.0, (y2)]
	       };
    };

    ///
    /// Functions and sub-functions for display.
    ///

    // TODO: later, allow display to take args to force size.
    this.display = function () {

	var layout = this._graph.layout();
	var elt = document.getElementById(elt_id);

	// Fudge variables.
	var edge_shift = 1.0; // fudge to allow the last little bit on screen
	var absolute_pull = 15.0; // there seems to be a misjudgement
				  // in width by about this much

	// Adjust vertical scales and display.
	var y_scale = renderer_context.box_height * 2.0; // fixed y-scale
	this._render_frame_height = (layout.max_width * y_scale);
	this._render_internal_height = this._render_frame_height - edge_shift;

	// Adjust for render width based on platform.
	// TODO: later, allow display to take args to force size.
	var x_scale = 1.0;
	//if( window && window.innerWidth && 1 == 2){
	    //this._render_frame_width = window.innerWidth;
	//}else 
	if( elt.clientWidth ){
	    this._render_frame_width = elt.clientWidth;
	}else{
	    ll("UFP: Unidentified Failing Platform.");
	}
	// Now adjust the drawing width to make sure that the boxes
	// fit.
	//this._render_internal_width = this._render_frame_width;
	this._render_internal_width =
	    this._render_frame_width
	    - (1.0 * renderer_context.box_width)
	    - absolute_pull;
	// If we're using the info box, adjust inwards by some amount.
	if( info_box_p ){
	    this._render_internal_width = this._render_internal_width * 0.8;
	}
	// Recalculate x-scale.
	x_scale = this._render_internal_width / layout.max_distance;
	// Get that last pixel column on board.
	ll('internal width: ' + this._render_internal_width);
	ll('frame width: ' + this._render_frame_width);

	// Create context.
	var paper = Raphael(elt_id,
			    this._render_frame_width,
			    this._render_frame_height);
	ll('display: made paper');

	///
	/// Graph helper function definitions.
	/// 

	function get_pnode_from_phynode_id(phynode_id){
	    var ret = null;
	    if( phynode_id_to_index[phynode_id] ){
		ret = phynodes[phynode_id_to_index[phynode_id]];
	    }
	    return ret;
	}

	// Subtree list, including self.
	function gather_list_from_hash(nid, hash){
    	    var retlist = new Array();
    	    retlist.push(nid);
    	    // Get all nodes cribbing from distances.
    	    for( vt in hash[nid] ){
    		//ll("id: " + id + ", v: " + ct);
    		retlist.push(vt);
    	    }
    	    return retlist;	
	}

	// Subtree list, including self.
	function get_descendant_node_list(nid){
	    return gather_list_from_hash(nid, layout.parent_distances);
	}

	// Ancestor list, including self.
	function get_ancestor_node_list(nid){
	    return gather_list_from_hash(nid, layout.child_distances);
	}

	//
	function get_associated(phynode_id, index_kept, getter){

    	    var retlist = new Array();
	    
    	    var node_id = phynode_id_to_node_id[phynode_id];
    	    var subtree_node_list = getter(node_id);
    	    for( var si = 0; si < subtree_node_list.length; si++ ){

    		var subnode_id = subtree_node_list[si];
    		var sindex = node_id_to_index[subnode_id];

    		var thing = index_kept[sindex];
    		retlist.push(thing);
    	    }

    	    return retlist;
	}

	function get_descendant_phynodes(phynode_id){
    	    return get_associated(phynode_id, phynodes, get_descendant_node_list);
	}

	function get_descendant_texts(phynode_id){
    	    return get_associated(phynode_id, texts, get_descendant_node_list);
	}

	function get_ancestor_phynodes(phynode_id){
    	    return get_associated(phynode_id, phynodes, get_ancestor_node_list);
	}

	// General func.
	function get_connections(phynode_id, phynode_getter, conn_hash){

	    var retlist = new Array();

	    // Fish in the connection ancestor hash for edges.
	    var tmp_phynodes = phynode_getter(phynode_id);
	    for( var si = 0; si < tmp_phynodes.length; si++ ){
		var tshp = tmp_phynodes[si];
		var tnid = phynode_id_to_node_id[tshp.id];
		if( tnid && conn_hash[tnid] ){
		    for( var anid in conn_hash[tnid] ){
			var conn_index = conn_hash[tnid][anid];
			var conn = connections[conn_index];
			ll('get_conn: found: [' + conn_index +
					 '] ' + anid + ' <=> ' + tnid +
					 ' ... ' + conn);
			retlist.push(conn);
		    }
		}
	    }
	    return retlist;
	};

	//
	function get_ancestor_connections(phynode_id){
	    return get_connections(phynode_id,
				   get_ancestor_phynodes,
				   conn_hash_ancestor);
	}

	//
	function get_descendant_connections(phynode_id){
	    return get_connections(phynode_id,
				   get_descendant_phynodes,
				   conn_hash_descendant);
	}

	///
	/// Phynode manipulation function definitions.
	/// 

	// Dragging animation (color dimming).
	var start = function () {

    	    var phynode_id = this.id;

	    // Darken boxes and update current position before dragging.
    	    var assoc_phynodes = get_descendant_phynodes(phynode_id);
    	    for( var si = 0; si < assoc_phynodes.length; si++ ){
		var phynode = assoc_phynodes[si];
		phynode.update_position();
		phynode.update("dim");
    	    }

	    // "Dim" edges.
	    var subtree_edges = get_descendant_connections(phynode_id);
	    for( var se = 0; se < subtree_edges.length; se++ ){
		var ste = subtree_edges[se];
		ste.update("dim");
	    }
	};

	// Movement animation (don't allow movement on the x-axis) and
	// redo lines.
	var move = function (dx, dy) {

    	    var phynode_id = this.id;

	    // Move box positions.
    	    var assoc_phynodes = get_descendant_phynodes(phynode_id);
    	    for( var si = 0; si < assoc_phynodes.length; si++ ){
		var mshp = assoc_phynodes[si];
		mshp.move_y(dy);
		//ll('mshp['+si+']:'+' oy: '+mshp.start_y+', dy:'+dy);
    	    }

	    // Collect subtree edges for next bit.
	    var dimmable_subtree = {};
	    var subtree_edges = get_descendant_connections(phynode_id);
	    for( var se = 0; se < subtree_edges.length; se++ ){
		var ste = subtree_edges[se];
		dimmable_subtree[ste.id] = true;
	    }

	    // Update connections; keep subtree dimmed while in transit.
            for (var i = connections.length; i--;) {
		var conn = connections[i];
		if( dimmable_subtree[conn.id] ){
		    conn.update('dim');		
		}else{
		    conn.update();		
		}
            }
            paper.safari();
	};

	// Undrag animation.
	var stop = function () {

    	    var phynode_id = this.id;

	    // Fade boxes.
    	    var assoc_phynodes = get_descendant_phynodes(phynode_id);
    	    for( var si = 0; si < assoc_phynodes.length; si++ ){
		var mshp = assoc_phynodes[si];
		mshp.update();
    	    }

	    // Update connections; bring them all back to normal.
            for (var i = connections.length; i--;) {
		connections[i].update();		
            }
            paper.safari();
	};

	// Experiment with double click.
	function dblclick_event_handler(event){

	    var phynode_id = this.id;

	    // If this is the first double click here...
	    var pn = get_pnode_from_phynode_id(phynode_id);
	    if( pn.open == true ){
		
		// "Vanish" edges.
		var subtree_edges = get_descendant_connections(phynode_id);
		for( var se = 0; se < subtree_edges.length; se++ ){
		    var ste = subtree_edges[se];
		    ste.visible = false;
		    ste.update();
		}

		// "Vanish" nodes and text; not this node though...
		var subtree_nodes = get_descendant_phynodes(phynode_id);
		for( var sn = 0; sn < subtree_nodes.length; sn++ ){
		    var stn = subtree_nodes[sn];
		    if( stn.id != phynode_id ){
			// Turn of visibilty for children.
			stn.visible = false;
		    }else{
			// Mark self as closed.
			stn.open = false;
		    }
		    stn.update();
		}
	    }else{ //Otherwise...
		
		// Reestablish edges.
		var subtree_edges = get_descendant_connections(phynode_id);
		for( var se = 0; se < subtree_edges.length; se++ ){
		    var ste = subtree_edges[se];
		    ste.visible = true;
		    ste.update();
		}

		// Restablish pnodes; clear all history.
		var subtree_nodes = get_descendant_phynodes(phynode_id);
		for( var sn = 0; sn < subtree_nodes.length; sn++ ){
		    var stn = subtree_nodes[sn];
		    stn.open = true;
		    stn.visible = true;
		    stn.update();
		}
	    }
	}

	// Experiment with hover.
	function mouseover_event_handler(event){

    	    var phynode_id = this.id;

	    // Cycle through ancestor phynodes.
    	    var anc_phynodes = get_ancestor_phynodes(phynode_id);
    	    for( var ai = 0; ai < anc_phynodes.length; ai++ ){
		// Change boxes opacity (darken).
		var ashp = anc_phynodes[ai];
		ashp.update("highlight");
	    }
	    // Cycle through descendant phynodes.
    	    var desc_phynodes = get_descendant_phynodes(phynode_id);
    	    for( var di = 0; di < desc_phynodes.length; di++ ){
		// Change boxes opacity (darken).
		var dshp = desc_phynodes[di];
		dshp.update("highlight");
	    }

	    // See if we can fish any edges out and highlight them.
    	    var anc_edges = get_ancestor_connections(phynode_id);
    	    for( var ac = 0; ac < anc_edges.length; ac++ ){
		var aconn = anc_edges[ac];
		aconn.update("highlight");
	    }
    	    var desc_edges = get_descendant_connections(phynode_id);
    	    for( var dc = 0; dc < desc_edges.length; dc++ ){
		var dconn = desc_edges[dc];
		dconn.update("highlight");
	    }
	    paper.safari();
	}
	function mouseout_event_handler(event){

    	    var phynode_id = this.id;

	    // Cycle through ancestor phynodes.
    	    var anc_phynodes = get_ancestor_phynodes(phynode_id);
    	    for( var ai = 0; ai < anc_phynodes.length; ai++ ){
		// Change boxes opacity (lighten).
		var ashp = anc_phynodes[ai];
		ashp.update();
    	    }
	    // Cycle through descendant phynodes.
    	    var desc_phynodes = get_descendant_phynodes(phynode_id);
    	    for( var di = 0; di < desc_phynodes.length; di++ ){
		// Change boxes opacity (lighten).
		var dshp = desc_phynodes[di];
		dshp.update();
    	    }

	    // See if we can fish any edges out and unhighlight them.
    	    var anc_edges = get_ancestor_connections(phynode_id);
    	    for( var ac = 0; ac < anc_edges.length; ac++ ){
		var aconn = anc_edges[ac];
		aconn.update();
	    }
    	    var desc_edges = get_descendant_connections(phynode_id);
    	    for( var dc = 0; dc < desc_edges.length; dc++ ){
		var dconn = desc_edges[dc];
		dconn.update();
	    }
	    paper.safari();
	}

	///
	///  Render info box if wanted.
	///

	if( info_box_p ){
	    
	    //var lnodes = this._graph.get_leaf_nodes();
	    // Get the last ordered cohort and build table from that.
	    var lnodes = layout.cohorts[layout.cohorts.length - 1];
	    for( var ln = 0; ln < lnodes.length; ln++ ){	    
		var lnode = lnodes[ln];

		var pr_xa = paper.width - (paper.width * 0.2) + 20; // x-axis
		var pr_ya = 1.0 + (y_scale * ln); // y-axis
		var bw = (paper.width * 0.2) - 30.0; // width
		var bh = y_scale - 1.0; // height
		var pr = paper.rect(pr_xa, pr_ya,
				    bw, bh,
				    1); // roundness
		pr.attr({
			    "fill": "#eeee99",
			    "fill-opacity": 0.5,
			    "opacity": 1.0,
			    "stroke": "#333388",
			    "stroke-width": 1,
			    "title": "This is " + lnode.id
			    //"cursor": "move"
			});

		var pt = paper.text(pr_xa + (bw / 2.0), pr_ya + (bh / 2.0),
				    "Data for " + lnode.id);
	    }
	}

	///
	/// Phynode creation and placement.
	/// 

	// Add phynodes and create lookup (hash) for use with connections.
	var phynodes = new Array();
	var phynode_hash = {};
	var texts = new Array();
	var phynode_id_to_index = {};
	var phynode_id_to_node_id = {};
	var node_id_to_index = {};
	for( var nidi = 0; nidi < layout.node_list.length; nidi++ ){

	    // Calculate position.
	    var node_id = layout.node_list[nidi];
	    var lpx = (layout.position_x[node_id] * x_scale) + edge_shift;
	    var lpy = (layout.position_y[node_id] * y_scale) + edge_shift;

	    // Create node at place. 
	    var phynode = null;
	    if( ! this._graph.is_leaf_node(node_id) && info_box_p ){
		ll('display: internal node: ' + node_id);
		phynode = new graph_pnode(paper, node_id, lpx, lpy, true);
		//phynode.attr("width") = 10;
		//phynode.attr("height") = 10;
	    }else{
		phynode = new graph_pnode(paper, node_id, lpx, lpy);
	    }

            phynodes.push(phynode);

	    // Indexing for later (edge) use.
	    phynode_hash[node_id] = nidi;

	    // More indexing.
	    var ref_index = phynodes.length -1;
	    var phynode_id = phynode.id;
	    phynode_id_to_index[phynode_id] = ref_index;
	    phynode_id_to_node_id[phynode_id] = node_id;
	    node_id_to_index[node_id] = ref_index;

	    ll('display: indexed (node): node_id: ' + node_id +
			     ', phynode_id: ' + phynode_id +
			     ', ref_index: ' + ref_index);
	}

	// Add listeners.
	for (var i = 0, ii = phynodes.length; i < ii; i++) {
	    phynodes[i].dblclick(dblclick_event_handler);
            phynodes[i].drag(move, start, stop);
	    phynodes[i].mouseover(mouseover_event_handler);
	    phynodes[i].mouseout(mouseout_event_handler);
	}

	// Add stored connections.
	var connections = new Array();
	var conn_hash_ancestor = {};
	var conn_hash_descendant = {};
	for( var ei = 0; ei < layout.edge_list.length; ei++ ){

	    //
	    var edge = layout.edge_list[ei];
	    var e0 = edge[0];
	    var e1 = edge[1];

	    // Push edge onto array.
	    var n0_pnode = phynodes[phynode_hash[e0]];
	    var n1_pnode = phynodes[phynode_hash[e1]];
	    var d_label = layout.parent_distances[e0][e1] + '';
	    var nconn = new graph_connection(paper, n0_pnode, n1_pnode,
					     d_label);
	    connections.push(nconn);

	    // Index edge index for later recall.
	    if( ! conn_hash_descendant[e0] ){ conn_hash_descendant[e0] = {}; }
	    conn_hash_descendant[e0][e1] = ei;
	    if( ! conn_hash_ancestor[e1] ){ conn_hash_ancestor[e1] = {}; }
	    conn_hash_ancestor[e1][e0] = ei;

	    ll('display: indexed (edge): e0: ' + e0 +
	       ', e1: ' + e1 +
	       ', ei: ' + ei);
	}
	
	// See: https://github.com/sorccu/cufon/wiki/about
	// See: http://raphaeljs.com/reference.html#getFont
	// var txt = paper.print(100, 100, "print",
	//  paper.getFont("Museo"), 30).attr({fill: "#00f"});
	//paper.print(100, 100, "Test string", paper.getFont("Times", 800), 30);
	//txt[0].attr({fill: "#f00"});
    };

};
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.phylo_tree == "undefined" ){ bbop.widget.phylo_tree = {}; }

(function() {

bbop.widget.phylo_tree.renderer = renderer;

// if there is more than one phylo tree on the page, this counter
// makes the CSS prefixes unique
var id_counter = 0;

// see default_config for a description of possible config settings
function renderer(parent, config){
    this.parent = ( ( "string" == typeof parent )
		    ? document.getElementById(parent)
		    : parent );
    if (this.parent === undefined) {
        throw "can't find parent element " + parent;
    }
    this.tree = new tree();
    this.node_hidden = {};
    this.children_hidden = {};
    this._sort = "ladderize_up";
    this._layout_dirty = true;
    this._css_prefix = "phylo_tree_" + (id_counter++) + "_";

    var self = this;
    this.node_elem_click_handler = function(event) {
        var node_elem =
            (event.currentTarget) ? event.currentTarget : event.srcElement;
        var node = self.tree.nodes[node_elem.node_id];
        if (node) return self.node_clicked(node, node_elem, event);
    };

    var default_config = {
        // these are in pixels
        // leaf box vertical height, including padding and borders
        box_height: 24,
        // vertical space between leaf boxes
        box_spacing: 10,
        // space between leaf box edge and leaf label
        leaf_padding: 4,
        // leaf border thickness
        leaf_border: 2,
        // leaf left offset
        leaf_margin: 1,
        // width/height of internal nodes
        node_size: 8,

        // leaf border color
        leaf_border_color: "blue",
        // font for leaf labels
        leaf_font: "Helvetica, Arial, sans-serif",
        transition_time: "0.8s"
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);

    //config settings with default values dependent on other config values
    this.config.parent_padding = ( (this.config.parent_padding === undefined)
                                   ? ((this.config.box_spacing / 2) | 0)
                                   : this.config.parent_padding );

    this.node_style = {
        position: "absolute",
        background: "white",
        "z-index": 2,
        width: this.config.node_size + "px",
        height: this.config.node_size + "px",
        "margin-top": (-this.config.node_size / 2) + "px",
        "margin-left": (-this.config.node_size / 2) + "px",
        border: "1px solid black",
        "transition-property": "top, left",
        "transition-duration": this.config.transition_time,
        "transition-timing-function": "ease-in-out, ease-in-out",
        "box-sizing": "content-box",
        "-moz-box-sizing": "content-box"
    };

    this.leaf_style = {
        position: "absolute",
        background: "#f1f1ff",
        "z-index": 1,
        padding: this.config.leaf_padding + "px",
        // if leaf_padding is too low, the branch line will touch the text
        "padding-left": Math.max(this.config.leaf_padding, 3) + "px",

        // so that the leaves don't cover up the connection lines
        "margin-left": this.config.leaf_margin + "px",

        "margin-top": (-this.config.box_height / 2) + "px",

        // setting font size from box height.  We'd like to set font cap height
        // directly, but we can only set em box size.  Cap height on average is
        // 70% of em box size, so we'll set the font size to the intended
	// height divided by 0.7
        font: ( ( this.config.box_height
                  - ( this.config.leaf_padding * 2 )
                  - ( this.config.leaf_border * 2 ) )
                / 0.7 ) + "px " + this.config.leaf_font,

        // this.config.box_height includes padding and borders, so we
        // subtract those out to set the CSS height, which doesn't include
        // padding or borders
        height: ( this.config.box_height
                  - ( this.config.leaf_padding * 2 )
                  - ( this.config.leaf_border * 2 ) ) + "px",

        // center vertically by setting the line height to 0.7em
        // (corresponding to the way we set font size above)
        "line-height": "0.7em",
        "border-radius": (this.config.leaf_padding + 1) + "px",
        "white-space": "nowrap",
        "transition-property": "top, left",
        "transition-duration": this.config.transition_time,
        "transition-timing-function": "ease-in-out, ease-in-out",
        "box-sizing": "content-box",
        "-moz-box-sizing": "content-box"
    };

    if (this.config.leaf_border > 0) {
        this.leaf_style.border =
            this.config.leaf_border + "px solid "
            + this.config.leaf_border_color;
    }

    this.connection_style = {
        position: "absolute",
        "border-left": "2px solid black",
        "border-top": "2px solid black",
        "border-bottom": "2px solid black",
        "border-right": "none",
        "transition-property": "top, height, left, width, border",
        "transition-duration": this.config.transition_time,
        "transition-timing-function": 
            "ease-in-out, ease-in-out, ease-in-out, ease-in-out, step-start"
    };
};

renderer.prototype.subtree_hidden = function(node_id) {
    return this.children_hidden[node_id];
};

// sets the given css_string as a new stylesheet, or replaces this object's
// stylesheet with css_string if one has already been set
renderer.prototype.set_styles = function(css_string) {
    if (! this._style_node) {
        head = document.getElementsByTagName('head')[0],
        this._style_node = document.createElement('style');
        this._style_node.type = 'text/css';
        head.appendChild(this._style_node);
    }

    if (this._style_node.styleSheet) {
        // IE
        this._style_node.styleSheet.cssText = css_string;
    } else {
        while (this._style_node.firstChild) {
            this._style_node.removeChild(this._style_node.firstChild);
        }
        this._style_node.appendChild(document.createTextNode(css_string));
    }
};

renderer.prototype.add_node = function(unique_id, label, meta){
    this.tree.add_node(unique_id, label, meta);
    this._layout_dirty = true;
};

renderer.prototype.add_edge = function(nid1, nid2, dist){
    this.tree.add_edge(nid1, nid2, dist);
    this._layout_dirty = true;
};

renderer.prototype.display = function () {
    if (this.container) this.parent.removeChild(this.container);

    this.container = document.createElement("div");
    this.container.style.cssText = [
        "position: absolute",
        "top: 0px",
        "left: " + ( (this.config.node_size / 2)
                     + this.config.parent_padding ) + "px",
        "margin: 0px",
        "padding: 0px",
        "transition-property: width, height",
        "transition-duration: " + this.config.transition_time,
        "transition-timing-function: ease-in-out"
    ].join(";") + ";";

    var node_class = this._css_prefix + "node";
    var leaf_class = this._css_prefix + "leaf";
    var conn_class = this._css_prefix + "conn";
        
    this.set_styles([
        "div." + node_class + " {" + css_string(this.node_style) + "}",
        "div." + leaf_class + " {" + css_string(this.leaf_style) + "}",
        "div." + conn_class + " {" + css_string(this.connection_style) + "}"
    ].join("\n"));

    var phynodes = {};
    for (var node_id in this.tree.nodes) {
        var node = this.tree.nodes[node_id];
        var phynode = new graph_pnode(node,
                                      node_class, leaf_class,
                                      this.config.box_height);
        this.container.appendChild(phynode.node_elem);
        phynode.node_elem.onclick = this.node_elem_click_handler;
        phynodes[node.id] = phynode;
    }
    this._phynodes = phynodes;

    var container = this.container;
    var self = this;
    this.tree.iterate_edges(function(parent, child) {
        if (self.node_hidden[child.id]) return;
        var child_phynode = phynodes[child.id];
        child_phynode.set_parent(
            phynodes[parent.id],
            conn_class
        );
        container.appendChild(child_phynode.conn_elem);
    });

    this.position_nodes();
    this.parent.appendChild(this.container);

    this.width_changed(this.parent.clientWidth);
};

renderer.prototype.position_nodes = function() {
    // x_scale will be percentage units
    var x_scale = 100 / this.max_distance();

    // row_height is in pixel units
    var row_height = this.config.box_height + this.config.box_spacing;

    // the position values from the tree layout are center
    // positions, and the very top one has a y-position of 0.
    // if a leaf node box is centered at that point, then the
    // top half of the top box would get cut off.  So we move
    // all of the positions down by top_margin pixels.
    var top_margin = ( (this.config.box_height / 2)
                       + this.config.parent_padding );

    var layout = this.layout();
    var self = this;
    this.tree.iterate_preorder(function(node) {
	var node_pos = layout[node.id];

	var x = (node_pos.x * x_scale);
	var y = (node_pos.y * row_height) + top_margin;
        self._phynodes[node_pos.id].set_position(x, y);
        if (self.subtree_hidden(node.id)) return true;
    });
    this.tree_height = ( (this.leaves().length * row_height)
                         - this.config.box_spacing
                         + (this.config.parent_padding * 2) );

    this.parent.style.transition =
        "height " + this.config.transition_time + " ease-in-out";
    this.parent.style.height = this.tree_height + "px";
    this.container.style.height = this.tree_height + "px";
};

renderer.prototype.max_distance = function() {
    if (this._layout_dirty) this._update_layout();
    return this._max_distance;
};

renderer.prototype.leaves = function() {
    if (this._layout_dirty) this._update_layout();
    return this._leaves;
};

renderer.prototype.layout = function() {
    if (this._layout_dirty) this._update_layout();
    return this._layout;
};

renderer.prototype._update_layout = function() {
    this._do_sort(this._sort);
    var self = this;

    var visible_leaves = [];
    this.tree.iterate_preorder(function(node) {
        if (self.node_hidden[node.id]) return;
        // nodes with hidden children are leaves for layout purposes
        if (node.is_leaf() || self.children_hidden[node.id]) {
            visible_leaves.push(node);
        }
    });
    this._leaves = visible_leaves;

    var roots = this.tree.roots();
    var root_distances = [];
    for (var i = 0; i < roots.length; i++) {
        root_distances.push(roots[i].parent_distance);
    }
    // if we're only showing a subtree, position the leftmost subtree
    // root all the way to the left
    this.x_offset = -min(root_distances);

    this._max_distance = max(this.tree.traverse(
        function(node, down_data) {
            return down_data + node.parent_distance;
        },
        this.x_offset,
        function(node, child_results, down_data) {
            if (self.node_hidden[node.id]) return 0;

            return Math.max(down_data, max(child_results));
        }
    ) );

    this._layout = this._do_layout();
    this._layout_dirty = false;
};

// returns an array of {id, x, y} objects (one per node)
renderer.prototype._do_layout = function() {
    var leaf_counter = 0;
    var self = this;
    var layout_list = Array.prototype.concat.apply([], this.tree.traverse(
        function(node, down_data) {
            return down_data + node.parent_distance;
        },
        this.x_offset,
        function(node, child_results, down_data) {
            // don't lay out the node if it's hidden
            if (self.node_hidden[node.id]) return [];

            // don't try to average child positions if children are hidden
            if (! (node.id in self.children_hidden)) {
                var immediate_child_y_sum = 0;
                for (var i = 0; i < child_results.length; i++) {
                    // child_results will be an array with one element
                    // for each child.  Each of those elements is an
                    // array of position objects.  The first position
                    // object is the position of the immediate child,
                    // and the rest of the position objects are for
                    // that child's descendants.  (see how the return
                    // value is constructed below)
                    immediate_child_y_sum += child_results[i][0].y;
                }
            }
            
            var my_pos = [{
                id: node.id,
                x: down_data,
                y: ( ( node.is_leaf() || self.children_hidden[node.id] )
                     // The traverse method goes depth-first, so we'll
                     // encounter the leaves in leaf-order.  So the
                     // y-coord for leaves is just the number of
                     // leaves we've seen so far.
                     ? leaf_counter++
                     // The internal node y-coord is the mean of its
                     // child y-coords
                     : ( immediate_child_y_sum / child_results.length ) )
            }];
            // flatten child result arrays and append the result to my_pos
            return Array.prototype.concat.apply(my_pos, child_results);
        }
    ) );

    var layout_hash = {};
    for (var i = 0; i < layout_list.length; i++) {
        layout_hash[layout_list[i].id] = layout_list[i];
    }
    return layout_hash;
};

// call this when the width of the tree's parent element changes
renderer.prototype.width_changed = function(parent_width) {
    var leaves = this.leaves();
    var avail_width = ( parent_width 
                        - (this.config.node_size / 2)
                        - (this.config.parent_padding * 2)
                        - this.config.leaf_margin );

    var min_width = Number.MAX_VALUE;
    for (var li = 0; li < leaves.length; li++) {
        var leaf_id = leaves[li].id;
        var phynode = this._phynodes[leaf_id];

        // Each potential width is the width that this.container
        // would have to be so that the leaf label fits into this.parent.
        // We take the minimum because that's the most conservative of
        // all the potential widths we calculate here.
        var potential_width =
            // dividing px by 100 because px is in percentage units
            (avail_width - phynode.width()) / (phynode.px / 100)
        min_width = Math.min(min_width, potential_width);
    }
    this.container.style.width = Math.max(0, min_width | 0) + "px";
};

// hides the subtree under the given node_id; for that node,
// it shows the label and a visual ellipsis
renderer.prototype.hide_subtree = function(node_id) {
    var to_hide_under = this.tree.nodes[node_id];
    if (to_hide_under === undefined) {
        throw "asked to hide non-existent node " + node_id;
    }
    // there's nothing to hide under a leaf node
    if (to_hide_under.is_leaf()) return;

    var self = this;
    to_hide_under.iterate_preorder(function(node) {
        // don't hide the given node
        if (node === to_hide_under) return;

        self.node_hidden[node.id] = true;
        self._phynodes[node.id].hide();
    });
    self.children_hidden[to_hide_under.id] = true;
    self._phynodes[to_hide_under.id].set_children_hidden();

    this._layout_dirty = true;
    this.position_nodes();
    this.width_changed(this.parent.clientWidth);
};

// show a previously-hidden subtree
renderer.prototype.show_subtree = function(node_id) {
    var to_show_under = this.tree.nodes[node_id];
    if (to_show_under === undefined) {
        throw "asked to show non-existent node " + node_id;
    }

    var self = this;
    // remove this node from children_hidden
    delete self.children_hidden[to_show_under.id];
    to_show_under.iterate_preorder(function(node) {
        if (node === to_show_under) return;

        delete self.node_hidden[node.id];
        self._phynodes[node.id].show();
        
        // returning true stops the iteration: if we encounter a
        // previously-hidden subtree under the node that we're
        // showing, we'll leave its children hidden unless it's
        // specifically shown
        if (self.children_hidden[node.id]) return true;
    });
    self._phynodes[to_show_under.id].set_children_visible();

    this._layout_dirty = true;
    this.position_nodes();
    this.width_changed(this.parent.clientWidth);
};

// hide everything except the subtree rooted at the given node
renderer.prototype.show_only_subtree = function(node_id) {
    var to_show = this.tree.nodes[node_id];
    if (to_show === undefined) {
        throw "asked to show non-existent node " + node_id;
    }

    // hide all nodes except those under the given node
    var self = this;
    this.tree.iterate_preorder(function(node) {
        // returning true stops the iteration: we don't want to hide
        // any nodes under this node, so we'll stop the iteration here
        // for the subtree rooted at the current node
        if (node === to_show) return true;

        self.node_hidden[node.id] = true;
        self._phynodes[node.id].hide();
    });
    this.tree.set_roots([to_show.id]);
    this._phynodes[node_id].hide_connector();

    this._layout_dirty = true;
    this.position_nodes();

    this.width_changed(this.parent.clientWidth);
};

// returns true if we're showing only a subtree rooted at the node
// with the given id, false otherwise
renderer.prototype.only_subtree_shown = function(node_id) {
    var node = this.tree.nodes[node_id];
    return contains(this.tree.roots(), node) && node.has_parent();
};

// undo show_only_subtree
renderer.prototype.show_global_root = function() {
    this.tree.clear_roots();
    
    var self = this;
    this.tree.iterate_preorder(function(node) {
        delete self.node_hidden[node.id];
        var phynode = self._phynodes[node.id];
        phynode.show();
        if (! phynode.connector_shown) phynode.show_connector();
        
        // returning true stops the iteration: if we encounter a
        // previously-hidden subtree under the node that we're
        // showing, we'll leave its children hidden unless it's
        // specifically shown
        if (self.children_hidden[node.id]) return true;
    });

    this._layout_dirty = true;
    this.position_nodes();
    this.width_changed(this.parent.clientWidth);
};

renderer.prototype.node_clicked = function() {};

renderer.prototype.set_sort = function(sort) {
    if (sort == this._sort) return;
    this._sort = sort;
    this._layout_dirty = true;
};

// sort the tree according to the given sort ordering
// see available_sorts for available sort arguments
renderer.prototype._do_sort = function(sort) {
    // leaf_counts: for each node, contains the number of its descendant leaves
    var leaf_counts = {};
    this.tree.traverse(
        function() {}, null,
        function(node, child_results, down_data) {
            // if this is a leaf, call the leaf count 1
            var leaf_count = node.is_leaf() ? 1 : sum(child_results);
            leaf_counts[node.id] = leaf_count;
            return leaf_count;
        }
    );

    var available_sorts = {
        ladderize_up: function(a, b) {
            return leaf_counts[b.id] - leaf_counts[a.id];
        },
        ladderize_down: function(a, b) {
            return leaf_counts[a.id] - leaf_counts[b.id];
        },
        alphabetical: function(a, b) {
            if( a.id == b.id ) return 0;
            return (a.id < b.id) ? -1 : 1;
        }
    };

    if ("string" == typeof sort) {
        if( ! sort in available_sorts ) throw "unknown sort " + sort;
        this.tree.sort_children(available_sorts[sort]);
    } else if ("function" == typeof sort) {
        this.tree.sort_children(sort);
    }
};

renderer.prototype.iterate_preorder = function(callback) {
    var self = this;
    this.tree.iterate_preorder(function(node) {
        // if the node is hidden, there won't be anything in self._phynodes
        if (self.node_hidden[node.id]) return;
        return callback(node.id, node.label, node.meta,
                        self._phynodes[node.id].node_elem,
                        node.children);
    });
};

renderer.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    var self = this;
    return this.tree.traverse(down_fun, down_data, up_aggregator);
};

///
/// phylo node html renderer
///

function graph_pnode(node, node_class, leaf_class, height){
    this.node = node;
    this.height = height;
    this.leaf_class = leaf_class;
    this.connector_shown = false;

    var node_elem = document.createElement("div");
    if (node.is_leaf()) {
        node_elem.appendChild(document.createTextNode(node.label));
        node_elem.className = leaf_class;
    } else {
        node_elem.title = node.label;
        node_elem.className = node_class;
    }

    node_elem.node_id = node.id;
    this.node_elem = node_elem;
}

graph_pnode.prototype.set_children_hidden = function() {
    var left_offset = 10;
    this.subtree_box = document.createElement("div");
    this.subtree_box.className = this.leaf_class;
    this.subtree_box.style.backgroundColor = "#eee";
    this.subtree_box.style.left = left_offset + "px";
    this.subtree_box.style.top =
        ((this.height / 2) - (this.node_elem.offsetHeight / 2 ) ) + "px";
    this.subtree_box.appendChild(
        document.createTextNode(this.node.label + " ...")
    );

    this.subtree_box.node_id = this.node.id;
    this.node_elem.appendChild(this.subtree_box);
    this._width = left_offset + this.subtree_box.offsetWidth;
};

graph_pnode.prototype.set_children_visible = function() {
    this._width = this.node_elem.offsetWidth;
    this.node_elem.removeChild(this.subtree_box);
};

graph_pnode.prototype.hide = function() {
    this.node_elem.style.display = "none";
    if (this.parent) this.conn_elem.style.display = "none";
};

graph_pnode.prototype.hide_connector = function() {
    if (this.parent) this.conn_elem.style.display = "none";
    this.connector_shown = false;
};

graph_pnode.prototype.show = function() {
    this.node_elem.style.display = "";
    if (this.parent) this.conn_elem.style.display = "";
};

graph_pnode.prototype.show_connector = function() {
    if (this.parent) this.conn_elem.style.display = "";
    this.connector_shown = true;
};

graph_pnode.prototype.set_position = function(x, y) {
    this.px = x;
    this.py = y;

    this.node_elem.style.left = x + "%";
    this.node_elem.style.top = y + "px";

    if (this.parent && this.connector_shown) {
        var conn_style =
            "top: " + Math.min(this.parent.py, this.py) + "px;"
            + "left: " + this.parent.px + "%;"
            + "width: " + (this.px - this.parent.px) + "%;"
            + "height: " + Math.abs(this.parent.py - this.py) + "px;";

        if (this.py < this.parent.py) {
            // upward connection
            conn_style += "border-bottom: none;";
        } else {
            // downward connection
            conn_style += "border-top: none;";
        }
        this.conn_elem.style.cssText = conn_style;
    }
}

graph_pnode.prototype.set_parent = function(parent, conn_class) {
    this.parent = parent;
    this.conn_elem = document.createElement("div");
    this.conn_elem.className = conn_class;
    this.conn_elem.id=parent.node.id + "-" + this.node.id;
    this.connector_shown = true;
};

graph_pnode.prototype.width = function() {
    if (! ("_width" in this)) this._width = this.node_elem.offsetWidth;
    return this._width;
};

///
/// a tree with distances on each edge
///

function tree() {
    this.nodes = {};
    // if _dirty is true, then the stuff that's calculated in _summarize()
    // is out of date
    this._dirty = true;
}

tree.prototype.add_node = function(id, label, meta) {
    this.nodes[id] = new node(id, label, meta);
    this._dirty = true;
};

tree.prototype.add_edge = function(parent_id, child_id, distance) {
    var parent = this.nodes[parent_id];
    var child = this.nodes[child_id];
    if( "undefined" == typeof parent ){
        throw "parent node " + parent_id + " not found";
    }
    if( "undefined" == typeof child ){
        throw "child node " + child_id + " not found";
    }
    parent.add_child(child, distance);
    this._dirty = true;
};

tree.prototype.sort_children = function(compare_fun) {
    var roots = this.roots();
    roots.sort(compare_fun);
    for (var i = 0; i < roots.length; i++) {
        roots[i].sort_children(compare_fun);
    }
};

tree.prototype.iterate_preorder = function(fun) {
    var roots = this.roots()
    for (var i = 0; i < roots.length; i++) {
        roots[i].iterate_preorder(fun);
    }
};

tree.prototype.iterate_edges = function(fun) {
    for (var id in this.nodes) {
        var parent = this.nodes[id];
        for (var i = 0; i < parent.children.length; i++) {
            fun(parent, parent.children[i]);
        }
    }
};

tree.prototype._summarize = function() {
    if (this._dirty) this.clear_roots();
    this._dirty = false;
};

tree.prototype.roots = function() {
    if (this._dirty) this._summarize();
    return this._roots;
};

// set the roots to be specific nodes
// i.e. to only show a subtree, set_roots(subtree_node_id)
tree.prototype.set_roots = function(root_ids) {
    var roots = [];
    for (var i = 0; i < root_ids.length; i++) {
        roots.push(this.nodes[root_ids[i]]);
    }
    this._roots = roots;
};

// set the list of roots back to the "natural" list of nodes without
// parents
tree.prototype.clear_roots = function() {
    var roots = [];
    for (var id in this.nodes) {
        var node = this.nodes[id];
        if( ! node.has_parent() ) roots.push(node);
    }
    this._roots = roots;
};

// see node.traverse for description
tree.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    var roots = this.roots();
    var results = [];
    for (var i = 0; i < roots.length; i++) {
        results.push(roots[i].traverse(down_fun, down_data, up_aggregator));
    }
    return results;
};

///
/// tree node
///

function node(id, label, meta) {
    this.id = id;
    this.label = label;
    this.meta = meta;
    this.parent = null;
    this.parent_distance = 0;
    this.children = [];
};

node.prototype.add_child = function(child_node, distance) {
    child_node.parent_distance = distance;
    child_node.parent = this;
    this.children.push(child_node);
};

node.prototype.is_leaf = function() {
    return 0 == this.children.length;
};

node.prototype.has_parent = function() {
    return null != this.parent;
};

node.prototype.sort_children = function(compare_fun) {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].sort_children(compare_fun);
    }
    this.children.sort(compare_fun);
};

// return true from the callback to stop iterating at a node
// (the iteration will continue with siblings but not with children of the
//  node where the callback returns true
node.prototype.iterate_preorder = function(fun) {
    if (! (true == fun(this))) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].iterate_preorder(fun);
        }
    }
};

// traverse down and then up the tree, passing some data down
// at each step, and aggregating traversal results from the
// children on the way up
// down_fun: gets called on each node on the way down
//           arguments: node, down_data
// down_data: starting value for the data to pass down
//            (down_fun on a root gets this value for down_data)
// up_aggregator: function to aggregate results on the way back up
//                arguments: node, child_results, down_data
node.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    down_data = down_fun(this, down_data);

    var child_results = new Array(this.children.length);;
    for (var i = 0; i < this.children.length; i++) {
        child_results[i] =
            this.children[i].traverse(down_fun, down_data, up_aggregator)
    }

    return up_aggregator(this, child_results, down_data);
};

///
/// Util functions
///

// takes an object like {"top": "10px", "left": "5px"}
// and return a string like "top: 10px; left: 5px;"
function css_string(css_object) {
    var result = "";
    if ("object" == typeof css_object) {
        for (var key in css_object) {
            result += key + ":" + css_object[key] + ";";
        }
    }
    return result;
}

function contains(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
        if (elem == arr[i]) return true;
    }
    return false;
}

function max(list) {
    if (0 == list.length) return null;
    var result = list[0];
    for (var i = 1; i < list.length; i++) {
        if (list[i] > result) result = list[i];
    }
    return result;
}

function min(list) {
    if (0 == list.length) return null;
    var result = list[0];
    for (var i = 1; i < list.length; i++) {
        if (list[i] < result) result = list[i];
    }
    return result;
}

function sum(list) {
    var result = 0;
    for (var i = 0; i < list.length; i++) {
        result += list[i];
    }
    return result;
}

})();
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.phylo == "undefined" ){ bbop.widget.phylo = {}; }

(function() {

bbop.widget.phylo.renderer = renderer;

function renderer(parent, golr_loc, golr_conf, config) {
    this.parent = parent;

    var default_config = {
        // these are in pixels
        // row vertical height, including padding and borders
        row_height: 18,
        // vertical space between the contents of adjacent rows
        row_spacing: 2,
        font: "Helvetica, Arial, sans-serif",
        mat_cell_width: 20,
        mat_cell_border: 1,
        transition_time: "0.8s",
        header_height: 100
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);

    this.phylo_facet_list = [
        "panther_family_label",
        "phylo_graph_json",
        "score"
    ].join(",");
    this.ann_facet_list = [
        "id",
        "bioentity",
        "bioentity_label",
        "taxon_label",
        "bioentity_name",
        "annotation_class_list_map",
        "score"
    ].join(",");

    var golr = new bbop.golr.manager.jquery(golr_loc, golr_conf);
    golr.set_personality('bbop_bio');
    golr.add_query_filter('document_category', 'bioentity', ['*']);
    this.golr = golr;
}

renderer.prototype.show_family = function(family_id) {
    var self = this;
    var pgraph;

    function phyloCallback(response) {
        // make sure we don't show the phylo tree before the doc is ready
        jQuery(document).ready(function() {
            if (response.documents().length > 0) {
                var pgraph_json = response.documents()[0].phylo_graph_json;
                pgraph = (JSON.parse(pgraph_json));

                self.golr.register('search', 's', annCallback);
                self.golr.set_query("panther_family:" + family_id);
                self.golr.current_fl = self.ann_facet_list;
                self.golr.set("fl", self.ann_facet_list);
                self.golr.page(response.total_documents(), 0);
            } else {
                console.log("no documents received");
            }
        });
    }

    function annCallback(response) {
        if (response.documents().length > 0) {
            self.bioentity_map = 
                self.match_pnodes(pgraph.nodes, response.documents());
            self.show_pgraph(pgraph);
        } else {
            console.log("no documents received");
        }
    }
        
    this.golr.register('search', 's', phyloCallback);
    this.golr.set_query("panther_family:" + family_id);
    this.golr.current_fl = this.phylo_facet_list;
    this.golr.set("fl", this.phylo_facet_list);
    this.golr.page(1, 0);
};

renderer.prototype.match_pnodes = function(pnodes, bioentities) {
    var bioent_id_map = {};
    var bioents_by_pthr_id = {};
    var bioents_matched = 0;

    for (var b = 0; b < bioentities.length; b++) {
        bioent_id_map[bioentities[b].id] = bioentities[b];
    }

    for (var n = 0; n < pnodes.length; n++) {
        if ("annotations" in pnodes[n].meta) {
            var pgraph_bioent_ids = pnodes[n].meta.annotations.split("|");
            for (var pbi = 0; pbi < pgraph_bioent_ids.length; pbi++) {
                if (pgraph_bioent_ids[pbi] in bioent_id_map) {
                    bioents_by_pthr_id[pnodes[n].id] =
                        bioent_id_map[pgraph_bioent_ids[pbi]];
                    bioents_matched++;
                    //console.log("found bioentity for " + pnodes[n].id + " (" + pgraph_bioent_ids[pbi] + ")");

                }
            }
            if (! (pnodes[n].id in bioents_by_pthr_id)) {
                //console.log("no bioentity for " + pnodes[n].id + " (" + pgraph_bioent_ids.join(",") + ")");
            }
        } else {
            // this is typically the case for internal nodes
            //console.log("no non-panther IDs for " + pnodes[n].id);
        }
    }
    //console.log(pnodes.length + " phylo nodes");
    //console.log(bioentities.length + " bioentities");
    
    //console.log(bioents_matched + " matched");
    return bioents_by_pthr_id;
};

renderer.prototype.show_pgraph = function(pgraph) {
    var self = this;
    this.parent = ( ( "string" == typeof this.parent )
		    ? document.getElementById(this.parent)
		    : this.parent );

    jQuery(this.parent).empty();

    var parentPos = getStyle(this.parent, "position");
    if (! (("absolute" == parentPos) || ("relative" == parentPos))) {
        this.parent.style.position = "relative";
    }

    this.parent_top_border =
        parseInt(getStyle(this.parent, "border-top-width"));
    this.parent_bot_border =
        parseInt(getStyle(this.parent, "border-bottom-width"));

    this.tree_container = document.createElement("div");
    this.tree_container.style.position = "absolute";
    this.tree_container.style.top =
        (this.config.header_height + this.config.mat_cell_border) + "px";
    //this.tree_container.style.bottom = "100%";
    this.tree_container.style.left = "0px";
    
    this.mat_container = document.createElement("div");
    this.mat_container.style.cssText = "position: absolute; top: 0px; bottom: 100%;";

    var all_go_terms = {};
    var go_term_list = [];
    var node_go_annots = {};
    for (var nid in this.bioentity_map) {
        var bioent = this.bioentity_map[nid];
        var annots = JSON.parse(bioent.annotation_class_list_map);
        node_go_annots[nid] = annots;
        for (var goterm in annots) {
            var term_desc = all_go_terms[goterm];
            if (term_desc === undefined) {
                term_desc = {
                    count: 0,
                    id: goterm,
                    name: annots[goterm]
                };
                all_go_terms[goterm] = term_desc;
                go_term_list.push(term_desc);
            }
            term_desc.count += 1;
        }            
    }

    go_term_list.sort( function(a, b) { return b.count - a.count; } );
    //var coldescs = go_term_list.map( function(x) { return x.id; } );
    //console.log(coldescs);

    var mat_width = go_term_list.length * this.config.mat_cell_width;
    var tree_width = 500;
    this.tree_container.style.width = tree_width + "px";
    this.mat_container.style.width = mat_width + "px";
    this.mat_container.style.left = tree_width + "px";
    //this.parent.style.width = (tree_width + mat_width) + "px";

    this.parent.appendChild(this.tree_container);
    this.parent.appendChild(this.mat_container);
    var tree_renderer = new bbop.widget.phylo_tree.renderer(this.tree_container, {
        box_height: this.config.row_height,
        box_spacing: this.config.row_spacing,
        leaf_font: this.config.font,
        leaf_border: 0,
        leaf_padding: 3,
        node_size: 8,
        transition_time: this.config.transition_time
    });
    tree_renderer.leaf_style.background = "none";
    tree_renderer.leaf_style.cursor = "pointer";
    tree_renderer.node_style.cursor = "pointer";

    var nodes = pgraph.nodes;
    var edges = pgraph.edges;
    //console.log(nodes.length + " nodes");
    //console.log(edges.length + " edges");
    function node_label(node) {
        var bioe =
            node.id in self.bioentity_map ?
            self.bioentity_map[node.id] :
            null;

        var label = node.lbl;
        // abbreviate genus
        if (bioe) {
            var taxon_words = [];
            if (bioe.taxon_label) taxon_words = bioe.taxon_label.split(/\s+/);
            // sometimes there are more than two taxon words (strain name?)
            // but taxon_words[0] appears to be the genus name
            if (taxon_words.length >= 2) {
                taxon_words[0] = taxon_words[0].substr(0, 1) + ".";
            }
            label = taxon_words.join(" ") + ":" + bioe.bioentity_label;
        }
        return label
    }
        

    for (var i = 0; i < nodes.length; i++) {
        tree_renderer.add_node(nodes[i].id,
                               node_label(nodes[i]),
                               nodes[i].meta);
    }

    for (var i = 0; i < edges.length; i++) {
        tree_renderer.add_edge(edges[i].sub,
                               edges[i].obj,
                               parseFloat(edges[i].meta.distance));
    }
    
    tree_renderer.set_sort(function(a, b) {
        return parseInt(a.meta.layout_index) - parseInt(b.meta.layout_index);
    });

    tree_renderer.node_clicked = function(node, node_elem, event) {
        return self.node_clicked(node, node_elem, event);
    };

    var node_colors = {};
    var cur_color = 1;
    tree_renderer.traverse(
        function(node, down_data) {
            if (node.id in node_colors) {
                down_data = node_colors[node.id]
            }
            if ("true" == node.meta.duplication_p) {
                var have_grandchildren = false;
                var nearest_child_dist = Infinity;
                var nearest_child;
                for (var i = 0; i < node.children.length; i++) {
                    if (node.children[i].parent_distance < nearest_child_dist) {
                        nearest_child = node.children[i];
                        nearest_child_dist = nearest_child.parent_distance;
                    }
                    have_grandchildren =
                        have_grandchildren
                        || (! node.children[i].is_leaf() );
                }
                if (have_grandchildren) {
                    // under duplication nodes, we give new colors to
                    // all children other than the nearest
                    for (var i = 0; i < node.children.length; i++) {
                        if (node.children[i] === nearest_child) {
                            node_colors[node.children[i].id] = down_data;
                        } else {
                            node_colors[node.children[i].id] = cur_color++;
                        }
                    }
                }
            }
            if (! (node.id in node_colors)) {
                node_colors[node.id] = down_data;
            }
            return node_colors[node.id];
        },
        0,
        function() {}
    );
    this.node_colors = node_colors;

    this.tree_renderer = tree_renderer;
    this.render_tree();

    // dismiss popovers by clicking outside them
    jQuery(this.tree_container).on("click", function (e) {
        if (self.popover_elem === undefined) return;
        self.popover_elem.popover("destroy");
        self.popover_elem = undefined;
    });

    var node_id_list = tree_renderer.leaves().map(function(x) { return x.id });
    var node_id_map = {};
    for (var i = 0; i < nodes.length; i++) {
        node_id_map[nodes[i].id] = nodes[i];
    }

    function cell_renderer(cell, row, col) {
        var node_go = node_go_annots[row];
        if ((node_go !== undefined) && (col in node_go)) {
            var cell = document.createElement("div");
            cell.style.backgroundColor = "#555";
            cell.title =
                node_label(node_id_map[row]) + " - " + all_go_terms[col].name;
            return cell;
        }
        return null;
    }
    
    var mat_config = {
        cell_width: this.config.mat_cell_width,
        cell_border: this.config.mat_cell_border,
        cell_height: this.config.row_height + 2,
        header_height: this.config.header_height,
        show_headers: true,
        transition_time: this.config.transition_time
    };
    this.mat_renderer =
        new bbop.widget.matrix.renderer(this.mat_container, node_id_list,
                                        go_term_list, cell_renderer,
                                        mat_config);


    var leaf_id_list = tree_renderer.leaves().map(
        function(x) { return x.id }
    );
    this.mat_renderer.show_rows(leaf_id_list);
    this.parent.style.transition =
        "height " + this.config.transition_time + " ease-in-out";
    this.update_heights();
    
};

renderer.prototype.toggle_subtree_shown = function(node_id) {
    if (this.tree_renderer.subtree_hidden(node_id)) {
        this.tree_renderer.show_subtree(node_id);
    } else {
        this.tree_renderer.hide_subtree(node_id);
    }
    this.show_mat_rows_for_tree_leaves();
};

renderer.prototype.show_global_root = function(node_id) {
    this.tree_renderer.show_global_root();
    this.show_mat_rows_for_tree_leaves();
};

renderer.prototype.show_only_subtree = function(node_id) {
    this.tree_renderer.show_only_subtree(node_id);
    this.show_mat_rows_for_tree_leaves();
};

renderer.prototype.show_mat_rows_for_tree_leaves = function() {
    var leaf_id_list = jQuery.map( this.tree_renderer.leaves(),
                                   function(x) { return x.id; } );
    this.mat_renderer.show_rows(leaf_id_list);
    this.update_heights();
};

renderer.prototype.update_heights = function() {
    this.parent.style.height =
        ( this.tree_renderer.tree_height
          + this.config.header_height
          + this.config.mat_cell_border
          + this.parent_top_border
          + this.parent_bot_border ) + "px";
};

renderer.prototype.node_clicked = function(node, node_elem, event) {
    var buttons = [];
    var jqElem = jQuery(node_elem);
    var self = this;

    // if there's an existing popover,
    if (this.popover_elem !== undefined) {
        // destroy it
        this.popover_elem.popover("destroy");
        // if this click is on the same node that the popover was on,
        // then return
        if (this.popover_elem[0] === jqElem[0]) {
            this.popover_elem = undefined;
            return;
        }
        // otherwise this.popover_elem becomes the new popover element
        // (below)
    }
    this.popover_elem = jqElem;
    jQuery.Event(event).stopPropagation();

    var podata = jqElem.data("bs.popover");

    jqElem.popover({
        html: true,
        placement: "auto top",
        container: "body",
        title: node.label
    });
    var podata = jqElem.data("bs.popover");

    if (! node.is_leaf()) {
        podata.tip().append("&nbsp;");

        var hideButton = jQuery("<button type='button' class='btn btn-primary btn-xs'></button>");
        hideButton.click(function() {
            jqElem.popover("destroy");
            self.popover_elem = undefined;
            self.toggle_subtree_shown(node.id);
        });

        hideButton.text( self.tree_renderer.subtree_hidden(node.id)
                         ? "Show subtree" : "Hide subtree" );
        podata.tip().append(hideButton);
    }

    podata.tip().append("&nbsp;");
    var rootButton = jQuery("<button type='button' class='btn btn-primary btn-xs'></button>");
    rootButton.click(function() {
        jqElem.popover("destroy");
        self.popover_elem = undefined;
        if (self.tree_renderer.only_subtree_shown(node.id)) {
            self.show_global_root();
        } else {
            self.show_only_subtree(node.id);
        }
    });
    rootButton.text( self.tree_renderer.only_subtree_shown(node.id)
                     ? "Show global root" : "Show only subtree" );
    podata.tip().append(rootButton);
    podata.tip().append("&nbsp;");

    jqElem.popover("show");
};

renderer.prototype.render_tree = function() {
    this.tree_renderer.display();

    this.tree_renderer.iterate_preorder(
        function(id, label, meta, dom_elem, children) {
            if ("true" == meta.speciation_p) {
                dom_elem.style.borderRadius = "6px";
            } else if ("true" == meta.duplication_p) {
                var has_children = children.length > 0;
                if (has_children) {
                    dom_elem.style.backgroundColor = "black";
                }
            }
        }
    );

    var color_list = [
        "white",
        "rgb(238, 232, 170)",
        "rgb(255, 182, 193)",
        "rgb(135, 206, 250)",
        "rgb(240, 128, 128)",
        "rgb(152, 251, 152)",
        "rgb(216, 191, 216)",
        "rgb(240, 230, 140)",
        "rgb(224, 255, 255)",
        "rgb(255, 218, 185)",
        "rgb(211, 211, 211)",
        "rgb(255, 250, 205)",
        "rgb(176, 196, 222)",
        "rgb(255, 228, 173)",
        "rgb(175, 238, 238)",
        "rgb(244, 164, 96)",
        "rgb(127, 255, 212)",
        "rgb(245, 222, 179)",
        "rgb(255, 160, 122)",
        "rgb(221, 160, 221)"
    ];
    var self = this;
    this.tree_renderer.iterate_preorder(
        function(id, label, meta, dom_elem, children) {
            var is_leaf = 0 == children.length;
            if (is_leaf) {
                dom_elem.style.backgroundColor =
                    color_list[self.node_colors[id] % color_list.length];
                if (id in self.bioentity_map) {
                    dom_elem.style.color = "black";
                } else {
                    dom_elem.style.color = "#aaa";
                }
            }
        }
    );
};

function getStyle(el, styleProp) {
    if (el.currentStyle) {
        var y = el.currentStyle[styleProp];
    } else if (window.getComputedStyle) {
        var y = window.getComputedStyle(el,null).getPropertyValue(styleProp);
    }
    return y;
}

})();
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.matrix == "undefined" ){ bbop.widget.matrix = {}; }

(function() {

bbop.widget.matrix.renderer = renderer;

// if there are multiple instances of this widget on the page, this will
// make sure that their CSS rules don't step on each other
var this_id = 0;

function renderer(parent, row_descriptors, col_descriptors,
                  cell_renderer, config) {
    var default_config = {
        // cell_width: null means to set the width based on cell contents;
        // otherwise cell_width is a fixed width per cell in pixels
        cell_width: null,
        cell_height: 24,
	cell_border: 1,
        cell_padding: 4,
        cell_font: "Helvetica, Arial, sans-serif",

        header_height: 30,
        header_font: "Helvetica, Arial, sans-serif",
        show_headers: true,
        transition_time: "0.8s"
    };

    if( "object" == typeof config ){
        this.config = bbop.core.merge(default_config, config);
    }else{
        this.config = default_config;
    }

    this.parent = ( ( "string" == typeof parent )
		    ? document.getElementById(parent)
		    : parent );
    if (this.parent === undefined) {
        throw "can't find parent element " + parent;
    }

    // css width/height don't include padding or border, but
    // offsetWidth/offsetHeight do
    this.offset_size_delta = ( ( this.config.cell_padding * 2 )
                               + ( this.config.cell_border ) );
    // setting font size from cell height.  We'd like to set font cap height
    // directly, but we can only set em box size.  Cap height on average is
    // 70% of em box size, so we'll set the font size to the intended
    // height divided by 0.7
    var cell_font_size = ( ( this.config.cell_height
                             - this.offset_size_delta )
                           / 0.7 );
    var header_font_size;
    if (null == this.config.cell_width) {
        header_font_size = ( ( this.config.header_height
                               - this.offset_size_delta )
                             / 0.7 );
    } else {
        header_font_size = ( ( this.config.cell_width
                               - this.offset_size_delta )
                             / 0.7 );
    }

    var css_prefix = "matrix_" + this_id++;
    var header_class = css_prefix + "_header";
    var inner_header_class = css_prefix + "_inner";
    var cell_class = css_prefix + "_cell";
    this.fixed_width = (null != this.config.cell_width);

    this.row_descriptors = row_descriptors;
    this.col_descriptors = col_descriptors;

    this.headers = [];
    this.matrix = [];
    this.num_cols = col_descriptors.length;
    this.num_rows = row_descriptors.length;
    //rowdesc_map: row descriptor -> matrix row index
    this.rowdesc_map = {};
    //coldesc_map: col descriptor -> matrix col index
    this.coldesc_map = {};
    //rowindex_map: displayed row index -> matrix row index
    this.rowindex_map = Array(row_descriptors.length);
    //colindex_map: displayed col index -> matrix col index
    this.colindex_map = Array(col_descriptors.length);
    this.grid_vert = [];
    this.grid_horiz = [];

    var vert_class = css_prefix + "_vert";
    //create vertical grid lines
    for (var i = 0; i < col_descriptors.length; i++) {
        var gridline = document.createElement("div");
        gridline.className = vert_class;
        gridline.style.top = "0px";
        this.parent.appendChild(gridline);
        this.grid_vert.push(gridline);
    }
    this.first_vert_gridline = document.createElement("div");
    this.first_vert_gridline.className = vert_class;
    this.first_vert_gridline.style.cssText = [
        "top: 0px;", "width: 0px;", "left: 0px;",
        "margin-left: 0px;", "margin-right: 0px;",
        "padding-left: 0px;", "padding-right: 0px;"
    ].join("\n");
    this.parent.appendChild(this.first_vert_gridline);

    var horiz_class = css_prefix + "_horiz";
    //create horizontal grid lines
    for (var i = 0; i < row_descriptors.length; i++) {
        var gridline = document.createElement("div");
        gridline.className = horiz_class;
        gridline.style.left = "0px";
        gridline.style.top = ( (this.config.show_headers ?
                                this.config.header_height : 0)
                               + (i * this.config.cell_height) ) + "px";
        this.parent.appendChild(gridline);
        this.grid_horiz.push(gridline);
    }
    this.first_horiz_gridline = document.createElement("div");
    this.first_horiz_gridline.className = horiz_class;
    this.first_horiz_gridline.style.cssText = [
        "top: 0px;", "height: 0px;", "left: 0px;",
        "margin-top: 0px;", "margin-bottom: 0px;",
        "padding-top: 0px;", "padding-bottom: 0px;"
    ].join("\n");
    this.parent.appendChild(this.first_horiz_gridline);
    if (this.config.show_headers) {
        this.header_gridline = document.createElement("div");
        this.header_gridline.className = horiz_class;
        this.header_gridline.style.cssText = [
            "top: " + ( this.config.header_height 
                        - this.config.cell_border ) + "px;",
            "height: 0px;", "left: 0px;",
            //"margin-bottom: 0px;",
            "padding-top: 0px;", "padding-bottom: 0px;"
        ].join("\n");
        this.parent.appendChild(this.header_gridline);
    }

    for (var i = 0; i < col_descriptors.length; i++) {
        if (this.config.show_headers) {
            //create the header cells
            var cell = document.createElement("div");
            cell.className = header_class;
            cell.style.top = "0px";
            if (null == this.config.cell_width) {
                cell.title = col_descriptors[i].name;
                cell.appendChild(document.createTextNode(col_descriptors[i].name));
            } else {
                // create inner rotated element
                var inner = document.createElement("div");
                inner.className = inner_header_class;
                inner.title = col_descriptors[i].name;
                inner.appendChild(document.createTextNode(col_descriptors[i].name));
                cell.appendChild(inner);
            }
            this.parent.appendChild(cell);
            this.headers.push(cell);
        }
        this.colindex_map[i] = i;
        this.coldesc_map[col_descriptors[i].id] = i;
    }

    for( var ri = 0; ri < row_descriptors.length; ri++ ){
        var row = [];

        for (var ci = 0; ci < col_descriptors.length; ci++) {
            var cell = cell_renderer(cell, row_descriptors[ri],
                                     col_descriptors[ci].id);
            if (null != cell) {
                cell.className += " " + cell_class;
                cell.style.top = ( (this.config.show_headers ?
                                    this.config.header_height : 0)
                                   + (ri * this.config.cell_height) ) + "px";
                this.parent.appendChild(cell);
            }
            row.push(cell);
        }

        this.matrix.push(row);
        this.rowindex_map[ri] = ri;
        this.rowdesc_map[row_descriptors[ri]] = ri;
    }

    this.vert_style = [
        "  position: absolute;",
        "  border-right: " + this.config.cell_border + "px solid black;",
        "  padding: " + this.config.cell_padding + "px;",
        "  margin-left: " + this.config.cell_border + "px;",
        "  overflow: hidden;",
        "  z-index: 0;",
        "  box-sizing: content-box;",
        "  -moz-box-sizing: content-box;"
    ].join("\n");

    this.horiz_style = [
        "  position: absolute;",
        "  border-bottom: " + this.config.cell_border + "px solid black;",
        "  padding: " + this.config.cell_padding + "px;",
        "  height: " + (this.config.cell_height
                        - this.offset_size_delta) + "px;",
        "  margin: 0px;",
        "  margin-top: " + this.config.cell_border + "px;",
        "  z-index: 1;",
        "  overflow: hidden;",
        "  box-sizing: content-box;",
        "  -moz-box-sizing: content-box;"
    ].join("\n");

    this.cell_style = [
        "  position: absolute;",
        "  white-space: nowrap;",
        "  height: " + (this.config.cell_height
                        - this.offset_size_delta) + "px;",
        "  margin: " + this.config.cell_border + "px;",
        "  padding: " + this.config.cell_padding + "px;",
        //"  margin: 0px;",
        "  z-index: 10;",
        "  font: " + cell_font_size + "px" + " " + this.config.cell_font + ";",
        "  line-height: 0.7em;",
        "  overflow: hidden;",
        "  box-sizing: content-box;",
        "  -moz-box-sizing: content-box;"
    ].join("\n");

    this.header_style = [
        "  position: absolute;",
        "  white-space: nowrap;",
        "  height: " + (this.config.header_height
                        - this.offset_size_delta) + "px;",
        //"  border: " + this.config.cell_border + "px solid black;",
        "  margin: " + this.config.cell_border + "px;",
        "  padding: " + this.config.cell_padding + "px;",
        "  font: " + header_font_size + "px" + " "
            + this.config.header_font + ";",
        "  line-height: 0.7em;",
        "  overflow: hidden;",
        "  box-sizing: content-box;",
        "  -moz-box-sizing: content-box;"
    ].join("\n");

    var inner_offset = -(this.config.header_height
                         - header_font_size
                         - this.config.cell_padding);
    this.inner_header_style = [
        "-webkit-transform: rotate(-90deg) translate(" + inner_offset + "px);",
        "transform: rotate(-90deg) translate(" + inner_offset + "px);",
        "-ms-transform: rotate(-90deg) translate(" + inner_offset + "px);",
        "-o-transform: rotate(-90deg) translate(" + inner_offset + "px);",
        "filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);"
    ].join("\n");

    this.transition_style = [
        "  transition-property: top, left;",
        "  transition-duration:" +  this.config.transition_time + ";",
        "  transition-timing-function: ease-in-out, ease-in-out;"
    ].join("\n");

    //"table." + table_class + " tr:hover td { background-color: #bef195; }"

    this.set_styles([
        "div." + header_class + " { ",
        this.header_style,
        "}",
        "div." + inner_header_class + " { ",
        this.inner_header_style,
        "}",
        "div." + cell_class + " { ",
        this.cell_style,
        "}",
        "div." + vert_class + " { ",
        this.vert_style,
        "}",
        "div." + horiz_class + " { ",
        this.horiz_style,
        "}"
    ].join("\n"));

    this.update_height();
    this.width = this.update_widths();// + this.offset_size_delta;
    this.parent.style.width = this.width + this.config.cell_border + "px";

    this.set_styles([
        "div." + header_class + " { ",
        this.header_style,
        this.transition_style,
        "}",
        "div." + inner_header_class + " { ",
        this.inner_header_style,
        this.transition_style,
        "}",
        "div." + cell_class + " { ",
        this.cell_style,
        this.transition_style,
        "}",
        "div." + vert_class + " { ",
        this.vert_style,
        this.transition_style,
        "}",
        "div." + horiz_class + " { ",
        this.horiz_style,
        this.transition_style,
        "}"
    ].join("\n"));
}

renderer.prototype.update_height = function() {
    this.height = ( (this.config.show_headers ? this.config.header_height : 0)
                    + (this.config.cell_height * this.rowindex_map.length) );
    var grid_height = ( this.height - this.offset_size_delta
                        + (2 * this.config.cell_border) ) + "px";
    for (var ci = 0; ci < this.colindex_map.length; ci++) {
        this.grid_vert[this.colindex_map[ci]].style.height = grid_height;
    }
    this.first_vert_gridline.style.height = grid_height;
    this.parent.style.height = (this.height + this.config.cell_border) + "px";
};

renderer.prototype.set_styles = function(css_string) {
    if( ! this._style_node ){
        head = document.getElementsByTagName('head')[0],
        this._style_node = document.createElement('style');
        this._style_node.type = 'text/css';
        head.appendChild(this._style_node);
    }

    if (this._style_node.styleSheet){
        this._style_node.styleSheet.cssText = css_string; // IE
    } else {
        while (this._style_node.firstChild) {
            this._style_node.removeChild(this._style_node.firstChild);
        }
        this._style_node.appendChild(document.createTextNode(css_string));
    }
};

renderer.prototype.update_widths = function() {
    function max_widths(matrix) {
        // matrix is row-major
        var widths = [];
        for (var row = 0; row < matrix.length; row++) {
            for (var col = 0; col < matrix[row].length; col++) {
                var cell = matrix[row][col];
                if (cell) {
                    cell.style.width = "";
                    if (! (col in widths)) widths[col] = 0;
                    widths[col] = Math.max(widths[col], cell.offsetWidth);
                }
            }
        }
        return widths;
    }

    function set_widths(row, colindex_map, widths, offset_delta) {
        var left = 0;
        for (var col = 0; col < colindex_map.length; col++) {
            var cell = row[colindex_map[col]];
            if (cell) {
                cell.style.width =
                    (widths[colindex_map[col]] - offset_delta) + "px";
                cell.style.left = left + "px";
            }
            left += widths[col];
        }
    }

    var widths = Array(this.num_cols);
    var totalWidth = 0;
    if (this.fixed_width) {
        for (var col = 0; col < this.num_cols; col++) {
            widths[col] = this.config.cell_width;
            totalWidth += widths[col];
        }
    } else {
        var header_widths = max_widths([this.headers]);
        var matrix_widths = max_widths(this.matrix);
        for (var col = 0; col < this.num_cols; col++) {
            // || 0 here in case the matrix and headers don't have the
            // same number of columns
            widths[col] = Math.max(header_widths[col] || 0,
                                   matrix_widths[col] || 0);
            totalWidth += widths[col];
        }
    }

    if (this.config.show_headers) {
        set_widths(this.headers, this.colindex_map, widths,
                   this.offset_size_delta);
    }
    for (var ri = 0; ri < this.matrix.length; ri++) {
        set_widths(this.matrix[ri], this.colindex_map, widths,
                   this.offset_size_delta);
    }
    set_widths(this.grid_vert, this.colindex_map, widths,
               this.offset_size_delta);

    var grid_width = ( totalWidth - this.offset_size_delta
                       + (2 * this.config.cell_border) ) + "px";
    for (var ri = 0; ri < this.grid_horiz.length; ri++) {
        this.grid_horiz[ri].style.width = grid_width;
    }
    this.first_horiz_gridline.style.width = grid_width;
    if (this.config.show_headers) {
        this.header_gridline.style.width = grid_width;
    }
        
    this.widths = widths;
    return totalWidth;
};

renderer.prototype.show_rows = function(row_list) {
    var new_rowindex_map = Array(row_list.length);
    var new_row_map = {};

    var displayed_colindices = Array(this.num_cols);
    for (var dci = 0; dci < this.colindex_map.length; dci++) {
        displayed_colindices[this.colindex_map[dci]] = dci;
    }

    // set new row y-positions
    for( var ri = 0; ri < row_list.length; ri++ ){
        if (row_list[ri] in this.rowdesc_map) {
            var matrix_row_index = this.rowdesc_map[row_list[ri]];
            var row = this.matrix[matrix_row_index];
            var row_top = ( (this.config.show_headers ?
                             this.config.header_height : 0)
                            + (ri * this.config.cell_height) ) + "px";

            var horiz_gridline = this.grid_horiz[matrix_row_index];
            horiz_gridline.style.top = row_top;
            horiz_gridline.style.display = "";

            for (var ci = 0; ci < this.num_cols; ci++) {
                var cell = row[ci];
                if (cell) {
                    cell.style.top = row_top;
                    var displayed_colindex = displayed_colindices[ci];
                    if (displayed_colindex == undefined) {
                        cell.style.display = "none";
                    } else {
                        cell.style.display = "";
                    }
                }
            }

            new_rowindex_map[ri] = matrix_row_index;
            new_row_map[row_list[ri]] = 1;
        }
    }

    this.rowindex_map = new_rowindex_map;

    // hide non-shown rows
    for(var i = 0; i < this.row_descriptors.length; i++) {
        var rowdesc = this.row_descriptors[i];
        if (! (rowdesc in new_row_map)) {
            var row_index = this.rowdesc_map[rowdesc];

            this.grid_horiz[row_index].style.display = "none";

            var row = this.matrix[row_index];
            for (var j = 0; j < row.length; j++) {
                var cell = row[j];
                if (cell) cell.style.display = "none";
            }
        }
    }
    this.update_height();
};

renderer.prototype.show_cols = function(col_list) {
    var new_colindex_map = Array(col_list.length);
    var new_col_map = {};

    var displayed_rowindices = Array(this.num_rows);
    for (var dri = 0; dri < this.rowindex_map.length; dri++) {
        displayed_rowindices[this.rowindex_map[dri]] = dri;
    }

    // set new col x-positions
    var left = 0;
    for( var ci = 0; ci < col_list.length; ci++ ){
        matrix_col_index = this.coldesc_map[col_list[ci]];

        var vert_gridline = this.grid_vert[matrix_col_index];
        vert_gridline.style.left = left + "px";
        vert_gridline.style.display = "";
        for (var ri = 0; ri < this.num_rows; ri++) {
            var row = this.matrix[ri];
            var cell = row[matrix_col_index];
            if (cell) {
                cell.style.left = left + "px";

                var displayed_rowindex = displayed_rowindices[ri];
                if (displayed_rowindex == undefined) {
                    cell.style.display = "none";
                } else {
                    cell.style.display = "";
                }
            }
        }
        if (this.config.show_headers) {
            this.headers[matrix_col_index].style.left = left + "px";
            this.headers[matrix_col_index].style.display = "";
        }

        new_colindex_map[ci] = matrix_col_index;
        new_col_map[col_list[ci]] = 1;
        left += this.widths[matrix_col_index];
    }

    this.colindex_map = new_colindex_map;

    // hide non-shown cols
    for(var i = 0; i < this.col_descriptors.length; i++) {
        var coldesc = this.col_descriptors[i];
        if (! (coldesc.id in new_col_map)) {
            matrix_col_index = this.coldesc_map[coldesc.id];
            for (var j = 0; j < this.matrix.length; j++) {
                var cell = this.matrix[j][matrix_col_index];
                if (cell) cell.style.display = "none";
            }
            this.grid_vert[matrix_col_index].style.display = "none";
            if (this.config.show_headers) {
                this.headers[matrix_col_index].style.display = "none";
            }
        }
    }

    this.width = left;
    var grid_width = ( left - this.offset_size_delta
                       + (2 * this.config.cell_border) ) + "px";
    for (var ri = 0; ri < this.rowindex_map.length; ri++) {
        this.grid_horiz[this.rowindex_map[ri]].style.width = grid_width;
    }
    this.first_horiz_gridline.style.width = grid_width;
    if (this.config.show_headers) {
        this.header_gridline.style.width = grid_width;
    }
    this.parent.style.width = this.width + this.config.cell_border + "px";
};

})();
/*
 * Package: message.js
 * 
 * Namespace: bbop.widget.message
 * 
 * TODO: Code needs to be cleaned with <bbop.html>.
 * 
 * BBOP object to produce a self-constructing/self-destructing
 * sliding message/announcments/warnings.
 * 
 * Note that this is a steal of some older code. We'll probably have
 * to clean this up a bit at some point.
 * 
 * These messages make use of the classes "bbop-js-message" and
 * "bbop-js-message-CTYPE", where CTYPE is one of "error",
 * "warning", or "notice".
 * 
 * Initial placement and the likes should be manipulated through
 * "bbop-js-message"--the created divs are append to the end of
 * the body and will not be particularly useful unless styled.
 * 
 * This is a completely self-contained UI.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: message
 * 
 * Contructor for the bbop.widget.message object.
 *
 * A trivial invocation might be something like:
 * : var m = new bbop.widget.message();
 * : m.notice("Hello, World!");
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
bbop.widget.message = function(){
    
    this._is_a = 'bbop.widget.message';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (message): ' + str); }

    // Generate tags.
    function _generate_element(ctype, str){

	var message_classes = ['bbop-js-message',
			       'bbop-js-message-' + ctype];

	var message_elt =
	    new bbop.html.tag('div',
			      {'generate_id': true,
			       'class': message_classes.join(' ')},
			      '<h2>' + str + '</h2>');

    	jQuery("body").append(jQuery(message_elt.to_string()).hide());

	// jQuery-ify the element.
    	var elt = jQuery('#' + message_elt.get_id());
    	return elt;
    }

    // Destroy tags.
    function _destroy_element(){
    	jQuery(this).remove();
    }

    ///
    /// Notice and error handling.
    ///
    // elt.show().fadeIn('slow').fadeOut('slow', _destroy_element);

    /*
     * Function: notice
     * 
     * Temporarily display a messsage styled for notices.
     * 
     * Parameters:
     *  msg - the message
     * 
     * Returns
     *  n/a
     */
    this.notice = function(msg){
    	var elt = _generate_element('notice', msg);
    	elt.show().slideDown('slow').slideUp('slow', _destroy_element);
    };

    /*
     * Function: warning
     * 
     * Temporarily display a messsage styled for warnings.
     * 
     * Parameters:
     *  msg - the message
     * 
     * Returns
     *  n/a
     */
    this.warning = function(msg){
    	var elt = _generate_element('warning', msg);
    	elt.show().slideDown('slow').slideUp('slow', _destroy_element);
    };

    /*
     * Function: error
     * 
     * Temporarily display a messsage styled for errors.
     * 
     * Parameters:
     *  msg - the message
     * 
     * Returns
     *  n/a
     */
    this.error = function(msg){
    	var elt = _generate_element('error', msg);
    	elt.show().fadeTo(2500, 0.9).fadeOut(1000, _destroy_element);
    };

};

// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the bbop namespace whole and export it. Otherwise
// (browser environment, etc.), take no action and depend on the
// global namespace.
if( typeof(exports) != 'undefined' ){
    exports.bbop = bbop;    
}

