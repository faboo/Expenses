angular.module('expenses').directive('trendChart', function(){
	function controller($scope, $element, dates, bank){
		var canvas = $element.find('canvas')
		var chart

		function setWidth(){
			canvas.attr('width', $element.innerWidth())
			canvas.attr('height', $element.innerHeight())
		}

		function createData(){
			var empty = fn.repeat(12*4, null)
			var category = bank.getCategory($scope.category)
			var averageLine = 0
			var labels = []
			var weekData = []
			var monthData = []
			var budgetData = empty.slice()
			var averageData = empty.slice()
			var weeks =
				{ label: $scope.category + ' by Week'
				, fillColor: "rgba(151,187,205,0.2)"
            	, strokeColor: "rgba(151,187,205,1)"
            	, pointColor: "rgba(151,187,205,1)"
				, pointStrokeColor: "#fff"
				, pointHighlightFill: "#fff"
				, pointHighlightStroke: "rgba(151,187,205,1)"
				, data: weekData
				}
			var months =
				{ label: $scope.category + ' by Month'
				, fillColor: "rgba(220,220,220,0.2)"
				, strokeColor: "rgba(220,220,220,1)"
				, pointColor: "rgba(220,220,220,1)"
				, pointStrokeColor: "#fff"
				, pointHighlightFill: "#fff"
				, pointHighlightStroke: "rgba(220,220,220,1)"
				, data: monthData
				}
			var budget =
				{ label: 'Budget Level'
				, fillColor: "rgba(0, 0, 0, 0)"
				, strokeColor: "rgba(20, 20, 20, 1)"
				, pointColor: "rgba(0, 0, 0, 0)"
				, pointStrokeColor: "rgba(0, 0, 0, 0)"
				, pointHighlightFill: "rgba(0, 0, 0, 0)"
				, pointHighlightStroke: "rgba(0, 0, 0, 0)"
				, data: budgetData
				}
			var average =
				{ label: 'Average'
				, fillColor: "rgba(0, 0, 0, 0)"
				, strokeColor: "rgba(127, 234, 127, 1)"
				, pointColor: "rgba(0, 0, 0, 0)"
				, pointStrokeColor: "rgba(0, 0, 0, 0)"
				, pointHighlightFill: "rgba(0, 0, 0, 0)"
				, pointHighlightStroke: "rgba(0, 0, 0, 0)"
				, data: averageData
				}
			var setup =
				{ labels: labels
				, datasets: [average, weeks]
				}

			dates.months.forEach(function(month){
				var total = 0

				dates.weeks[month.days].forEach(function(week){
					var amount = 
						- ($scope.data[(month.number)+'/'+week.index] || [])
						.map(fn.prop('amount'))
						.reduce(fn.add, 0)
					labels.push(month.name + ' - Week ' + (week.index + 1))
					weekData.push(amount)
					monthData.push(null)
					total += amount
				})

				monthData[monthData.length - 2] = total
				averageLine += total
			})

			averageLine = averageLine / Object.keys($scope.data).length
			averageData[0] = averageLine
			averageData[budgetData.length - 1] = averageLine

			if(category && fn.isNumber(category.budget)){
				budgetData[0] = category.budget
				budgetData[budgetData.length - 1] = category.budget

				setup.datasets.unshift(budget)
			}

			return setup
		}

		function drawChart(){
			var context = canvas.get(0).getContext("2d")

			if(chart){
				chart.clear()
				chart.destroy()
				setWidth()
			}

			if($scope.data)
				chart = new Chart(context).Line(createData())
		}

		$scope.$watch('data', drawChart)

		// TODO: turn off
		$(window).resize(setWidth)
		setWidth()
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'TrendChart.html'
		, controller: controller
		, scope:
			{ data: '='
			, category: '='
			}
		})
})

