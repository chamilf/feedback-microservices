var tsae = new function() {

	// FONT DEFAULTS, last resort.
	// Format of internal font representation is [font-family];[font-size];[font-style];[font-weight].
	var FONT_FAMILY='Arial', FONT_SIZE='36px', FONT_STYLE='normal' , FONT_WEIGHT='normal';

    /** Constant values of type for page */
    var START_PAGE = 'startpage', TICKET_LAST_PAGE = 'lastpage', STANDARD_PAGE = 'standard';

    this.deviceTypes = {
        TP311X: 15,
        SW_TP3115_TOUCH: 62,
        SW_VISION15_TOUCH: 63,
        SW_VISION17_TOUCH: 64,
        SW_MEDIA_HD_POSITIONAL_DISPLAY_POINT: 65,
        SW_MEDIA_HD_DISPLAY_POINT: 66,
        SW_MEDIA_FULL_HD_DISPLAY_POINT: 67
    };

    this.surfaceGroup = {
        TOUCH: "TOUCH",
        MEDIA: "MEDIA",
        POSITIONAL: "POSITIONAL",
        TICKET: "TICKET"
    };

    this.pageTypes = {
        START_PAGE: 'startpage',
        TICKET_LAST_PAGE: 'lastpage',
        STANDARD_PAGE: 'standard'
    };

    this.ticketLength = {
        SINGLE: 'SINGLE',
        DOUBLE: 'DOUBLE'
    };

	var sa;
    var direction = "ltr";

	this.getSA = function() {
		return sa;
	};

    this.getLanguageDirection = function() {
        return direction;
    };

    this.isRTL = function() {
        return direction == 'rtl';
    };

	/** Current zoom level (percentage) */
	var zoomLevel;
	/** Counter to ensure that new component's id's will be unique */
	var idCounter = 0;
	/** List of titles of resizable components */
	var resizableComponents = new Array();

	var dirty = false;

	var gridSize = 10;

	this.init = function() {
        var userName = tsae.callService("getCurrentUser", {});
        $("#userName").text(userName);

        $("#application_name").text(translate.msg("info_no_application_active"));

        var dir = tsae.callService("getLanguageDirection", {});
        direction = dir.toLowerCase();

        setBrowserClass();
		setupPositionEvents();
        setupChangePageName();
	};

	this.exceptionHandler = function(errorString, exception) {
		dialogs.showAlertDialog(errorString, translate.msg('error'));
	};

	this.isEmpty = function() {
		return (sa ? false : true);
	};

	this.isDirty = function() {
		if (sa && dirty) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Call whenever a change is made to keep track of changes
	 */
	this.markDirty = function() {
		if (dirty) return;
		dirty = true;
		menubar.toggleButtons(dirty, sa ? false : true);
		$('#dirty_flag').text('*');
	};

	var markClean = function() {
		dirty = false;
		menubar.toggleButtons(dirty, sa ? false : true);
		$('#dirty_flag').text('');
	};

	var setBrowserClass = function()
	{
		 if ( $.browser.msie ){
		    if($.browser.version == '6.0')
		    {   $('html').addClass('ie6');
		    }
		    else if($.browser.version == '7.0')
		    {   $('html').addClass('ie7');
		    }
		    else if($.browser.version == '8.0')
		    {   $('html').addClass('ie8');
		    }
		    else if($.browser.version == '9.0')
		    {   $('html').addClass('ie9');
		    }
		    else if($.browser.version == '10.0')
		    {   $('html').addClass('ie10');
		    }
		 }
		 else if ( $.browser.webkit )
		 { $('html').addClass('webkit');
		 }
		 else if ( $.browser.mozilla )
		 { $('html').addClass('mozilla');
		 }
		 else if ( $.browser.opera )
		 { $('html').addClass('opera');
		 }
	};

	/**
	 * Create a unique ID
	 */
	var createUniqueId = function(prefix) {
		var newId = prefix + (idCounter++);
		// While loop is necessary to avoid problems in existing (R3) applications
		while ($('#' + newId).attr('id')) {
			newId = prefix + (idCounter++);
		}
		sa.idSequence = idCounter;
		return newId;
	};

	/**
	 * Called to disable buttons when application is closed / or enable buttons when application is opened
	 */
	this.toggleButtons = function(disable) {
		$('#apply_properties_button').button({ disabled: disable });
		menubar.toggleButtons(dirty, sa ? false : true);
	};

    /**
     * Called to disable textfield when application is closed / or enable buttons when application is opened
     */
    this.toggleTextField = function(disable) {
        var elem = $('#page_name');
        toggleDisabled(elem, disable);
    };

    var toggleDisabled = function(elem, disable) {
        if (disable) {
            $(elem).addClass('ui-state-disabled');
        } else {
            $(elem).removeClass('ui-state-disabled');
        }
    }

	/**
	 * Reset application. Use before loading a new application.
	 */
	var reset = function() {
        sa = null;
        markClean();

        var canvas = $('#canvas');

		tsae.toggleButtons(true);
        tsae.toggleTextField(false);
		canvas.empty();
		canvas.removeAttr('style');
		$('#pages').empty();
		$('#zoom_slider').slider('value', 100);
		$('#templates').empty();
		$('#templateMenu').empty();
		$('#page_name').val("");
        $('#property_service_select > option[value!="-1"]').remove();
        $('#property_service_select').val("-1");
		tsae.focusComponent();
		canvas.hide();
        $('#surface_group').text('');
        $("#surfaceGroupSpace").text('');
        $('#device_type').text('');
        $("#deviceTypeSpace").text('');
        $("#application_name").text(translate.msg("info_no_application_active"));
        widgets.reset();
        dialogs.closeAndResetDialogs();
	};

	/**
	 * Set which properties we can edit for a component
	 *
	 * Will go through all these properties and add class names like "property_BUTTON", "property_LINK", etc to them
	 *
	 * componentId is the id of the component template
	 * properties are the editable properties for this component, a comma separated list
	 */
	var setupProperties = function(componentId, properties) {
		for (var i = 0; i < properties.length; i++) {
			if ($.trim(properties[i]) == 'size') {
				// Component is resizable, add to resizableComponents array
				resizableComponents.push($('#' + componentId).attr('id'));
			} else {
				// Add class to appropriate property
				$('#property_' + $.trim(properties[i])).addClass('property_' + componentId);
			}
		}
	};

	/**
	 * Load templates for components. Called after loading an application
	 *
	 * - Add the templates to the Add-menu
	 * - Setup properties to templates
	 * - Setup if component is resizable
	 * - Show/hide elements depending on which components are available
	 *
	 */
	var loadTemplates = function() {
		resizableComponents = new Array(); // Clear resizable array, components will be added in call to setupProperties
		$('#applicationSettingsVMEnabled').hide();
		var templates = sa.surfaceType.allowedComponents;
		for (var i = 0; i < templates.length; i++) {
			var template = $(templates[i].htmlContent);
			// iframe fix
			if ($(template).attr('id') == 'vertical_message') $('#applicationSettingsVMEnabled').show();
			$('#templates').append(template);
			setupProperties($(template).attr('id'), templates[i].surfaceComponentProperties);
		}
		$('#templates button').button();
		menubar.createTemplateMenu(templates);
	};

    /**
     * Set up canvas to match the currently loaded application
     * TODO: This method is messy, refactor.
     */
    var setupCanvas = function(existingApplication) {
        tsae.zoom(100);
        $('#canvas').css('direction', direction);

        $('#pages').html(sa.html);

        // Put start page in drawing canvas

        if (existingApplication) {
            var startpage = $('#pages > [type="' + START_PAGE + '"]').first();
            $('#canvas').replaceWith($(startpage));
            //$(startpage).attr('title', 'canvas');
            $(startpage).attr('id', 'canvas');
        } else {
            if (sa.screenWidth) {
                $('#canvas').width(sa.screenWidth);
                $('#canvas').height(sa.screenHeight);
            }
            $('#canvas').attr('type', START_PAGE);
            var startPageName = "Start"; // fallback only
            if(sa.surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
                startPageName = translate.msg('info_startpage_ticket');
            } else {
                startPageName = translate.msg('info_startpage');
            }
            $('#canvas').attr('name', startPageName);
            $('#canvas').css('position', 'relative');
        }
        $('#canvas').show();
        $('#page_name').val($('#canvas').attr('name'));

        setupMultiPage();
        //menubar.createPageMenu(false);
        swapPage();
    };

	/**
	 * Things to do when we swap page
	 */
	var swapPage = function() {
		properties.createPageSelect();
		tsae.toggleButtons(false);
		tsae.focusComponent();
		disableTemplates();
		gdae.showStartpageInBackground(START_PAGE);

		// Make canvas droppable
		$('#canvas').droppable({
			accept: '.component_draggable',
			drop: function(evt, ui) {
                var canvas = $('#canvas');
				var canvasHeight = canvas.height();
				var canvasWidth = canvas.width();

				// Check if element is outside canvas
				if (ui.position.left < 0) return;
				if (ui.position.left + ui.helper.width() > canvasWidth) return;
				if (ui.position.top < 0) return;
				if (ui.position.top + ui.helper.height() > canvasHeight) return;

				// Add element to canvas
				tsae.addComponent(ui.draggable.attr('id').substr(16), ui.position.left, ui.position.top);
			}
		});

		dialogs.reloadComponentsList();
	};

    var setupChangePageName = function() {
        $('#page_name').change(function(evt) {
            tsae.changePageName($('#page_name').val());
        });
    };

	/**
	 * Create new application
	 */
	this.createNew = function(deviceTypeCode, resolution) {
		reset();

        sa = tsae.callService("createApplication", {"deviceTypeCode": new Number(deviceTypeCode), "resolution" : resolution});
        setupCanvas(false);
        loadTemplates();
        tsae.editSettings();
        widgets.initWidgets();
        $('#surface_group').text(translate.msg('name_surface_group_' + sa.surfaceType.allowedSurfaceGroup.toLowerCase()));
        $('#surfaceGroupSpace').text("|");
        $('#surfaceGroupSpace').prepend("&nbsp;");
        $('#surfaceGroupSpace').append("&nbsp;");
        $('#device_type').text(translate.msg('name_surface_type_allowed_device_code_' + sa.surfaceType.allowedDevice));
        var deviceTypeSpace = $('#deviceTypeSpace');
        deviceTypeSpace.text("|");
        deviceTypeSpace.prepend("&nbsp;");
        deviceTypeSpace.append("&nbsp;");
        $("#application_name").text(translate.msg("info_application_not_saved"));
        var applicationNameSpace = $('#applicationNameSpace');
        applicationNameSpace.text("|");
        applicationNameSpace.prepend("&nbsp;");
        applicationNameSpace.append("&nbsp;");
        $('#application_resolution').text(sa.screenWidth + "x" + sa.screenHeight);
	};

	/**
	 * If element contains an image, resize the image to element size
     * @param elmt The jQuery element
     * @param useRealSize if true, the image will be sized to its real size unless it's to big for the canvas in which case it will be fitted within the canvas borders
	 */
	this.resizeContainedImage = function(elmt, useRealSize) {
		var img = elmt.find('img').first();
        // Only one (1) or no image(s) per component allowed
        if(img.size() == 1) {
            img.css("margin-left", 'auto');
            img.css("margin-top", 'auto');
            getOriginalImageSize(img, function(imgOriginalSize) {
                var picOriginalWidth = imgOriginalSize.width,
                picOriginalHeight = imgOriginalSize.height,
                picNewWidth = imgOriginalSize.width,
                picNewHeight = imgOriginalSize.height,
                elmtHeight = elmt.height(),
                elmtWidth = elmt.width(),
                src = img.attr('src'),
                ratio, ratioX, ratioY, stretch = false;

                if(typeof useRealSize !== 'undefined' && useRealSize != null && useRealSize == true) {
                    var canvas = $("#canvas");
                    if(picNewWidth > canvas.width() && picNewHeight > canvas.height()) {
                        picNewWidth = canvas.width();
                        picNewHeight = canvas.height();
                    } else if(picNewWidth > canvas.width()) {
                        picNewWidth = canvas.width();
                    } else if(picNewHeight > canvas.height()) {
                        picNewHeight = canvas.height();
                    }
                    elmt.height(picNewHeight);
                    elmtHeight = elmt.height();
                    elmt.width(picNewWidth);
                    elmtWidth = elmt.width();
                }
                // calculate scale ratios
                ratioX = elmtWidth / picOriginalWidth;
                ratioY = elmtHeight / picOriginalHeight;
                if(elmt.attr('scaling') == 'center') {
                    picNewWidth = picOriginalWidth;
                    picNewHeight = picOriginalHeight;
                } else if(elmt.attr('scaling') == 'fill') {
                    ratio = ratioX > ratioY ? ratioX : ratioY;
                    picNewWidth = parseInt(picOriginalWidth * ratio, 10);
                    picNewHeight = parseInt(picOriginalHeight * ratio, 10);
                } else if(elmt.attr('scaling') == 'fit') {
                    ratio = ratioX < ratioY ? ratioX : ratioY;
                    picNewWidth = parseInt(picOriginalWidth * ratio, 10);
                    picNewHeight = parseInt(picOriginalHeight * ratio, 10);
                } else if(elmt.attr('scaling') == 'stretch') {
                    picNewWidth = elmtWidth;
                    picNewHeight = elmtHeight;
                    stretch = true;
                }
                img.attr('src', tsae.getImageUrl(src, picNewWidth, picNewHeight, stretch));
                img.attr('width', picNewWidth);
                img.attr('height', picNewHeight);
                img.css("margin-left", Math.floor((elmtWidth - picNewWidth) / 2));
                img.css("margin-top", Math.floor((elmtHeight - picNewHeight) / 2));
                if(typeof useRealSize !== 'undefined' && useRealSize != null && useRealSize == true) {
                    tsae.fitComponentInCanvas(elmt);
                }
            });
        }
	};

    this.calculateAndSetAspectRatio = function(container) {
        if (typeof container.attr('keep-aspect-ratio') !== 'undefined') {
            getOriginalImageSize(container.find('img').first(), function(imageOriginalSize) {
                var aspectRatio = imageOriginalSize.width / imageOriginalSize.height;
                container.attr('aspect-ratio', aspectRatio);
            });
        }
    };

    /**
     *
     * @param img an image selected with jQuery
     * @param callback The original image width and height is passed as an object to this function
     */
    var getOriginalImageSize = function(img, callback) {
        if(typeof img !== 'undefined' && null != img && typeof img.attr('src') !== 'undefined' &&
            img.attr('src') != null && img.attr('src').length > 0) {
            var src = img.attr('src');
            var urlExtra = "";
            if ((typeof lowfiie !== 'undefined' && lowfiie) || init.isInChromeFrame()) {
                urlExtra = '?breakcache=' + Math.random();
            }
            if($.param.querystring(src).length > 0) {
                src = src.substring(0, src.indexOf($.param.querystring(src)) + 1);
            }
            $("<img/>").attr("src", src + urlExtra)
                .load(function() {
                    if(typeof callback === 'function') {
                        callback({"width": this.width, "height": this.height});
                    }
                });
        }
    };

    this.getImageUrl = function(src, imgWidth, imgHeight, stretch) {
        return $.param.querystring(src, 'color=palette&quality=1.0&width=' + imgWidth + '&height=' + imgHeight +
            (stretch ? '&stretch=true' : ''), 2);
    };

	/**
	 * Make a component draggable, and resizable if applicable, hide iframes
	 *
	 * Note: draggable and resizable whilst zooming are not supported by jQuery UI
     * TODO: Chop up; overlong function snake
	 */
	var makeResizable = function(component) {
		if (!component) return; // nullcheck

		var c = component;
		if ($.inArray($(c).attr('name'), resizableComponents) >= 0 && zoomLevel == 100) {
			if (!$(c).hasClass('ui-resizable')) {
				var aspectRatio = parseFloat($(c).attr('keep-aspect-ratio'));
				var keepAspectRatio = $(c).attr('keep-aspect-ratio') == 'true' || isFinite(aspectRatio);
				$(c).resizable({
					autoHide : true,
					grid : [gridSize, gridSize],
					aspectRatio : isFinite(aspectRatio) ? aspectRatio : keepAspectRatio,
                    containment: $("#canvas"),
					start : function(event, ui) {
						tsae.focusComponent($(c).attr('id'));
						if (zoomLevel != 100) {
							// Does currently not work, due to erroneously implemented event in jQuery UI 1.8.11
							// Will probably work with later versions
						    event.preventDefault();
						    event.stopImmediatePropagation();
						    return false;
						}
					},
					resize : function(evt, ui) {
                        var rotationOffset = calculateRotationOffset($(this));

                        // live update of width and height input fields while dragging
                        if(rotationOffset != 0) {
                            $('#property_size_w').attr('value', ui.size.height);
                            $('#property_size_h').attr('value', ui.size.width);
                        } else {
                            $('#property_size_w').attr('value', ui.size.width);
                            $('#property_size_h').attr('value', ui.size.height);
                        }

						tsae.markDirty();
					},
					stop : function(evt, ui) {
						tsae.resizeContainedImage($(this));
                        var rotationOffset = calculateRotationOffset($(this));
                        if(rotationOffset != 0) {
                            tsae.fitComponentInCanvas($(this));
                            $('#property_size_w').attr('value', Math.round($(this).height()));
                            $('#property_size_h').attr('value', Math.round($(this).width()));
                        } else {
                            $('#property_size_w').attr('value', Math.round($(this).width()));
                            $('#property_size_h').attr('value', Math.round($(this).height()));
                        }
					}
				});
			}
		}

		// Position of the pointer when we started dragging
		var pointerX;
		var pointerY;
		$(c).draggable({
//			stack : '.component',
//			addClasses : false,
//			containment : $('#canvas'), Works bad with scroll
			cancel: null,
			start : function(evt, ui) {
				var zoom = zoomLevel / 100;
                var canvas = $("#canvas");
				pointerY = (evt.pageY - canvas.offset().top) / zoom - parseInt($(evt.target).css('top'));
				pointerX = (evt.pageX - canvas.offset().left) / zoom - parseInt($(evt.target).css('left'));
			},
			drag : function(evt, ui) {
                var canvas = $("#canvas");
				var canvasTop = canvas.offset().top;
				var canvasLeft = canvas.offset().left;
				var canvasHeight = canvas.height();
				var canvasWidth = canvas.width();

				// Fix for zoom
				var zoom = zoomLevel / 100;
				ui.position.top = Math.round((evt.pageY - canvasTop) / zoom - pointerY);
				ui.position.left = Math.round((evt.pageX - canvasLeft) / zoom - pointerX);

                // If the dragged element has been rotated, calculate how far outside or inside top and left
                // are allowed to be
                var rotationOffset = calculateRotationOffset($(this));

                // Check if element is outside of canvas
                if (ui.position.left < -rotationOffset) ui.position.left = -rotationOffset;
                if (ui.position.left + $(this).width() > canvasWidth + rotationOffset) ui.position.left = canvasWidth - $(this).width() + rotationOffset;
                if (ui.position.top < rotationOffset) ui.position.top = rotationOffset;
                if (ui.position.top + $(this).height() > canvasHeight - rotationOffset) ui.position.top = canvasHeight - $(this).height() - rotationOffset;

				// Fix to make component align with grid correctly
				ui.position.top = (ui.position.top - (ui.position.top % gridSize));
				ui.position.left = (ui.position.left - (ui.position.left % gridSize));

				// Finally, make sure offset aligns with position
				ui.offset.top = Math.round(ui.position.top + canvasTop);
				ui.offset.left = Math.round(ui.position.left + canvasLeft);

				// Show position
                var pos = $(evt.target).position();
                $('#property_position_x').attr('value', Math.round(pos.left));
                $('#property_position_y').attr('value', Math.round(pos.top));

				tsae.markDirty();
			},
			stop : function(evt, ui) {
				var pos = $(evt.target).position();
				$('#property_position_x').attr('value', Math.round(pos.left));
				$('#property_position_y').attr('value', Math.round(pos.top));
			},
//			distance : 30, Does not work with IE !!!
//			grid : [gridSize, gridSize], Does not get correct offset
			cursor : 'default'
//			iframeFix : true
		});
	};

	/**
	 * Check if an element is inside the drawing canvas
	 */
	this.isInsideCanvas = function(x, y, w, h) {
		var canvas = $('#canvas');

		if (x < 0 || y < 0) {
			return false;
		}

		if (x + w > canvas.width()) return false;
		if (y + h > canvas.height()) return false;

		return true;
	};

    /**
     * Keeps an element in the canvas, taking any rotation into account
     *
     * @param ui the jQuery element to fit within the canvas
     */
    this.fitComponentInCanvas = function(ui) {
        var canvas = $("#canvas");
        var canvasHeight = canvas.height();
        var canvasWidth = canvas.width();

        var left = ui.prop('offsetLeft');
        var top = ui.prop('offsetTop');

        // If the dragged element has been rotated, calculate how far outside or inside top and left
        // are allowed to be
        var rotationOffset = calculateRotationOffset(ui);

        // Check if element is outside of canvas
        if (left < -rotationOffset) left = -rotationOffset;
        if (left + ui.width() > canvasWidth + rotationOffset) left = canvasWidth - ui.width() + rotationOffset;
        if (top < rotationOffset) top = rotationOffset;
        if (top + ui.height() > canvasHeight - rotationOffset) top = canvasHeight - ui.height() - rotationOffset;

        // Fix to make component align with grid correctly
        left = (left - (left % gridSize));
        top = (top - (top % gridSize));

        ui.css({
            'left': parseInt(left),
            'top': parseInt(top)
        });


    };

    /**
     * @param component integer between 0 and 3, multiply by 90 to get the actual rotation
     * @param newRotation
     * @param oldRotation
     */
    this.correctXYWHAfterRotation = function(component, newRotation, oldRotation) {

        var pos = component.position();
        $('#property_position_x').attr('value', parseInt(pos.left));
        $('#property_position_y').attr('value', parseInt(pos.top));

        if((newRotation % 2 == 1 && oldRotation % 2 == 0) || (newRotation % 2 == 0 && oldRotation % 2 == 1)) {
            // change width and height to match rotation
            var oldHeight = $('#property_size_h').attr('value');
            var oldWidth = $('#property_size_w').attr('value');
            $('#property_size_w').attr('value', parseInt(oldHeight));
            $('#property_size_h').attr('value', parseInt(oldWidth));
        }
    };

    /**
     * Calculates the distance a component can be dragged outside or inside of the canvas if it has been
     * rotated.
     * @param component zero if the object has not been rotated, has been rotated 180 degrees or is a square. Negative
     * if the component's width is smaller than its height.
     */
    var calculateRotationOffset = function(component) {
        // Check if element has been rotated
        var rotation = component.attr("rotation");
        var rotationOffset = 0;
        if(typeof rotation !== 'undefined' && null !== rotation && rotation % 2 == 1) {
            // Bingo, bango, bongo! Left and top are not what you think they are due to the rotation transform
            rotationOffset = (component.width() / 2) - (component.height() / 2);
        }
        return parseInt(rotationOffset);
    };

	/**
	 * Attach events to components in canvas.
	 *
	 * - Make draggable
	 * - Make resizable if applicable
	 * - Click event for showing properties
	 * - Stop event propagation to component
	 */
	this.attachEventsToComponents = function(components) {
		// Attach events to canvas
        var canvas = $('#canvas');
		canvas.unbind();
		canvas.click(function(evt) {
			tsae.focusComponent('canvas');
		});

		// Set focus to component and stop event propagation
		$(components).unbind();
		$(components).click(function(evt) {
			evt.stopPropagation();
			if ($(evt.target).hasClass('component')) {
				tsae.focusComponent($(evt.target).attr('id'));
			} else {
				tsae.focusComponent($(evt.target).parents('.component').first().attr('id'));
			}
			return false;
		});

		// Make elements draggable, and resizable if applicable
		if (components && components.length > 0) {
            for (var i = 0; i < components.length; i++) {
                makeResizable(components[i]);
            }
		}


	};

	this.loadApplication = function(applicationId) {
		reset();
        sa = tsae.callService("loadApplication", {"applicationId": Number(applicationId)});
        idCounter = sa.idSequence;
        setupCanvas(true);
        loadTemplates();
        tsae.attachEventsToComponents($('#canvas').children());
        properties.createPropertyServiceSelect(sa.branchProfile ? sa.branchProfile.id : null);
        $('#surface_group').text(translate.msg('name_surface_group_' +
            sa.surfaceType.allowedSurfaceGroup.toLowerCase()));
        var surfaceGroupSpace = $("#surfaceGroupSpace");
        surfaceGroupSpace.text("|");
        surfaceGroupSpace.prepend("&nbsp;");
        surfaceGroupSpace.append("&nbsp;");
        $('#device_type').text(translate.msg('name_surface_type_allowed_device_code_' +
            sa.surfaceType.allowedDevice));
        var deviceTypeSpace = $('#deviceTypeSpace');
        deviceTypeSpace.text("|");
        deviceTypeSpace.prepend("&nbsp;");
        deviceTypeSpace.append("&nbsp;");
        $('#application_name').text(sa.name);
        var applicationNameSpace = $('#applicationNameSpace');
        applicationNameSpace.text("|");
        applicationNameSpace.prepend("&nbsp;");
        applicationNameSpace.append("&nbsp;");
        $('#application_resolution').text(sa.screenWidth + "x" + sa.screenHeight);
        disableTemplates();
        widgets.initWidgets();
        fixBordersAndWidgetBackground();
	};

	/**
	 * Adjust border color so it XOR:s with the background color.
	 * Add the widget background image to all widgets.
	 *
	 * Those are never saved to the database.
	 */
	var fixBordersAndWidgetBackground = function() {
		// Add component borders and widget background image (those are never saved to the database)
		$('.component').append(borderTemplate);
		$('.widget').css('background-image', "url('img/widgetback.png')");
	};

	/**
	 * Show/hide add/duplicate buttons depending on whether the application is multi or single page.
	 */
	var setupMultiPage = function() {
		if (sa.surfaceType.multiPage == true) {
//			$('#currentPageDiv').show('fast', tsae.resizeLayout);
		//	$('#menu_page_add').css('display', 'block');
		//	$('#menu_page_duplicate').css('display', 'block');
		} else {
//			$('#currentPageDiv').hide('fast', tsae.resizeLayout);
		//	$('#menu_page_add').css('display', 'none');
		//	$('#menu_page_duplicate').css('display', 'none');
            if(sa.surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
                // Always create the last page for a ticket layout
                if($('#pages').children().length == 0) {
                    tsae.createNewPage(null, translate.msg('info_lastpage_ticket'), false, true, TICKET_LAST_PAGE);
                }
            } else {
                gdae.createCallpage(); // SIDE EFFECT! Not very nice, but I did not find any better solution.
            }
		}
	};

	/**
	 * Called when the user wants to delete the current application.
	 * Will ask the user to confirm the operation before deleting.
	 */
	this.deleteApplication = function() {
		if (typeof sa === 'undefined' || sa == null) {
            return;
        }

        if(sa.surfaceType.allowedSurfaceGroup == tsae.surfaceGroup.TICKET) {
            dialogs.showDeleteDialog(sa, "Ticket", "ticketId", reset);
        } else {
            dialogs.showDeleteDialog(sa, "Application", "applicationId", reset);
        }
	};

	/**
	 * Called by saveApplication and does the actual saving
	 *
	 * @param callback Will be called when save is finished
	 */
	var saveApplicationCallback = function(callback) {

        if(sa.surfaceType.allowedSurfaceGroup == tsae.surfaceGroup.TICKET) {
            saveCanvasToPages();
            putPageWithTypeInCanvas(START_PAGE, $('#canvas'));
            saveActualDimensionsForPageInCanvas();
            saveCanvasToPages();
            putPageWithTypeInCanvas(TICKET_LAST_PAGE, $('#canvas'));
            saveActualDimensionsForPageInCanvas();
            saveCanvasToPages();
        } else {
            saveCanvasToPages();
        }

		// Remove draggable and resizable
        var canvas = $("#canvas");
		canvas.find('> .ui-draggable').draggable('destroy');
		canvas.find('> .ui-resizable').resizable('destroy');
		$('.ui-droppable').droppable('destroy');

		// Set attributes depending on content
        var pages = $("#pages");
		if (pages.find('.channel_player_component').length > 0) {
			sa.channelplayerEnabled = true;
		} else {
			sa.channelplayerEnabled = false;
		}

		if (pages.find('.vertical_message_component').length > 0) {
			sa.hasVerticalMessage = true;
		} else {
			sa.hasVerticalMessage = false;
		}

		// Remove borders.
		pages.find('.component_border').remove();
		$('.widget').css('background-image', '');

		// Save
		sa.html = pages.html();
		var surfaceApplication = tsae.callService("saveApplication", {"$entity" : sa});
        if (typeof surfaceApplication !== 'undefined' && surfaceApplication != null) {

            widgets.saveWidgetAttributes();

            sa = surfaceApplication;

            var deviceTypeSpace = $('#deviceTypeSpace');
            deviceTypeSpace.empty();
            deviceTypeSpace.text("|");
            deviceTypeSpace.prepend("&nbsp;");
            deviceTypeSpace.append("&nbsp;");
            $('#application_name').text(sa.name);
            var applicationNameSpace = $('#applicationNameSpace');
            applicationNameSpace.text("|");
            applicationNameSpace.prepend("&nbsp;");
            applicationNameSpace.append("&nbsp;");
            $('#application_resolution').text(sa.screenWidth + "x" + sa.screenHeight);
            markClean();
            if (typeof callback !== 'undefined' && callback != null) {
                callback(true);
            }
        } else {
            dialogs.showAlertDialog(translate.msg('error_saved_file_as_failed', ['\'' + sa.name + '\'']),
                translate.msg('error_saved_file_as_failed_title'));
            if (typeof callback !== 'undefined' && callback != null) {
                callback(false);
            }
        }
        // After saving, add the borders again...
        fixBordersAndWidgetBackground();

		// Put the start page in drawing canvas
        putPageWithTypeInCanvas(START_PAGE, $('#canvas'));

        // Refresh the pages list
        dialogs.reloadPagesList();
	};

    var saveActualDimensionsForPageInCanvas = function() {
        var componentsToAddWidthTo = $("#canvas").find('*').filter(function(index) {
                return $(this).hasClass("text_area_element") ||
                    $(this).hasClass("system_information_element");
            }
        );
        $.each(componentsToAddWidthTo, function(index, component) {
            $(component).parent().attr('width', $(component).parent().width() + "px");
            $(component).parent().attr('height', $(component).parent().height() + "px");
        });
    };

	/**
	 * Validate if a file name is unique
	 */
	var validateNewFileName = function(fileName, callback) {
        var valid = tsae.callService("validateFilename", {"fileName": fileName});
        callback(fileName, valid);
	};

	/**
	 * Save application with given filename.
	 * When done, it calls callback() with argument true if save was successful
	 */
	this.saveApplication = function(fileName, callback) {
        // Need branch profile for everything but ticket layouts
        if(typeof sa !== 'undefined' && null != sa && (sa.surfaceType.allowedDevice != tsae.deviceTypes.TP311X &&
            (typeof sa.branchProfile === 'undefined' || sa.branchProfile == null))) {
            dialogs.showAlertDialog(translate.msg('error_save_no_branch_profile', ['\'' + fileName + '\'']),
                translate.msg('error_save_no_branch_profile_title'));
            return;
        }

		if (!tsae.isDirty()) {
			if (callback) callback(false);
			return;
		}

		// Check if this is a new or existing application
		if (fileName) {
			// User clicked Save as in menu
			validateNewFileName(fileName,
				function(fn, valid) {
					if (valid) {
						sa.name = fn;
						sa.id = null; // Make sure it will be saved as a new application
						saveApplicationCallback(callback);
					} else {
						dialogs.showAlertDialog(translate.msg('error_save_filename_not_unique', ['\'' + fileName + '\'']),
								translate.msg('error_save_filename_not_unique_title'));
						dialogs.showSaveAsDialog(fn);
					}
				}
			);
		} else {
			// User clicked save in menu
			if (!sa.name) {
				// The tsa has not been saved yet, show save as dialog
				dialogs.showSaveAsDialog();
			} else {
				saveApplicationCallback();
			}
		}

	};

	/**
	 * Save currently active canvas to pages div
	 *
	 * keepExisting (optional): Set to true to if you do not want to remove contents of current page
	 *
	 * NOTE: Important to remove and add draggable/resizable before moving html around
	 */
	var saveCanvasToPages = function(keepExisting) {
        var canvas = $('#canvas');
		canvas.find('> .ui-draggable').draggable('destroy');
        canvas.find('> .ui-resizable').resizable('destroy');
		$('.ui-droppable').droppable('destroy');
		tsae.focusComponent();

		// Fix image size
		var imgs = canvas.find('img');
		for (var i = 0; i < imgs.length; i++) {
			$(imgs[i]).attr('width', $(imgs[i]).width());
			$(imgs[i]).attr('height', $(imgs[i]).height());
		}

		var canvasClone = canvas.clone();
        canvasClone.attr('id', createUniqueId('canvas'));
		$('#pages').append(canvasClone);
		if (!keepExisting) {
            canvas.empty();
		} else {
			tsae.attachEventsToComponents(canvas.children());
		}
	};

	/**
	 * Create a new application page with a given name
	 *
     * @param pageName The name of the page
     * @param duplicateCurrent Set to true if the new page shall be a copy of the current page in the canvas
	 * @param doNotSwitchPage Set to true if active page should not be switched after adding page
     * @param type The type of the page
	 */
	this.createNewPage = function(originalKey, pageName, duplicateCurrent, doNotSwitchPage, type) {

		var currentPage = originalKey != null ? $('#' + originalKey).attr('name') : $('#canvas').attr('name');

        // Only switch and perform deep stuff etc. if we are duplicating the current page
        if(typeof originalKey == 'undefined' || originalKey == null || originalKey == 'canvas') {
            var canvas = $('#canvas');
            saveCanvasToPages(duplicateCurrent);
            canvas.attr('name', pageName);
            canvas.attr('type', type);
            canvas.css('direction', direction);
            $('#page_name').val(pageName);
            canvas.find('> .component').each(
                function() {
                    $(this).attr('id', createUniqueId($(this).attr('name') + '_'));
                }
            );
        } else {
            // If duplicating a non-active page just copy the page and update internal id's
            var copy = $('#' + originalKey).clone();
            var newId = createUniqueId('canvas');
            copy.attr('id', newId);
            copy.attr('name', pageName);

            // Append it to the DOM before updating all the ID's.
            $('#pages').append(copy);

            $('#' + newId + ' > .component').each(
                function() {
                    $(this).attr('id', createUniqueId($(this).attr('title') + '_'));
                }
            );
        }


        // TODO: Bizarre side effect, should be created in onclick event...sigh.
	//	menubar.createPageMenu(true);
		if (doNotSwitchPage) {
			tsae.switchPage($('#pages > [name="' + currentPage + '"]').attr('id'), dialogs.reloadPagesList);
		} else {
			swapPage();
		}
		tsae.markDirty();
	};

	/**
	 * Adds a page to the TSA
	 *
	 * suggestedPageName (optional) is default name for the new page
	 * duplicateCurrent (optional): Set to true to duplicate current page as new
	 */
	this.addPage = function(originalKey, suggestedPageName, duplicateCurrent, onCompleteCallback) {
		dialogs.showInputStringDialog(
			translate.msg('info_enter_new_page_name') + ':', suggestedPageName ? suggestedPageName : '',
			function(pageName) {
				if (isPageNameValid(pageName) && isPageNameAvailable(pageName)) {
					tsae.createNewPage(originalKey, pageName, duplicateCurrent, false, STANDARD_PAGE);

                    if(typeof onCompleteCallback != 'undefined') {
                        onCompleteCallback();
                    }

				} else {
					dialogs.showAlertDialog(
							translate.msg('error_page_name_not_unique', ['\'' + pageName + '\'']), translate.msg('error_page_name_not_unique_title'),
						function() {
							tsae.addPage(originalKey, pageName, duplicateCurrent, onCompleteCallback);
						}
					);
				}
			}
		);
	};

	/**
	 * Validates that a page name is not used in any other page
	 */
	var isPageNameAvailable = function(pageName) {
		var pages = $('#pages').children();
		pages.push($('#canvas'));
		for (var i = 0; i < pages.length; i++) {
			if ($(pages[i]).attr('name') == pageName) return false;
		}
		return true;
	};

	/**
	 * Validates that a given string is a valid page name
	 */
	var isPageNameValid = function(pageName) {
		if (!pageName) return false;
		if (pageName.length < 1) return false;
		return true;
	};

	/**
	 * Remove current page from the TSA
	 */
	this.removePage = function() {
		dialogs.showConfirmDialog(
			translate.msg('warn_remove_current_page'),
			function() {
				// Remove links to current page
				$('[href="#' + $('#canvas').attr('name') + '"]').attr('href', '');

                // Replace the current page with the start page => Remove!
                putPageWithTypeInCanvas(START_PAGE, $('#canvas'));

				tsae.markDirty();
			},
            translate.msg('confirm_delete_page_title')
		);
	};

    /**
     * Remove current page from the TSA
     */
    this.removeNamedPage = function(key, name, onCompleteCallback) {
        dialogs.showConfirmDialog(
            translate.msg('warn_remove_named_page', [name]),
            function() {
                // Remove links to current page
                $('[href="#' + $('#' + key).attr('name') + '"]').attr('href', '');

                // Put start page in drawing canvas only if we are deleting the currently selected page    TODO ONLY IF NOT ALREADY THE ACTIVE ONE!
                if($('#canvas').attr('type') != START_PAGE && $('#canvas').attr('name') == name) {
                    // Replace the current page with the start page => Remove!
                    putPageWithTypeInCanvas(START_PAGE, $('#' + key));
                } else {
                    // Else just remove the page by its ID
                    $('#' + key).remove();
                }


                tsae.markDirty();
                onCompleteCallback();
            },
            translate.msg('confirm_delete_page_title')
        );
    };

    /**
     *
     * @param type STANDARD_PAGE, START_PAGE etc
     */
    var putPageWithTypeInCanvas = function(type, canvasToRemove) {
        //var canvas = $('#canvas');
        var canvas = canvasToRemove;
        var pageToPutInCanvas = findPageWithType(type);
        canvas.replaceWith($(pageToPutInCanvas)); // Removes current page
        $(pageToPutInCanvas).attr('id', 'canvas');
        $('#page_name').val($(pageToPutInCanvas).attr('name'));
        tsae.attachEventsToComponents($(pageToPutInCanvas).children());
    //    menubar.createPageMenu(false);
        swapPage();
    };

    var findPageWithType = function(type) {
        var page = null;
        var allPages = $('#pages').children();
        for (var i = 0; i < allPages.length; i++) {
            if ($(allPages[i]).attr('type') == type) {
                page = allPages[i];
                break;
            }
        }
        return page;
    };

	/**
	 * Switch to a different page
	 */
	this.switchPage = function(pageId, onCompleteCallback) {
		saveCanvasToPages();
		var page = $('#' + pageId);
		$('#canvas_container').fadeOut(100, function() {
            var canvas = $('#canvas');
			canvas.replaceWith(page);
			$('#canvas_container').fadeIn(100);
			page.attr('id', 'canvas');
			$('#page_name').val($(page).attr('name'));
			tsae.attachEventsToComponents(page.children());
		//	menubar.createPageMenu(page.attr('type') != START_PAGE && page.attr('type') != TICKET_LAST_PAGE);
			swapPage();
            onCompleteCallback();
		});
	};

    this.changePageName = function(newPageName) {
        var oldPageName = $('#canvas').attr('name');

        /* Changing page names is OK in R5 since we use the type attribute rather than the name... */
        // Make sure we don't try to rename the startpage as that may break the surfaceapp...
//        if(oldPageName == startpageName) {
//            $('#page_name').val($("#canvas").attr('name'));
//            dialogs.showAlertDialog(
//                translate.msg('error_page_name_cannot_rename_startpage'),
//                translate.msg('error_page_name_not_unique_title'));
//            return;
//        }

        if(isPageNameValid(newPageName) && isPageNameAvailable(newPageName)) {

            $('#canvas').attr('name', newPageName);

            // Update all page links to the new page
            $('[href="#' + oldPageName + '"]').attr('href', '#' + newPageName);

            tsae.markDirty();
            dialogs.reloadPagesList();
        } else {
            $('#page_name').val($("#canvas").attr('name'));
            dialogs.showAlertDialog(
                translate.msg('error_page_name_not_unique', ['\'' + newPageName + '\'']),
                translate.msg('error_page_name_not_unique_title'));
        }
    };

	/**
	 * Set zoom level for canvas
	 */
	this.zoom = function(percentage) {
		if (!percentage) return zoomLevel;

		// Remove draggable and resizable
		$('#canvas > .ui-draggable').draggable('destroy');
		$('#canvas > .ui-resizable').resizable('destroy');
		$('.ui-droppable').droppable('destroy');

		zoomLevel = Number(percentage);
		if (!sa) return;
		tsae.zoomElement($('#canvas_container'));
		$('#zoom_value').text(percentage + '%');

		// And make them zoom- and resizable again
		tsae.attachEventsToComponents($('#canvas').children());
		swapPage();
	};

	this.zoomElement = function(elmt) {
		var zoom = zoomLevel / 100;
		elmt.css('-ms-transform', 'scale(' + zoom + ',' + zoom + ')');
		elmt.css('-moz-transform', 'scale(' + zoom + ')');
		elmt.css('-webkit-transform', 'scale(' + zoom + ')');
		elmt.css('-moz-transform-origin', '0 0');
		elmt.css('-ms-zoom', zoom);
		elmt.css('zoom', zoom);
	};

	/**
	 * Called when a component in the drawing canvas gets into focus
	 * Makes sure we show the correct attributes for the component
	 *
	 * If componentId not has been set, focus will be set to no component
	 */
	this.focusComponent = function(componentId) {
		properties.hide();
		var component = $('#' + componentId);

		// Remove highlight from currently selected component
        var oldSelectedComponent = $('.selected_component');
		oldSelectedComponent.find('.component_border').css('border-width','1px');
        oldSelectedComponent.removeClass('selected_component');
		$('#remove_button').remove();
		$('#send_forward_button').remove();
		$('#send_back_button').remove();
        $('#center_button').remove();

		// Remove any widget property rows and any widget-specific fontpickers/colorpickers.
		$('.widget_property').remove();
		$('.widget_fontpicker').remove();
		$('.widget_colorpicker').remove();

		// Add highlight and drag handle to new selected component
		if (componentId) {
			component.addClass('selected_component');
		}

		if (componentId && componentId != 'canvas') {
			// Delete button
			component.append(
					$('<span class="ui-state-default ui-corner-all" title="' + translate.msg('info_delete_component') + '"/>')
							.attr('id', 'remove_button')
							.addClass('opaque80')
							.click(tsae.deleteSelectedComponent)
							.css('z-index', 1001)
							.append($('<span class="ui-icon ui-icon-closethick"/>')));

            // Center button
            component.append(
                $('<span class="ui-state-default ui-corner-all" title="' + translate.msg('info_center_component') + '"/>')
                    .attr('id', 'center_button')
                    .addClass('opaque80')
                    .click(tsae.centerSelectedComponent)
                    .css('z-index', 1001)
                    .append($('<span class="ui-icon ui-icon-center-greyscale"/>')));

			// Send to back button
			component.append(
					$('<span class="ui-state-default ui-corner-all" title="' + translate.msg('info_send_back') + '"/>')
							.attr('id', 'send_back_button')
							.addClass('opaque80')
							.click(tsae.sendSelectedComponentBack)
							.css('z-index', 1001)
							.append($('<span class="ui-icon ui-icon-arrowreturnthick-1-s"/>')));

			// Send to front button
			component.append(
					$('<span class="ui-state-default ui-corner-all" title="' + translate.msg('info_send_front') + '"/>')
							.attr('id', 'send_forward_button')
							.addClass('opaque80')
							.click(tsae.sendSelectedComponentFront)
							.css('z-index', 1001)
							.append($('<span class="ui-icon ui-icon-arrowreturnthick-1-n"/>')));

			// Thicken border
			component.find('.component_border').css('border-width', '2px');

            if(calculateRotationOffset(component) != 0) {
                // a bit bonkers but hey, the user deserves proper values even if the component has been rotated
                $('#property_size_w').attr('value', Math.round(component.height()));
                $('#property_size_h').attr('value', Math.round(component.width()));
            } else {
                $('#property_size_w').attr('value', Math.round(component.width()));
                $('#property_size_h').attr('value', Math.round(component.height()));
            }
			$('#property_position_x').attr('value', Math.round(component.position().left));
			$('#property_position_y').attr('value', Math.round(component.position().top));
		} else {
			$('#property_size_w').attr('value', '-');
			$('#property_size_h').attr('value', '-');
			$('#property_position_x').attr('value', '-');
			$('#property_position_y').attr('value', '-');
		}

		// Make size and position fields editable if applicable
		if (component.hasClass('ui-resizable')) {
			$('#property_size_w').removeClass('ui-state-disabled').removeAttr('disabled');
			$('#property_size_h').removeClass('ui-state-disabled').removeAttr('disabled');
		} else {
			$('#property_size_w').addClass('ui-state-disabled').attr('disabled', 'disabled');
			$('#property_size_h').addClass('ui-state-disabled').attr('disabled', 'disabled');
		}
		if (component.hasClass('ui-draggable')) {
			$('#property_position_x').removeClass('ui-state-disabled').removeAttr('disabled');
			$('#property_position_y').removeClass('ui-state-disabled').removeAttr('disabled');
		} else {
			$('#property_position_x').addClass('ui-state-disabled').attr('disabled', 'disabled');
			$('#property_position_y').addClass('ui-state-disabled').attr('disabled', 'disabled');
		}


		// Show applicable attributes for component
		$('.property').hide();
		if (componentId) {
            if(componentId == 'canvas') {
                $('.property_' + componentId).show();
                properties.setAttributes(componentId); //Callback currently not working due to hiding some properties for TP3115
            } else {
            	var numComponents = $('.property_' + component.attr('name')).size();
            	var currComponents = 0;
			    $('.property_' + component.attr('name')).show(0, function() {
			    	currComponents++;
			    	if(currComponents == numComponents) { //Trigger when all elements are visible
						properties.setAttributes(componentId);
			    	}
			    });
            }
		}

		properties.show();

		dialogs.highlightInNavigation(componentId);

		widgets.loadWidgetAttributes(component, componentId);

		tsae.resizeLayout();
	};


	var borderTemplate =
		'<div style="width:100%;height:100%;position:absolute;top:auto;left:auto;bottom:0px;right:0px;border-color:black;border-style:solid;border-width:1px;" class="component_border"/>' +
		'<div style="width:100%;height:100%;position:absolute;top:auto;left:auto;bottom:0px;right:0px;border-color:white;border-style:dashed;border-width:1px;" class="component_border"/>' +
		'<div style="width:100%;height:100%;position:absolute;top:0px;left:0px;bottom:auto;right:auto;border-color:black;border-style:solid;border-width:1px;" class="component_border"/>' +
		'<div style="width:100%;height:100%;position:absolute;top:0px;left:0px;bottom:auto;right:auto;border-color:white;border-style:dashed;border-width:1px;" class="component_border"/>';

	/**
	 * Add a component to drawing canvas
	 */
	this.addComponent = function(componentType, left, top) {
        var newComponent;
        if(componentType != "widget" && componentType != 'ticket_text') {
            newComponent = $("#templates" + " > ." + componentType + "_component").clone();
        } else {
            newComponent = $('#' + componentType).clone();
        }

		$(newComponent).addClass(componentType);
		$(newComponent).addClass('component');
		$(newComponent).attr('name', componentType);
		$(newComponent).attr('id', createUniqueId(componentType + '_'));
		$(newComponent).css('position', 'absolute');
		$(newComponent).appendTo('#canvas');
		if (left) $(newComponent).css('left', left);
		if (top) $(newComponent).css('top', top);
        $(newComponent).attr('title', translate.msg("title_component_" + componentType));

        // This is the initial text that is displayed inside text components
        var textElement = $(newComponent).find('*').andSelf().filter(function(index) {
                    return ($(this).hasClass("text_single_element") ||
                        $(this).hasClass("text_area_element") ||
                        $(this).hasClass("url_component") ||
                        $(this).hasClass("system_information_element"));
                })[0];
        if(typeof textElement !== 'undefined' && null != textElement) {
            $(textElement).text(translate.msg("text_component_" + $(newComponent).attr('name')));

            // add max width and max height, values depend of the type of element
            if($(textElement).hasClass("text_single_element") || $(textElement).hasClass("text_area_element")) {
                var parentElement = $(textElement).parent().first();
                if(typeof parentElement !== 'undefined' && parentElement != null && parentElement.attr('id') !== 'canvas') {
                    parentElement.css("max-width", tsae.getSA().screenWidth + "px");
                    parentElement.css("max-height", tsae.getSA().screenHeight + "px");
                    $(newComponent).attr('width', $(newComponent).width() + "px");
                } else {
                    // this is for link components
                    $(textElement).css("max-width", tsae.getSA().screenWidth + "px");
                    $(textElement).css("max-height", tsae.getSA().screenHeight + "px");
                }
            } else if($(textElement).hasClass("system_information_element")) {
                $(textElement).parent().css("max-width", tsae.getSA().screenWidth + "px");
                $(textElement).parent().css("max-height", function(index, value) {
                    return $(this).find(".system_information_element").first().height() + "px";
                });
                $(newComponent).attr('width', $(newComponent).width() + "px");
            }
        }

		tsae.attachEventsToComponents(newComponent);
		tsae.focusComponent(newComponent.attr('id'));
		disableTemplates();

		if ($(newComponent).hasClass('image_component')) {
            if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
                // half height and width for ticket layout
                $(newComponent).height($(newComponent).height()/2);
                $(newComponent).width($(newComponent).width()/2);
                tsae.resizeContainedImage($(newComponent));
            }
			dialogs.showSelectImageDialog('property_image_text', false);
		}

		if ($(newComponent).hasClass('widget')) {
			dialogs.showSelectWidgetDialog('property_widget_text', false);
			$(newComponent).css('background-image',"url('img/widgetback.png')");
		}
		// Set focus to first input of component
        if($('#componentProperties').find('input:visible').first().select().attr('disabled') != 'disabled') {
            $('#componentProperties').find('input:visible').first().select().focus();
        }

		$(newComponent).append(borderTemplate);

		dialogs.reloadComponentsList();
        tsae.sendSelectedComponentFront();
		tsae.markDirty();
	};

	/**
	 * Enable or disable component templates depending on how many are allowed in application
	 */
	var disableTemplates = function() {
		var templates = sa.surfaceType.allowedComponents;
		for (var i = 0; i < templates.length; i++) {
			var template = templates[i];
			var templateHtml = $(template.htmlContent);
			if (!template.multipleInstancesPerApp && $('.' + templateHtml.attr('id')).length > 0) {
				$('#template_button_' + templateHtml.attr('id')).addClass('ui-state-disabled');
			} else if (!template.multipleInstancesPerPage && $('#canvas').find('.' + templateHtml.attr('id')).length > 0) {
				$('#template_button_' + templateHtml.attr('id')).addClass('ui-state-disabled');
			} else {
				$('#template_button_' + templateHtml.attr('id')).removeClass('ui-state-disabled');
			}

		}

		// Addition for widgets
		if(!widgets.getWidgetServerAvailable()) {
			widgets.disableWidgetComponent();
		}
	};

	/**
	 * Open a dialog to edit tsa settings
	 */
	this.editSettings = function() {
        if(!tsae.isEmpty()) {
            var branchProfileId;

            if (sa && sa.branchProfile) {
                branchProfileId = sa.branchProfile.id;
            }

            dialogs.showApplicationSettingsDialog(
                    branchProfileId,
                    sa.timeBeforeRestart,
                    sa.callpageEnabled,
                sa.ticketLength,
                    sa.id,
                    function(newBranchProfileId, timeBeforeRestart, callpageEnabled, ticketLength) {
                        setBranchProfile(newBranchProfileId);
                        sa.timeBeforeRestart = timeBeforeRestart;
                        sa.callpageEnabled = callpageEnabled;
                        sa.ticketLength = ticketLength;
                       // menubar.createPageMenu(false);
                        tsae.markDirty();
                    });
        }
	};

    this.addActiveState = function(id) {
        if(!tsae.isEmpty()) {
            $("#" + id + " > a").addClass("ui-state-active");
        }
    };

    this.removeActiveState = function(id) {
        if(!tsae.isEmpty()) {
            $("#" + id + " > a").removeClass("ui-state-active");
        }
    };

	/**
	 * Set branch profile ID for application
	 */
	var setBranchProfile = function(newBranchProfileId) {
		if (typeof sa.branchProfile === "undefined" || sa.branchProfile == null) {
			sa.branchProfile = {
                id : newBranchProfileId,
                name : null
            };
		} else {
			sa.branchProfile.id = newBranchProfileId;
		}
		properties.createPropertyServiceSelect(newBranchProfileId);
	};

	/**
	 * Delete currently selected component
	 */
	this.deleteSelectedComponent = function() {
		// if widget, clean out widgets temporary storage so the deleted component attribute values gets destroyed.
		widgets.cleanUpWidget();
		// Hide properties
		$('.property').hide();
		// Delete component
		$('.selected_component').remove();
		disableTemplates();

		dialogs.reloadComponentsList();

		tsae.markDirty();

	};

	/**
	 * Send selected component to min z-index
	 */
	this.sendSelectedComponentBack = function() {
		var minZ = 1000;

        var selectedComponent = $('.selected_component');
        selectedComponent.siblings().each(
			function() {
				if (parseInt($(this).css('z-index')) < minZ) {
					minZ = parseInt($(this).css('z-index'));
				}
			}
		);

		if (minZ <= 1) {
			// Send all forward
            selectedComponent$('.selected_component').siblings().each(
				function() {
					$(this).css('z-index', parseInt($(this).css('z-index')) + 1);
				}
			);
			tsae.sendSelectedComponentBack(); // Do this recursively until min > 0
		} else {
            selectedComponent.css('z-index', minZ - 1);
            tsae.markDirty();
		}
	};

	/**
	 * Send selected component to max z-index
	 */
	this.sendSelectedComponentFront = function() {
		var maxZ = 0;

        var selectedComponent = $('.selected_component');
        selectedComponent.siblings().each(
			function () {
				if (parseInt($(this).css('z-index')) > maxZ) {
					maxZ = parseInt($(this).css('z-index'));
				}
			}
		);

		if (maxZ >= 1000) {
			// Send all backward
            selectedComponent.siblings().each(
				function() {
					$(this).css('z-index', parseInt($(this).css('z-index')) - 1);
				}
			);
			tsae.sendSelectedComponentFront(); // Do this recursively until max < 1000
		} else {
            selectedComponent.css('z-index', maxZ + 1);
            tsae.markDirty();
		}
	};

    this.centerSelectedComponent = function() {
        var selectedComponent = $('.selected_component');

        var canvasWidth = $("#canvas").width();
        var elementWidth = selectedComponent.width();
        var newPosX = (canvasWidth / 2) - (elementWidth / 2);
        selectedComponent.css('left', newPosX + "px");
//        selectedComponent.position({
//            at: "center"
//        })
    };

	/**
	 * Open preview window with current application
	 */
	this.showPreview = function() {

		if (sa) {
            if(!tsae.isDirty()) {

                if (sa.branchProfile) {
                    dialogs.showPreviewDialog(sa.branchProfile.id,
                        function(unitId, isUnitOnCentralQAgent, eventSimulatorChoice) {

                            var url = '';
                            if (sa.surfaceType.allowedSurfaceGroup == tsae.surfaceGroup.TOUCH) {
                                url = '/pages/graphicaldisplay/touch.jsp';
                            } else {
                                url = '/pages/graphicaldisplay/graphicaldisplay.jsp';
                            }
                            var urlextra = "";
                            if ((typeof lowfiie !== 'undefined' && lowfiie) || init.isInChromeFrame()) {
                                urlextra = '&breakcache=' + Math.random();
                            }
                            var canvas = $("#canvas");
                            var win = window.open(url + '?preview=true&application=' + escape(sa.name) + '&unitId=' + unitId + "&isUnitOnCentralQAgent=" + isUnitOnCentralQAgent + 
                            		"&eventSimulatorChoice=" + eventSimulatorChoice, 
                            		'TSAE_preview_window',
                                    'status=0,toolbar=1,location=0,menubar=0,directories=0,' +
                                    'resizable=0,scrollbars=0,width=' + canvas.width() + ',' +
                                    'height=' + canvas.height()) + urlextra;
                        });
                } else if(sa.surfaceType.allowedSurfaceGroup == tsae.surfaceGroup.TICKET) {
                    var urlextra = "";
                    if ((typeof lowfiie !== 'undefined' && lowfiie) || init.isInChromeFrame()) {
                        urlextra = '&breakcache=' + Math.random();
                    }
                    $('.system_information').each(
                        function() {
                            var parameterType = $(this).attr('information');
                            var previewValue = $(this).attr('data-preview-text');
                            if (typeof previewValue !== 'undefined' && previewValue != null && previewValue != "") {
                                if (typeof parameterType !== 'undefined' && parameterType != null && parameterType != 'ticket' && parameterType != 'date' && parameterType != 'time') {
                                    urlextra += "&" + parameterType + "=" + previewValue;
                                }
                            }
                        }
                    );
                    var canvas = $("#canvas");
                    var win = window.open('/qsystem/surfaceeditor/editor/ticketpreview.jsp?application=' +
                        escape(sa.name) + '&width=' + canvas.width() + '&height=' +
                        (sa.ticketLength == tsae.ticketLength.DOUBLE ? canvas.height() * 2 :canvas.height())
                        + urlextra,
                        'TSAE_preview_window', 'status=0,toolbar=0,location=0,menubar=0,directories=0, resizable=0,' +
                            'scrollbars=0,width=' + canvas.width() + 5 + ',' + 'height=' + canvas.height() + 20);
                } else {
                    dialogs.showAlertDialog(translate.msg('error_preview_branch_not_set'), translate.msg('error_preview_branch_not_set_title'));
                }
            } else {
                dialogs.showAlertDialog(translate.msg('error_surface_not_saved'), translate.msg('error_surface_not_saved_title'));
            }
        }
	};

	/**
	 * Check if we have changes and open a save dialog
	 */
	this.showOpenDialog = function() {
		if (tsae.isDirty()) {
			dialogs.showConfirmDialog(translate.msg('confirm_open_new_application'), dialogs.showOpenDialog);
		} else {
			dialogs.showOpenDialog();
		}
	};

	/**
	 * Set grid size
	 */
	this.grid = function(size) {
		if (!size && size != 0) return gridSize;
		gridSize = (size == 0 ? 1 : size);
		$('#grid_value').text(gridSize + 'px');
	};

    // Unused
	this.exitApplication = function() {
		if (!tsae.isDirty()) {
			window.close();
		} else {
			dialogs.showConfirmDialog(
                translate.msg('confirm_discard_changes'),
                function() {
                    markClean();
                    window.close();
                }
            );
		}
	};

    /**
	 * Resize layout to fit window size
	 */
	this.resizeLayout = function() {
		$('.treeMenuMenu').height($(window).height() - $('#header').height() - 6);
		$('#componentProperties').height($('.treeMenuMenu').height() - $('#button_div').height() - 6 -
            ($('#currentPageDiv').is(':visible') ? $('#currentPageDiv').height() + 6 : 0) -
            $('#componentsAndZoom').height() - $('#property_position_display').height()
        );
	};

	/**
	 * Set up the editing boxes for component width and height
	 */
	var setupPositionEvents = function() {
		$('#property_position_x').change(
			function() {
				var x = parseInt($('#property_position_x').val());
				if (isNaN(x)) return;
				var selected = $('.selected_component').first();
				var canvasWidth = $('#canvas').width();

                var rotationOffset = calculateRotationOffset(selected);
                var realXPos = x - rotationOffset;
				if (realXPos < -rotationOffset) {
                    realXPos = -rotationOffset;
                    x = 0;
                }
				else if (realXPos + selected.width() > canvasWidth + rotationOffset) {
                    realXPos = canvasWidth - selected.width() + rotationOffset;
                    x = realXPos + rotationOffset;
                }
				$('#property_position_x').attr('value', x);

				$('.selected_component').css('left', realXPos + 'px');

				tsae.markDirty();
			}
		);
		$('#property_position_y').change(
			function() {
				var y = parseInt($('#property_position_y').val());
				if (isNaN(y)) return;
				var selected = $('.selected_component').first();
				var canvasHeight = $('#canvas').height();

                var rotationOffset = calculateRotationOffset(selected);
                var realYPos = y + rotationOffset;
				if (realYPos < rotationOffset) {
                    realYPos = rotationOffset;
                    y = 0;
                }
				if (realYPos + selected.height() > canvasHeight - rotationOffset) {
                    realYPos = canvasHeight - selected.height() - rotationOffset;
                    y = realYPos - rotationOffset;
                }
				$('#property_position_y').attr('value', y);

                $('.selected_component').css('top', realYPos + 'px');

				tsae.markDirty();
			}
		);
		$('#property_size_w').change(
			function() {
                var selected = $('.selected_component').first();
                var w = parseInt($('#property_size_w').val());
                if(calculateRotationOffset(selected) != 0) {
                    // we're really changing the height
                    var hPrev = selected.height();
                    var topPrev = parseInt(selected.css('top'));
                    selected.css({height: w + 'px'});
                    selected.css({top: (topPrev - (selected.height() - hPrev)/2) + "px"});
                } else {
                    selected.css({width: w + 'px'});
                }
                tsae.resizeContainedImage(selected);
                tsae.fitComponentInCanvas(selected);
                tsae.markDirty();
			}
		);
		$('#property_size_h').change(
            function() {
                var selected = $('.selected_component').first();
                var h = parseInt($('#property_size_h').val());
                if(calculateRotationOffset(selected) != 0) {
                    // we're really changing the width
                    var leftPrev = parseInt(selected.css('left'));
                    var wPrev = selected.width();
                    selected.css({width: h + 'px'});
                    selected.css({left: (leftPrev - (selected.width() - wPrev)/2) + "px"});
                } else {
                    selected.css({height: h + 'px'});
                }
                tsae.resizeContainedImage(selected);
                tsae.fitComponentInCanvas(selected);
                tsae.markDirty();
            }
		);
	};


	// Experimental, component outline dialog stuff
	this.showComponentsList = function() {
        if(!tsae.isEmpty()) {
		    dialogs.showComponentsList();
        }
	};

    this.showPagesList = function() {
        if(!tsae.isEmpty()) {
            dialogs.showPagesList();
        }
    };

	/**
	 * Returns the default font formatted into our internal font format.
	 */
	this.getDefaultFontStr = function() {
		return FONT_FAMILY + ';' + FONT_SIZE + ';' + FONT_STYLE + ';' + FONT_WEIGHT;
	};

	this.getDefaultFontDisplayStr = function() {
		return FONT_FAMILY + ' ' + FONT_SIZE;
	};

    // calls the service and handles HTTP error codes
    // will return the value of the request if there is a return value
    this.callService = function (method, parameters) {
        if(typeof parameters === 'undefined' || null == parameters) {
            parameters = {};
        }
        var returnValue;
        parameters["$callback"] = function(httpCode, xmlHttpRequest, value) {
            // if HTTP code isnt within 200-399 range we need to print out an error
            if (httpCode < 200  || httpCode > 399) {
                // 503 is used when connection from QAgent -> Central is down
                if(httpCode == 503) {
                    dialogs.showAlertDialog(translate.msg('error.central.server.unavailable'), translate.msg('error'));
                } else if(httpCode == 1223) {
                    // silently ignore this, bug in IE <= 9. See http://www.enhanceie.com/ie/bugs.asp IE0013
                } else {
                    var err = null;
                    var serverErrorCode = stripHtml(xmlHttpRequest.getResponseHeader("ERROR_CODE"));
                    if(typeof serverErrorCode === 'undefined' || serverErrorCode == null || serverErrorCode == "" || serverErrorCode == 0) {
                        // strip out html text
                        var text = stripHtml(xmlHttpRequest.getResponseHeader("ERROR_MESSAGE"));
                        // limit the no of characters to 200
                        if (text.length > 200) {
                            text = text.substring(0,200);
                        }
                        err = translate.msg('error.server_error', [text]);
                    } else {
                        err = translate.msg('error.server_error_' + serverErrorCode);
                    }
                    dialogs.showAlertDialog(err, translate.msg('error'));
                }
            } else if(value !== "") {
                returnValue = value;
            }
        };
        SurfaceEditorRestEndpoint[method](parameters);
        return returnValue;
    };

    // Strips any html elements within a string
    // inspired from http://stackoverflow.com/questions/822452/strip-html-from-text-javascript:
    var stripHtml = function(htmlString) {
        // put the string in a div and get the raw text
        var tmp = document.createElement("DIV");
        tmp.innerHTML = htmlString;
        var text = tmp.textContent||tmp.innerText;
        // remove any nested html comments
        return text.replace(/<!--*[^<>]*-->/ig, "");
    };
};