var properties = new function() {
	
	var selectedComponentId;
	
	/**
	 * Initialize all components in properties menu
	 */
	this.initComponents = function() {
		// Attach color pickers to some fields 
		$('.colorInput').ColorPicker({
			onSubmit: function(hsb, hex, rgb, el) {
				$(el).css('background-color', '#' + hex);
				$(el).css('background-image', '');
				$(el).ColorPickerHide();
				$(el).change();
			},
			onBeforeShow: function () {
				$(this).ColorPickerSetColor(properties.rgbToHex($(this).css('background-color')));
			}
		});
		$('.colorpicker_submit').button({
			label : translate.msg('info_button_ok')
		});
		
		// Attach font picker
		$('.fontInput').click( 
				function() {
					
					var fontFamily = $('#' + selectedComponentId).css('font-family');
					var fontSize = $('#' + selectedComponentId).css('font-size');
					var fontStyle = $('#' + selectedComponentId).css('font-style');
					var fontWeight = $('#' + selectedComponentId).css('font-weight');
					
					picker.init($(this), fontFamily + ';' + fontSize + ';' + fontStyle + ';' + fontWeight,
                        [selectedComponentId], null, function() {
						// Mark dirty and set preview text
						$('#font_preview').text(picker.getDisplayText());
						tsae.markDirty();
					}); 
				}
		);

        $(".addfontbtn").button({
            text: true
        }).click(
            function(event) {
                dialogs.showCreateFontDialog();
            }
        );
		
        // Attach text editor
        $('.editTextButton').click(
            function(event) {
                var textElement;
                if($(this).attr("id") == "property_text_2_button") {
                    textElement = $("#" + selectedComponentId).find(".text_element_2");
                } else {
                    textElement = $("#" + selectedComponentId).find(".text_element_3");
                }

                textEditor.init(textElement, $(this).offset(), function() {
                    // Mark dirty
                    tsae.markDirty();
                });

                event.stopPropagation();
            }
        );

 	};
	
	
	
	this.checkIfHexColor = function(hexString) {
	     var regColorcode = /^(#)?([0-9a-fA-F]{3})([0-9a-fA-F]{3})?$/;
	     return regColorcode.test(hexString);
	};
	
	this.rgbToHex = function(rgbString) {
		try {
			var parts = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			// parts now should be ["rgb(0, 70, 255", "0", "70", "255"]
	
			if (parts == null) return rgbString;
			delete (parts[0]);
			for (var i = 1; i <= 3; ++i) {
			    parts[i] = parseInt(parts[i]).toString(16);
			    if (parts[i].length == 1) parts[i] = '0' + parts[i];
			}
			return parts.join('');
		} catch (err) {
			return rgbString;
		}
	};

	var setElmtTextArea = function(elmt, text) {
        var jQueryTextElmt = $(elmt);
		if (jQueryTextElmt.find('.text_area_element').andSelf().filter('.text_area_element').length > 0) {
			// New, fresh implementation, http://stackoverflow.com/a/6717742
            var joiner = "<br>";
            var html = $('html');
            if(html.hasClass('ie8') || html.hasClass('ie7') || html.hasClass('ie6')) {
                joiner = "<BR>"
            }
            var wPrev = jQueryTextElmt.width();
            var leftPrev = parseInt(jQueryTextElmt.css('left'));

            var hPrev = jQueryTextElmt.height();
            var topPrev = parseInt(jQueryTextElmt.css('top'));

            var textSpan = jQueryTextElmt.find('.text_area_element').andSelf().filter('.text_area_element');
            textSpan.html(text.split("\n").join(joiner));

            // compare old width and new width, re-position element if it has moved due to new center of rotation
            if(wPrev != jQueryTextElmt.width()) {
                jQueryTextElmt.css({left: (leftPrev - (jQueryTextElmt.width() - wPrev)/2) + "px"});
            }

            if(hPrev != jQueryTextElmt.height()) {
                jQueryTextElmt.css({top: (topPrev - (jQueryTextElmt.height() - hPrev)/2) + "px"});
            }
		} else {
			// For old elements
			// Replacing contents will destroy draggable/droppable, so we have to make this hack
            jQueryTextElmt.resizable('destroy');
            jQueryTextElmt.draggable('destroy');
			var oldText = $.trim(jQueryTextElmt.text());
            jQueryTextElmt.html(jQueryTextElmt.html().replace(oldText, text));
			tsae.attachEventsToComponents(elmt);
		}
	};

    var setElmtTextSingle = function(elmt, text) {
        var jelmt = $(elmt);
        if (jelmt.find('.text_single_element').andSelf().filter('.text_single_element').length > 0) {
            // New, fresh implementation
            jelmt.find('.text_single_element').andSelf().filter('.text_single_element').text(text);
        } else {
            // For old elements
            // Replacing contents will destroy draggable/droppable, so we have to make this hack
            jelmt.resizable('destroy');
            jelmt.draggable('destroy');
            var oldText = $.trim($(elmt).text());
            jelmt.html(jelmt.html().replace(oldText, text));
            tsae.attachEventsToComponents(elmt);
        }
    };
	
	/**
	 * Disable or enable button text depending on if service is set
	 * 
	 * Note: In editor, button text is only updated when setting service or
	 * selecting component. In touch screen, this will be updated every time
	 * application is refreshed.
	 * 
	 * If service is set, read button text from server
	 */
	var setupButtonText = function(component) {
		var propertyServiceSelect = $('#property_service_select');
		var propertyTextText = $('#property_text_text_single');
        var textOverride = $("#text_override");
		
		if (propertyServiceSelect.val() && propertyServiceSelect.val() != "-1"
            && (component.hasClass('button_component') || component.hasClass('button_extended_component'))) {
            if(component.attr('text-override') == 'false') {
                propertyTextText.attr('disabled', 'disabled');
                propertyTextText.addClass('ui-state-disabled');
            } else {
                propertyTextText.removeAttr('disabled');
                propertyTextText.removeClass('ui-state-disabled');
            }
            textOverride.removeAttr('disabled');
            textOverride.toggleClass('ui-state-disabled', false);
            $("#text_override_table").show();
        } else {
            propertyTextText.removeAttr('disabled');
            propertyTextText.removeClass('ui-state-disabled');
            textOverride.attr('disabled', 'disabled');
            textOverride.toggleClass('ui-state-disabled', true);
            $("#text_override_table").hide();
        }
		
		var service = $('.selected_component').attr('value');
		if (typeof service !== 'undefined' && service != null && service != "" && service != "-1" &&
            component.attr('text-override') == 'false') {
			var text = tsae.callService("getButtonText", {"serviceId": Number(service),
                "locale": $('#canvas').attr('locale')});
            if (typeof text !== 'undefined' && text != null) {
                if ($.trim(propertyTextText.val()) != $.trim(text)) {
                    propertyTextText.val(text);
                    propertyTextText.change();
                }
            }
		}
	};
	
	/**
	 * Helper function, which takes a value from user input and translates it to an integer.
	 * If the integer is NaN, the css attribute is set to "", otherwise "px" is added
	 * to the attribute, which then is inserted.
	 */
	this.setupElementCssPxAttr = function(elmt, attr, value) {
		var intVal = parseInt(value);
		$(elmt).css(attr, isNaN(intVal) ? '' : intVal + 'px');
	};
	
	/**
	 * Set all attributes of the given element into input fields
	 */
	this.setAttributes = function(componentId) {
		var component = $('#' + componentId);
		selectedComponentId = componentId;
		
		var propertyImageText = $('#property_image_text');
		if ($('#property_image_button').is(':visible')) {
			propertyImageText.unbind('change');
			propertyImageText.change(
				function(evt) {
					var img = component.children().andSelf().find('img');
                    if (component.hasClass('ui-resizable')) {
					    component.resizable('destroy');
                    }
					component.draggable('destroy');
					img.attr('src', propertyImageText.val());
					img.removeAttr('width');
					img.removeAttr('height');
					component.ready(function() {
                        tsae.calculateAndSetAspectRatio(component);
                        tsae.resizeContainedImage(component, true);
                        tsae.attachEventsToComponents(component);
                        tsae.markDirty();
					});
				}
			);
			propertyImageText.val(component.children().andSelf().find('img').first().attr('src'));
		}
		
		
		var propertyWidgetText = $('#property_widget_text');
		if ($('#property_widget_button').is(':visible')) {
			propertyWidgetText.unbind('change');
			propertyWidgetText.change(
				function(evt) {
					component.resizable('destroy');
					component.draggable('destroy');
					component.children().andSelf().find('img').attr('src', propertyWidgetText.val());
					component.css('width', '');
					component.css('height', '');
					component.ready(function() {
						tsae.attachEventsToComponents(component);
						tsae.markDirty();
					});
				}
			);
			propertyWidgetText.val(component.children().andSelf().find('img').first().attr('src'));			
		}

        var property_parameter_name_text = $('#property_parameter_name_text');
        if(property_parameter_name_text.is(':visible')) {
            property_parameter_name_text.off('input');
            property_parameter_name_text.val("");
            property_parameter_name_text.attr('disabled', 'disabled');
            property_parameter_name_text.addClass('ui-state-disabled');
            property_parameter_name_text.on('input', function(event) {
                component.attr('information', $(this).val());
                $('.system_information_element', component).text($(this).val());
                tsae.markDirty();
            });
        }

        var propertySystemSelect = $('#property_system_select');
        if(propertySystemSelect.is(':visible')) {
            propertySystemSelect.unbind('change');
            $('#property_system_select > option[value!="custom"]').remove();

            var selectedSystemProperty = component.attr('information');
            var systemProperties = tsae.callService("getAvailableSystemProperties", {});

            for(var a = 0; a < systemProperties.length; a++) {
                propertySystemSelect.append('<option value="' + systemProperties[a] + '"' +
                    (selectedSystemProperty == systemProperties[a] ? ' selected' : '') + '>' +
                    translate.msg("system_information_" + systemProperties[a]) + '</option>');
            }
            // Set to default value, ticket id
            if(typeof selectedSystemProperty === 'undefined' || selectedSystemProperty == null) {
                propertySystemSelect.val(systemProperties[1]); //ticket
                component.attr('information', propertySystemSelect.val());
                $('.system_information_element', component).text(translate.msg("system_information_example_" +
                    propertySystemSelect.val()));
            } else if(selectedSystemProperty != "time" && selectedSystemProperty != "ticket" &&
                selectedSystemProperty != "serviceExtName" && selectedSystemProperty != "date") {
                $("#property_parameter_name_text").removeAttr('disabled');
                $("#property_parameter_name_text").removeClass('ui-state-disabled');
                if(selectedSystemProperty.length == 0) {
                    $('.system_information_element', component).text(translate.msg("system_information_example_" +
                        propertySystemSelect.val()));
                    $("#property_parameter_name_text").val("");
                } else {
                    $("#property_parameter_name_text").val(selectedSystemProperty);
                }
            }
            updateShowMaxRowAndPreview(propertySystemSelect.val());            

            propertySystemSelect.change(
                function(evt) {
                    if(propertySystemSelect.val() == "custom") {
                        $("#property_parameter_name_text").removeAttr('disabled');
                        $("#property_parameter_name_text").removeClass('ui-state-disabled');
                        component.attr('information', "");
                            $('.system_information_element', component).text(
                                translate.msg("system_information_example_custom")
                            );
                    } else {
                        $("#property_parameter_name_text").attr('disabled', 'disabled');
                        $("#property_parameter_name_text").addClass('ui-state-disabled');
                        component.attr('information', propertySystemSelect.val());
                        // set example text on span element
                        $('.system_information_element', component).text(translate.msg("system_information_example_" +
                            propertySystemSelect.val()));
                    }
                    
                    var selectedSystem = $(this).val();
                    updateShowMaxRowAndPreview(selectedSystem);
                    
                    tsae.markDirty();
                }
            );
        }

        var propertyBarcodeTypeSelect = $('#property_barcode_type_select');
        if(propertyBarcodeTypeSelect.is(':visible')) {
            propertyBarcodeTypeSelect.unbind('change');

            var selectedBarcodeType = component.attr('barcode_type');

            // Set to default value, Interleaved 2/5
            if(typeof selectedBarcodeType === 'undefined' || selectedBarcodeType == null) {
                selectedBarcodeType = "code25I";
                propertyBarcodeTypeSelect.val(selectedBarcodeType);
                component.attr('barcode_type', propertyBarcodeTypeSelect.val());
            } else {
                propertyBarcodeTypeSelect.val(selectedBarcodeType);
            }
            component.find("> img").attr("src", "/qsystem/surfaceeditor/common/img/" + propertyBarcodeTypeSelect.val() + ".png");

            propertyBarcodeTypeSelect.change(
                function(evt) {
                    component.attr('barcode_type', propertyBarcodeTypeSelect.val());
                    // set example text on span element
                    component.find("> img").attr("src", "/qsystem/surfaceeditor/common/img/" + propertyBarcodeTypeSelect.val() + ".png");
                    if(propertyBarcodeTypeSelect.val() == "code128" || propertyBarcodeTypeSelect.val() == "datamatrixsquare"
                        || propertyBarcodeTypeSelect.val() == "datamatrixrect" || propertyBarcodeTypeSelect.val() == "qrcode") {
                        $("#property_barcode_checksum_checkbox").attr('disabled', true);
                        propertyTextTextArea.toggleClass('ui-state-disabled', true);
                    } else {
                        $("#property_barcode_checksum_checkbox").removeAttr('disabled');
                        propertyTextTextArea.toggleClass('ui-state-disabled', false);
                    }
                    tsae.resizeContainedImage(component);
                    tsae.markDirty();
                }
            );
        }

        var propertyBarcodeChecksumCheckbox = $('#property_barcode_checksum_checkbox');
        if (propertyBarcodeChecksumCheckbox.is(':visible')) {
            propertyBarcodeChecksumCheckbox.unbind('click');
            propertyBarcodeChecksumCheckbox.click(
                function(evt) {
                    component.attr('barcode_checksum', propertyBarcodeChecksumCheckbox.is(':checked'));
                    tsae.markDirty();
                }
            );
            propertyBarcodeChecksumCheckbox.attr('checked', component.attr('barcode_checksum') == 'true');
        }
		
		// propertyTextText must be before propertyServiceSelect
		var propertyTextTextArea = $('#property_text_text_area');
		// Clear attributes
        propertyTextTextArea.removeAttr('disabled');
        propertyTextTextArea.removeClass('ui-state-disabled');
		if (propertyTextTextArea.is(':visible')) {
            propertyTextTextArea.unbind('change');
            propertyTextTextArea.change(
				function(evt) {
					setElmtTextArea(component, propertyTextTextArea.val());
                    tsae.fitComponentInCanvas(component);
					tsae.markDirty();
				}
			);
			if (component.find('.text_area_element').length > 0) {
                // Preserve new lines
                var splitter = "<br>";
                if($('html').hasClass('ie8') || $('html').hasClass('ie7') || $('html').hasClass('ie6')) {
                    splitter = "<BR>"
                }
                var parsedText = component.find('.text_area_element').first().html().split(splitter).join("\n");
                propertyTextTextArea.val(parsedText);
			} else {
                propertyTextTextArea.val(component.text());
			}
			// NSD-4082
            propertyTextTextArea.blur();
		}

        // propertyTextText must be before propertyServiceSelect
        var propertyTextTextSingle = $('#property_text_text_single');
        // Clear attributes
        propertyTextTextSingle.removeAttr('disabled');
        propertyTextTextSingle.removeClass('ui-state-disabled');
        if (propertyTextTextSingle.is(':visible')) {
            propertyTextTextSingle.unbind('change');
            propertyTextTextSingle.change(
                function(evt) {
                    setElmtTextSingle(component, propertyTextTextSingle.val());
                    tsae.markDirty();
                }
            );
            var textOverrideCheckbox = $("#text_override");
            textOverrideCheckbox.unbind('change');
            if(component.hasClass('button_component') || component.hasClass('button_extended_component')) {
                textOverrideCheckbox.toggleClass('ui-state-disabled', false);
                if(component.attr('text-override') == 'true') {
                    textOverrideCheckbox.prop('checked', true);
                } else {
                    textOverrideCheckbox.prop('checked', false);
                }

                textOverrideCheckbox.change(function(evt) {
                    component.attr('text-override', $(this).attr('checked') == 'checked' ? 'true' : 'false');
                    setupButtonText(component);
                    tsae.markDirty();
                });
            } else {
                $("#text_override_table").hide();
            }
            if (component.find('.text_single_element').length > 0) {
                propertyTextTextSingle.val(component.find('.text_single_element').first().text());
            } else {
                propertyTextTextSingle.val(component.text());
            }
            // NSD-4082
            propertyTextTextSingle.blur();
        }

		// propertyServiceSelect must be after propertyTextText
		var propertyServiceSelect = $('#property_service_select');
		if (propertyServiceSelect.is(':visible')) {
			propertyServiceSelect.unbind('change');
			propertyServiceSelect.change(
				function(evt) {
					component.attr('value', propertyServiceSelect.val());
					setupButtonText(component);
					tsae.markDirty();
				}
			);
			propertyServiceSelect.val(component.attr('value'));
			setupButtonText(component);
		}
		
		
		if ($('#property_text-position').is(':visible')) {
			var propertyTextPositionLeft = $('#property_text-position_left');
			var propertyTextPositionTop = $('#property_text-position_top');
			
			propertyTextPositionLeft.unbind('change');
			propertyTextPositionTop.unbind('change');
			propertyTextPositionLeft.change(
				function(evt) {
					properties.setupElementCssPxAttr(
							component.find('.text_single_element').first(),
							'left',
							propertyTextPositionLeft.val());
					tsae.markDirty();
				}
			);
			propertyTextPositionTop.change(
				function(evt) {
					properties.setupElementCssPxAttr(
							component.find('.text_single_element').first(),
							'top',
							propertyTextPositionTop.val());
					tsae.markDirty();
				}
			);
            propertyTextPositionLeft.val(parseInt(component.find('.text_single_element').first().css('left')));
            propertyTextPositionTop.val(parseInt(component.find('.text_single_element').first().css('top')));
		}
		
		var propertyFontText = $('#property_font');
		if (propertyFontText.is(':visible')) {
			propertyFontText.unbind('change');
			propertyFontText.change(
				function(evt) {
					component.css('fontFamily', propertyFontText.val());
					tsae.markDirty();
				}
			);
			propertyFontText.val(component.css('fontFamily'));
			
			// Update the little preview next to the button.
			$('#font_preview').text(propertyFontText.val().split(',')[0] + ' ' + component.css('font-size'));
            if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X ||
                tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.SW_TP3115_TOUCH) {
                $(".addfontbtn").button('disable');
                $(".addfontbtn").hide();
            } else {
                $(".addfontbtn").show();
                $(".addfontbtn").button('enable');
            }
		}
		
		var propertyColorText = $('#property_color_text');

        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            $('#property_color').hide();
        } else if (propertyColorText.is(':visible')) {
			propertyColorText.unbind('change');
			propertyColorText.change(
				function(evt) {
					var color = propertyColorText.css('background-color');
					if (properties.checkIfHexColor(color)) {
						component.css('color', properties.addLeadingHash(color));
					} else {
						component.css('color', color);
					}
					tsae.markDirty();
				}
			);
			propertyColorText.css('background-color', '#' + properties.rgbToHex(component.css('color')));
		}

		var propertyBackgroundColorText = $('#property_background-color_text');
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            $('#property_background-color').hide();
        } else if (propertyBackgroundColorText.is(':visible')) {
			propertyBackgroundColorText.unbind('change');
			propertyBackgroundColorText.change(
				function(evt) {
					var color = propertyBackgroundColorText.css('background-color');
					if (properties.checkIfHexColor(color)) {
						component.css('background-color', properties.addLeadingHash(color));
					} else {
						component.css('background-color', color);
					}
					tsae.markDirty();
				}
			);

            if ('transparent' == component.css('background-color') || 'rgba(0, 0, 0, 0)' == component.css('background-color')) {
                $('#property_background-color_text').css('background-image', 'url(img/transparent.png)');
            } else {
                $('#property_background-color_text').css('background-image', '');
            }
            propertyBackgroundColorText.css('background-color', '#' + properties.rgbToHex(component.css('background-color')));
		}

        var propertyRotationSelect = $('#property_rotation_select');
        // Hack to avoid surface application not loading in Embedded Opera 9.02 used in TP3115.
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.SW_TP3115_TOUCH) {
            $('#property_rotation').hide();
        } else if (propertyRotationSelect.is(':visible')) {
            propertyRotationSelect.unbind('change');
            propertyRotationSelect.change(
                function(evt) {
                	if(component.data('draggable')) {
                    	component.draggable('destroy');
                	}
                	if(component.data('resizable')) {
                    	component.resizable('destroy');
                	}
                    var oldRotation = component.attr("rotation");
                    component.removeClass("rotation_" + oldRotation);
                    var newRotation = propertyRotationSelect.val();
                    component.attr("rotation", newRotation);
                    component.addClass("rotation_" + newRotation);
                    tsae.fitComponentInCanvas(component);
                    tsae.correctXYWHAfterRotation(component, newRotation, oldRotation);
                    tsae.attachEventsToComponents(component); // Apply property
                    tsae.markDirty();
                }
            );
            // at load application time
            var rotationVal = component.attr("rotation");
            propertyRotationSelect.val(rotationVal);
        }

		var propertyBackgroundImageText = $('#property_background-image_text');
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            $('#property_background-image').hide();
        } else if ($('#property_background-image_button').is(':visible')) {
			propertyBackgroundImageText.unbind('change');
			propertyBackgroundImageText.change(
					function(evt) {
						var val = propertyBackgroundImageText.val();
						if (val && val.length > 0) {
							component.css('background-image', 'url("' + propertyBackgroundImageText.val() + '")');
							component.css('background-repeat', propertyBackgroundImageText.css('background-repeat'));
							component.css('background-position', propertyBackgroundImageText.css('background-position'));
						} else {
							component.css('background-image', '');
							component.css('background-repeat', '');
							component.css('background-position', '');
						}
						tsae.markDirty();
					}
			);
			var imageArr = component.css('background-image').split('"');
			if (imageArr.length > 1) {
				propertyBackgroundImageText.val(component.css('background-image').split('"')[1]);
				propertyBackgroundImageText.css('background-repeat', component.css('background-repeat'));
				propertyBackgroundImageText.css('background-position', component.css('background-position'));
			} else {
				propertyBackgroundImageText.val('');
			}
		}

		var propertyArrowLeftText = $('#property_arrowLeft_text');
		if ($('#property_arrowLeft_button').is(':visible')) {
			propertyArrowLeftText.unbind('change');
			propertyArrowLeftText.change(
					function(evt) {
						var val = propertyArrowLeftText.val();
						var img = component.find('.called_customer_arrow_left_img');
						if (val && val.length > 0) {
							var src = propertyArrowLeftText.val();
							var height = Math.round(img.siblings('.called_customer_service_counter').height());
							src = $.param.querystring(src, "height=" + height);
							img.attr('src', src);
							img.attr('height', height);
						} else {
							img.removeAttr('src');
						}
						component.find('.called_customer_arrow_left_img').show();
						component.find('.called_customer_arrow_right_img').hide();
						tsae.markDirty();
					}
			);
			propertyArrowLeftText.val(component.find('img').attr('src'));
		}

		var propertyArrowRightText = $('#property_arrowRight_text');
		if ($('#property_arrowRight_button').is(':visible')) {
			propertyArrowRightText.unbind('change');
			propertyArrowRightText.change(
					function(evt) {
						var val = propertyArrowRightText.val();
						var img = component.find('.called_customer_arrow_right_img');
						if (val && val.length > 0) {
							var src = propertyArrowRightText.val();
							var height = Math.round(img.siblings('.called_customer_service_counter').height());
							src = $.param.querystring(src, "height=" + height);
							img.attr('src', src);
							img.attr('height', height);
						} else {
							img.removeAttr('src');
						}
						component.find('.called_customer_arrow_right_img').show();
						component.find('.called_customer_arrow_left_img').hide();
						tsae.markDirty();
					}
			);
			propertyArrowRightText.val(component.find('img').attr('src'));
		}
		
		var propertyRefTo = $('#property_ref_to');
		if (propertyRefTo.is(':visible')) {
			propertyRefTo.unbind('change');
			propertyRefTo.change(
				function(evt) {
					component.attr('href', propertyRefTo.val());
					tsae.markDirty();
				}
			);
			propertyRefTo.val(properties.addLeadingHash(component.attr('href')));
		}
		
		// TODO Optimize the following attributes using variables instead of searching DOM
		var propertyTextAlignSelect = $('#property_text-align_select');
		if (propertyTextAlignSelect.is(':visible')) {
			propertyTextAlignSelect.unbind('change');
			propertyTextAlignSelect.change(
				function(evt) {
					component.css('text-align', propertyTextAlignSelect.val());
					tsae.markDirty();
				}
			);
			propertyTextAlignSelect.val(component.css('text-align'));
		}
		
		var propertyUrlText = $('#property_url_text');
		if (propertyUrlText.is(':visible')) {
			propertyUrlText.unbind('change');
			propertyUrlText.change(
				function(evt) {
					component.attr('src', propertyUrlText.val());
					tsae.markDirty();
				}
			);
			
			var src;
			// For backward compatibility, we see if there is a element within the div that has a src attribute
			if (component.attr('src')) {
				src = component.attr('src');
			} else if (component.find('[src]').first()) {
				src = component.find('[src]').first().attr('src');
			} else {
				src = '';
			}
			propertyUrlText.val(src);
		}
		
		var propertyKeepAspectRatioCheckbox = $('#property_keep-aspect-ratio_checkbox');
		if (propertyKeepAspectRatioCheckbox.is(':visible')) {
			propertyKeepAspectRatioCheckbox.unbind('click');
			propertyKeepAspectRatioCheckbox.click(
				function(evt) {
					component.resizable('destroy');
					component.draggable('destroy');
					component.attr('keep-aspect-ratio', propertyKeepAspectRatioCheckbox.is(':checked'));
					tsae.resizeContainedImage(component);
					tsae.attachEventsToComponents(component); // Apply property
				}
			);
			propertyKeepAspectRatioCheckbox.attr('checked', component.attr('keep-aspect-ratio') == 'true');
		}

        var propertyScalingSelect = $("#property_scaling_select");
        if(propertyScalingSelect.is(":visible")) {
            propertyScalingSelect.unbind('change');
            propertyScalingSelect.change(
                function(evt) {
                    var newScaling = propertyScalingSelect.val();
                    component.attr("scaling", newScaling);
                    tsae.resizeContainedImage(component);
                    tsae.markDirty();
                }
            );
            // at load application time
            var scaleVal = component.attr("scaling");
            propertyScalingSelect.val(scaleVal);
        }
		
		var localeSelect = $('#property_locale_select');
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            $('#property_locale').hide();
        } else if (localeSelect.is(':visible')) {
			localeSelect.unbind('change');
			
			// Load values...
			localeSelect.empty();
			var selectedLocaleCode = component.attr('locale');
			var locales = tsae.callService("getAvailableLocales", {});
            $.each(locales, function(i, locale) {
                localeSelect.append($('<option>')
                    .val(locale.localeCode)
                    .text(locale.description)
                    .attr('id', locale.id)
                    .prop('selected', selectedLocaleCode == locale.localeCode ? true : false)
                );
            });
			
			// Change the display direction if the direction of the selected language differs from the old language direction
			localeSelect.bind('change', 
				function(evt) {
                    // TODO: No idea what this might be good for, commented for now. Ask Erik L.
                    component.css('direction', tsae.getLanguageDirection());

					// Set locale as an attribute on canvas div.
					$(component).attr('locale', $(localeSelect).val());
                    tsae.markDirty();
				}
			);
		}
		
		var propertyMarginTop = $('#property_marginTop_text');
		if (propertyMarginTop.is(':visible')) {
			propertyMarginTop.unbind('change');
			propertyMarginTop.change(
				function(evt) {
					properties.setupElementCssPxAttr(component.children().first(), 'margin-top', propertyMarginTop.val());
					tsae.markDirty();
				}
			);
			propertyMarginTop.val(parseInt(component.children().first().css('margin-top')));
		}

		var propertyRestartTime = $('#property_restart_time_text');
        if(tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X) {
            $('#property_restart_time').hide();
        } else if (propertyRestartTime.is(':visible')) {
			propertyRestartTime.unbind('change');
			propertyRestartTime.change(
				function(evt) {
					if (propertyRestartTime.val()) {
						component.attr('restart-time', propertyRestartTime.val());
					} else {
						component.removeAttr('restart-time');
					}
					tsae.markDirty();
				}
			);
			propertyRestartTime.val(component.attr('restart-time'));
            if(component.hasClass('vertical_message_component')) {
                $("#property_restart_time_label").text(translate.msg('info_remove_vertical_message_time'));
            } else {
                $("#property_restart_time_label").text(translate.msg('info_restart_time'));
            }
		}
		
		var propertyMuted = $('#property_muted_checkbox');
		if (propertyMuted.is(':visible')) {
			propertyMuted.unbind('click');
			propertyMuted.click(
				function(evt) {
					if (propertyMuted.is(':checked')) {
						component.attr('muted', 'true');
					} else {
						component.removeAttr('muted');
					}
					tsae.markDirty();
				}
			);
			propertyMuted.attr('checked', component.attr('muted') == 'true');
		}
		
		var propertyPreviewText = $('#property_preview_text_text');
		if(propertyPreviewText.is(':visible')) {
			propertyPreviewText.off('input');
			propertyPreviewText.on('input', function() {
				var previewText = $(this).val();
				component.attr('data-preview-text', previewText);
				tsae.markDirty();
			});
			propertyPreviewText.val(component.attr('data-preview-text'));
		}
		
		var propertyMaxRows = $('#property_max_rows_select');
		if(propertyMaxRows.is(':visible')) {
			propertyMaxRows.unbind('change');
			propertyMaxRows.change(function() {
				var maxRows = $(this).val();
				component.attr('data-max-rows', maxRows);
				tsae.markDirty();
			});
			propertyMaxRows.val(component.attr('data-max-rows'));
		}

        var propertyText2JSON = $('#property_text_2_json');
        if ($('#property_text_2_button').is(':visible')) {
            propertyText2JSON.unbind('change');
            propertyText2JSON.change(
                function(evt) {
                    tsae.markDirty();
                }
            );
            if (component.find('.text_element_2').length > 0) {
                var extendedTextElement2 = component.find('.text_element_2').first();

                // add id
                if(typeof extendedTextElement2.attr('id') === 'undefined' || extendedTextElement2.attr('id') == null) {
                    extendedTextElement2.attr('id', component.attr('id') + "_text_2");
                }

                // Metadata
                var text = extendedTextElement2.text();
                var textColor = extendedTextElement2.css('color');
                var textPosition = extendedTextElement2.css('text-position');
                var font = extendedTextElement2.css('font-family') + ';' + extendedTextElement2.css('font-size') + ';' + extendedTextElement2.css('font-style') + ';' + extendedTextElement2.css('font-weight');
                var align = extendedTextElement2.css('align');
                propertyText2JSON.val(JSON.stringify({'text':text, 'textColor':textColor, 'textPosition':textPosition, 'font':font, 'align':align}));
            }
        }

        var propertyText3JSON = $('#property_text_3_json');
        if ($('#property_text_3_button').is(':visible')) {
            propertyText3JSON.unbind('change');
            propertyText3JSON.change(
                function(evt) {
                    tsae.markDirty();
                }
            );
            if (component.find('.text_element_3').length > 0) {
                var extendedTextElement3 = component.find('.text_element_3').first();

                // add id
                if(typeof extendedTextElement3.attr('id') === 'undefined' || extendedTextElement3.attr('id') == null) {
                    extendedTextElement3.attr('id', component.attr('id') + "_text_3");
                }

                // Metadata
                var text = extendedTextElement3.text();
                var textColor = extendedTextElement3.css('color');
                var textPosition = extendedTextElement3.css('text-position');
                var font = extendedTextElement3.css('font-family') + ';' + extendedTextElement3.css('font-size') + ';' + extendedTextElement3.css('font-style') + ';' + extendedTextElement3.css('font-weight');
                var align = extendedTextElement3.css('align');
                propertyText3JSON.val(JSON.stringify({'text':text, 'textColor':textColor, 'textPosition':textPosition, 'font':font, 'align':align}));
            }
        }

    };

	/**
	 * Translate a CSS font value to a alphanumeric font value
	 * 
	 * Note that values "lighter" and "bolder" means lighter or bolder relative to DOM parent
	 */
	var translateNumericFont = function(i) {
		try {
			var parsedInt = parseInt(i);
			if (parsedInt < 550) {
				return "normal";
			} else {
				return "bold";
			}
		} catch (err) {
			return i;
		}
	};
	
	/**
	 * Add a hash to beginning of string if it does not have one
	 */
	this.addLeadingHash = function(str) {
		if (!str || str.length == 0) return str;
		if (str.substr(0, 1) == '#') {
			return str;
		} else {
			return '#' + str;
		}
	};

	/**
	 * Create select items for all available pages (except active page)
	 */
	this.createPageSelect = function() {
		$('#property_ref_to > option[value!="#"]').remove();
        $('#property_ref_to').val("#");

		var pages = $('#pages').children();
		for (var i = 0; i < pages.length; i++) {
			var name = $(pages[i]).attr('name');
			$('#property_ref_to').append($('<option/>').val('#' + name).text(name));
		}
	};
	
	/**
	 * Create select for services, and update service name for all buttons that are bound to services
	 */
	this.createPropertyServiceSelect = function(branchProfileId) {
		$('#property_service_select > option[value!="-1"]').remove();
        $('#property_service_select').val("-1");

		if (branchProfileId) {
			var services = tsae.callService("getServices", {"branchProfileId": branchProfileId});
            for (var i = 0; i < services.length; i++) {
                var serviceName = services[i].externalName ? services[i].externalName : services[i].internalName;

                // Append service to select list
                $('#property_service_select').append($('<option/>').val(services[i].id).text(serviceName));

                // Update buttons attached to service
                // Not an input field of type button but rather a div, hence attr('value') instead of val()
                $('.button_component, .button_extended_component').each(
                    function() {
                        if (typeof $(this).attr('value') !== 'undefined' && $(this).attr('value') != null &&
                            parseInt($(this).attr('value')) == services[i].id && $(this).attr('text-override') == 'false') {
                            setElmtTextSingle($(this), serviceName);
                        }
                    }
                );
            }
		}
	};
	
	this.hide = function() {
		$('properties_table_body').hide('blind', {}, 'fast');
	};

	this.show = function() {
		$('properties_table_body').show('blind', {}, 'fast');
	};
	
	var updateShowMaxRowAndPreview = function(selectedSystem) {
        var enableMaxRowAndPreview = (selectedSystem == 'custom' || selectedSystem == 'serviceExtName'); 
        if(enableMaxRowAndPreview) {
        	$('#property_max_rows_select').removeAttr('disabled').removeClass('ui-state-disabled');
        	$('#property_preview_text_text').removeAttr('disabled').removeClass('ui-state-disabled');
        } else {
            $("#property_max_rows_select").attr('disabled', 'disabled').addClass('ui-state-disabled');
            $("#property_preview_text_text").attr('disabled', 'disabled').addClass('ui-state-disabled');
            $("#property_max_rows_select").val(1);
        }
		
	}

};