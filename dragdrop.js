angular.module('expenses').directive('draggable', function(){
	function controller($scope, $element, $parse){
		var draggable = $parse($element.attr('draggable'))($scope)

		if(draggable){
			var data = $parse($element.attr('drag-data'))

			$element.on('dragstart', function(event){
				var dataTransfer = event.originalEvent.dataTransfer

				$element.addClass('dragging')
				dataTransfer.effectAllowed = 'move'
				dataTransfer.setDragImage($element[0], 5, 5);
				dataTransfer.setData('application/json', JSON.stringify(data($scope)))
			})
			$element.on('dragend', function(event){
				$element.removeClass('dragging')
			})
		}
	}

	return (
		{ restrict: 'A'
		, controller: controller
		})
})
.directive('dropTarget', function(){
	function controller($scope, $element, $parse){
		var dropTarget = $parse($element.attr('drop-target'))($scope)

		if(dropTarget){
			var onDrop = $parse($element.attr('on-drop'))

			$element.on('dragover', function(event){
				var dataTransfer = event.originalEvent.dataTransfer
				$element.addClass('dropHover')
				dataTransfer.dropEffect = 'move'
				if(dataTransfer.types.contains('application/json'))
					event.preventDefault()
			})
			$element.on('mouseleave dragleave', function(event){
				if($element.is('.dropHover'))
					$element.removeClass('dropHover')
			})
			$element.on('drop', function(event){
				var dataTransfer = event.originalEvent.dataTransfer
				var data = JSON.parse(dataTransfer.getData('application/json'))
				$element.removeClass('dropHover')

				$scope.$applyAsync(function(){
					onDrop($scope, {$event: event, $data: data})
				})
			})
		}
	}

	return (
		{ restrict: 'A'
		, controller: controller
		})
})
