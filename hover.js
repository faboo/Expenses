angular.module('expenses').directive('hover', function(){
	function controller($scope, $element, $parse){
		var variable = $parse($element.attr('hover')).assign

		$element.mouseenter(function (event){
			$scope.$applyAsync(function(){
				variable($scope, true)
			})
		})
		$element.mouseleave(function (event){
			$scope.$applyAsync(function(){
				variable($scope, false)
			})
		})
	}

	return (
		{ restrict: 'A'
		, controller: controller
		})
})

