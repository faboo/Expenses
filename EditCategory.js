angular.module('expenses')
.directive('editCategory', function(){
	function controller($scope, $element, bank, Category){
		var dialog = $element.find('dialog')[0];
		var categoryOff

		$scope.categories = []
		$scope.weeks =
			[ {name: 'Week 1', value: 0}
 			, {name: 'Week 2', value: 1}
 			, {name: 'Week 3', value: 2}
 			, {name: 'Week 4', value: 3}
			]

		function init(){
			$scope.setup =
				{ id: ""
				, budget: null
				, hide: false
				, auto: false
				, descriptionTest: null
				, amountTest: null
				, weeks: []
				}
		}

		function load(category){
			$scope.setup = fn.pick(
				[ 'id'
				, 'budget'
				, 'hide'
				, 'auto'
				, 'descriptionTest'
				, 'amountTest'
				, 'order'
				, 'weeks'],
				category)
		}

		categoryOff = bank.categories()
			.map(function(category){return category.id})
			.onValue(function(category){
				$scope.$applyAsync(function(){
					$scope.categories = $scope.categories.cons(category).uniq()
				})
			})

		init()

		$scope.close = function(){
			init()
			$scope.open = false
		}

		$scope.accept = function(){
			if(!$scope.category){
				$scope.category = bank.getCategory($scope.setup.id)
			}
			else{
				$scope.category.timestamp = Date.now()
			}

			fn.assign($scope.category, $scope.setup)
			$scope.category.expenses.forEach(function(expense){
				expense.category = $scope.category.id
			})
			bank.putCategory($scope.category)
			$scope.save({category: $scope.category})
			$scope.close()
		}

		$scope.$watch('open', function(open){
			if(open){
				dialog.showModal()
				if($scope.category)
					load($scope.category)
			}
			else if(dialog.open){
				dialog.close()
			}
		})

		$scope.$watch('setup.id', function(id){
			if($scope.categories.contains(id)){
				$scope.category = bank.getCategory($scope.setup.id)

				load($scope.category)
			}
		})

		$scope.$on('$destroy', function(){
			categoryOff()
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'EditCategory.html'
		, scope:
			{ category: '='
			, open: '='
			, save: '&'
			}
		, controller: controller
		})
})
