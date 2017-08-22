var dialogs = new function() {

    /**
	 * Refresh surface type checkbox
	 */
	var refreshSurfaceTypeSelect = function(surfaceGroup, selectElmt) {
		selectElmt.empty();
		var surfaceTypes = tsae.callService("getAvailableSurfaceTypes", {"surfaceGroup": surfaceGroup});
        for (var i = 0; i < surfaceTypes.length; i++) {
            selectElmt.append($('<option/>').val(surfaceTypes[i].allowedDevice).text(translate.msg(
                'name_surface_type_allowed_device_code_' + surfaceTypes[i].allowedDevice)));
        }
        selectElmt.change();
	};
	
	var refreshResolutionSelectBox = function(deviceTypeCode, resolutionSelectBox) {
		var resolutions = tsae.callService("getAvailableResolutions", {"deviceTypeCode" : deviceTypeCode});
		resolutionSelectBox.empty();
		$.each(resolutions, function(key, resolutionItem) {
			resolutionSelectBox.append(getBasicOption(resolutionItem.name));
		});
		
	};
	
	/**
	 * Show create new dialog
	 */
	this.showNewDialog = function() {
		$('#newDialog_select_surfaceGroup').unbind('change');
		$('#newDialog_select_surfaceType').empty();
		$('#newDialog_select_surfaceGroup').empty();

		// When user selects a surface group, load surface types
		$('#newDialog_select_surfaceGroup').off("change");
		$('#newDialog_select_surfaceGroup').change(function() {
			refreshSurfaceTypeSelect($('#newDialog_select_surfaceGroup').val(), 
					$('#newDialog_select_surfaceType'));
        });

		// Refresh resolution when surface type is changed
		$('#newDialog_select_surfaceType').off("change");
		$('#newDialog_select_surfaceType').change(function() {
			refreshResolutionSelectBox($('#newDialog_select_surfaceType').val(), 
					$('#newDialog_select_resolution'));
	    });		

		var surfaceGroups = tsae.callService("getAvailableSurfaceGroups", {});
        for (var i = 0; i < surfaceGroups.length; i++) {
            $('#newDialog_select_surfaceGroup').append($('<option/>').val(surfaceGroups[i]).text(
                translate.msg('name_surface_group_' + surfaceGroups[i].toLowerCase())));
        }
        $('#newDialog_select_surfaceGroup').change();

        //	Refresh surface type checkbox
        var btns = {};
        
        btns["ok"] = {
    		text: translate.msg('info_button_ok'),
    		id: "ok",
    		click: function() {
	            // This is where the actual call to create function is made
	            if ($('#newDialog_select_surfaceGroup').val() && $('#newDialog_select_surfaceType').val()) {
	            	var selectedSurfaceType = $('#newDialog_select_surfaceType').val();
	            	var selectResolution = $('#newDialog_select_resolution').val();
	                tsae.createNew(selectedSurfaceType, selectResolution);
	                $('#newDialog').dialog('destroy');
	            }
    		}
        };
        btns[translate.msg('info_button_cancel')] = function() {
            $('#newDialog').dialog('destroy');
        };
        
        $('#newDialog').dialog(
            {
                buttons : btns,
                modal : true,
                closeOnEscape : true,
                resizable : false,
                title : translate.msg('info_new_application'),
                width : 400
            }
        );
        $('#newDialog').dialog('open');
	};
	
	var getBasicOption = function(value) {
		var item = $('<option />').val(value).text(value);
		return item;
	};
	
	this.showManageResolutionDialog = function() {
        
		$('#resolution-select-surface-group').off("change");
		$('#resolution-select-surface-group').change(function() {
			refreshManagedResolutions( $('#resolution-select-surface-group').val());
		});
		
		$('#manage-resolution-table').off("click", ".remove-resolution-button");
		$('#manage-resolution-table').on("click", ".remove-resolution-button", function() {
			var resolution = $(this).attr('data-resolution');
			removeResolution($('#resolution-select-surface-group').val(), resolution);
		});
		
		$('#add-resolution-button').off("click");
		$('#add-resolution-button').click(function() {
			addResolution($('#resolution-select-surface-group').val(),
					$('#resolution-width-input').val(),
					$('#resolution-height-input').val());
		});
		$('#add-resolution-button').button({
            icons: { primary: "ui-icon-plus" },
            text: false
        });			
		
		$('#manageResolutionsDialog').dialog({
			buttons : {},
            modal : true,
            closeOnEscape : true,
            resizable : false,
            title : translate.msg('info_manage_resolutions'),
            width : 400,
            create: function() {
                $(this).css("maxHeight", 400);
            }
		});
		
		refreshManagedSurfaceTypes();
		refreshManagedResolutions($('#resolution-select-surface-group').val());
		
        $('#manageResolutionsDialog').dialog('open');
	};
	
	var removeResolution = function(deviceTypeId, resolution) {
		tsae.callService("removeSurfaceTypeResolution", {deviceTypeId : deviceTypeId, surfaceResolution : resolution});
		refreshManagedResolutions($('#resolution-select-surface-group').val());
	};
	
	var addResolution = function(deviceTypeId, width, height) {
        if(typeof width !== 'undefined' && width != null && width.length > 0 && width == parseInt(width, 10) && parseInt(width, 10) > 0
            && typeof height !== 'undefined' && height != null && height.length > 0 && height == parseInt(height, 10) && parseInt(height, 10) > 0) {
            var resolution = width + 'x' + height;
            tsae.callService("addSurfaceTypeResolution", {deviceTypeId : deviceTypeId, surfaceResolution : resolution});
            refreshManagedResolutions($('#resolution-select-surface-group').val());
            $('#resolution-width-input').val('');
            $('#resolution-width-input').toggleClass('ui-state-error', false);
            $('#resolution-height-input').val('');
            $('#resolution-height-input').toggleClass('ui-state-error', false);
        } else {
            if(typeof width === 'undefined' || width == null || width.length == 0 || width != parseInt(width, 10) || parseInt(width, 10) < 1) {
                $('#resolution-width-input').toggleClass('ui-state-error', true);
            } else {
                $('#resolution-width-input').toggleClass('ui-state-error', false);
            }
            if(typeof height === 'undefined' || height == null || height.length == 0 || height != parseInt(height, 10) || parseInt(height, 10) < 1) {
                $('#resolution-height-input').toggleClass('ui-state-error', true);
            } else {
                $('#resolution-height-input').toggleClass('ui-state-error', false);
            }
        }
	};	
	
	var refreshManagedResolutions = function(deviceTypeCode) {
		var resolutionTable = $('#manage-resolution-table');
		var resolutions = tsae.callService("getAvailableResolutions", {"deviceTypeCode" : deviceTypeCode});
		$.each(resolutionTable.find('tbody tr:not(.add-button-row)'), function(key, item) {
			$(item).remove();
		});
		$.each(resolutions, function(key, item) {
			var row = getResolutionRow(item);
			resolutionTable.find('tbody .add-button-row').before(row);
		});		
	};
	
	var getResolutionRow = function(resolution) {
		var row = $('<tr />');
		var deleteButton = $('<img src="/images/common/button/delete.png" onClick="return false;" />');
		deleteButton.attr('data-resolution', resolution.name).addClass('remove-resolution-button');
		
		
		row.append($('<td />').html(resolution.width));
		row.append($('<td />').html(resolution.height));
		row.append($('<td />').append(deleteButton));
		return row;
	};
	
	var refreshManagedSurfaceTypes = function() {
		var surfaceTypeSelectBox = $('#resolution-select-surface-group');
		var surfaceTypes = tsae.callService("getSurfaceTypesWithCustomResolutions", {});
		surfaceTypeSelectBox.empty();
		$.each(surfaceTypes, function(key, surfaceTypeItem) {
			var surfaceTypeName = translate.msg('name_surface_type_allowed_device_code_' + surfaceTypeItem.allowedDevice);
			var surfaceTypeOption = $('<option />').text(surfaceTypeName).val(surfaceTypeItem.allowedDevice);
			surfaceTypeSelectBox.append(surfaceTypeOption);
		});
	};	
	
	/**
	 * Show save as dialog, and after that, save the application
	 */
	this.showSaveAsDialog = function(defaultFileName) {
		if (tsae.isEmpty()) return;

        if(typeof defaultFileName !== 'undefined' && defaultFileName != null) {
		    $('#saveAsDialog_input_name').val(defaultFileName);
        }
		
		var btns = {};
		btns["ok"] = {
            id: "ok",
            text: translate.msg('info_button_ok'),
            click: function() {
                tsae.markDirty();
                tsae.saveApplication(
                    $('#saveAsDialog_input_name').val(),
                    function(success) {
                        if (success) {
                            $('#saveAsDialog').dialog('destroy');
                        }
                    }
                );
		    }
        };

		btns[translate.msg('info_button_cancel')] = function() {
			$('#saveAsDialog').dialog('destroy');
		};
		
		$('#saveAsDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : false,
				title : translate.msg('info_save_as')
			}
		);
		$('#saveAsDialog').dialog('open');
	};

	/**
	 * Show alert dialog with a message and OK/Cancel buttons
	 * Callback function will be called if user OK button
	 */
	this.showConfirmDialog = function(msg, callback, title) {
		$('#alertDialog').text(msg);
		
		var btns = {};
		btns["ok"] = {
            id: "ok",
            text: translate.msg('info_button_ok'),
            click: function() {
                $('#alertDialog').dialog('destroy');
                callback();
		    }
        };

		btns[translate.msg('info_button_cancel')] = function() {
			$('#alertDialog').dialog('destroy');
		};
		
		$('#alertDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : false,
				title : typeof title !== 'undefined' && title != null ? title : ''
			}
		);
		$('#alertDialog').dialog('open');
	};

	/**
	 * Show alert dialog with a message
	 */
	this.showAlertDialog = function(msg, title, callback) {
		$('#alertDialog').text(msg);
		
		var btns = {};
		btns["close"] = {
            id: "close",
            text: translate.msg('info_button_close'),
            click: function() {
                $('#alertDialog').dialog('destroy');
                if (callback) callback();
		    }
        };
		
		$('#alertDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : false,
				title : title
			}
		);
		$('#alertDialog').dialog('open');
	};

	/**
	 * Show open dialog
	 */
	this.showOpenDialog = function() {
		$('#openDialog_select_application').empty();
		$('#openDialog_select_application').removeClass('ui-state-error');

		$('#openDialog_select_surfaceGroup').unbind('change');
		$('#openDialog_select_surfaceType').empty();
        $('#openDialog_select_surfaceType').unbind('change');
		$('#openDialog_select_surfaceGroup').empty();
		
		// When user selects surface type, load applications
		$('#openDialog_select_surfaceType').off("change");
		$('#openDialog_select_surfaceType').change(
            function() {
                var applications = tsae.callService("getAvailableApplications",
                    {"deviceTypeCode": parseInt($('#openDialog_select_surfaceType').val())});
                $('#openDialog_select_application').empty();
                for (var i = 0; i < applications.length; i++) {
                    $('#openDialog_select_application').append($('<option/>').val(
                        applications[i].id).text(applications[i].name));
                }
            }
        );

		// When user selects a surface group, load surface types
		$('#openDialog_select_surfaceGroup').off("change");
		$('#openDialog_select_surfaceGroup').change(
				function() {
					refreshSurfaceTypeSelect(
							$('#openDialog_select_surfaceGroup').val(), $('#openDialog_select_surfaceType'));
				});

		var surfaceGroups = tsae.callService("getAvailableSurfaceGroups", {});
        for (var i = 0; i < surfaceGroups.length; i++) {
            $('#openDialog_select_surfaceGroup').append($('<option/>').val(surfaceGroups[i]).text(
                translate.msg('name_surface_group_' + surfaceGroups[i].toLowerCase())));
        }
        $('#openDialog_select_surfaceGroup').change();

		var btns = {};
		btns["ok"] = {
            id: "ok",
            text: translate.msg('info_button_ok'),
            click: function() {
                var val = $('#openDialog_select_application').val();
                if (val && val.length > 0) {
                    tsae.loadApplication($('#openDialog_select_application').val());
                    $('#openDialog').dialog('destroy');
                } else {
                    $('#openDialog_select_application').addClass('ui-state-error');
                }
		    }
        };
		btns[translate.msg('info_button_cancel')] = function() {
			$('#openDialog').dialog('destroy');
		};
		
		$('#openDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : true,
				height: 300,
				width: 400,
				title : translate.msg('info_open_application')
			}
		);
		$('#openDialog').dialog('open');
	};

	/**
	 * Show a dialog to input a string.
	 * 
	 * prompt is the prompt message to show in the dialog
	 * defaultValue is the value to show in input field when opening the dialog
	 * callback will be called with the value in input field when the user clicks OK
	 */
	this.showInputStringDialog = function(prompt, defaultValue, callback) {
		$('#inputStringDialog_prompt').text(prompt);
		$('#inputStringDialog_input').val(defaultValue);
		
		var btns = {};
		btns["ok"] = {
			text: translate.msg('info_button_ok'),
			id: "ok",
			click: function() {
				$('#inputStringDialog').dialog('destroy');
				if (callback) callback($('#inputStringDialog_input').val());
			}
		};
		btns[translate.msg('info_button_cancel')] = function() {
			$('#inputStringDialog').dialog('destroy');
		};

		$('#inputStringDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : false
			}
		);
		$('#inputStringDialog').dialog('open');
	};
	
	var availableBranchProfilesCallback = function(branchProfiles, currentBranchProfile, applicationId) {
		var sel = $('#applicationSettingsDialog_select_branch');
		
		sel.removeAttr('disabled');
		sel.append($('<option/>').val('').text(translate.msg('info_none')));
		for (var i = 0; i <branchProfiles.length; i++) {
			sel.append($('<option/>').val(branchProfiles[i].id).text(branchProfiles[i].name));
		}
		sel.val('' + (currentBranchProfile == null ? '' : currentBranchProfile)); // To avoid problems when currentBranchProfile is a long

        var isReferenced;
        if(typeof applicationId !== 'undefined' && null != applicationId) {
		    isReferenced = tsae.callService("isReferenced", {"applicationId": applicationId});
        }

        if (typeof isReferenced !== 'undefined' && isReferenced != null && isReferenced.length > 0) {
            sel.attr('disabled', 'disabled');
        } else {
            sel.removeAttr('disabled');
        }
	};

    var availableTicketLengthsCallback = function(ticketLengths, currentTicketLength) {
        var sel = $('#applicationSettingsDialog_select_ticket_length');
        sel.empty();

        sel.removeAttr('disabled');
        for(var i = 0; i < ticketLengths.length; i++) {
            sel.append($('<option/>').val(ticketLengths[i]).text(translate.msg("info_ticket_length_" + ticketLengths[i].toLowerCase())));
        }

        sel.val((currentTicketLength == null ? sel.val() : currentTicketLength));
    };
	
	/**
	 * Dialog for setting application properties
	 */
	this.showApplicationSettingsDialog = function(currentBranchProfile, timeBeforeRestart, callpageEnabled,
                                                  currentTicketLength, applicationId, callback) {
		$('#applicationSettingsDialog_select_branch').removeClass('ui-state-error');
		$('#applicationSettingsDialog_error_branch').hide();
		$('#applicationSettingsDialog_input_return').removeClass('ui-state-error');
		$('#applicationSettingsDialog_error_return').hide();
		$('#applicationSettingsDialog_select_branch').empty();
        $('#applicationSettingsDialog_select_ticket_length').removeClass('ui-state-error');
        $('#applicationSettingsDialog_error_ticket_length').hide();
        $('#applicationSettingsBranch').hide();
        $('#applicationSettingsCallpage').hide();
        $('#applicationSettingsTicketPages').hide();
        $('#applicationSettingsReturnToStartpage').hide();

        // Show hide stuff in the menu based on application type
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            $('#applicationSettingsTicketPages').show();
            var ticketLengths = tsae.callService("getAvailableTicketLengths", {});
            availableTicketLengthsCallback(ticketLengths, currentTicketLength);
        } else {
            $('#applicationSettingsBranch').show();
            var branchProfiles = tsae.callService("getAvailableBranchProfiles", {});
            availableBranchProfilesCallback(branchProfiles, currentBranchProfile, applicationId);
            $('#applicationSettingsReturnToStartpage').show();
            if (!tsae.getSA().surfaceType.multiPage) {
                $('#applicationSettingsCallpage').show();
            }
        }

		$('#applicationSettingsDialog_input_return').val(timeBeforeRestart);
		$('#applicationSettingsDialog_input_callpage').attr('checked', callpageEnabled);
		
		var btns = {};
		btns["ok"] = {
			text: translate.msg('info_button_ok'),
			id: "ok",
			click: function() {
				var branchId = null;
	            var branchIdOk = true;
	            var returnTime = "";
	            var returnTimeOk = true;
	            var ticketLength = null;
	
	            if(tsae.getSA().surfaceType.allowedDevice != tsae.deviceTypes.TP311X) {
	                branchId = $('#applicationSettingsDialog_select_branch').val();
	                branchId = branchId == null || $.trim(branchId.length) == 0 ? null : parseInt(branchId);
	                branchIdOk = branchId !== null;
	                returnTime = $('#applicationSettingsDialog_input_return').val();
	                returnTimeOk = !returnTime || (("" + parseInt(returnTime)) == returnTime && parseInt(returnTime) >= 0);
	            } else {
	                ticketLength = $('#applicationSettingsDialog_select_ticket_length').val();
	                ticketLength = ticketLength == null || ticketLength;
	            }
	
				if (!branchIdOk || !returnTimeOk) {
					if (!branchIdOk) {
						// Must be set when we create a new application
						$('#applicationSettingsDialog_select_branch').addClass('ui-state-error');
						$('#applicationSettingsDialog_error_branch').show();
					}
					if (!returnTimeOk) {
						$('#applicationSettingsDialog_input_return').addClass('ui-state-error');
						$('#applicationSettingsDialog_error_return').show();
					}
				} else {
					callback(
							branchId,
							parseInt($('#applicationSettingsDialog_input_return').val()),
							$('#applicationSettingsDialog_input_callpage').is(':checked'),
	                    ticketLength
	                );
					$('#applicationSettingsDialog').dialog('destroy');
				}
			}
		};
		btns[translate.msg('info_button_cancel')] = function() {
			$('#applicationSettingsDialog').dialog('destroy');
		};
		
		$('#applicationSettingsDialog').dialog(
				{
					buttons : btns,
					modal : true,
					closeOnEscape : true,
					resizable : false,
					title : translate.msg('info_application_settings'),
					width : 400
				}
			);
		$('#applicationSettingsDialog').dialog('open');
	};
	
	/****** START WIDGET SELECTION DIALOG ***/
	/**
	 * Show a dialog to select an image for a img tag
	 * 
	 * targetInput = ID of input box to add selected value to
	 */
	this.showSelectWidgetDialog = function(targetInputId) {
        var availableWidgets = tsae.callService("getAvailableWidgets", {"deviceType": tsae.getSA().surfaceType.allowedDevice});
        if(availableWidgets.length == 0) {
            if(widgets.getWidgetServerAvailable()) {
                dialogs.showAlertDialog(translate.msg('widget_none_available'));
                $('#selectWidgetDialog_widget_icons').empty();
                $('#selectWidgetDialog_widget_icons').append(translate.msg('widget_none_available'));
                $('.selected_component').remove();
            } else {
                dialogs.showAlertDialog(translate.msg('widget_server_unavailable'));
                $('#selectWidgetDialog_widget_icons').empty();
                $('#selectWidgetDialog_widget_icons').append(translate.msg('widget_server_unavailable'));
            }
        } else {
            dialogs.refreshWidgetList(availableWidgets);

            // OK button
            var okCallback = function() {

                if(!$('#selectWidgetDialog_widget_div').children().first()) {
                    dialogs.showAlertDialog(translate.msg('alert_select_widget'), translate.msg('alert_select_widget_title'));
                    return;
                }

                var url, id, name, width, height;
                try {
                    url = $('#selectWidgetDialog_widget_div').children().first().attr('src');
                    id = $('#selectWidgetDialog_widget_div').children().first().attr('id');
                    name = $('#selectWidgetDialog_widget_div').children().first().attr('name');
                    width = $('#selectWidgetDialog_widget_div').children().first().attr('actualwidth');
                    height = $('#selectWidgetDialog_widget_div').children().first().attr('actualheight');

                    $('#' + targetInputId).val(url);
                    $('#' + targetInputId).change();
                    // Add sub-element with the id.
                    $('.selected_component').find('.widget_identifier').remove();
                    $('.selected_component').append("<div style='display:none;' class='widget_identifier'>" + id + "</div>");
                    $('.selected_component').append("<div class='widget_name'>" + name + "</div>");

                    // We don't use the IMG anymore, except for the placeholder img while dragging the widget onto the canvas.
                    $('.selected_component').find('img').remove();
                    $('.selected_component').append(
                            '<div class="widget_background" style="width:' + width + 'px;height:' + height + 'px;background-repeat:no-repeat;background-image: url(\'' + url + '\');"/>'
                    );

                    // Set width and height of widget to container div
                    $('.selected_component').css('width', width + 'px');
                    $('.selected_component').css('height', height + 'px');

                    // Focus it programmatically so the widget attributes are loaded directly
                    tsae.focusComponent($('.selected_component').attr('id'));
                    // Make sure the components list is updated with the selected Widgets name name
                    dialogs.reloadComponentsList();
                    $('#selectWidgetDialog').dialog('destroy');
                } catch (err) {
                    dialogs.showAlertDialog(translate.msg('alert_select_widget'), translate.msg('alert_select_widget_title'));
                }
            };
            // Cancel button
            var cancelCallback = function() {
                $('.selected_component').remove();
                $('#selectWidgetDialog').dialog('destroy');
            };

            $('#selectWidgetDialog').dialog(
                {
                    buttons : [
                        {
                            id: "ok",
                            text: translate.msg('info_button_ok'),
                            click: okCallback
                        },
                        {
                            id: "cancel",
                            text: translate.msg('info_button_cancel'),
                            click: cancelCallback
                        }
                    ],
                    modal : true,
                    closeOnEscape : true,
                    height : 600,
                    width : 700,
                    resizable : false,
                    title : translate.msg('info_select_widget_title'),
                    close: function(event, ui) {
                            // If we havn't chosen a widget when closing, remove selected_component from the DOM.
                            var id = $('.selected_component').find('.widget_identifier').text();
                            if(!id) {
                                $('.selected_component').remove();
                            }
                    }
                }
            );
            $('#selectWidgetDialog').dialog('open');
            $('#ok').attr('disabled','disabled');
            $('#ok').addClass('ui-state-disabled')
        }
	};
	
	
	/**
	 * Refresh widget list in widget dialog
	 */
	this.refreshWidgetList = function(availableWidgets) {
		
		$('#selectWidgetDialog_widget_div').empty();

        $('#selectWidgetDialog_widget_icons').empty();
        for (var i = 0; i < availableWidgets.length; i++) {
            // Handle widget without icon
            if (!availableWidgets[i].icon || availableWidgets[i].icon.length == 0) {
                availableWidgets[i].icon = '/qsystem/surfaceeditor/common/img/defaulticon150x150.png';
            }
            var iconUrl =  dialogs.toRelativePath(availableWidgets[i].icon);
            var img =
                "<div class='image_icon_wrapper'>" +
                    "<img id='img_" + i + "' title='" + availableWidgets[i].title + "' src='" + iconUrl + "?height=72&width=72&stretch=true' class='image_icon'>" +
                "</div>";
            $('#selectWidgetDialog_widget_icons').append($(img));
            $('#img_' + i).bind('click', (function(widget) {
                return function() {
                    dialogs.updateWidgetDialogImage(widget);
                    $('#ok').removeAttr('disabled');
                    $('#ok').removeClass('ui-state-disabled')
                }
            })(availableWidgets[i]));
        }
	};
	
	/**
	 * Convert a http://127.0.0.1:8080/cms/content/surfaceeditor/touch/myimage.png path to relative format, e.g. /cms/content/surfaceeditor/touch/myimage.png
	 */
	this.toRelativePath = function(url) {
		return "/" + url.replace(/^(?:\/\/|[^\/]+)*\//, "");
	};
	
	/**
	 * Update widget preview
	 */
	this.updateWidgetDialogImage = function(widget) {  // function(fileName, title, description, widgetId) {
		
		$('#widget_info_icon').show();
		$('#widget_title').find('b').empty();
		$('#widget_title').find('b').html(widget.title);
		$('#widget_description').find('i').empty();
		$('#widget_description').find('i').html(widget.description);

		var imageDiv = $('#selectWidgetDialog_widget_div');
		
		// Handle widget without icon
		if (!widget.icon || widget.icon.length == 0) {
			widget.icon = '/surface/common/img/defaulticon150x150.png';
		}
		
		if (widget.icon && widget.icon.length > 0) {
			imageDiv.html($('<img/>').attr({
					src : '' + dialogs.toRelativePath(widget.icon) + '?maxWidth=' + Math.floor(imageDiv.width()) + '&maxHeight=' + Math.floor(imageDiv.height()), 
					name : widget.title,
					id : widget.identifier, actualwidth : widget.width, actualheight : widget.height}));
					
		} else {
			imageDiv.html('');
		}
	};
	/******************************************** END WIDGET SELECTION DIALOG ****/

	this.isUnitOnCentralQagent = function(unitId) {
        var allowedDevice = tsae.getSA().surfaceType.allowedDevice;
        var branchId = $('#previewDialog_select_branch').val();
        var ids = tsae.callService("getUnitIdsFromCentralQAgent", {"deviceCode": allowedDevice,
            "branchId": branchId });
        var result = false;
        $.each(ids, function(key, unitIdItem) {
        	if(unitId == unitIdItem) {
        		result = true;        
        	}
        });
        return result;
	};

	/**
	 * Show the dialog asking for preview settings
	 */
	this.showPreviewDialog = function(branchProfileId, callback) {
		$('#previewDialog_select_branch').removeClass('ui-state-error');
        $('#previewDialog_select_unit_id').removeClass('ui-state-error');
        $('#previewDialog_select_branch').unbind('change');
        $('#previewDialog_select_unit_id').unbind('change');
        $('#previewDialog_select_branch').empty();
        $('#previewDialog_select_unit_id').empty();

        function toggleEventSimWidgetSelection() {
            var eventSimulatorSelect = $('#previewDialog_select_event_simulator');
            eventSimulatorSelect.val(-1);
            if(!isEventSimWidgetAvailable()) {
                var eventSimNotAvailableText = translate.msg('event_widget_not_available');
                eventSimulatorSelect.prop('title', eventSimNotAvailableText);
                eventSimulatorSelect.prop('disabled', 'disabled');
            } else {
                var eventSimTitle = translate.msg('info_preview_select_event_simulator_title');
                eventSimulatorSelect.prop('title', eventSimTitle);
                eventSimulatorSelect.prop('disabled', false);
            }
        }
        
        function isEventSimWidgetAvailable() {
            var widgets = tsae.callService("getAvailableWidgets", {"deviceType": tsae.getSA().surfaceType.allowedDevice});
            var eventSimWidgetName = 'http://qmatic.com/widgets/eventsim';
            var result = false;
            $.each(widgets, function(key, widgetItem) {
            	if(widgetItem.identifier == eventSimWidgetName) {
            		result = true;
            	}
            });
            return result;        	
        }
        
        var branches = tsae.callService("getBranches", {"branchProfileId": branchProfileId});
        toggleEventSimWidgetSelection();
        
        if(branches.length > 0) {
            $.each(branches,
                function(i, elmt) {
                    $('#previewDialog_select_branch').append($('<option></option>').val(elmt.id).text(elmt.name));
                }
            );
            $('#previewDialog_select_branch').change(selectBranchFunction);
            $('#previewDialog_select_branch').change();
        } else {
            $('#previewDialog_select_branch').append($('<option></option>').val(-1).text(translate.msg('info_preview_select_branch_empty')));
            $('#previewDialog_select_unit_id').append($('<option></option>').val(-1).text(translate.msg('info_preview_select_unit_empty')));
        }

        var btns = {};
        btns["ok"] = {
            id: "ok", text: translate.msg('info_button_ok'),
            click: function () {
                var selectedBranch = $('#previewDialog_select_branch').val();
                var selectedUnit = $('#previewDialog_select_unit_id').val();
                var eventSimulatorChoice = $('#previewDialog_select_event_simulator').val();
                var isUnitOnCentralQAgent = dialogs.isUnitOnCentralQagent(selectedUnit);
                if (typeof selectedBranch !== 'undefined' && selectedBranch != null && selectedBranch !== -1) {
                    if (typeof selectedUnit !== 'undefined' && selectedUnit != null && selectedUnit !== -1) {
                        $('#previewDialog').dialog('destroy');
                        if (typeof callback === 'function') {
                            callback(selectedUnit, isUnitOnCentralQAgent, eventSimulatorChoice);
                        }
                    } else {
                        $('#previewDialog_select_unit_id').addClass('ui-state-error');
                    }
                } else {
                    $('#previewDialog_select_branch').addClass('ui-state-error');
                    $('#previewDialog_select_unit_id').addClass('ui-state-error');
                }
            }
        };

        btns[translate.msg('info_button_cancel')] = function () {
            $('#previewDialog').dialog('destroy');
        };

        $('#previewDialog').dialog(
            {
                buttons : btns,
                modal : true,
                closeOnEscape : true,
                resizable : false,
                title : translate.msg('info_preview_select_printer_unit_id')
            }
        );
        $('#previewDialog').dialog('open');

	};

    var selectBranchFunction = function() {
        var allowedDevice = tsae.getSA().surfaceType.allowedDevice;
        $('#previewDialog_select_unit_id').empty();
        var ids = tsae.callService("getUnitIds", {"deviceCode": allowedDevice,
            "branchId": $('#previewDialog_select_branch').val()});
        if(ids.length > 0) {
            for (var i = 0; i < ids.length; i++) {
                $('#previewDialog_select_unit_id').append($('<option></option>').val(ids[i]).text(ids[i]));
            }
        } else {
            $('#previewDialog_select_unit_id').append($('<option></option>').val(-1).text(
                translate.msg('info_preview_select_unit_empty')));
        }
    };
	
	/**
	 * Refresh image list in image dialog
	 */
	this.refreshImageList = function() {
		dialogs.updateImageDialogImage();
		var urls = tsae.callService("getImageUrls", {"surfaceGroup": tsae.getSA().surfaceType.allowedSurfaceGroup});
        $('#selectImageDialog_image_icons').empty();
        for (var i = 0; i < urls.length; i++) {
            var img =
                "<div class='image_icon_wrapper'>" +
                    //"<img src='" + urls[i] + "?maxHeight=72&maxWidth=72&stretch=false' class='image_icon' onclick='dialogs.updateImageDialogImage(\"" + urls[i] + "\")'>" +
                    "<div style='width:72px;height:72px;background: url(" + urls[i] + "?maxWidth=72&amp;maxHeight=72&amp;stretch=false) no-repeat center transparent;' class='image_icon' onclick='dialogs.updateImageDialogImage(\"" + urls[i] + "\")'></div>" +
                    "<img src='/images/common/button/delete.png' class='image_icon_delete_delete' onclick='dialogs.deleteImageDialogImage(event, \"" + decodeURI(urls[i]) + "\")'>" +
                "</div>";
            $('#selectImageDialog_image_icons').append($(img));
        }
	};
	
	var setupAlignSelects = function() {
		$('#selectImageDialog_halign').empty();
		$('#selectImageDialog_halign').append($('<option></option>').val('left').text(translate.msg('info_align_left')));
		$('#selectImageDialog_halign').append($('<option></option>').val('center').text(translate.msg('info_align_center')));
		$('#selectImageDialog_halign').append($('<option></option>').val('right').text(translate.msg('info_align_right')));

		$('#selectImageDialog_valign').empty();
		$('#selectImageDialog_valign').append($('<option></option>').val('top').text(translate.msg('info_align_top')));
		$('#selectImageDialog_valign').append($('<option></option>').val('center').text(translate.msg('info_align_center')));
		$('#selectImageDialog_valign').append($('<option></option>').val('bottom').text(translate.msg('info_align_bottom')));
	};
	
	/**
	 * Shows a dialog to select an image for a img tag.
	 *
	 * @param targetInputId = ID of input box to add selected value to
	 * @param absolutePath = Set the absolute path to the image instead of the relative path. Handy when setting an image for a widget which doesn't
	 *                             have the same web-context as the other components.
     * @param isBackground
     * @param repeat
     * @param align
	 */
	this.showSelectImageDialog = function(targetInputId, absolutePath, isBackground, repeat, align) {
		setupAlignSelects();
		dialogs.refreshImageList();
        var imageUrl = $('#' + targetInputId).val();
		dialogs.updateImageDialogImage(imageUrl.indexOf("/qsystem/surfaceeditor/common/img/placeholder.gif") === -1 ? imageUrl : "");
		
		// Set attributes of background image
		if (isBackground) {
			$('#selectImageDialog_backgroundSettings').show();
			if ("no-repeat" != repeat) {
				$('#selectImageDialog_repeat').attr('checked', 'checked');
			} else {
				$('#selectImageDialog_repeat').removeAttr('checked');
			}
			var aligns = align ? align.split(' ', 2) : ['0', '0'];

			var h = parseInt(aligns[0]);
			if (h < 50) {
				h = 'left';
			} else if (h > 50) {
				h = 'right';
			} else {
				h = 'center';
			}

			var v = parseInt(aligns[1]);
			if (v < 50) {
				v = 'top';
			} else if (v > 50) {
				v = 'bottom';
			} else {
				v = 'center';
			}

			$('#selectImageDialog_halign').val(h);
			$('#selectImageDialog_valign').val(v);
		} else {
			$('#selectImageDialog_backgroundSettings').hide();
		}
		
		// If Keep Aspect Ratio property is visible, image should be resized
		var allowResize = $('#property_keep-aspect-ratio_checkbox').is(':visible');

		var btns = {};
		// OK button
		btns["ok"] = {
			id: "ok",
			text: translate.msg('info_button_ok'),
			click: function() {
				var url;
				try {
					url = $('#selectImageDialog_image_div').children().first().attr('src');
					url = url.split('?')[0];
					if(absolutePath) {
						url = url.replace('/cms/thumbs','');
					}

					var imageComponent = $('#' + targetInputId);
					// For background images...
					if ($('#selectImageDialog_backgroundSettings').is(':visible')) {
						imageComponent.css('background-repeat', $('#selectImageDialog_repeat').is(':checked') ?
							'repeat' : 'no-repeat');
						imageComponent.css('background-position', $('#selectImageDialog_halign').val() + ' ' +
							$('#selectImageDialog_valign').val());
						imageComponent.attr('scaling', 'fit');
					} else {
						imageComponent.attr('scaling', 'center');
					}

					imageComponent.val(url);
					imageComponent.change();

					$('#selectImageDialog').dialog('destroy');
				} catch (err) {
					dialogs.showAlertDialog(translate.msg('alert_select_image'), translate.msg('alert_select_image_title'));
				}
			}
		};
		// Cancel button
		btns[translate.msg('info_button_cancel')] = function() {
			$('#selectImageDialog').dialog('destroy');
		};

		$('#selectImageDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				height : 550,
				width : 700,
				resizable : false,
				title : translate.msg('info_select_image_title')
			}
		);
		$('#selectImageDialog').dialog('open');
	};
	
	/**
	 * Upload image
	 */
	this.showUploadImageDialog = function() {
        $("#uploadImageDialogInputWrapper").fileupload({
            paramName: "image",
            fileInput: null,
            dataType: 'json',
            forceIframeTransport: true,
            done: function(e, data){
                if(data.result === true) {
                    dialogs.refreshImageList();
                    $('#uploadImageDialog').dialog('destroy');

                    // and now you're wondering what this is, here's a hint: http://stackoverflow.com/a/1043969
                    var uploadInput = $("#uploadImageDialog_file");
                    uploadInput.replaceWith(uploadInput.clone());

                    $('#uploadImageDialogInputWrapper').fileupload('destroy');
                } else {
                    if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
                        dialogs.showAlertDialog(
                            translate.msg('alert_upload_failed_ticket'), translate.msg('alert_image_upload_failed_image_ticket'));
                    } else {
                        dialogs.showAlertDialog(
                            translate.msg('alert_image_upload_failed'), translate.msg('alert_upload_failed'));
                    }
                }
            },
            fail: function(e, data) {
                if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
                    dialogs.showAlertDialog(
                        translate.msg('alert_upload_failed_ticket'), translate.msg('alert_image_upload_failed_image_ticket'));
                } else {
                    dialogs.showAlertDialog(
                        translate.msg('alert_image_upload_failed'), translate.msg('alert_upload_failed'));
                }
            }
        });
        $('#uploadImageDialog_file').bind('change', function (e) {
            var fileName = $(this).val();
            // IE and Firefox handles this differently
            fileName = fileName.substr(fileName.lastIndexOf('\\') + 1);
            $("#uploadImageDialogInputWrapper").fileupload(
                'option', {
                    url: '/qsystem/surfaceeditor/rest/surfaceeditor/image/' + fileName + '/device/' +
                        tsae.getSA().surfaceType.allowedDevice + '/upload'
                }
            );
        });

		var mimeTypes = tsae.callService("readSupportedImageMimeTypes", {});
        $('#uploadImageDialog_file').attr('accept', mimeTypes);
		
		var btns = {};
		btns["ok"] = {
			id: "imageOK",
			text: translate.msg('info_button_ok'),
			click: function() {
				$('#uploadImageDialogInputWrapper').fileupload('send', {
					fileInput: $('#uploadImageDialog_file')
				});
			}
		};

		btns[translate.msg('info_button_cancel')] = function() {
			$('#uploadImageDialog').dialog('destroy');
		};

		$('#uploadImageDialog').dialog(
			{
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : false,
                width: 350,
				title : translate.msg('info_upload_image')
			}
		);
	};

    /**
     * Upload font
     */
    this.showUploadFontDialog = function() {
        $("#uploadFontDialogInputWrapper").fileupload({
            paramName: "font",
            fileInput: null,
            dataType: 'json',
            forceIframeTransport: true,
            done: function(e, data){
                if(data.result === true) {
                    $("#createFontStyleTable > tbody tr").each(function(fontStyleNumber, row) {
                        $("#createFontFileSelect_" + fontStyleNumber).append($('<option/>').val("fonts/" + data.files[0].name).text(data.files[0].name));
                    });
                    $('#uploadFontDialog').dialog('destroy');

                    // and now you're wondering what this is, here's a hint: http://stackoverflow.com/a/1043969
                    var uploadInput = $("#uploadFontDialog_file");
                    uploadInput.replaceWith(uploadInput.clone());

                    $('#uploadFontDialogInputWrapper').fileupload('destroy');
                } else {
                    dialogs.showAlertDialog(
                        translate.msg('alert_font_upload_failed'), translate.msg('alert_upload_failed'));
                }
            },
            fail: function(e, data) {
                dialogs.showAlertDialog(
                    translate.msg('alert_font_upload_failed'), translate.msg('alert_upload_failed'));
            }
        });
        $('#uploadFontDialog_file').bind('change', function (e) {
            var fileName = $(this).val();
            // IE and Firefox handles this differently
            fileName = fileName.substr(fileName.lastIndexOf('\\') + 1);
            $("#uploadFontDialogInputWrapper").fileupload(
                'option', {
                    url: '/qsystem/surfaceeditor/rest/surfaceeditor/fonts/' + fileName + '/upload'
                }
            );
        });

        var btns = {};
        btns["ok"] = {
			id: "ok",
			text: translate.msg('info_button_ok'),
			click: function() {
				$('#uploadFontDialogInputWrapper').fileupload('send', {
					fileInput: $('#uploadFontDialog_file')
				});
			}
		};

        btns[translate.msg('info_button_cancel')] = function() {
            $('#uploadFontDialog').dialog('destroy');
        };

        $('#uploadFontDialog').dialog(
            {
                buttons : btns,
                modal : true,
                closeOnEscape : true,
                resizable : false,
                width: 350,
                title : translate.msg('info_upload_new_font_file')
            }
        );
    };

	/**
	 * Delete image
	 */
	this.deleteImageDialogImage = function(event, fileName) {
		var i = fileName.lastIndexOf('/');
		i = isNaN(i) ? 0 : i + 1; 
		dialogs.showConfirmDialog(
			'"' + fileName.substr(i).replace(/\+/g, ' ') + '": ' + translate.msg('confirm_delete_image'),
			function() {
				var success = tsae.callService("deleteImage", {"imagePath": fileName});
                if (typeof success !== 'undefined' && success != null && success === 'false') {
                    dialogs.showAlertDialog(
                            translate.msg('error_delete_image_failed'),
                            translate.msg('error_delete_image_failed_title'));
                }
                dialogs.refreshImageList();
			},
            translate.msg('confirm_delete_image_title')
		);
		
		event.stopPropagation();
		return false;
	};

	/**
	 * Update image preview
	 */
	this.updateImageDialogImage = function(fileName) {
		var imageDiv = $('#selectImageDialog_image_div');
		if (fileName && fileName.length > 0) {
			imageDiv.html($('<img/>').attr(
					'src', fileName + '?maxWidth=' + Math.floor(imageDiv.width()) + '&maxHeight=' + Math.floor(imageDiv.height())));
		} else {
			imageDiv.html('');
		}
	};
	
	/********* START NAVIGATION WINDOW ******************/
	
	this.highlightInNavigation = function(componentId) {
		$('.navigation_item').removeClass('ui-state-focus');
		$('#' + componentId + "_item").addClass('ui-state-focus');
		
		$('.component_btns').css('display', "none");
		$('#' + componentId + "_btns").css('display', 'block');
	};

	/**
	 * Show the navigation window, listing all components currently added to the active canvas.
	 */
	this.showComponentsList = function() {
		
		dialogs.reloadComponentsList();

		// if a component is already selected, add td_selected css class.
		if($('.selected_component').attr('id')) {
			$('#' + $('.selected_component').attr('id') + '_item').addClass('ui-state-focus');
		}
		
		var DIALOG_WIDTH = 350;
		
		var btns = {};
		btns[translate.msg('info_button_refresh')] = function() {
			dialogs.reloadComponentsList();
		};
		btns[translate.msg('info_button_close')] = function() {
			$('#navigation_dialog').dialog('destroy');
		};
		
		// Set ltr or rtl default dialog position. ltr is default
		var pos = [($(document).width()-DIALOG_WIDTH-35),65];
		if(tsae.isRTL()) {
			pos = [10,65];
		}



		$('#navigation_dialog').dialog(
				{
					width: DIALOG_WIDTH,
					height: 340,
					buttons : btns,
					modal : false,
					closeOnEscape : true,
					resizable : true,
					title : translate.msg('info_show_navigation'),
					position : pos
				}
			);
		$('#navigation_dialog').dialog('open');

        if($('#pages_dialog').is(":visible")) {
            refreshDialogPosition('pages_dialog',"right","bottom");
            $("#pages_dialog").parent().css('z-index', 1000);
            $("#navigation_dialog").parent().css('z-index', 1005);
        }
		
	};


    /**
     * Show the navigation window, listing all components currently added to the active canvas.
     */
    this.showPagesList = function() {

        var DIALOG_WIDTH = 350;

        var btns = {
            "AddBtn" : {
                text: translate.msg('pages_button_add'),
                    id: "addPageBtn",
                    click: function(){
                        tsae.addPage(null, '', false, dialogs.reloadPagesList);
                }
            },
            "RefreshBtn" : {
                text: translate.msg('pages_button_refresh'),
                id: "refreshPagesBtn",
                click: function(){
                    dialogs.reloadPagesList();
                }
            },
            "CloseBtn" : {
                text: translate.msg('pages_button_close'),
                id: "pagesCloseBtn",
                click: function(){
                    $('#pages_dialog').dialog('destroy');
                }
            }
        };

        // Set ltr or rtl default dialog position. ltr is default
        var pos = [($(document).width()-DIALOG_WIDTH-35),65];
        if(tsae.isRTL()) {
            pos = [10,65];
        }

        // If the navigation dialog is visible, put the pages dialog below it



        $('#pages_dialog').dialog(
            {
                width: DIALOG_WIDTH,
                height: 440,
                buttons : btns,
                modal : false,
                closeOnEscape : true,
                resizable : true,
                title : translate.msg('info_show_pages'),
                position : pos
            }
        );
        $('#pages_dialog').dialog('open');

        dialogs.reloadPagesList();

        if($('#navigation_dialog').is(":visible")) {
            refreshDialogPosition('navigation_dialog',"right","bottom");
            $("#pages_dialog").parent().css('z-index', 1005);
            $("#navigation_dialog").parent().css('z-index', 1000);
        }
    };

    var refreshDialogPosition = function (id, xpos, ypos) {
        $("#" + id).parent().position({
            at: xpos + " " + ypos,
            of: window,
            collision: "fit",
            // Ensure the titlebar is always visible
            using: function (pos) {
                var topOffset = $(this).css(pos).offset().top;
                if (topOffset < 0) {
                    $(this).css("top", pos.top - topOffset);
                }
                $("#" + id).parent().css("left",pos.left - 58 + "px");
            }
        });
    }

    /**
     * Reload the list of components in the navigation window
     */
	this.reloadComponentsList = function() {
		$('#nav_tbody').find("tr:gt(0)").remove();
		
		$('#canvas').find($('.component')).each(function() {
			
			var key = $(this).attr('id');
			
			var controls = '<div id="' + key + '_btns" class="component_btns" style="display:' + ($('.selected_component').attr('id') == key ? 'block':'none') + ';">' +
						   '<button id="' + key + '_back" title="' + translate.msg('info_send_back') + '"></button>' +
                           '<button id="' + key + '_front" title="' + translate.msg('info_send_front') + '"></button>' +
                           '<button id="' + key + '_center" title="' + translate.msg('info_center_component') + '"></button>' +
                           '<button id="' + key + '_delete" title="' + translate.msg('info_delete_component') + '"></button></div>';
			
			var name = $(this).hasClass('widget') ? $(this).find('.widget_name').text() : '';
			
			var rowData = 
				'<tr id="' + key + '_item" class="dr-table-row  navigation_item" title="' + $(this).attr('id') + '">' +
					'<td class="dr-table-cell">' + $(this).attr('id') + '</td>'+
					'<td class="dr-table-cell">' +
						translate.msg("name_component_" + $(this).attr('name')) +
					'</td>' +	
					'<td class="dr-table-cell">' +
						name +
					'</td>' +
					'<td nowrap class="dr-table-cell">' + controls + '</td">' +
				'</tr>';
			
			$('#nav_tbody tr:last').after(rowData);
			
			$('#' + key + '_back').button({
				icons: {
					primary: "ui-icon-arrowreturnthick-1-s"
				},
				text:false
			}).click(tsae.sendSelectedComponentBack);
		
			$('#' + key + '_front').button({
				icons: {
					primary: "ui-icon-arrowreturnthick-1-n"
				},
				text:false
			}).click(tsae.sendSelectedComponentFront);

            $('#' + key + '_center').button({
                icons: {
                    primary: "ui-icon-center"
                },
                text:false
            }).click(tsae.centerSelectedComponent);
	
			$('#' + key + '_delete').button({
				icons: {
					primary: "ui-icon-closethick"
				},
				text:false
			}).click(
                function() {
                    dialogs.showConfirmDialog(
                        translate.msg('confirm_delete_component'),
                        tsae.deleteSelectedComponent,
                        translate.msg('confirm_delete_component_title')
                    );
                }
            );
			
			$('#' + key + "_item").bind('click', function() {
				dialogs.highlightInNavigation(key);
				tsae.focusComponent(key);
			});
			
			$('#' + key + "_item").bind('mouseover', function() {
				$(this).addClass('ui-state-hover');
				
			});
			$('#' + key + "_item").bind('mouseout', function() {
				$(this).removeClass('ui-state-hover');		
			});
		});
	};


    /**
     * Reload the list of components in the navigation window
     */
    this.reloadPagesList = function() {
         renderPagesList(loadPages());
    };


	var pageContainerSelector = '#canvas_container';
	var pagesSelector = '.canvas-page';

    var loadPages = function() {
        $('#pages_tbody').find("tr:gt(0)").remove();
        var pages = $(pagesSelector);
        return pages;
    }

    var renderPagesList = function(pages) {
        pages.sort(function(p1, p2) {
            if ( $(p1).attr('name').toLowerCase() < $(p2).attr('name').toLowerCase() )
                return -1;
            if ( $(p1).attr('name').toLowerCase() > $(p2).attr('name').toLowerCase() )
                return 1;
            return 0;
        });

        for(var a = 0; a < pages.length; a++) {
            addPageToPageNavigation(pages[a]);
        }


        var allowAdd = allowCreateOrDeleteOfPages(null);
        if(!allowAdd) {
            $('#addPageBtn').attr('disabled','disabled').addClass('ui-state-disabled');
        } else {
            if(typeof $('#addPageBtn').attr('disabled') != 'undefined') {
                $('#addPageBtn').removeAttribute('disabled');
                $('#addPageBtn').removeClass('ui-state-disabled');
            }
        }
    }

    var allowCreateOrDeleteOfPages = function(type) {

        // First, check if its a ticket. Never allow add/delete for ticket pages.
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            return false;
        } else {
            return tsae.getSA().surfaceType.multiPage == true
        }
    }

    var addPageToPageNavigation = function(page) {

        var key = $(page).attr('id');
        var name = $(page).attr('name');
        var type = $(page).attr('type');

        // This is a hack to mitigate the situation where the startpage is rendered as a background to the callpage +
        // Single-sheet tickets.
        if(key == 'callpage_background' || (tsae.getSA().ticketLength == "SINGLE" && type == tsae.pageTypes.TICKET_LAST_PAGE)) {
            return;
        }


        var renderControls = allowCreateOrDeleteOfPages(type);

        var controls = '<div id="' + key + '_page_btns" class="page_btns">' +
            '<button id="' + key + 'page_duplicate" title="' + translate.msg('info_duplicate_page') + '"></button>' +
            '<button id="' + key + 'page_delete" title="' + translate.msg('info_delete_page') + '"></button></div>';


        var rowData =
            '<tr id="' + key + '_page_row" class="dr-table-row page_item" title="' + $(page).attr('id') + '">' +
                '<td id="' + key + '_page_item" class="dr-table-cell page_item_name">' + name +
                '</td>' +
                '<td nowrap class="dr-table-cell">' + (renderControls ? controls : "") + '</td>' +
            '</tr>';

        $('#pages_tbody tr:last').after(rowData);

        // Duplicate button
        if(renderControls) {
            $('#' + key + 'page_duplicate').button({
                icons: {
                    primary: "ui-icon-copy"
                },
                text:false
            }).unbind().click(function(_key, _name) {
                    return function() {
                        tsae.addPage(_key, _name, true, dialogs.reloadPagesList);
                    }
                }(key, name));

            // Delete button
            $('#' + key + 'page_delete').button({
                icons: {
                    primary: "ui-icon-trash"
                },
                text:false
            }).unbind().click(function(_key, _name) {
                    return function() {
                        tsae.removeNamedPage(_key, _name, dialogs.reloadPagesList);
                    }
                }(key, name));

            // Remove deletebutton from startpage.
            if($(page).attr('type') == 'startpage') {
                $('#' + key + 'page_delete').remove();
            }

        }

        // Row click listener, selects page
        $('#' + key + "_page_item").unbind().bind('click', function(_key) {

            // Note the usage of closure-return pattern to handle iterator value in callback.
            return function() {
                // If there is no currentPage we've gotten into a weird state, fix it transparently...
                var missingCurrentPage = $(pageContainerSelector + " " + pagesSelector).length == 0;
                if(missingCurrentPage) {
                    // If there is no current page we have gotten into a invalid state. This is a hack to get out of it
                    var wantedCanvas = $('#' + _key);
                    var activeCanvas = wantedCanvas.clone();
                    $('#canvas_container').empty().append(activeCanvas);
                    wantedCanvas.remove();
                    dialogs.reloadPagesList();
                    return;
                }

                // If we're clicking on the already selected item, do nothing.
                if($('#' + key + '_page_row').hasClass('ui-state-focus')) {
                    return;
                }

                $('#pages_tbody').find('.ui-state-focus').removeClass('ui-state-focus');
                tsae.switchPage(_key, dialogs.reloadPagesList); //
            };

        }(key));

        $('#' + key + '_page_row').bind('mouseover', function() {
            $(this).addClass('ui-state-hover');

        });
        $('#' + key + '_page_row').bind('mouseout', function() {
            $(this).removeClass('ui-state-hover');
        });

		var pagesInContainer = $(pageContainerSelector + " " + pagesSelector);
		if(pagesInContainer.length > 0 && $(pagesInContainer[0]).attr('name') == name) {
            $('#' + key + '_page_row').addClass('ui-state-focus');
		}
    };
	
	
	// AUDIO PICKER
	this.showSelectAudioDialog = function(targetInputId) {
		dialogs.refreshAudioList(targetInputId, false); // Use false (DESC) sortorder first time, for some strange reason.
		
		// If Keep Aspect Ratio property is visible, image should be resized
		var allowResize = $('#property_keep-aspect-ratio_checkbox').is(':visible');

		var btns = {};
		// Upload button
		btns[translate.msg('info_upload_new_audio')] = function() {dialogs.showUploadAudioDialog(targetInputId);};
		// Cancel button
		btns[translate.msg('info_button_cancel')] = function() {$('#selectAudioDialog').dialog('destroy');};

		$('#selectAudioDialog').dialog(
			{				
				modal : true,
				buttons : btns,
				closeOnEscape : true,
				height : 550,
				width : 450,
				resizable : false,
				title : translate.msg('info_select_audio_title')
			}
		);
		$('#selectAudioDialog').dialog('open');
	};

    this.showEditFontDialog = function(fontId) {
        initCruFontDialog(fontId);
    };

    /**
     *
     * @param itemToDelete
     * @param itemType a String value e.g. "Font", "Application", "Audio" etc used for translation
     * @param restParamName an string value used to name the item to be removed in the rest call used instead of the itemType if provided
     * @param callback function to be called after the item has been deleted
     */
    this.showDeleteDialog = function(itemToDelete, itemType, restParamName, callback) {
        if (typeof itemToDelete === 'undefined' || itemToDelete == null || itemToDelete.length == 0 ||
            typeof itemType === 'undefined' || itemType == null || itemType.length == 0) {
            return;
        }

        dialogs.showConfirmDialog(
            translate.msg('confirm_delete_' + itemType.toLowerCase()),
            function() {
                if (!itemToDelete.id || itemToDelete.id.length == 0) {
                    if(typeof callback === 'function') {
                        callback();
                    }
                } else {
                    var paramName = (typeof restParamName !== 'undefined' && restParamName != null ? restParamName : itemType);
                    var params = {};
                    params[paramName] = itemToDelete.id;
                    var referencedBy = tsae.callService("delete" + itemType, params);
                    if (isOKDeleteResponse(referencedBy)) {
                        if(typeof callback === 'function') {
                            callback();
                        }
                        dialogs.showAlertDialog(translate.msg('info_delete_' + itemType.toLowerCase() + '_success'), translate.msg('info_delete_success_title'));
                    } else {
                        var message;
                    	if (itemType == 'Ticket' || itemType == 'Application') {
                    		handleSurfaceDeleteErrors(itemType, itemToDelete.name, referencedBy);
                    		return;
                    	} else {
                    		var formattedList = "";
	                        $.each(referencedBy, function(index, referencedItem) {
	                            if(index + 1 < referencedBy.length) {
	                                formattedList += referencedItem.name + ", ";
	                            } else {
	                                formattedList += referencedItem.name + ".";
	                            }
	                        });
	                        message = translate.msg('error_delete_' + itemType.toLowerCase() + '_failed', ['\'' +
	                            (typeof itemToDelete.name !== 'undefined' && itemToDelete.name != null ?
	                                itemToDelete.name : itemToDelete.fontFamily) + '\'', formattedList]);
                    	}
                        dialogs.showAlertDialog(message, translate.msg('error_delete_failed_title'));
                    }
                }
            },
            translate.msg('confirm_delete_' + itemType.toLowerCase() + "_title")
        );
    };
    
    var isOKDeleteResponse = function(response) {
    	// empty response = OK
    	if (typeof response !== 'undefined' && response != null && response.length == 0) {
    		return true;
    	}
    	// list of something = NOK, probably font or image
		if (typeof response !== 'undefined' && response != null && response.length > 0) {
			return false;
		}
    	var isReferenceFound = false;
		if (typeof response !== 'undefined' && response != null && typeof response.referencedServices !== 'undefined' && response.referencedServices != null && response.referencedServices.length > 0) {
			isReferenceFound = true;
		}
		if (typeof response !== 'undefined' && response != null && typeof response.referencedGlobalUnits !== 'undefined' && response.referencedGlobalUnits != null && response.referencedGlobalUnits.length > 0) {
			isReferenceFound = true;
		}
		if (typeof response !== 'undefined' && response != null && typeof response.referencedPlaylists !== 'undefined' && response.referencedPlaylists != null && response.referencedPlaylists.length > 0) {
			isReferenceFound = true;
		}
		if (typeof response !== 'undefined' && response != null && typeof response.referencedEquipmentProfileUnits !== 'undefined' && response.referencedEquipmentProfileUnits != null) {
			isReferenceFound = true;
		}
		if (typeof response !== 'undefined' && response != null && typeof response.referencedBranchUnits !== 'undefined' && response.referencedBranchUnits != null) {
			isReferenceFound = true;
		}
		return (!isReferenceFound);
    };
    
    var handleSurfaceDeleteErrors = function(type, name, referenceDto) {
    	
		$('#deleteSurfaceAlertDialog_table > tbody > tr').empty();
		$('#deleteSurfaceAlertDialog_table > tbody > tr').css('display', "none");
		$('#deleteSurfaceAlertDialog_header').empty();

		if (typeof referenceDto !== 'undefined' && referenceDto != null && typeof referenceDto.referencedServices !== 'undefined' && referenceDto.referencedServices != null && referenceDto.referencedServices.length > 0) {
			var serviceNames = convertListToString(referenceDto.referencedServices);
			var html = '<td><table class="dr-table" style="width:100%;"><tr class="dr-table-header"><td class="dr-table-headercell">' + translate.msg('error_delete_failed_services') + '</td></tr><tr><td title="' + serviceNames + '" class="dr-table-cell">' + trimString(serviceNames,50) + "</td></tr></table></td>";
			$('#deleteSurfaceAlertDialog_table_services').html(html);
			$('#deleteSurfaceAlertDialog_table_services').css('display', "block");
		}
		if (typeof referenceDto !== 'undefined' && referenceDto != null && typeof referenceDto.referencedGlobalUnits !== 'undefined' && referenceDto.referencedGlobalUnits != null && referenceDto.referencedGlobalUnits.length > 0) {
			var globalUnits = convertListToString(referenceDto.referencedGlobalUnits);
			var html = '<td><table class="dr-table" style="width:100%;"><tr class="dr-table-header"><td class="dr-table-headercell">' + translate.msg('error_delete_failed_global_units') + '</td></tr><tr><td title="' + globalUnits + '" class="dr-table-cell">' + trimString(globalUnits,50) + "</td></tr></table></td>";
			$('#deleteSurfaceAlertDialog_table_global_units').html(html);
			$('#deleteSurfaceAlertDialog_table_global_units').css('display', "block");
		}
		if (typeof referenceDto !== 'undefined' && referenceDto != null && typeof referenceDto.referencedPlaylists !== 'undefined' && referenceDto.referencedPlaylists != null && referenceDto.referencedPlaylists.length > 0) {
			var playlists = convertListToString(referenceDto.referencedPlaylists);
			var html = '<td><table class="dr-table" style="width:100%;"><tr class="dr-table-header"><td class="dr-table-headercell">' + translate.msg('error_delete_failed_playlists') + '</td></tr><tr><td title="' + playlists + '" class="dr-table-cell">' + trimString(playlists,50) + "</td></tr></table></td>";
			$('#deleteSurfaceAlertDialog_table_playlists').html(html);
			$('#deleteSurfaceAlertDialog_table_playlists').css('display', "block");
		}
		if (typeof referenceDto !== 'undefined' && referenceDto != null && typeof referenceDto.referencedEquipmentProfileUnits !== 'undefined' && referenceDto.referencedEquipmentProfileUnits != null) {
			var profileUnitsTable = getTableFromReferenceDTO(referenceDto.referencedEquipmentProfileUnits);
			var html = '<td><table class="dr-table" style="width:100%;"><tr class="dr-table-header"><td class="dr-table-headercell">' + translate.msg('error_delete_failed_profile') + '</td><td class="dr-table-headercell">' + translate.msg('error_delete_failed_units') + '</td></tr>' + profileUnitsTable + '</table></td>';
			$('#deleteSurfaceAlertDialog_table_profile_units').html(html);
			$('#deleteSurfaceAlertDialog_table_profile_units').css('display', "block");
		}
		if (typeof referenceDto !== 'undefined' && referenceDto != null && typeof referenceDto.referencedBranchUnits !== 'undefined' && referenceDto.referencedBranchUnits != null) {
			var branchUnitsTable = getTableFromReferenceDTO(referenceDto.referencedBranchUnits);
			var html = '<td><table class="dr-table" style="width:100%;"><tr class="dr-table-header"><td class="dr-table-headercell">' + translate.msg('error_delete_failed_branch') + '</td><td class="dr-table-headercell">' + translate.msg('error_delete_failed_units') + '</td></tr>' + branchUnitsTable + '</table></td>';
			$('#deleteSurfaceAlertDialog_table_branch_units').html(html);
			$('#deleteSurfaceAlertDialog_table_branch_units').css('display', "block");
		}
		$('#deleteSurfaceAlertDialog_table').css('display', "block");
		var message = translate.msg('error_delete_' + type.toLowerCase() + '_failed', [name]);
		$('#deleteSurfaceAlertDialog_header').text(message);
		var title = translate.msg('error_delete_failed_title');
		
		var btns = {};
		btns[translate.msg('info_button_close')] = function() {
			$('#deleteSurfaceAlertDialog').dialog('destroy');
		};
		
		$('#deleteSurfaceAlertDialog').dialog(
			{
				width: 450,
				buttons : btns,
				modal : true,
				closeOnEscape : true,
				resizable : false,
				title : title,
				create: function() {
			        $(this).css("maxHeight", 400);        
			    }
			}
		);
		$('#deleteSurfaceAlertDialog').dialog('open');
    };
    
    var getTableFromReferenceDTO = function(referenceMap) {
    	var html = "";
    	$.map(referenceMap, function(item, key) {
    		var list = convertListToString(item);
    		html += '<tr><td title="' + key + '" class="dr-table-cell">' + trimString(key, 20) + '</td><td title="' + list + '" class="dr-table-cell">' + trimString(list,50) + '</td></tr>';
    	});
    	return html; 
    };
    
    var trimString = function(inString, limit) {
    	var str = inString;
    	if (inString.length > (limit-3)) {
    		str = inString.substring(0,(limit-3)) + "...";
    	}
    	return str;
    };
    
    var convertListToString = function(inputObject) {
    	var returnString = "";
		$.each(inputObject, function(index, name) {
			if(index > 0) {
				returnString += ", ";
			}
			returnString += name;
		});
		return returnString;
    };

    // Create font form dialog
    this.showCreateFontDialog = function() {
        initCruFontDialog();
    };

    var initCruFontDialog = function(fontFamily) {

        clearCrudFontDialog();

        var fontStylesIndex = 0;
        var okBtnCallFunction;
        var title;

        if(typeof fontFamily !== 'undefined' && fontFamily != null && fontFamily.length > 0) {
            title = "info_edit_font_title";
            var font = tsae.callService("getFontByFamily", {'fontFamily': fontFamily});
            okBtnCallFunction = editFont;
            $("#createFontId").val(font.id);
            $("#createFontFamily").val(font.fontFamily);
            $("#createFontFormatSelect").val(font.format);
            $(font.fontStyles).each(
                function(index, fontStyle) {
                    dialogs.addFontStyle(fontStylesIndex, fontStyle);
                    fontStylesIndex++;
                }
            );
        } else {
            title = "info_create_font_title";
            dialogs.addFontStyle(fontStylesIndex);
            fontStylesIndex++;
            okBtnCallFunction = createNewFont;
        }

        $("#createFontFamily").unbind("change");
        $("#createFontFamily").change(function(event) {
            var fontFamily = $(this).val();
            var fontFamilyErrorId = null;
            if(typeof fontFamily === 'undefined' || fontFamily == null || fontFamily.length == 0) {
                fontFamilyErrorId = "createFontFamilyErrorFontFamily";
            }
            if(fontFamilyErrorId == null && !isFontFamilyNameFormatValid(fontFamily.split(","))) {
                fontFamilyErrorId = "createFontFamilyErrorFontFamilyInvalid";
            }
            // check if it's only quotes that have changed for existing fonts
            if(fontFamilyErrorId == null && typeof $("#createFontId").val() !== 'undefined' && $("#createFontId").val() != null && $("#createFontId").val() > 0) {
                var fontFamilyWithInvertedQuotes = fontFamily;

                if(fontFamily.indexOf("\"") != -1) {
                    fontFamilyWithInvertedQuotes = fontFamily.replace(/"/g, "'");
                } else if(fontFamily.indexOf("'") != -1) {
                    fontFamilyWithInvertedQuotes = fontFamily.replace(/'/g, "\"");
                }

                var currentFontVersion = tsae.callService("getFont", {"fontId": $("#createFontId").val(),
                    "deviceType": tsae.getSA().surfaceType.allowedDevice});
                if(currentFontVersion.fontFamily != fontFamilyWithInvertedQuotes && tsae.callService("validateFontFamily", {'fontFamily': fontFamily}) == 'false') {
                    fontFamilyErrorId = "createFontFamilyErrorFontFamilyExists";
                }
            } else if(fontFamilyErrorId == null && tsae.callService("validateFontFamily", {"fontFamily": fontFamily}) == "false") {
                fontFamilyErrorId = "createFontFamilyErrorFontFamilyExists";
            }

            if(fontFamilyErrorId != null) {
                $('#createFontFamily').toggleClass('ui-state-error', true);
                $('#' + fontFamilyErrorId).show();
            } else {
                $('#createFontFamily').toggleClass('ui-state-error', false);
                $('.fontFamilyError').hide();
            }
        });

        $(".createFontFileUpload").button({text:true}).click(
            function(event) {
                dialogs.showUploadFontDialog();
            }
        );
        $(".createFontAddFontStyleBtn").unbind('click');
        $(".createFontAddFontStyleBtn").button({
            icons: {
                primary: "ui-icon-plus"
            },
            text: true
        }).click(function(event) {
                if(isFontStylesTableValid()) {
                    dialogs.addFontStyle(fontStylesIndex);
                    fontStylesIndex++;
                }
                return false; // to avoid navigation
            });

        var btns = {};
        // Upload button
        btns[translate.msg('info_create_font_ok')] = okBtnCallFunction;
        // Cancel button
        btns[translate.msg('info_create_font_cancel')] = function() {$('#createFontDialog').dialog('destroy');};

        $('#createFontDialog').dialog(
            {
                modal : true,
                buttons : btns,
                closeOnEscape : true,
                height : 550,
                width : 550,
                resizable : false,
                title : translate.msg(title)
            }
        );
        $('#createFontDialog').dialog('open');
    };

    var clearCrudFontDialog = function() {

        var fontStyleTableBody = $("#createFontStyleTable > tbody");
        fontStyleTableBody.empty();

        var fontFamilyInput = $('#createFontFamily');
        fontFamilyInput.val("");
        fontFamilyInput.toggleClass('ui-state-error', false);
        $('.fontFamilyError').hide();

        var fontFormatSelect = $('#createFontFormatSelect');
        fontFormatSelect.val(-1);
        fontFormatSelect.toggleClass('ui-state-error', false);
        $('#createFontFamilyErrorFontFormat').hide();

        $("#createFontId").val(-1);
    };

    var isFontStylesTableValid = function() {
        var allFontsValid = true;
        $("#createFontStyleTable > tbody tr").each(function(index, row) {
            var fileSelect = $(this).find(".createFontFileSelect").first();
            if(fileSelect.val() == -1) {
                var urlInput = $(this).find(".createFontUrl").first();
                if(typeof urlInput.val() !== 'undefined' && urlInput.val() != null && urlInput.val().length > 0) {
                    var isValid = tsae.callService("validateFontUrl", {'fontUrl': urlInput.val()});
                    if(isValid == "true") {
                        urlInput.toggleClass('ui-state-error', false);
                    } else {
                        urlInput.toggleClass('ui-state-error', true);
                        allFontsValid = false;
                    }
                } else {
                    urlInput.toggleClass('ui-state-error', true);
                    allFontsValid = false;
                }
            }
        });
        return allFontsValid;
    };

    this.addFontStyle = function(fontStylesIndex, fontStyle) {
        var fontStyleTableBody = $("#createFontStyleTable > tbody");
        var fontStyleRow =
            '<tr class="dr-table-row" id="' + "createFontStyle_" + fontStylesIndex + '">' +
                '<td class="dr-table-cell" style="display: none;">' +
                    '<input class="fieldRequired" type="text" id="createFontId_' + fontStylesIndex + '" name="fontStyles[' + fontStylesIndex + '].id"/>' +
                '</td>' +
                '<td class="dr-table-cell">' +
                    '<button id="removeFontStyleBtn_' + fontStylesIndex + '"/>' +
                '</td>' +
                '<td class="dr-table-cell">' +
                    '<input class="fieldRequired createFontUrl" type="text" id="createFontUrl_' + fontStylesIndex + '" name="fontStyles[' + fontStylesIndex + '].url"/>' +
                '</td>' +
                '<td class="dr-table-cell" style="white-space: nowrap;">' +
                    '<select class="createFontFileSelect" id="createFontFileSelect_' + fontStylesIndex + '" name="fontStyles[' + fontStylesIndex + '].contentResource.filePath">' +
                        '<option value="-1" selected>' + translate.msg("info_create_font_file_select") + '</option>' +
                    '</select>' +
                '</td>' +
                '<td class="dr-table-cell">' +
                    '<select id="createFontWeightSelect_' + fontStylesIndex + '" name="fontStyles[' + fontStylesIndex + '].weight">' +
                        '<option value="normal">' + translate.msg("info_create_font_weight_select_normal") + '</option>' +
                        '<option value="bold">' + translate.msg("info_create_font_weight_select_bold") + '</option>' +
                    '</select>' +
                '</td>' +
                '<td class="dr-table-cell">' +
                    '<select id="createFontStyleSelect_' + fontStylesIndex + '" name="fontStyles[' + fontStylesIndex + '].style">' +
                        '<option value="normal">' + translate.msg("info_font_style_select_normal") + '</option>' +
                        '<option value="italic">' + translate.msg("info_font_style_select_italic") + '</option>' +
                    '</select>' +
                '</td>' +
            '</tr>';

        fontStyleTableBody.append(fontStyleRow);
        $('#removeFontStyleBtn_' + fontStylesIndex).unbind('click');
        $('#removeFontStyleBtn_' + fontStylesIndex).button({
            icons: {primary: "ui-icon-minus"},
            text:false
        }).click(
            function(event) {
                //remove the font style
                $('#removeFontStyleBtn_' + fontStylesIndex).unbind('click');
                $('#removeFontStyleBtn_' + fontStylesIndex).button('destroy');
                $("#createFontFileSelect_" + fontStylesIndex).unbind('change');
                $("#createFontStyle_" + fontStylesIndex).remove();
            }
        );

        if(typeof fontStyle !== 'undefined' && fontStyle != null) {
            $("#createFontId_" + fontStylesIndex).val(fontStyle.id);
            $("#createFontUrl_" + fontStylesIndex).val(fontStyle.url);
            if(fontStyle.contentResource == null || fontStyle.contentResource.filePath == null) {
                $('#createFontFileSelect_' + fontStylesIndex).val(-1);
                $("#createFontUrl_" + fontStylesIndex).removeAttr('disabled');
                $("#createFontUrl_" + fontStylesIndex).toggleClass('fieldRequired', true);
            } else {
                $('#createFontFileSelect_' + fontStylesIndex).append($("<option/>").
                    val(fontStyle.contentResource.filePath).text(
                    fontStyle.contentResource.filePath.substr("fonts/".length)));
                $('#createFontFileSelect_' + fontStylesIndex).val(fontStyle.contentResource.filePath);
                $("#createFontUrl_" + fontStylesIndex).attr('disabled', 'disabled');
                $("#createFontUrl_" + fontStylesIndex).toggleClass('fieldRequired', false);
            }
            $('#createFontWeightSelect_' + fontStylesIndex).val(fontStyle.weight);
            $('#createFontStyleSelect_' + fontStylesIndex).val(fontStyle.style);

        } else {
            $("#createFontFileSelect_" + fontStylesIndex).val(-1);
            $.each(tsae.callService("getFontContentResources"), function(index, fontContentResource) {
                $('#createFontFileSelect_' + fontStylesIndex).append($("<option/>").val(fontContentResource.filePath).text(
                    fontContentResource.filePath.substr("fonts/".length)));
            });
        }

        $("#createFontFileSelect_" + fontStylesIndex).unbind('change');
        $("#createFontFileSelect_" + fontStylesIndex).change(
            function(event) {
                if($(this).val() == -1) {
                    $(this).parent().siblings().children(".createFontUrl").first().val("");
                    $(this).parent().siblings().children(".createFontUrl").first().removeAttr('disabled');
                    $(this).parent().siblings().children(".createFontUrl").first().toggleClass('fieldRequired', true);
                } else {
                    $(this).parent().siblings().children(".createFontUrl").first().val($(this).val());
                    $(this).parent().siblings().children(".createFontUrl").first().attr('disabled', 'disabled');
                    $(this).parent().siblings().children(".createFontUrl").first().toggleClass('fieldRequired', false);
                }
            }
        );
    };

    var createNewFont = function() {
        var fontParameterized = parameterizeForm("createFontForm");
        if(isFontFormValid(fontParameterized.$entity)) {
            tsae.callService("createFont", fontParameterized);
            // update font picker with newly created font
            picker.showFonts();
            $('#createFontDialog').dialog('destroy');
        }
    };

    var editFont = function() {
        var fontParameterized = parameterizeForm("createFontForm");
        if(isFontFormValid(fontParameterized.$entity)) {
            var updatedFont = tsae.callService("updateFont", fontParameterized);
            // update font picker with newly created font
            picker.updateFontList(updatedFont);
            $('#createFontDialog').dialog('destroy');
        }
    };

    var parameterizeForm = function(formId) {
        var fontArray = form2js("createFontForm");
        return {"$entity" : fontArray};
    };

    var isFontFormValid = function(formValues) {
        var fontFamilyErrorId = null;
        var fontFormatError = false;
        if(typeof formValues.fontFamily !== 'undefined' && formValues.fontFamily != null && formValues.fontFamily != "") {
            var fontFamilyNames = formValues.fontFamily.split(",");
            if(!isFontFamilyNameFormatValid(fontFamilyNames)) {
                fontFamilyErrorId = "createFontFamilyErrorFontFamilyInvalid";
            }
            // check if it's only quotes that have changed
            if(fontFamilyErrorId == null && typeof formValues.id !== 'undefined' && formValues.id != null && formValues.id !== "-1") {
                var fontFamilyWithInvertedQuotes = formValues.fontFamily;

                if(formValues.fontFamily.indexOf("\"") != -1) {
                    fontFamilyWithInvertedQuotes = formValues.fontFamily.replace(/"/g, "'");
                } else if(formValues.fontFamily.indexOf("'") != -1) {
                    fontFamilyWithInvertedQuotes = formValues.fontFamily.replace(/'/g, "\"");
                }

                var currentFontVersion = tsae.callService("getFont", {"fontId": formValues.id, "deviceType": tsae.getSA().surfaceType.allowedDevice});
                if(currentFontVersion.fontFamily != fontFamilyWithInvertedQuotes && tsae.callService("validateFontFamily", {'fontFamily': formValues.fontFamily}) == 'false') {
                    fontFamilyErrorId = "createFontFamilyErrorFontFamilyExists";
                }
            } else if(tsae.callService("validateFontFamily", {'fontFamily': formValues.fontFamily}) == 'false') {
                fontFamilyErrorId = "createFontFamilyErrorFontFamilyExists";
            }
        } else {
            fontFamilyErrorId = "createFontFamilyErrorFontFamily";
        }

        if(fontFamilyErrorId != null) {
            $('#createFontFamily').toggleClass('ui-state-error', true);
            $('#' + fontFamilyErrorId).show();
        } else {
            $('#createFontFamily').toggleClass('ui-state-error', false);
            $('.fontFamilyError').hide();
        }

        if(formValues.format == null || formValues.format == "-1") {
            fontFormatError = true;
            $('#createFontFormatSelect').toggleClass('ui-state-error', true);
            $('#createFontFamilyErrorFontFormat').show();
        } else {
            $('#createFontFormatSelect').toggleClass('ui-state-error', false);
            $('#createFontFamilyErrorFontFormat').hide();
        }

        return isFontStylesTableValid() && fontFamilyErrorId == null && !fontFormatError;
    };

    var isFontFamilyNameFormatValid = function(fontFamilyNames) {
        var fontFamilyError = false;
        var escapedFontFamilyRegEx = /^(('?)([a-zA-Z0-9]\s?\-?)+\2)+$/;
        var unescapedFontFamilyRegEx = /^(('?)([a-zA-Z]\s?\-?)+\2)+$/;
        $.each(fontFamilyNames, function(index, fontFamilyName) {
            // does the string start with '?
            if((fontFamilyName.slice(0, "'".length) == "'" && (fontFamilyName.slice(-"'".length) == "'"))) {
                if(!escapedFontFamilyRegEx.test(fontFamilyName)) {
                    fontFamilyError = true;
                }
            } else {
                if(!unescapedFontFamilyRegEx.test(fontFamilyName)) {
                    fontFamilyError = true
                }
            }
        });
        return !fontFamilyError;
    };
	
	var getAudioMarkup = function(i, decodedUrl) {
		// IE8 doesn't support HTML5 audio tag, show message
		if($('html').hasClass('ie8') || $('html').hasClass('ie7') || $('html').hasClass('ie6')) {
			return '<button class="ui-state-disabled" data="' + i + '" id="' + i + '_btnplay" title="' + translate.msg('info_audio_play') + '" disabled="true"/>' +
				   '<button class="ui-state-disabled" data="' + i + '" id="' + i + '_btnpause" title="' + translate.msg('info_audio_pause') + '" disabled="true"/>' +
				   '<img src="img/warning_16x16.png" title="' + translate.msg('info_ie8_no_audio_title') + '"/>';
			
		} else {
			return '<button data="' + i + '" id="' + i + '_btnplay" title="' + translate.msg('info_audio_play') + '"/><button data="' + i + '" id="' + i + '_btnpause" title="' + translate.msg('info_audio_pause') + '"/><audio id="' + i + '_player" src="/cms/content/' + decodedUrl + '"/>';
		}		
	};
	
	/**
	 * Refresh image list in image dialog
	 */
	this.refreshAudioList = function(targetInputId, sortOrder) {
		$('#audio_filename_header').find('span').remove();
		$('#audio_filename_header').append(sortOrder ? '<span>&nbsp;&darr;</span>' : '<span>&nbsp;&uarr;</span>');
		$('#selectAudioDialog_tbody').empty();

        var urls = tsae.callService("getAudioUrls", {"sortOrder": sortOrder});

        $('.audio_item').remove();
        for (var i = 0; i < urls.length; i++) {
            var decodedUrl = decodeURI(urls[i]).replace(/\+/g, ' ');
            var suffix = decodedUrl.substring(decodedUrl.lastIndexOf('.') + 1, decodedUrl.length);
            var icon = '<div class="icon_' + suffix + '" style="width:24px;height:24px"/>';
            var audioMarkup = getAudioMarkup(i, decodedUrl);
            var rowData =
                '<tr class="dr-table-row audio_item">' +
                    '<td class="dr-table-cell" style="text-align:center;">' + icon + '</td">' +
                    '<td class="dr-table-cell">' + decodedUrl.replace('sound//', '') + '</td>'+
                    '<td class="dr-table-cell">' +
                        audioMarkup +
                    '</td>' +
                    '<td class="dr-table-cell">' +
                        '<button data="' + decodedUrl + '" id="' + i + '_btnselect" title="' + translate.msg('info_select_audio_file') + '">' + translate.msg('info_select') + '</button>' +
                        '<button data="' + decodedUrl + '" id="' + i + '_btndelete" title="' + translate.msg('info_delete_audio_file') + '">' + translate.msg('info_delete') + '</button></td>'+
                '</tr>';

            $('#selectAudioDialog_tbody').after(rowData);

            $('#' + i + '_btnplay').button({text:false,icons: {primary: "ui-icon-play"}});
            $('#' + i + '_btnpause').button({text:false,icons: {primary: 'ui-icon-pause'}});

            // If browser isn't IE6,7,8, add click listeners.
            if(!$('html').hasClass('ie8') && !$('html').hasClass('ie7') && !$('html').hasClass('ie6')) {

                $('#' + i + '_btnplay').click(function() {
                        var num = $(this).attr('data');
                        $('#' + num + '_player')[0].play();
                    });

                $('#' + i + '_btnpause').click(function() {
                        var num = $(this).attr('data');
                        $('#' + num + '_player')[0].pause();
                    });
            }

            $('#' + i + '_btnselect').button({text:true}).click(
                    function() {
                        var url = $(this).attr('data');
                        $('#' + targetInputId).val(url);
                        $('#' + targetInputId).change();

                        $('#selectAudioDialog').dialog('destroy');
                    }
            );

            dialogs.addDeleteCallback(i, urls, targetInputId, sortOrder);
        }
        $('.audio_item').mouseover(function() {
            $(this).addClass('ui-state-hover');
        });
        $('.audio_item').mouseout(function() {
            $(this).removeClass('ui-state-hover');
        });

        $('#audio_filename_header').css('cursor','pointer');
        $('#audio_filename_header').unbind('mouseup');
        $('#audio_filename_header').mouseup(function() {
            dialogs.refreshAudioList(targetInputId, !sortOrder);
        });
	};
	
	this.addDeleteCallback = function(i, urls, targetInputId, sortOrder) {
		$('#' + i + '_btndelete').button({text:true}).click(
			function(event) {
				dialogs.deleteAudioDialog(event, decodeURI(urls[i]), targetInputId, sortOrder);
			}
		);
	};
	
	this.deleteAudioDialog = function(event, fileName, targetInputId, sortOrder) {
		
		var i = fileName.lastIndexOf('/');
		i = isNaN(i) ? 0 : i + 1; 
		dialogs.showConfirmDialog(
			'"' + fileName.substr(i).replace(/\+/g, ' ') + '": ' + translate.msg('confirm_delete_audio'),
			function() {
				var success = tsae.callService("deleteAudio", {"audioPath": fileName});
                if (typeof success !== 'undefined' && success != null && success === 'false') {
                    dialogs.showAlertDialog(
                            translate.msg('error_delete_audio_failed'),
                            translate.msg('error_delete_application_failed_title'))
                }
                dialogs.refreshAudioList(targetInputId, sortOrder);
			},
            translate.msg('confirm_delete_audio_title')
		);
		
		event.stopPropagation();
		return false;
	};

    /**
     * Upload audio
     */
    this.showUploadAudioDialog = function(targetInputId) {
        $("#uploadAudioDialogInputWrapper").fileupload({
            paramName: "audio",
            fileInput: null,
            dataType: 'json',
            forceIframeTransport: true,
            done: function(e, data){
                if(data.result === true) {
                    dialogs.refreshAudioList(targetInputId, true);
                    $('#uploadAudioDialog').dialog('destroy');

                    // and now you're wondering what this is, here's a hint: http://stackoverflow.com/a/1043969
                    var uploadInput = $("#uploadAudioDialog_file");
                    uploadInput.replaceWith(uploadInput.clone());

                    $('#uploadAudioDialogInputWrapper').fileupload('destroy');
                } else {
                    dialogs.showAlertDialog(
                        translate.msg('alert_audio_upload_failed'), translate.msg('alert_upload_failed'));
                }
            },
            fail: function(e, data) {
                dialogs.showAlertDialog(
                    translate.msg('alert_audio_upload_failed'), translate.msg('alert_upload_failed'));
            }
        });
        $('#uploadAudioDialog_file').bind('change', function (e) {
            var fileName = $(this).val();
            // IE and Firefox handles this differently
            fileName = fileName.substr(fileName.lastIndexOf('\\') + 1);
            $("#uploadAudioDialogInputWrapper").fileupload(
                'option', {
                    url: '/qsystem/surfaceeditor/rest/surfaceeditor/audio/' + fileName + '/upload'
                }
            );
        });

        var mimeTypes = tsae.callService("readSupportedAudioMimeTypes", {});
        $('#uploadAudioDialog_file').attr('accept', mimeTypes);

        var btns = {};
        btns["ok"] = {
			id: "ok",
			text: translate.msg('info_button_ok'),
			click: function() {
				$('#uploadAudioDialogInputWrapper').fileupload('send', {
					fileInput: $('#uploadAudioDialog_file')
				});
				return false;
			}
		};

        btns[translate.msg('info_button_cancel')] = function() {
            $('#uploadAudioDialog').dialog('destroy');
        };

        $('#uploadAudioDialog').dialog(
            {
                buttons : btns,
                modal : true,
                closeOnEscape : true,
                resizable : false,
                width: 350,
                title : translate.msg('info_upload_audio')
            }
        );
    };

    /**
     * Remove background image from current page
     */
    this.removeBackgroundImage = function() {
        $('#property_background-image_text').val('');
        $('#property_background-image_text').change();
    };

    /**
     * Sel background color of selected component to transparent
     */
    this.removeBackgroundColor = function() {
        $('#property_background-color_text').css('background-color', 'transparent');
        $('#property_background-color_text').css('background-image', 'url(img/transparent.png)');
        $('#property_background-color_text').change();
    };


    this.closeAndResetDialogs = function() {
        try {$('#pages_dialog').dialog("destroy"); } catch(e){}
        try {$('#navigation_dialog').dialog("destroy"); } catch(e){}
    }
};