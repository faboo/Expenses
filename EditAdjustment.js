angular.module('expenses')
.directive('editAdjustment', function(){
	function controller($scope, $element, bank, Adjustment){
		var dialog = $element.find('dialog')[0];

		function init(){
			$scope.setup =
				{ description: ""
				, date: $scope.date
				, amount: 0
				}
		}

		$scope.close = function(){
			init()
			$scope.open = false
		}

		$scope.accept = function(){
			if(!$scope.adjustment)
				$scope.adjustment = new Adjustment()

			fn.assign($scope.adjustment, $scope.setup)
			bank.putAdjustment($scope.adjustment)
			$scope.save({adjustment: $scope.adjustment})
			$scope.close()
		}

		$scope.$watch('open', function(open){
			if(open){
				init()
				dialog.showModal()
				if($scope.adjustment)
					$scope.setup = fn.pick(
						['description', 'date', 'amount'],
						$scope.adjustment)
					/*
					$scope.setup = _.pick(
						$scope.adjustment,
						'description',
						'date',
						'amount')
					*/
			}
			else if(dialog.open){
				dialog.close()
			}
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'EditAdjustment.html'
		, scope:
			{ adjustment: '='
			, open: '='
			, date: '='
			, save: '&'
			}
		, controller: controller
		})
})
