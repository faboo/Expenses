angular.module('expenses').directive('dateRange', function(){
	function controller($scope, dates, $state){
		//var today = new Date()

		$scope.weeks = dates.weeks
		$scope.months = dates.months
		//_.assign($scope, dates.today())

		function setDate(){
			var start = new Date(
				$scope.year,
				$scope.month.number - 1,
				$scope.week.start)
			var end = new Date(
				$scope.year,
				$scope.month.number - 1,
				$scope.week.end)

			if(end.getMonth() !== $scope.month.number - 1)
				end.setDate(end.getDate() - 1)

			$scope.start = dates.startDate($scope.year, $scope.month, $scope.week)
			$scope.end = dates.endDate($scope.year, $scope.month, $scope.week)
		}

		$scope.select = function(week){
			$state.go(
				'expenseList',
				{year: $scope.year, month: $scope.month.number, week: week.index},
				{reloadOnSearch: true})
		}

		$scope.prevWeek = function(){
			var date = dates.prevWeek($scope.year, $scope.month, $scope.week)

			$state.go(
				'expenseList',
				{year: date.year, month: date.month.number, week: date.week.index},
				{reloadOnSearch: true})
		}

		$scope.nextWeek = function(){
			var date = dates.nextWeek($scope.year, $scope.month, $scope.week)

			$state.go(
				'expenseList',
				{year: date.year, month: date.month.number, week: date.week.index},
				{reloadOnSearch: true})
		}

		$scope.$watch('month', function(month){
			setDate()
		})
		$scope.$watch('week', function(){
			setDate()
		})
		$scope.$watch('year', function(){
			setDate()
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'DateRange.html'
		, controller: controller
		, scope:
			{ year: '='
			, month: '='
			, week: '='
			}
		})
})
