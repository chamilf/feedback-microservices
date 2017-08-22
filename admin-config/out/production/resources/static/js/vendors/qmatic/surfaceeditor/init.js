var init = new function() {

	var chromeFrameScriptIncluded = false;
	
	var initCallback = function() {
		tsae.init();
		menubar.initMenu();
		properties.initComponents();
		shortcuts.init();

		$('button').button();
		tsae.toggleButtons(true);
        tsae.toggleTextField(true);
		window.onbeforeunload = init.windowBeforeUnload;
		if ($.url.param('applicationId')) {
			tsae.loadApplication($.url.param('applicationId'));
		}
		initInputValidation();
		tsae.resizeLayout();
	};
	
	/**
	 * If chrome frame is enabled and we run on IE 8 or earlier, ask to install chrome frame
	 */
	var loadChromeFrame = function() {
        if ($.browser.msie && parseFloat($.browser.version) < 9) {
	        if (typeof CFInstall === 'undefined') {
	            if(!chromeFrameScriptIncluded) {
	            	chromeFrameScriptIncluded = true;
	                $('head').append($('<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/chrome-frame/1/CFInstall.min.js"></script>'));
	            }
	            setTimeout(loadChromeFrame, 50);
	        } else {
                if(tsae.callService("runInChromeFrame", {}) == "true") {
                    CFInstall.check({
                        mode: "overlay"
                    });
                }
	        }
        }
	};
	
	this.init = function() {
        // we need to override the default resteasy constructor in order to get synchronous behaviour with callbacks
        var oldprototype = REST.Request.prototype;
        REST.Request = function () {
            REST.log("Creating new Request");
            this.uri = null;
            this.method = "GET";
            this.username = null;
            this.password = null;
            this.acceptHeader = "*/*";
            this.contentTypeHeader = null;
            this.async = false;
            this.queryParameters = [];
            this.matrixParameters = [];
            this.formParameters = [];
            this.cookies = [];
            this.headers = [];
            this.entity = null;
        };
        REST.Request.prototype = oldprototype;

		loadChromeFrame();

        // QP-1612 : Uploaded image invisible if using Google Chrome frame plugin for IE : Even if chrome frame is used, IE will still cache like a devil
        // QP-3458 : Added programmatic IE check since the old method with directive-style in markup is broken in IE10+
        if(init.isInChromeFrame() || navigator.sayswho.indexOf('MSIE') > -1 || navigator.sayswho.indexOf('IE 11') > -1) {
            $('head').append('<script type="text/javascript" src="js/rest-ie.js"></script>');
        }

		// indexOf is not implemented in IE8
		if(typeof Array.indexOf === 'undefined'){
            Array.prototype.indexOf = function(obj){
                for(var i=0; i<this.length; i++){
                    if(this[i]==obj){
                        return i;
                    }
                }
                return -1;
            }
        }

		$(window).resize(tsae.resizeLayout);
        var lang = tsae.callService("readLanguage", {});
        $.i18n.properties({
            name: 'surfaceEditorMessages',
            path: '/qsystem/surfaceeditor/bundle/',
            mode: 'map',
            language: typeof lang === 'undefined' ? " " : lang,
            callback : initCallback
        });
	};
	
	this.windowBeforeUnload = function(evt) {
		if (tsae.isDirty()) {
			return translate.msg('alert_closing_window');
		}
	};
	
	var initInputValidation = function() {
	    $(".positive-integer").keypress(function(event) {
            allowIntegerInputOnly(event, false)
        });
        $(".zero-and-positive-integer").keypress(function(event) {
            allowIntegerInputOnly(event, true);
        });
	};
	
	// http://stackoverflow.com/a/2232838
	var allowIntegerInputOnly = function(event, allowZero) {
        // Backspace, tab, enter, end, home, left, right
        // We don't support the del key in Opera because del == . == 46.
        var controlKeys = [8, 9, 13, 35, 36, 37, 39];
        // IE doesn't support indexOf
        var isControlKey = controlKeys.join(",").match(new RegExp(event.which));
        // Some browsers just don't raise events for control keys. Easy.
        // e.g. Safari backspace.
        if (!event.which || // Control keys in most browsers. e.g. Firefox tab is 0
            (49 <= event.which && event.which <= 57) || // Always 1 through 9
            (48 == event.which && $(event.target).val() && !allowZero) || // No 0 first digit
            isControlKey) { // Opera assigns values for control keys.
            return;
        } else {
            event.preventDefault();
        }
      };

    this.isInChromeFrame = function() {
        return typeof window.externalHost !== 'undefined';
    };
};