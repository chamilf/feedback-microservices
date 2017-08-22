var menubar = new function() {
	
	/**
	 * Initialize components in the properties part of page
	 */
	this.initMenu = function() {
//		$('#file_menu_root').button({icons : {secondary : 'ui-icon-triangle-1-s'} });
		$('.menubar-icons').menubar({
            menuIcon: true,
            buttons: true
		});
		setupSliders();
	};
	
	/**
	 * Set up the sliders for zoom and grid
	 */
	var setupSliders = function() {
		$('#zoom_slider').slider({
			max : 100,
			min : 10,
			value : 100,
			slide : function(evt, ui) {
				tsae.zoom(ui.value);
			}
		});
		$('#grid_slider').slider({
			max : 20,
			min : 0,
			step : 5,
			value : 10,
			slide : function(evt, ui) {
				tsae.grid(ui.value);
			}
		});
	};
	
    var disableButton = function(btn, disabled) {
        if (disabled) {
            $(btn).addClass('ui-state-disabled');
        } else {
            $(btn).removeClass('ui-state-disabled');
        }
    };

    /**
     * Enable or disable buttons depending on application state
     */
    this.toggleButtons = function(isDirty, isEmpty) {
        disableButton($('#surface_settings_button'), isEmpty);
        disableButton($('#component_list_button'), isEmpty);
        disableButton($('#pages_button'), isEmpty);

        // Following does not work with currently used menu plugin
        disableButton($('#file_menu_save'), isEmpty);
        disableButton($('#file_menu_save_as'), isEmpty);
        disableButton($('#file_menu_delete'), isEmpty);
        disableButton($('#file_menu_preview'), isDirty || isEmpty);
    };

	/**
	 * Creates the draggable components for the current surface
	 * 
	 * @param templates is an array of objects that can be dragged to the drawing canvas
	 */
	this.createTemplateMenu = function(templates) {
		var componentDragArea = $('#component_dragarea');
        componentDragArea.empty();
		
		templates.sort(
			function(a, b) {
				var compA = a.type;
				var compB = b.type;
				return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
			}
		);
		
		for (var i = 0; i < templates.length; i++) {
			var template = $(templates[i].htmlContent);
			var html = 
				'<div class="ui-widget">' +
					'<div ' + 
							'class="component_draggable ui-widget-header ui-corner-all" ' +
							'id="template_button_'  + $(template).attr('id') + '">' + 
						translate.msg("name_component_" + $(template).attr('id')) +
					'</div>' + 
				'</div>';
            componentDragArea.append(html);

			// Position of the pointer when we started dragging
			var pointerX;
			var pointerY;

			var buttonId = '#template_button_' + $(template).attr('id');
			$(buttonId).draggable({
				appendTo : '#canvas',
                zIndex : 1000,
				helper : function(evt) {
                    // the type of component, "text", "widget" etc is computed from the id of the selected button
                    var componentId = $(evt.target).attr('id').substr("template_button_".length);
                    // TODO: Update init data with proper class names for all components
                    var elmt;
                    if(componentId != "widget" && componentId != "ticket_text") {
                        elmt = $("#templates" + " > ." + componentId + "_component").clone(false);
                    } else {
                        elmt = $('#' + componentId).clone(false);
                    }
                    // Add text to the helper that should be displayed while dragging
                    var textElement = elmt.find('*').andSelf().
                        filter(function(index) {
                            return ($(this).hasClass("text_single_element") ||
                                $(this).hasClass("text_area_element") ||
                                $(this).hasClass("url_component") ||
                                $(this).hasClass("system_information_element"));
                        })[0];
                    if(typeof textElement !== 'undefined' && null != textElement) {
                        $(textElement).text(translate.msg("text_component_" + elmt.attr('id')));
                    }

                    // to avoid creating duplicate DOM elements
                    elmt.removeAttr('id');
                    if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
                        // half height and width for ticket layout
                        elmt.height(elmt.height()/2);
                        elmt.width(elmt.width()/2);
                        tsae.resizeContainedImage(elmt);
                    }
					return elmt;
				},
				start : function(evt, ui) {
					if ($(this).hasClass('ui-state-disabled')) return false;
					var zoom = tsae.zoom() / 100;
                    var canvas = $("#canvas");
					pointerY = (evt.pageY - canvas.offset().top) / zoom - parseInt($(evt.target).css('top'));
					pointerX = (evt.pageX - canvas.offset().left) / zoom - parseInt($(evt.target).css('left'));
				},
				drag : function(evt, ui) {
                    var canvas = $("#canvas");
					var canvasTop = canvas.offset().top;
					var canvasLeft = canvas.offset().left;

					// Fix for zoom
					var zoom = tsae.zoom() / 100;
					ui.position.left = (evt.pageX - canvasLeft) / zoom; 
					ui.position.top = (evt.pageY - canvasTop) / zoom; 

					// Fix to make component align with grid correctly
					ui.position.top = (ui.position.top - (ui.position.top % tsae.grid()));
					ui.position.left = (ui.position.left - (ui.position.left % tsae.grid()));
					
					// Finally, make sure offset aligns with position
					ui.offset.top = Math.round(ui.position.top + canvasTop);
					ui.offset.left = Math.round(ui.position.left + canvasLeft);

					// Show position
					var pos = $(evt.target).position();
					$('#property_position_x').attr('value', ui.position.left);
					$('#property_position_y').attr('value', ui.position.top);
				},
				cursorAt: {top : 0, left : 0},
				opacity : 0.8,
				stack : '#canvas .component',
				cursor : 'move'
			});
			$(buttonId).mouseover(
				function() {
					$(this).addClass('ui-state-highlight');
				}
			);
			$(buttonId).mouseout(
					function() {
						$(this).removeClass('ui-state-highlight');
					}
				);
		}
	};
	
	/**
	 * Create menu items for all available pages
	 * 
	 * @param isRemoveable if the menu
	 */
//	this.createPageMenu = function(isRemoveable) {
//		$('#change_page_button').show();
//
//		$('#page_hr').nextAll().remove();
//
//		var pages = $('#pages').children();
//
//		// Sort pages in alphabetical order
//		pages.sort(function(p1, p2) {
//			return $(p1).attr('name') > $(p2).attr('name');
//		});
//
//		for (var i = 0; i < pages.length; i++) {
//            var type = $(pages[i]).attr('type');
//			var name = $(pages[i]).attr('name');
//			var id = $(pages[i]).attr('id');
//
//            var html = "";
//            if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
//                if(tsae.getSA().ticketLength == "SINGLE" && type == tsae.pageTypes.TICKET_LAST_PAGE) {
//                    html = '<li><a class="ui-state-disabled" href="#">' + name
//                        + " (" + translate.msg("info_" + type + "_ticket") + ")" + '</a></li>';
//                } else {
//                    html = '<li><a href="#" onclick="tsae.switchPage(\'' + id + '\');">' +
//                        name + " (" + translate.msg("info_" + type + "_ticket") + ")" + '</a></li>';
//                }
//            } else {
//                html = '<li><a href="#" onclick="tsae.switchPage(\'' + id + '\');">' +
//                    name + " (" + translate.msg("info_" + type) + ")" + '</a></li>';
//            }
//
//			$('#page_ul').append($(html));
//		}
//
//		// If start page, do not allow removal
//		$('#page_remove').remove();
//		if (isRemoveable && !gdae.isCallpage()) {
//			$('<li id="page_remove"><a href="#" onclick="tsae.removePage();">' + translate.msg('info_menu_page_remove') + '</a></li>').insertBefore('#page_hr');
//		}
//
//        // this is where the magic happens, see http://jqueryui.com/button/#splitbutton
//
//        $('#change_page_button').button({
//            text: false,
//            icons : {
//                primary : 'ui-icon-triangle-1-s'
//            }
//        }).click(function() {
//            var menu = $('#page_ul').show().position({
//                my: "left top",
//                at: "left bottom",
//                of: this
//            });
//            $(document).one("click", function() {
//                menu.hide();
//            });
//            return false;
//        });
//        $("#page_ul").hide().menu();
//        $("#page_ul").hide().menu('refresh');
//
//	};
};