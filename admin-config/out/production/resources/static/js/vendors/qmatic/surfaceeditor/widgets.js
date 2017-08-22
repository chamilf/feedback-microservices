/**
 * This javascript 'class' contains various methods related to the management of widget components for the surface editor.
 * 
 * It has some dependencies on tsae.js, uses only public methods such as markDirty().
 * 
 * @author erilup
 */

var widgets = (function($) {
	
	/** Temporary storage for widget attributes. Needs some handling, e.g. null when loading new application, delete entry when removing widget **/
	var widgetRegistry = {};
	var widgetServerAvailable = true;
	
	/**
	 * Adds a message to the status message area.
	 */
	function addStatusMessage(msg) {
		$('#status_message').empty();
		$('#status_message').text(msg);
	}	
	
	
	/**
	 * Attach the colorpicker to the input field identified by the supplied id.
	 */
	function attachColorPicker(id) {
		// Attach color pickers to some fields
		$('#' + id).ColorPicker({
			onSubmit: function(hsb, hex, rgb, el) {
				$(el).css('background-color', '#' + hex);
                $(el).css('background-image', '');
				$(el).ColorPickerHide();
				$(el).change();
				saveAttributeValue(el, '#' + hex);
			},
			onBeforeShow: function () {
				var id = $(this).data('colorpickerId');
				$('#' + id).addClass('widget_colorpicker');
				$(this).ColorPickerSetColor($(this).css('background-color'));
			}
		});
		$('#td_' + id).append($('<button style="height: 20px;">Remove</button>').button().click(
			function() {
				$('#' + id).css('background-color', 'transparent');
                $('#' + id).css('background-image', 'url(img/transparent.png)');
				$('#' + id).ColorPickerHide();
				$('#' + id).change();
				saveAttributeValue($('#' + id), 'transparent');
			}));

		// Add a css class so we can delete the colorpicker easily when we lose focus of the selected component.
		var colorpickerId = $('#' + id).data('colorpickerId');
		$('#' + colorpickerId).addClass('widget_colorpicker');
		
		$('.colorpicker_submit').button({
			label : translate.msg('info_button_ok')
		});
	}
	
	
	
	/**
	 * Attaches the qmatic-specific font picker to the field identified by the supplied id.
	 */
	function attachFontPicker(id) {
		
		$('#' + id).click( 
				function() { 
					picker.init($(this), $(this).val(), null, null,  function() {
						var val = picker.getValue();
						$('#' + id + '_val').text(picker.getDisplayText());
						saveAttributeValue($('#' + id), val);
					}); 
				}
		);
		
		var parts = $('#' + id).val().split(';');
	}
	
	
	/**
	 * Adds the appropriate control to the a td element in the properties list.
	 * For each control, we add a suitable 'change' listener so values are saved directly to the local variable 'widgets[componentId].attributes'.
	 * For some attribute types (font, color) we have specific controllers (pickers) who takes care of saving values to the attributes map. 
	 * 
	 * @param attribute
	 *           The attribute, e.g. a WidgetAttribute fetched from the wookie server, enriched with any saved values.
	 * @oaram componentId
	 *           Id of the Widget component.
	 */
	function addWidgetPropertyControl(attribute, componentId) {
		var key = escape(attribute.key);
		
		
		if(attribute.type == 'color') {
			
			// Do the colorpicker thingy.
			$('#td_' + key).addClass('image_input_table_data');
			$('#td_' + key).html(
			        $('<div class="widgetColorInput" id="' + attribute.key + '" data="' + componentId + '">&nbsp;</div>')
			        .css('background-color', (attribute.value != null ? attribute.value : 'transparent'))
			        .css('background-image', (attribute.value == 'transparent' ? 'url(img/transparent.png)' : '')));
			attachColorPicker(key);
		} 
		
		else if(attribute.type == 'font') {
            var fontParts = "";
			if(attribute.value) {
				fontParts = attribute.value.split(';');
			} else {
				fontParts = tsae.getDefaultFontStr().split(';');
			}
			var font = fontParts[0].split(',')[0];
			var size = fontParts[1];
			
			$('#td_' + key).html(					
				'<span class="font_preview" id="' + attribute.key + '_val">' + font + ' ' + size + '</span>' + 
				'<button style="padding: 0;" data="' + componentId + '" id="' + attribute.key + '" value="' + attribute.value + '">' + translate.msg('info_change_font') + '</button>'
			);
			$('#' + key).button({				
				text:true
			});
			$('#td_' + key).addClass('font_input_table_data');
			attachFontPicker(key);
		} 
		
		else if(attribute.type == 'boolean') {
			// Yes/No dropdown
			$('#td_' + key).html( 
					'<select data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'">' +
						'<option value="true">' + translate.msg('yes') + '</option>' +
						'<option value="false">' + translate.msg('no') + '</option>' +
					'</select>'
			);
			
			$('#' + key + ' option[selected]').removeAttr("selected");
			$('#' + key + ' option[value=' + attribute.value +']').attr("selected", "selected"); 
			
			if(!attribute.value) {
				saveAttributeValue($('#' + key), $('#' + key).val());
			}
			$('#' + key).bind('change', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
				$('#' + key + ' option[selected]').removeAttr("selected");
				$('#' + key + ' option[value=' + $('#' + key).val() +']').attr("selected", "selected"); 
			});
		} 
		
		else if(attribute.type == 'image') {
			// Image picker
			var hiddenInputId = componentId + '_' + key;
			$('#td_' + key).html('<input type="hidden" id="' + componentId + '_' + attribute.key + '" value="' + attribute.value + '"/>' +
								 '<span id="' + attribute.key + '_preview">' + (attribute.value ? attribute.value.slice(attribute.value.lastIndexOf("/") + 1, attribute.value.length) : '') + '</span>' +
								 '<button data="' + componentId + '" id="' + attribute.key + '" value="' + (attribute.value != null ? attribute.value : '') + '">' + translate.msg('info_edit') + '</button>');
			
			$('#' + key).button({				
				text:true
			}).click(
					function() {
						// Open an image picker of some kind.
						dialogs.showSelectImageDialog(hiddenInputId, true);
					});
			$('#td_' + key).addClass('font_input_table_data');
			
			
			$('#' + hiddenInputId).bind('change', function() {
				var url = $('#' + hiddenInputId).val();
				$('#' + key).val(url);
				$('#' + key + '_preview').text(url.slice(url.lastIndexOf("/")+1, url.length));
				saveAttributeValue($('#' + key), url);
			});

		}	
		
		else if(attribute.type == 'audio') {
			// Audio picker
			var hiddenInputId = componentId + '_' + key;
			$('#td_' + key).html('<input type="hidden" id="' + componentId + '_' + attribute.key + '" value="' + attribute.value + '"/>' +
								 '<span id="' + attribute.key + '_preview">' + (attribute.value ? attribute.value.slice(attribute.value.lastIndexOf("/") + 1, attribute.value.length) : '') + '</span>' +
								 '<button data="' + componentId + '" id="' + attribute.key + '" value="' + (attribute.value != null ? attribute.value : '') + '">' + translate.msg('info_edit') + '</button>');
			
			$('#' + key).button({				
				text:true
			}).click(
					function() {
						// Open an image picker of some kind.
						dialogs.showSelectAudioDialog(hiddenInputId, true);
					});
			$('#td_' + key).addClass('font_input_table_data');
			
			
			$('#' + hiddenInputId).bind('change', function() {
				var url = $('#' + hiddenInputId).val();
				$('#' + key).val(url);
				$('#' + key + '_preview').text(url.slice(url.lastIndexOf("/")+1, url.length));
				saveAttributeValue($('#' + key), url);
			});

		}	
		
		else if(attribute.type == 'number') {			
			// Numberfield?
			$('#td_' + key).html('<input data="' + componentId + '" type="text" id="' + attribute.key + '" value="' + (attribute.value != null ? attribute.value : '') + '"/>');
			$('#' + key).bind('keyup', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
			});
			
			/** Validation code */
			$('#' + key).bind('blur', function() {
				var match = new RegExp(attribute.validation,'g').test($(this).val());
				if(!match) {
					
					// Show info icon					
					$('#' + key).parent().find('#' + key + '_img').remove();
					$('#' + key).parent().append('<img id="' + attribute.key + '_img" src="img/information.png" title="' + attribute.validationMessage + '"/>');
					
					// Set red bg-color, but fade it out.
					$('#' + key).css('background-color','#ff5c5c');
					$('#' + key).animate({'background-color' :'white'}, 5000);					
					
				} else {
					$('#' + key).css('background-color','white');
					$('#' + key).parent().find('#' + key + '_img').remove();
				}
			});
			
		}		
		
		else if(attribute.type == 'service') {
			
			// add select without options, populate in callback
			$('#td_' + key).html('<select data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'"></select>');
			$('#' + key).bind('change', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
			});
			
			// Get available services fpr the selected branch type, populate dropdown.
			var services = tsae.callService("getServices", {"branchProfileId": tsae.getSA().branchProfile ? tsae.getSA().branchProfile.id : null});
            var isValueSelected = false;
            // Use jquery to add select options
            for(var i = 0; i < services.length; i++) {
                isValueSelected = attribute.value == services[i].id;
                $('#' + key).append('<option value="' + services[i].id + '" ' + (isValueSelected ? 'selected' : '') + '>' + services[i].internalName + '</option>');
            }
            if(!isValueSelected && services.length > 0) {
                saveAttributeValue($('#' + key), $('#' + key).val());
            }
		}		
		
		else if(attribute.type == 'queue') {
			
			$('#td_' + key).html('<select data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'"></select>');
			$('#' + key).bind('change', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
			});
			
			// Get available queues for the selected branch type, populate dropdown.
			var queues = tsae.callService("getQueues", {"branchProfileId": tsae.getSA().branchProfile ? tsae.getSA().branchProfile.id : null});

            var isValueSelected = false;
            // Use jquery to add select options
            for(var i = 0; i < queues.length; i++) {
                isValueSelected = attribute.value == queues[i].id;
                $('#' + key).append('<option value="' + queues[i].id + '" ' + (isValueSelected ? 'selected' : '') + '>' + queues[i].name + '</option>');
            }
            if(!isValueSelected && queues.length > 0) {
                saveAttributeValue($('#' + key), $('#' + key).val());
            }
			
		} else if(attribute.type == 'enumlist') {
			
			$('#td_' + key).html('<select data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'"></select>');
			$('#' + key).bind('change', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
			});
			
			// Get available values from the supplied enum values.

            var isValueSelected = false;
			// Use jquery to add select options
			for(var i = 0; i < attribute.enumeratedValues.length; i++) {
                isValueSelected = attribute.value == attribute.enumeratedValues[i].value;
				$('#' + key).append('<option value="' + attribute.enumeratedValues[i].value + '" ' + (isValueSelected ? 'selected' : '') + '>' + attribute.enumeratedValues[i].name + '</option>');
			}
            if(!isValueSelected && attribute.enumeratedValues.length > 0) {
                saveAttributeValue($('#' + key), $('#' + key).val());
            }
			
			
		} else if(attribute.type == 'hidden') {
			// Do absolutely nothing. Don't show in the GUI.
			
		} else if(attribute.type == 'page') {
			// Show a drop-down (e.g. <select>) of all current pages in the GUI
			$('#td_' + key).html('<select data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'"></select>');
			$('#' + key).bind('change', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
			});
			
			// Get available values from the GUI (pages are "stored" in the markup)
			$('#' + key).empty();
			$('#' + key).append($('<option/>').val('').text('[None]'));
			
			// Select all pages, including the active one.
			var pages = $('div [type=startpage], div [type=standard]');
			for (var i = 0; i < pages.length; i++) {
				var name = $(pages[i]).attr('name');
				var selected = attribute.value == name;
				$('#' + key).append('<option value="' + name + '" ' + (selected ? 'selected' : '') + '>' + name + '</option>');
			}
			
		} else if(attribute.type == 'marktype') {
			
			var selectedMarkType = attribute.value;
			var markTypes = tsae.callService("getAvailableMarkTypes", {});
			var select = $('<select data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'"></select>');
			select.append($('<option />').val('').html('[None]')); //TODO i18
			for(var i=0;i<markTypes.length;i++) {
				var optionItem = $('<option />').val(markTypes[i].id).html(markTypes[i].name);
				if(markTypes[i].id == selectedMarkType) {
					$(optionItem).attr('selected', 'selected');
				}
				select.append(optionItem);
			}
			bindMarkTypeSelectorChange(key, select);
			$('#td_' + key).empty().append(select);
			
		} else if(attribute.type == 'markitem') {

			var selectedMark = attribute.value;
			var markTypeId = '';
			
			var markTypeSelector = $('#marktype:first');
			if(typeof markTypeSelector !== "undefined") {
				markTypeId = markTypeSelector.val();
			}
			
			var marks = new Array();
			if(markTypeId != '') {
				marks = tsae.callService("getAvailableMarks", {"markTypeId" : markTypeId});
			}
			
			var options = getMarkOptions(marks, selectedMark);			
			var select = $('<select class="markitem" data="' + componentId + '" id="'+ attribute.key +'" name="'+ attribute.key +'"></select>');
			for(var i=0;i<options.length;i++) {
				select.append(options[i]);
			}
			select.change(function() {
				saveAttributeValue($('#' + key), $('#' + key).val());				
			});
			$('#td_' + key).empty().append(select);
			
		} else {
			// If unknown type (including type 'text'), provide standard input text field.
			$('#td_' + key).html('<input data="' + componentId + '" type="text" id="' + attribute.key + '" value="' + htmlEscape(attribute.value != null ? attribute.value : '') + '"/>');
			
			$('#' + key).bind('keyup', function() {
				saveAttributeValue($('#' + key), $('#' + key).val());
			});		
		}		
	}
	
	function bindMarkTypeSelectorChange(key, select) {
		select.change(function() {
			var markTypeId = $(this).val();
			var marks = new Array();
			if(markTypeId != '') {
				marks = tsae.callService("getAvailableMarks", {"markTypeId" : markTypeId});
			}
			
			$.each($('select.markitem'), function(key, selectItem) {
				$(selectItem).empty();
				var selectedMark = $(selectItem).val();
				if(!selectedMark) {
					selectedMark = '';
				}
				var options = getMarkOptions(marks, selectedMark);
				for(var i=0;i<options.length;i++) {
					$(selectItem).append(options[i]);
				}
			});
			saveAttributeValue($('#' + key), $('#' + key).val());
		});
	}

	function getMarkOptions(marks, selectedValue) {
		var options = [];
		options.push($('<option />').val('').html('[None]')); //TODO i18
		for(var i=0;i<marks.length;i++) {
			var optionItem = $('<option />').val(marks[i].name).html(marks[i].name);
			if(marks[i].name == selectedValue) {
				optionItem.attr('selected', 'selected');
			}
			options.push(optionItem);
		}
		return options;
	}
		
	function htmlEscape(str) {
        return String(str)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
	}

	
	function addWidgetProperties(widget, componentId) {			
		
		for(var a = 0; a < widget.attributes.length; a++) {
			var attribute = widget.attributes[a];
			
			if(attribute.type == 'hidden') {
				continue;
			}
			
			// Add tr programmatically using jQuery
			// Then call function to add control to tr/td.
						
			var rowData = '<tr class=\"widget_property property dr-table-row property_text\" title=\"' + attribute.description + '">' +
				'<td class=\"dr-table-cell\">' + attribute.name + '</td>'+
				'<td class=\"dr-table-cell\" id="td_' + attribute.key + '">' +
					// Here the control will be added
				'</td>' +
				'</tr>';
			$('#properties_table_body tr:last').after(rowData);
			
			addWidgetPropertyControl(attribute, componentId);
		}
	}	
	
	function escape(key) {
		return key.replace(/\./g,'\\.');
	}
	
	
	/**
	 * Save an attribute to the local widgets attribute array.
	 * 
	 * @param targetEl
	 * 		The input DOM element, e.g. <input type=... />
	 * @param value
	 * 		The value to save. If null, try to use $(targetEl).val(); Reason for this is that we might want to manipulate the value stored in the input control
	 *      prior to saving. For example, the colorpicker stores it's value without #, but we save with the #, so we prepend it before calling saveAttributeValue.
	 */
	function saveAttributeValue(targetEl, value) {
		var localWidgetId = $(targetEl).attr('data');
		var val = value != null ? value : $(targetEl).val();
		
		// A bit ugly, iterate over attributes until the right one is found. Perhaps change the attributes List<WidgetAttribute> in java to Map<String,WidgetAttribute> ?
		for(var j = 0; j < widgetRegistry[localWidgetId].attributes.length; j++) {
			
			var attr = widgetRegistry[localWidgetId].attributes[j];
			
			if(attr.key == $(targetEl).attr('id')) {
				attr.value = val;
				break;
			}
		}
		tsae.markDirty();
	}
	
	
	// PUBLIC CONTRACT
	return {
		
		reset : function() {
			widgetRegistry = new Array();
		},
		
		/**
		 * returns true/false.
		 */
		getWidgetServerAvailable : function() {
			return widgetServerAvailable;
		},
	
		/**
		 * Makes the 'Widget' drag component undraggable and greyed out.
		 */
		disableWidgetComponent : function() {
			$('#template_button_widget').removeClass('component-draggable');
			$('#template_button_widget').removeClass('ui-draggable');
			$('#template_button_widget').addClass('ui-state-disabled');
		},
		
		/**
		 * Cleans out various stuff stored in the browser related to the selected widget.
		 */
		cleanUpWidget : function() {
			
			if($('.selected_component').hasClass('widget')) {
				var identifier = $('.selected_component').find('.widget_identifier').text();
				if(identifier != null && identifier != '') {		
					var componentId = $('.selected_component').attr('id');
					
					// If the widget exists in the registry, mark for deletion. (If a TSA references a deleted Widget, it won't exist in the registry)
					if(widgetRegistry[componentId]) {
						widgetRegistry[componentId].deleted = true;
					}
				}
			}
		},	
	
		/**
		 * Check if there is a wookie connection available. Then iterate over all widgets deployed in this Surfaceapplication. Make sure they are available to the current surfaceapplication.
		 */
		initWidgets : function() {
            var widgetServerAvailableString = tsae.callService("pingWidgetServer", {});
            if(typeof widgetServerAvailableString === 'undefined' || widgetServerAvailableString == null ||
                widgetServerAvailableString == "false") {
                widgetServerAvailable = false;
            } else {
                widgetServerAvailable = true;
            }
            if(!widgetServerAvailable) {
                addStatusMessage(translate.msg('widget_server_unavailable'));
                widgets.disableWidgetComponent();
                return;
            }
				
            // If there are no widgets in this application, just return..
            if(!$('.widget')) {
                return;
            }

            // Iterate over each widget, make sure it's available on the server.
            $('.widget').each(function() {
                // Just make sure all referenced widgets exists on the Wookie Server.

                var identifier = $('#' + $(this).attr('id')).find('.widget_identifier').text();
                if(identifier != null && identifier != '') {
                    var componentId = $(this).attr('id');
                    // Ok, do a DWR call to get the widget (the name used by the widgets)
                    var widget = tsae.callService("getWidget", {"guid":identifier,
                        "applicationId": (typeof tsae.getSA().id !== 'undefined' && tsae.getSA().id != null ?
                        		tsae.getSA().id : -1), "componentId": componentId});

                    if(widget == null) {
                        // Widget is no longer available, inform using an alert.
                        dialogs.showAlertDialog(translate.msg('widget_deleted'));
                    } else {
                        // For each widget, populate the widgetRegistry.
                        widgetRegistry[componentId] = widget;
                        widgetRegistry[componentId].componentId = componentId;
                    }

                }
            });
		},
	
	
		loadWidgetAttributes : function(component, componentId) {
			
			// 1. If a widget has been specified, load WidgetAdapter from Wookie Server.
			// 2. Check the database for values for the custom properties (something like) WIDGET_ATTRIBUTE.
			// 3. Append the appropriate property controls (depends on type, example: type=color should show a color picker).
			if(component.hasClass('widget')) {
				
				// Make sure there is a widget_identifier element present.
				var identifierDiv = $('#' + componentId).find('.widget_identifier');
				if(identifierDiv == null) {
					return;
				}
			
				// If no widget type has been chosen yet, the value is null and we can skip widget attributes.
				var identifier = $('#' + componentId).find('.widget_identifier').text();
				if(identifier == null || identifier == '') {
					return;
				}
				
				// check if we have the widget stored locally
				if(widgetRegistry[componentId] == null) {
				
					// Ok, do a DWR call to get the widget attributes
					var widget = tsae.callService("getWidget", {"guid": identifier,
                        "applicationId": (typeof tsae.getSA().id !== 'undefined' && tsae.getSA().id != null ?
                        		tsae.getSA().id : -1), "componentId": componentId});

                    if(widget == null) {
                        // Widget is no longer available, inform using an alert. TODO Add translation.
                        if(widgetServerAvailable) {
                            dialogs.showAlertDialog(translate.msg('widget_deleted'));
                        }

                    } else {
                        // For each attribute, add something to the properties
                        widgetRegistry[componentId] = widget;
                        widgetRegistry[componentId].componentId = componentId;
                        addWidgetProperties(widgetRegistry[componentId], componentId);
                    }
				} else {
					addWidgetProperties(widgetRegistry[componentId], componentId);
				}
			}
		},
	
	
	
		resetSelectedWidget : function() {
			var id = $('.selected_component').attr('id');
			var identifier = $('.selected_component').find('.widget_identifier').text();
			
			// Blank all input fields in widget property list.
			$('.widget_property').find('input,select,button,').val(null);
			$('.widget_property').find('.font_preview').text(tsae.getDefaultFontDisplayStr());
			// Remove all attributes, if possible.
			if(widgetRegistry[id]) {
				for(var i = 0; i < widgetRegistry[id].attributes.length; i++) {
					widgetRegistry[id].attributes[i].value = null;
				}
				$('#'+id).css('width', widgetRegistry[id].width);
				$('#'+id).css('height', widgetRegistry[id].height);
			}
			
			tsae.markDirty();
		},
		
		
		saveWidgetAttributes : function() {
			// Save widget attributes separately. If the widget is marked as deleted, delete the attributes instead.	
			for(var key in widgetRegistry) {
				if(widgetRegistry.hasOwnProperty(key)) {
					if(widgetRegistry[key] != null && widgetRegistry[key] !== 'undefined') {
						if(widgetRegistry[key].deleted) {
							tsae.callService("deleteWidgetAttributes", {"guid": widgetRegistry[key].identifier,
                                "applicationId":tsae.getSA().id, "componentId": widgetRegistry[key].componentId});
							// Remove the widget locally now.
							widgetRegistry[key] = null;
						} else {
							tsae.callService("saveWidgetAttribute", {"surfaceApplicationName": tsae.getSA().name,
                                "componentId": widgetRegistry[key].componentId,
                                "$entity": widgetRegistry[key]});
						}
					}
				}					
			}
		}
	};
})(jQuery);