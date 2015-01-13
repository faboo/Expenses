angular.module('expenses').directive('offclick', function(){
	function controller($scope, $element, $parse){
		var callback = $parse($element.attr('offclick'))

		$(window).click(function (event){
			if($element.is(':visible')){
				var within = false
				var ancestors = $(event.target).parents()

				for(var ancestor = 0; !within && ancestor < ancestors.length; ancestor += 1)
					if(ancestors[ancestor] === $element[0])
						within = true

				if(!within)
					$scope.$applyAsync(function(){
						callback($scope)
					})
			}
		})
	}

	return (
		{ restrict: 'A'
		, controller: controller
		})
})
