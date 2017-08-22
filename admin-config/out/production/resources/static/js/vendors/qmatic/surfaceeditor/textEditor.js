var textEditor = (function($) {

    // store initial value to be able to undo
    var initMetadata = {};
    var textElementToEdit;
    var colorPicker;

    var template = '<div id="textEditor" class="texteditor">' +
        '<table class="dr-table" style="width: 100%;">' +
            '<tr id="textEditorText" class="dr-table-row">' +
            '</tr>' +
            '<tr id="textEditorColor" class="property dr-table-row">' +
            '</tr>' +
            '<tr id="textEditorTextPosition" class="property dr-table-row">' +
            '</tr>' +
            '<tr id="textEditorFont" class="property dr-table-row">' +
            '</tr>' +
            '<tr id="textEditorTextAlign" class="property dr-table-row">' +
            '</tr>' +
        '</table>' +
        '<div id="textEditorButtons">' +
        // Buttons here
        '</div>' +
        '</div>';

    var userCallbacks = {};

    function addTranslatedElements() {
        $('#textEditorText').html('<td class="dr-table-cell">' + translate.msg("info_text") + '</td>' +
            '<td class="dr-table-cell"><input type="text" id="textEditorTextInput"></input></td>');
        $('#textEditorColor').html('<td class="dr-table-cell">' + translate.msg("info_text_color") + '</td>' + '<td class="dr-table-cell"><div class="colorInput" id="textEditorColorText">' + '&nbsp;' + '</div></td>');
        $('#textEditorTextPosition').html('<td class="dr-table-cell">' + translate.msg("info_text_position") + '</td>' + '<td class="dr-table-cell">' +
            translate.msg("info_text_position_top") + '<br/><input type="text" id="textEditor_property_text-position_top" class="positive-integer"></input><br/>' +
            translate.msg("info_text_position_left")+ '<br/><input type="text" id="textEditor_property_text-position_left" class="positive-integer"></input></td>');
        $("#textEditorFont").html('<td class="dr-table-cell">' + translate.msg("info_font") + '</td>' +
            '<td class="dr-table-cell image_input_table_data"><span id="textEditor_font_preview"></span><button class="fontInput" id="textEditor_property_font_button">' + translate.msg("info_edit") + ' </button></td>');
        $("#textEditorTextAlign").html('<td class="dr-table-cell">' + translate.msg("info_text_align") + '</td>' +
            '<td class="dr-table-cell">' +
            '<select id="textEditor_property_text-align_select">' +
                '<option value="left">' + translate.msg("info_text_align_left") + '</option>' +
                '<option value="right">' + translate.msg("info_text_align_right") + '</option>' +
                '<option value="center">' + translate.msg("info_text_align_center") + '</option>' +
                '<option value="justify">' + translate.msg("info_text_align_justify") + '</option>' +
            '</select>' +
            '</td>)');

        $('#textEditorButtons').html('<button id="textEditorOk">' + translate.msg('info_button_apply') + '</button><button id="textEditorCancel">' + translate.msg('info_button_cancel') + '</button>');
        // Make the buttons jQuery UI buttons.
        $('#textEditor_property_font_button').button({
            text:true
        });
        $('#textEditorOk').button({
            text:true
        });
        $('#textEditorCancel').button({
            text:true
        });
    }

    function apply() {
        userCallbacks.onSubmit();
        destroyDialogs();
    }

    function destroyDialogs() {
        colorPicker.ColorPickerDestroy();
        textEditor.destroy();
    }

    /**
     * Reset all fields of the picker to the ones stored when we created the picker instance.
     */
    function undo() {        // If the "undo" value is OK, use that. Otherwise, restore to defaults.
        textElementToEdit.text(initMetadata['text']);
        textElementToEdit.css('color', initMetadata['color']);
        textElementToEdit.css('left', initMetadata['left']);
        textElementToEdit.css('top', initMetadata['top']);
        textElementToEdit.css('font-family', initMetadata['font-family']);
        textElementToEdit.css('font-size', initMetadata['font-size']);
        textElementToEdit.css('font-style', initMetadata['font-style']);
        textElementToEdit.css('font-weight', initMetadata['font-weight']);
        textElementToEdit.css('text-align', initMetadata['text-align']);
    }

    function setElmtText(elmt, text) {
        elmt.text(text);
    }

    return {
        init : function(textElement, drawLocation, onSubmitCallback) {
            textElementToEdit = textElement;
            userCallbacks.onSubmit = onSubmitCallback;

            // Remove any text editors in the DOM
            $('body').find('#textEditor').remove();

            $('body').append(template);
            addTranslatedElements();

            // Position of the text editing dialog
            $('#textEditor').css('top', drawLocation.top - 245);
            if (tsae.isRTL()) {
                $('#textEditor').css('left', drawLocation.left - 320);
            } else {
                $('#textEditor').css('left', drawLocation.left);
            }

            // Attach font picker
            $('#textEditor_property_font_button').click(
                function() {
                    var selectedComponentTextElement = $('#' + textElement.attr('id'));
                    var fontFamily = selectedComponentTextElement.css('font-family');
                    var fontSize = selectedComponentTextElement.css('font-size');
                    var fontStyle = selectedComponentTextElement.css('font-style');
                    var fontWeight = selectedComponentTextElement.css('font-weight');

                    picker.init($(this), fontFamily + ';' + fontSize + ';' + fontStyle + ';' + fontWeight, [textElement.attr('id')], null, function() {
                        // Mark dirty and set preview text
                        $('#textEditor_font_preview').text(picker.getDisplayText());
                    });
                }
            );

            // Attach color picker to text color field
            colorPicker = $('#textEditorColorText').ColorPicker({
                onSubmit: function(hsb, hex, rgb, el) {
                    $(el).css('background-color', '#' + hex);
                    $(el).css('background-image', '');
                    $(el).ColorPickerHide();
                    $(el).change();
                },
                onBeforeShow: function () {
                    $(this).ColorPickerSetColor(properties.rgbToHex($(this).css('background-color')));
                },
                'custom_id' : 'extended_button'
            });

            $('.colorpicker_submit').button({
                label : translate.msg('info_button_ok')
            });

            $(document).bind('click.texteditor', function(event) {
                 if(($(event.target).parents().index($('.texteditor')) == -1) && $(event.target).parents().index($('#' + $(colorPicker).data('colorpickerId'))) == -1) {
                     if($('.texteditor').is(':visible') && !$('.colorpicker').is(':visible') && !$('.fontpicker').is(':visible')) {
                         apply();
                     }
                 }
             });

            // Ok and Cancel button click listeners
            $('#textEditorOk').click(function() {
                apply();
            });

            $('#textEditorCancel').click(function() {
                undo();
                destroyDialogs();
            });

            // Text editor properties below

            // text input
            var textEditorText = $('#textEditorTextInput');
            // Clear attributes
            textEditorText.unbind('change');
            textEditorText.change(
                function(evt) {
                    setElmtText(textElement, textEditorText.val());
                }
            );

            textEditorText.val(textElement.text());
            initMetadata['text'] = textElement.text();
            // NSD-4082
            textEditorText.blur();
            // end text input

            // text color
            var propertyColorText = $('#textEditorColorText');
            propertyColorText.unbind('change');
            propertyColorText.change(
                function(evt) {
                    var color = propertyColorText.css('background-color');
                    if (properties.checkIfHexColor(color)) {
                        textElement.css('color', properties.addLeadingHash(color));
                    } else {
                        textElement.css('color', color);
                    }
                }
            );
            propertyColorText.css('background-color', '#' + properties.rgbToHex(textElement.css('color')));
            initMetadata['color'] = textElement.css('color');
            // end text color

            // text position
            var propertyTextPositionLeft = $('#textEditor_property_text-position_left');
            var propertyTextPositionTop = $('#textEditor_property_text-position_top');

            propertyTextPositionLeft.unbind('change');
            propertyTextPositionTop.unbind('change');
            propertyTextPositionLeft.change(
                function(evt) {
                    properties.setupElementCssPxAttr(
                        textElement,
                        'left',
                        propertyTextPositionLeft.val());
                }
            );
            propertyTextPositionTop.change(
                function(evt) {
                    properties.setupElementCssPxAttr(
                        textElement,
                        'top',
                        propertyTextPositionTop.val());
                }
            );
            propertyTextPositionLeft.val(parseInt(textElement.css('left')));
            propertyTextPositionTop.val(parseInt(textElement.css('top')));
            initMetadata['left'] = textElement.css('left');
            initMetadata['top'] = textElement.css('top');
            // end text position

            // text font
            var propertyFontText = $('#textEditor_property_font_button');
            propertyFontText.unbind('change');
            propertyFontText.change(
                function(evt) {
                    textElement.css('font-family', propertyFontText.val());
                }
            );
            propertyFontText.val(textElement.css('font-family'));
            initMetadata['font-family'] = textElement.css('font-family');
            initMetadata['font-size'] = textElement.css('font-size');
            initMetadata['font-style'] = textElement.css('font-style');
            initMetadata['font-weight'] = textElement.css('font-weight');

            // Update the preview next to the button.
            $('#textEditor_font_preview').text(propertyFontText.val().split(',')[0] + ' ' + textElement.css('font-size'));
            // end text font

            // text align
            var propertyTextAlignSelect = $('#textEditor_property_text-align_select');
            propertyTextAlignSelect.unbind('change');
            propertyTextAlignSelect.change(
                function(evt) {
                    textElement.css('text-align', propertyTextAlignSelect.val());
                }
            );
            propertyTextAlignSelect.val(textElement.css('text-align'));
            initMetadata['text-align'] = textElement.css('text-align');
            // end text align
        },

        destroy : function() {
            // remove all click handlers associated with our namespace only (so we don't disturb other click handlers in document
            $(document).unbind('click.texteditor');
            //resetToDefaults();
            $('body').find('#textEditor').remove();
        }
    };

})(jQuery);