// Esa Kemppainen 2011-03
// Depends on jquery i18n plugin

var translate = (function($) {

	/** Load and parse .properties files */
	function findKeyInFile(filename, key, callback) {
	    $.ajax({
	        url:        filename,
	        async:      false,
	        success:    function(data, status) {
	        	           var parsed = '';
	            	       var parameters = data.split( /\n/ );
	            	       var reg = /(\{\d+\})/g;
	                       var regRep = /\{(\d+)\}/g;
	            	       for(var i=0; i<parameters.length; i++ ) {
	            	       	   parameters[i] = parameters[i].replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
	            	           if(parameters[i].length > 0 && parameters[i].match("^#")!="#") { // skip comments
	            	               var pair = parameters[i].split( /=/ );
	            	               if(pair.length > 0) {
	                	               var name = unescape(pair[0]).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
	                	               var value = pair.length == 1 ? "" : unescape(pair[1]).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
	                	               if(name == key) {
	                	            	   callback(value);
	                	            	   return;
	                	               }
	            	               }
	            	           }
	            	       }
	            	       
	                    },
	        error:		function(jxr, status, error) {
	        				
	        			},
	        dataType:   'text'
	    });
	}
	
	return {

		/**
		 * Retrieve translated messages by providing a key to the message to be retrieved, e.g. "info_start_page_name".
		 * If parameters need to be passed for the translated message, pass an additional array argument with the strings to replace parameters with, example:
		 * trans.msg('some_text_key', ['param_1_text', 'param_2_text']);
		 * Param {0} in the message will be replaced with 'param_1_text' and {1} with 'param_2_text'. 
		 */
		msg : function() {
			if (arguments.length === 1) {
				return $.i18n.prop(arguments[0]);
			} else if (arguments.length === 2) {
				return $.i18n.prop(arguments[0], arguments[1]);
			} else {
				alert('Invalid number of arguments to translate.msg');
			}
		},
		
		getRTLForLocale : function(locale, callback) {
			$.ajax({
		        url:        '/surface/bundle/surfaceEditorMessages_' + locale + '.properties',
		        async:      false,
		        success:    function(data, status) {
		        	findKeyInFile('/surface/bundle/surfaceEditorMessages_' + locale + '.properties', RTL_KEY, callback);
		        },
		        error:		function(jxr, status, err) {
		        	findKeyInFile('/surface/bundle/surfaceEditorMessages.properties', RTL_KEY, callback);
		        }
		    });						
		}
	}
	
	
	
}($));
