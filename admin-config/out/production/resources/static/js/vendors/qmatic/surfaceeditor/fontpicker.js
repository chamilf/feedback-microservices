var picker = (function($) {

	// We supply some hard coded defaults as well.
	var selectedFont, selectedFontShortName, selectedSize, isBold = false, isItalic = false;
	
	// Stores the initial value so we can undo.
	var initialValueStr;
	var liveIds;
	
	// Used for keyup/keydown
	var index = -1, filteredListSize = 0;
	
	var expanded = false;
	var mouse_is_inside = false;
	
	var parentComponent;
	
	var template = '<div id="fontpicker" class="fontpicker">' +
						'<div class="inner_fontpicker">' + 
							'<div id="fontbox_heading"></div>' +
							'<div id="fontbox"></div>' +	
							'<div id="sizebox_heading"></div>' +
							'<div id="sizebox"></div>' +
							'<div id="fontpicker_cbs" style="padding-left: 2em;">' +
								// Checkboxes goes here
							'</div>' +
                            '<button id="editfontbtn" class="editfontbtn"></button>' +
                            '<button id="deletefontbtn" class="deletefontbtn"></button>' +
							'<button id="fontbtn" class="fontbtn_cls"></button>' +
							'<div id="fontpicker_btns">' +
								// Buttons here
							'</div>' +
							'<button id="sizebtn" class="sizebtn_cls"></button>' +
						'</div>' +
					'</div>';
	
	var fontsizes = [7,8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72,96,125];

	var userCallbacks = {};
	
	function resetToDefaults() {
		selectedFont = 'Arial, sans-serif';
		selectedFontShortName = 'Arial';
		selectedSize = '36px';
		isBold = false;
		isItalic = false;
	}
	
	/**
	 * Updates the css styles for all specified element id's
	 */
	function liveUpdate(ids) {
		if(ids != null) {
			for(var i = 0; i < ids.length; i++) {
				$('#' + ids[i]).css('font-family', picker.getFontFamily());
				$('#' + ids[i]).css('font-size', picker.getFontSize());
				$('#' + ids[i]).css('font-style', picker.getFontStyle());
				$('#' + ids[i]).css('font-weight', picker.getFontWeight());
                if($('#' + ids[i]).hasClass("system_information_component")) {
                    $('#' + ids[i]).css("max-height", function(index, value) {
                        return $(this).find(".system_information_element").first().height() + "px";
                    });
                }
			}
		}
	}
	
	/**
	 * Updates css styles of the element identified as preview.
	 * Note that we don't set the size of the preview element, instead we set display text=[Short font name] [size]px 
	 */
	function updatePreview(id) {
		if(id != null) {	
			$('#' + id).text(picker.getDisplayText());
			$('#' + id).css('font-family', picker.getFontFamily());
			$('#' + id).css('font-style', picker.getFontStyle());
			$('#' + id).css('font-weight', picker.getFontWeight());			
		}
	}
	
	function apply(previewId) {
		$(parentComponent).val(picker.getValue());				
		updatePreview(previewId);
		userCallbacks.onSubmit();
		picker.destroy();
	}
	
	/**
	 * Reset all fields of the picker to the ones stored when we created the picker instance.
	 */
	function undo() {
		var parts = initialValueStr.split(';');
		
		// If the "undo" value is OK, use that. Otherwise, restore to defaults.
		if(parts.length == 4) {
			parseValueArr(parts);
		} else {
			resetToDefaults();
		}		
	}
	
	/**
	 * Parses the array of font values (that was previously splitted using ;)
	 * Index: 
	 * 0 = Full font family, fallbacks separated by comma.
	 * 1 = Font size, including 'px'.
	 * 2 = Font style, e.g. 'normal' or 'italic'
	 * 3 = Font weight, e.g. 'normal' or 'bold'
	 */
	function parseValueArr(parts) {
		selectedFont = parts[0].replace(/'/g, "");
		selectedFontShortName = parts[0].split(',')[0].replace(/'/g, "");
		selectedSize = parts[1];
		isItalic = parts[2] == 'italic';
		isBold = parts[3] == 'bold' || parts[3] > 400;		
	}
	
	function addTranslatedElements(previewId) {
        var fontTextSpan = $("<span></span>").text(translate.msg('info_font'));
		$('#fontbox_heading').html(fontTextSpan);
        var sizeTextSpan = $("<span></span>").text(translate.msg('info_font_size'));
		$('#sizebox_heading').html(sizeTextSpan);
		
		$('#fontpicker_btns').html('<button id="fontOk">' + translate.msg('info_button_apply') + '</button><button id="fontCancel">' + translate.msg('info_button_cancel') + '</button>');
		$('#fontpicker_cbs') .html('<input type="checkbox" id="field_bold">&nbsp;' + translate.msg('info_font_weight_bold') + '<br>' +
								   '<input type="checkbox" id="field_italic">&nbsp;' + translate.msg('info_font_style_italic') + '');
		// Make the buttons jQuery UI buttons.
		$('#fontOk').button({
			text:true
		}).click(function(event) {
			event.stopPropagation();
            apply(previewId);
        });


		$('#fontCancel').button({
			text:true
		}).click(function(event) {
			event.stopPropagation();
            undo();
            liveUpdate(liveIds);
            apply(previewId);
        });
	}
	
	// Helper functions for our comboboxes/autocompletes
	function handleKeyUp(evt, clazz, controlId, listContainerId, onEnterPressed) {
		filteredListSize = $('.' + clazz).filter(":visible").length;
		if(index > filteredListSize-1)
			index = filteredListSize;
		
		// If return was pressed
		if (evt.keyCode == 13 || evt.keyCode == 108) {
			if(filteredListSize == 0) {
				var valx = $('#' + controlId).val();
			} else {
				var valx =  $($('.' + clazz).filter(":visible")[index]).text();
			}
			onEnterPressed(valx);
			onEnter(valx, index, controlId, listContainerId);						
			return;
		}
		
		// If down arrow
		if(evt.keyCode == 40) {
			if(index < filteredListSize-1)
				index++;
			onKey(clazz, index, controlId);						
			return;
		}
		
		// If up arrow
		if(evt.keyCode == 38) {
			if(index > 0)
				index--;
			onKey(clazz, index, controlId);
			return;
		}

		var val = $('#' + controlId).val();
		
		// If textfield is empty, show all.
		if(val == '') {
			$('.' + clazz).css('display','block');
			return;
		}
		
		$('.' + clazz).each(function () {
			if ($(this).attr('id').search(new RegExp('^' + val, "i")) < 0) {
				$(this).css('display','none');
			} else {
				$(this).css('display','block');
			}
		});
		// Reset selection index if filter changes.
		index = 0;
		$('.' + clazz).css('background-color','#ffffee');
		$($('.' + clazz).filter(":visible")[index]).css('background-color','#efefff');
	}
	
	function onKey(clazz, index, control) {
		$('.' + clazz).css('background-color','#ffffee');
		$($('.' + clazz).filter(":visible")[index]).css('background-color','#efefff');
		$('#' + control).val($($('.' + clazz).filter(":visible")[index]).text());
	}
	
	function onEnter(value, index, control, listContainer) {		
		$('#' + control).val(value);
		liveUpdate(liveIds);
		$('#' + listContainer).remove();
		$('#' + control).unbind('keyup');
		$('#' + control).unbind('keypress');
		$('#' + control).blur();
		rebindStopPropagation();
	}
	
	/**
	 * Removes any mouseup events from the fontpicker and reattaches the "default" stopPropagation one.
	 */
	function rebindStopPropagation() {
		$('.fontpicker').unbind('mouseup');
		$('.fontpicker').bind('mouseup', function(event){
			event.stopPropagation();
		});
	}
	
	/**
	 * Makes sure there is no trailing ; which can screw up our parser on occasion.
	 */
	function clean(fontStr) {
		if(fontStr.charAt( fontStr.length-1 ) == ";") {
			fontStr = fontStr.slice(0, -1)
		}
		return fontStr;
	}
		
	// Public contract.
	return {
		init : function(parent, currentValue, liveUpdateIds, previewId, onSubmitCallback) {
			parentComponent = parent;
			currentValue = clean(currentValue);
			// Save initial value so we can undo
			initialValueStr = currentValue;
			liveIds = liveUpdateIds;
			
			userCallbacks.onSubmit = onSubmitCallback;
			
			if(typeof currentValue !== 'undefined' && currentValue != 'null') {
				// Parse...
				var parts = currentValue.split(';');
				parseValueArr(parts);
			} else {
				resetToDefaults();
			}
		
			// Remove any old pickers left in the DOM
			$('body').find('#fontpicker').remove();
		
			$('body').append(template);
			addTranslatedElements(previewId);
			// Position
			var parentPosition = $(parent).offset();
			$('#fontpicker').css('top', parentPosition.top + 20);
			if (tsae.isRTL()) {
                $('#fontpicker').css('left', parentPosition.left - 320);
			} else {
			    $('#fontpicker').css('left', parentPosition.left);
			}
				
			$('#fontbox').empty();
			$('#fontbox').append('<input id="font_text" type="text" data="' + selectedFont + '" value="' + selectedFontShortName + '"/>');//(selectedFontShortName);
			$('#font_text').bind('focus', function() {
				picker.showFonts();
			});

            $("#editfontbtn").button({
                text: true
            }).click(function(event) {
                dialogs.showEditFontDialog($("#font_text").attr('data-fontFamily'));
            });

            $("#deletefontbtn").button({
                text: true
            }).click(function(event) {
                var fontToDelete = tsae.callService("getFontByFamily", {"fontFamily": $("#font_text").attr('data-fontFamily')});
                if(typeof fontToDelete !== 'undefined' && fontToDelete != null) {
                    dialogs.showDeleteDialog(fontToDelete, "Font", "fontId");
                }
            });

            // The seemingly strange use of validateFontFamily(fontFamily) should be interpreted like:
            // validateFont(fontFamily) == 'true' == font not found => disable button.
            // That could happen if a widget defines a standard font that doesn't exist
            if(selectedFont == "Arial, sans-serif" || tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X ||
                tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.SW_TP3115_TOUCH ||
                tsae.callService("validateFontFamily", {'fontFamily': selectedFont}) == 'true') {
                $("#editfontbtn").button('disable');
                $("#deletefontbtn").button('disable');
            } else {
                $("#editfontbtn").button('enable');
                $("#deletefontbtn").button('enable');
            }

            $("#editfontbtn").find("span").text(translate.msg("info.edit.font"));
            $("#deletefontbtn").find("span").text(translate.msg("info.delete.font"));
			
			$('#fontbtn').button({
				icons: {
					primary: "ui-icon-triangle-1-s"
				},
				text:false				
			}).click(function(event) {				
				$('#font_text').focus();				
			});
			
			$('#sizebtn').button({
				icons: {
					primary: "ui-icon-triangle-1-s"
				},
				text:false				
			}).click(function(click) {
				$('#font_size').focus();				
			});
			
			if(isBold)			$('#field_bold').attr('checked','checked');
			if(isItalic)		$('#field_italic').attr('checked','checked');
			
			
			$('#sizebox').empty();			
			$('#sizebox').append('<input type="text" id="font_size"/>');
			var regexp = /[a-zA-Z]+/;
			$('#font_size').val(selectedSize.replace(regexp, ''));
			
			
			$('#font_size').bind('focus', function() {
				picker.showSizes();
			});

			
			$('#field_bold').change(function() {
				if($('#field_bold').is(':checked')) {
					isBold = true;
				} else {
					isBold = false;
				}
				liveUpdate(liveIds);
			});
			
			$('#field_italic').change(function() {
				if($('#field_italic').is(':checked')) {
					isItalic = true;
				} else {
					isItalic = false;
				}
				liveUpdate(liveIds);
			});			
			
			// Fix so dialog closes if we click outside of it
			$('body').bind('mouseup', function() {
				 apply(previewId);
			});

			$('.fontpicker').bind('mouseup', function(event){
				event.stopPropagation();
			});
		},

		showSizes : function() {
			index = -1;
			$('#sizes').remove();
			$('#sizebox').append('<div id="sizes" style="display:none; overflow-y: scroll; max-height: 200px;"></div>');
				var fontSize = $('#sizebox').find('#font_size');
				var startValue = $(fontSize).val();
				for(var i = 0; i < fontsizes.length; i++) {
					var selected = fontsizes[i]+'px' == selectedSize; 
					if(selected) {
						$(fontSize).val(fontsizes[i]);
					}				
					$('#sizes').append( '<div id="fontSize' + fontsizes[i] + '" class="singlesize" onmouseout="this.style.backgroundColor=\'#ffffee\'" onmouseover="this.style.backgroundColor=\'#efefff\';" value="' + fontsizes[i] + 'px">' + fontsizes[i] + '</div>');
				}
							
				$('#sizes').css('display','block');
				
				if($('html').hasClass('ie8')) {
					$('#font_size').bind('keypress', function(evt) {
						var e = evt || window.event;
						if(e.keyCode == 13) {
							handleKeyUp(e, 'singlesize', 'font_size', 'sizes', function(rawValue) {						
								selectedSize = rawValue + 'px';
							});
						}
					});
				}
				
				// Add keyup filter
				$('#font_size').unbind('keyup');
				$('#font_size').bind('keyup', function(evt) {	
					var e = evt || window.event;
					handleKeyUp(e, 'singlesize', 'font_size', 'sizes', function(rawValue) {						
						selectedSize = rawValue + 'px';
					});					
				});
				
				// Add click listener so font list is removed if we click outside it, but inside the fontpicker.
				$('.fontpicker').unbind('mouseup');
				$('#font_size').bind('mouseup', function(event) {
					event.stopPropagation();
				});
				
				$('.fontpicker').bind('mouseup', function(event) {
                    if($(event.target).not("[class='']").length > 0 && $(event.target).first().attr('id') == "sizes") {
                        event.stopPropagation();
                    } else {
                        $('#font_size').unbind('keyup');
                        $('#font_size').unbind('keypress');
                        $('#sizes').remove();
                        selectedSize = $('#font_size').val() + 'px';
                        liveUpdate(liveIds);
                        $('#font_size').blur();
                        rebindStopPropagation();
                        event.stopPropagation();
                    }
				});
       				
				$('.singlesize').bind('mouseup', function(event) {
					$('#font_size').unbind('keyup');
					$('#font_size').unbind('keypress');
					$('#font_size').val($(this).text());
					selectedSize = $('#font_size').val() + 'px';
					liveUpdate(liveIds);
					$('#sizes').remove();
					$('#font_size').blur();
					rebindStopPropagation();
					event.stopPropagation();
				});
	
		}
		,
		showFonts : function() {
			index = -1;
			$('#fonts').remove();
			$('#fontbox').append('<div id="fonts" style="display: none; overflow-y: scroll; max-height: 200px;"></div>');
				var fontText = $('#fontbox').find('#font_text');
                var fonts = tsae.callService("getFonts", {"deviceType": tsae.getSA().surfaceType.allowedDevice});
				for(var i = 0; i < fonts.length; i++) {
					var selected = fonts[i].fontFamily == selectedFont;
					if(selected) {
						$(fontText).attr('data-fontFamily', selectedFont);
                        $(fontText).val(selectedFontShortName);
					}
					$('#fonts').append(
                        $("<div/>").
                        prop("id", "fontId" + fonts[i].id).
                        addClass("singlefont").
                        mouseout(
                            function() {
                                this.style.backgroundColor="#ffffee"
                            }
                        ).
                        mouseover(
                            function() {
                                this.style.backgroundColor="#efefff";
                            }
                        ).css("font-family", fonts[i].fontFamily).attr('data-fontId', fonts[i].id).text(fonts[i].fontFamily.split(',')[0]));
				}
							
				$('#fonts').css('display','block');
				
				// Add special hack to support ENTER/RETURN on IE8
				//alert($('html').attr('class'));
				if($('html').hasClass('ie8')) {
					$('#font_text').bind('keypress', function(evt) {
						var e = evt || window.event;
						if(e.keyCode == 13) {
							handleKeyUp(e, 'singlefont', 'font_text', 'fonts', function(rawValue) {						
								selectedFont = rawValue;
								selectedFontShortName = selectedFont.split(',')[0];
							});
						}
					});
				}
							
				// Add keyup filter
				$('#font_text').unbind('keyup');
				$('#font_text').bind('keyup', function(evt) {
					var e = evt || window.event;
					
					handleKeyUp(e, 'singlefont', 'font_text', 'fonts', function(rawValue) {						
						selectedFont = rawValue;
						selectedFontShortName = selectedFont.split(',')[0];
					});					
				});
				
				// Add click listener so font list is removed if we click outside it, but inside the fontpicker.
				$('.fontpicker').unbind('mouseup');
				$('#font_text').bind('mouseup', function(event) {
					event.stopPropagation();
				});
				
				$('.fontpicker').bind('mouseup', function(event) {
					$('#font_text').unbind('keyup');
					$('#font_text').unbind('keypress');
					$('#fonts').remove();
                    selectedFont = $('#font_text').attr('data-fontFamily');
                    // If no font was selected, i.e. user expands dropdown but clicks outside but still within fontpicker,
                    // we will not have a selection and will not update selectedFontShortName (which is still the previous value in this case).
                    if (typeof selectedFont !== 'undefined' && selectedFont != null) {
                    	selectedFontShortName = selectedFont.split(',')[0];
                    }

					liveUpdate(liveIds);
					$('#font_text').blur();
					rebindStopPropagation();
					event.stopPropagation();
				});

				$('.singlefont').bind('mouseup', function(event) {	
					$('#font_text').unbind('keyup');
					$('#font_text').unbind('keypress');
                    var font = tsae.callService("getFont", {"fontId": $(this).attr('data-fontId'),
                        "deviceType": tsae.getSA().surfaceType.allowedDevice});
					selectedFont = font.fontFamily;
					selectedFontShortName = selectedFont.split(',')[0];
                    $('#font_text').attr('data-fontFamily', selectedFont);
                    $('#font_text').val(selectedFontShortName);
					liveUpdate(liveIds);
                    if(selectedFont.split(';')[0] == "Arial, sans-serif" ||
                        tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.TP311X ||
                        tsae.getSA().surfaceType.allowedDevice == tsae.deviceTypes.SW_TP3115_TOUCH) {
                        $("#editfontbtn").button('disable');
                        $("#deletefontbtn").button('disable');
                    } else {
                        $("#editfontbtn").button('enable');
                        $("#deletefontbtn").button('enable');
                    }
					$('#fonts').remove();
					$('#font_text').blur();
					rebindStopPropagation();
					event.stopPropagation();
				});
		},

        updateFontList : function(font) {
            if(typeof font !== 'undefined' && font != null) {
                selectedFont = font;
                liveUpdate(liveIds);
            }
            picker.showFonts();
        },
		
		getValue : function() {
			return selectedFont + ';' + selectedSize + ';' + (isItalic ? 'italic' : 'normal') + ';' + (isBold ? 'bold' : 'normal');
		},
		
		getDisplayText : function() {
			return selectedFontShortName + ' ' + selectedSize;
		},

		getFontFamily : function() {
			return selectedFont;
		},
		
		getFontSize : function() {
			return selectedSize;
		},
		
		getFontStyle : function() {
			return isItalic == true ? 
					'italic' 
					: 
					'normal';
		},
		
		getFontWeight : function() {
			return isBold == true ? 
					'bold' 
					: 
					'normal';
		},
		
		destroy : function() {
			$('body').unbind('mouseup');
			resetToDefaults();
			$('body').find('#fontpicker').remove();
		}
	};
		
})(jQuery);