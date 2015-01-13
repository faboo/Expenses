angular.module('expenses')
.directive('income', function(){
	function controller($scope, $element, bank){
		var dialog = $element.find('dialog')[0];

		function init(){
			var income = bank.getIncome()

			$scope.income =
				{ 0: 0
				, 1: 0
				, 2: 0
				, 3: 0
				}

			income.forEach(function(week){
				$scope.income[week.id] = week.value
			})
		}

		$scope.close = function(){
			init()
			$scope.open = false
			dialog.close()
		}

		$scope.accept = function(){
			bank.putIncome(
				[ {id: '0', value: $scope.income[0]}
				, {id: '1', value: $scope.income[1]}
				, {id: '2', value: $scope.income[2]}
				, {id: '3', value: $scope.income[3]}
				])

			$scope.close()
		}

		$scope.$watch('open', function(open){
			if(open){
				init()
				dialog.showModal()
			}
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'Income.html'
		, scope:
			{ open: '='
			}
		, controller: controller
		})
})
