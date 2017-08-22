/**
 * This file contains functions that are only for Graphical Display functionality
 */
var gdae = new function() {

	/** Constant containing name of callpage */
	var CALL_PAGE = 'callpage';
	
	this.createCallpage = function() {
		if ($('#pages > [type="' + CALL_PAGE + '"]').length == 0) {
            var callPageName = translate.msg('info_callpage');
			tsae.createNewPage(null, callPageName, false, true, CALL_PAGE);
			$('#pages > [type="' + CALL_PAGE + '"]').css('background-color', 'transparent');
		}
	};
	
	this.isCallpage = function() {
		return $('#canvas').attr('type') == CALL_PAGE;
	};
	
	/**
	 * When showing callpage, the startpage will be shown in the background of the callpage
	 * 
	 * @param backgroundPage is the name of the page that should be shown as background of callpage
	 */
	this.showStartpageInBackground = function(backgroundPageType) {
	    var hpos = (tsae.isRTL() ? 'right' : 'left');
	    
		if (gdae.isCallpage()) {
			if ($('#callpage_background').length == 0) {
				$('#pages > [type="' + backgroundPageType + '"]').clone()
					.addClass('reset_styles')
					.attr('id', 'callpage_background')
					.removeAttr('type')
					.css('position', 'absolute')
					.css('top', '0px')
					.css(hpos, '0px')
					.css('z-index', 0)
					.show()
					.fadeTo('slow', 0.1)
						.appendTo('#canvas_container');
			}
			$('#canvas').css('z-index', 1);
		} else {
			$('#callpage_background').remove();
			$('#canvas').css('z-index', 0);
		}
	};

};