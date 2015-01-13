angular.module('expenses').service('copy', function($timeout){
	var copyText = ""
	var clipboard

	if($('#clipboard-container').length === 0){
		$('body').append('<textarea id="clipboard-container"></textarea>')
	}

	clipboard = $('#clipboard-container')
	clipboard.hide()

	$(document).keydown(function(event){
		if((event.ctrlKey || event.metaKey)
			&& !$(event.target).is('input:visible, textarea:visible')
			&& !window.getSelection().toString()){

			$timeout(
				function(){
					clipboard.val(copyText).show().focus().select()
				},
				0,
				false)
		}
	})
	clipboard.focusout(function(){
		clipboard.hide()
	})
	$(document).keyup(function(event){
		clipboard.hide()
	})

	return (
		{ setText:
			function(text){
				copyText = text
			}
		})
})
