/**
 * This file keyboard describes shortcut keys
 */
var shortcuts = new function() {
	this.init = function() {

		$(document).bind('keydown', 'del', function() {tsae.deleteSelectedComponent(); return false;});
		$(document).add('input').add('select').bind('keydown', 'ctrl+s', function() {tsae.saveApplication(); return false;});
		$(document).add('input').add('select').bind('keydown', 'ctrl+p', function() {tsae.showPreview(); return false;});
		$(document).add('input').add('select').bind('keydown', 'ctrl+n', function() {dialogs.showNewDialog(); return false;});

		// Moving selected element
		$(document).bind('keyup', 'left', 
				function() {
					if (!$('#property_position_x').is(':disabled')) {
						var newValue = parseInt($('#property_position_x').val());
						if (!isNaN(newValue)) {
							newValue = newValue - tsae.grid();
							$('#property_position_x').val(newValue);
							$('#property_position_x').change();
							return false;
						}
					}
				});

		$(document).bind('keyup', 'right', 
				function() {
					if (!$('#property_position_x').is(':disabled')) {
						var newValue = parseInt($('#property_position_x').val());
						if (!isNaN(newValue)) {
							newValue = newValue + tsae.grid();
							$('#property_position_x').val(newValue);
							$('#property_position_x').change();
							return false;
						}
					}
				});

		$(document).bind('keyup', 'up', 
				function() {
					if (!$('#property_position_y').is(':disabled')) {
						var newValue = parseInt($('#property_position_y').val());
						if (!isNaN(newValue)) {
							newValue = newValue - tsae.grid();
							$('#property_position_y').val(newValue);
							$('#property_position_y').change();
							return false;
						}
					}
				});

		$(document).bind('keyup', 'down', 
				function() {
					if (!$('#property_position_y').is(':disabled')) {
						var newValue = parseInt($('#property_position_y').val());
						if (!isNaN(newValue)) {
							newValue = newValue + tsae.grid();
							$('#property_position_y').val(newValue);
							$('#property_position_y').change();
							return false;
						}
					}
				});

		// Tab between elements
		$(document).bind('keydown', 'n',
				function() {
					var selected = $('.selected_component');
					if (selected.length > 0) {
						// Find next component
						var next = selected.next('.component');
						if (next.length == 0) {
							if (selected.siblings('.component').length > 0) {
								next = selected.siblings('.component').first();
							}
						}
						if (next.length > 0) {
							tsae.focusComponent(next.attr('id'));
							return false;
						}
					}
				});

		$(document).bind('keydown', 'p',
				function() {
					var selected = $('.selected_component');
					if (selected.length > 0) {
						// Find next component
						var previous = selected.prev('.component');
						if (previous.length == 0) {
							if (selected.siblings('.component').length > 0) {
								previous = selected.siblings('.component').last();
							}
						}
						if (previous.length > 0) {
							tsae.focusComponent(previous.attr('id'));
							return false;
						}
					}
				});

	}
};