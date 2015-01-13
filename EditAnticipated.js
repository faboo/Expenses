angular.module('expenses')
.directive('editAnticipated', function(Anticipated){
	function controller($scope, $element, bank, Adjustment){
		var dialog = $element.find('dialog')[0];

		function init(){
			$scope.setup =
				{ description: ""
				, check: false
				, amount: 0
				}
		}

		$scope.close = function(){
			$scope.open = false
		}

		$scope.accept = function(){
			if(!$scope.anticipated)
				$scope.anticipated = new Anticipated($scope.setup)
			else
				fn.assign($scope.anticipated, $scope.setup)

			bank.putAnticipated($scope.anticipated)
			$scope.save({anticipated: $scope.anticipated})
			$scope.close()
		}

		$scope.$watch('open', function(open){
			if(open){
				init()
				dialog.showModal()
				if($scope.anticipated)
					$scope.setup = fn.pick(
						['description', 'amount', 'check'],
						$scope.adjustment)
					/*
					$scope.setup = _.pick(
						$scope.anticipated,
						'description',
						'amount',
						'check')
					*/
			}
			else if(dialog.open){
				dialog.close()
			}
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'EditAnticipated.html'
		, scope:
			{ anticipated: '='
			, open: '='
			, save: '&'
			}
		, controller: controller
		})
})
