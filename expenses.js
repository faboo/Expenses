angular.module('expenses').directive('expenses', function(){
	function controller($scope, bank, copycsv, sorter, Expense, Category, Adjustment, Anticipated){
		var categoryOff
		var expenseOff
		var incomeOff
		var expenses = { }
		var categories = { }
		var autoCategories = []
		var startDate
		var endDate
		var anticipated = []
		
		var summed = false

		$scope.expenseList = []
		$scope.hiddenCategories = []
		$scope.spent = 0
		$scope.budget = 0
		$scope.revenue = 0
		$scope.total = 0
		$scope.menuItem = null
		$scope.openCategory = false
		$scope.showHidden = false
		$scope.income = { }

		function resetExpenses(){
			startDate = dates.startDate($scope.year, $scope.month, $scope.week)
			endDate = dates.endDate($scope.year, $scope.month, $scope.week)

			expenses = { }
			fn.forIn(
				function (category){
					category.expenses = []
				},
				categories)
			$scope.expenseList = []
			$scope.spent = 0
			$scope.budget = 0
			$scope.revenue = 0
			$scope.total = 0
			$scope.income = bank.getIncome($scope.week.index).value
			setExpenseList()
			bank.repeatExpenses($scope.year, $scope.month.number - 1, $scope.week.index)
		}

		function setExpenseList(){
			$scope.expenseList = sorter.sort(
				fn.values(categories)
				.filter(fn(fn.not, fn.prop('hide')))
				.filter(function(cat){ return fn.isNumber(cat.budget)||cat.expenses.length })
				.concat(
					fn.values(expenses).filter(fn(fn.not, fn.prop('category'))))
				)
			$scope.spent = -$scope.expenseList
				.filter(fn(fn.not, fn.is(Anticipated)))
				.pluck('amount')
				.filter(fn.less.flip(0))
				.reduce(fn.add, 0)
			$scope.revenue = $scope.expenseList
				.filter(fn(fn.not, fn.is(Anticipated)))
				.pluck('amount')
				.filter(fn.greater.flip(0))
				.reduce(fn.add, 0)
			$scope.budget = $scope.expenseList
				.pluck('budget')
				.filter(fn.id)
				.reduce(fn.add, 0)
			$scope.anticipated = $scope.expenseList
				.filter(fn.is(Anticipated))
				.pluck('amount')
				.reduce(fn.add, 0)

			anticipated = $scope.expenseList.filter(fn.is(Anticipated))

			if(summed)
				bank.putTotal(
					$scope.year,
					$scope.month.number - 1,
					$scope.week.index,
					$scope.revenue + $scope.income,
					$scope.spent)

			$scope.hiddenCategories = fn.values(categories).filter(fn.prop('hide'))

			$scope.$applyAsync(function(){
				copycsv.copyExpenses($scope.expenseList)
			})

			try{
				$scope.$digest()
			}
			catch(ex){ }
		}

		function processCategories(expense){
			var bestCategory = null
			var longestDesc = false
			var closestAmount = false

			autoCategories.forEach(function(category){
				var desc = false
				var amt = false

				if(category.descriptionTest
					&& expense.description.contains(category.descriptionTest))
					desc = category.descriptionTest.length
				if(category.amountTest
					&& Math.abs(expense.amount - category.amountTest) < expense.amount*.1)
					amt = Math.abs(expense.amount - category.amountTest)

				if((!category.descriptionTest
					|| desc && desc > longestDesc)
					&& (!category.amountTest || amt)){

					bestCategory = category
					longestDesc = desc
					closestAmount = amt
				}
			})

			if(bestCategory && bestCategory.description !== expense.category){
				if(expense.category && categories[expense.category])
					categories[expense.category].removeExpense(expense)
				
				expense.category = bestCategory.description
				bank.put(expense)
			}
		}

		function checkAnticipated(expense){
			var found = anticipated.find(
				fn(fn.eq(expense.amount), fn.prop('amount')))

			if(found)
				bank.removeAnticipated(found)
		}

		bank.onInitialized(function(){
			summed = false

			categoryOff = bank.categories(true).onValue(function(category){
				if(category['delete'])
					delete categories[category.id]
				else if(categories[category.id])
					categories[category.id] = 
						fn.assign(category, fn.pick(['expenses'], categories[category.id]))
				else
					categories[category.id] = category

				autoCategories = fn.values(categories).filter(fn.prop('auto'))

				fn.values(expenses).forEach(processCategories)
				setExpenseList()
			})

			expenseOff = bank.expenses()
			.filter(function(expense){
				if(expense.end){
					bank.putTotal(
						expense.year,
						expense.month,
						expense.week,
						$scope.revenue + $scope.income,
						$scope.spent)

					summed = true

					return false
				}
				else if(expense['delete']){
					if(expense.id in expenses){
						if(expenses[expense.id].category in categories)
							categories[expenses[expense.id].category].expenses

						delete expenses[expense.id]
					}

					$scope.$applyAsync(setExpenseList)

					return false
				}

				return true
			})
			.filter(function(expense){
				return (expense.date >= startDate || expense instanceof Anticipated)
					&& expense.date <= endDate
			})
			.filter(function(expense){
				return !expense.type.contains("TRANSFER")
			})
			.onValue(function(expense){
				var oldCategory = expenses[expense.id]? expenses[expense.id].category : null

				expenses[expense.id] = expense
				
				checkAnticipated(expense)
				processCategories(expense)

				if(oldCategory && categories[oldCategory] && expense.category !== oldCategory)
					categories[oldCategory].removeExpense(expense)

				if(expense.category){
					if(!categories[expense.category]){
						categories[expense.category] = new Category()
						categories[expense.category].id = expense.category
					}

					categories[expense.category].addExpense(expense)
				}

				setExpenseList()
			})

			incomeOff = bank.income()
			.onValue(function(income){
				if(income.id === $scope.week)
					$scope.$applyAsync(function(){
						$scope.income = income.value
					})
			})
		})

		$scope.openMenu = function($event, expense){
			$scope.menuLeft = $event.clientX
			$scope.menuTop = $event.clientY
			$scope.menuItem = expense
		}

		$scope.onDrop = function($event, $data){
			function saveCategory(category){
				if(to !== category)
					add.push(to)

				add.forEach(function(expense){
					expense.category = category.description
				})

				bank.put(add)
			}
			var add = expenses[$data] || categories[$data]
			var to = expenses[$event.currentTarget.dataset['id']]
				|| categories[$event.currentTarget.dataset['id']]

			if(add instanceof Category)
				add = add.expenses
			else
				add = [add]

			if(to instanceof Category){
				saveCategory(to)
			}
			else{
				$scope.openCategory = true
				$scope.saveCategory = saveCategory
			}
		}

		$scope.canCategorize = function(){
			return !($scope.menuItem instanceof Category || $scope.menuItem instanceof Anticipated)
		}

		$scope.categorize = function(){
			var expense = null
			
			if($scope.menuItem instanceof Category){
				$scope.editCategory = $scope.menuItem
			}
			else{
				expense = $scope.menuItem
				$scope.editCategory = null
			}

			$scope.menuItem = null
			$scope.openCategory = true

			$scope.saveCategory = function(category){
				if(expense){
					expense.category = category.description
					bank.put(expense)
				}
				else{
					categories[category.description] = category
				}
			}
		}

		$scope.canTrend = function(){
			return $scope.menuItem instanceof Category
		}

		$scope.canRemove = function(){
			return $scope.menuItem instanceof Category || $scope.menuItem instanceof Adjustment || $scope.menuItem instanceof Anticipated
		}

		$scope.remove = function(){
			var item = $scope.menuItem

			$scope.menuItem = null
			if(item instanceof Category){
				item.expenses.forEach(function(expense){
					expense.category = null
				})
				bank.put(item.expenses)
				bank.removeCategory(item)
			}
			else if(item instanceof Adjustment){
				bank.removeAdjustment(item)
			}
			else if(item instanceof Anticipated){
				bank.removeAnticipated(item)
			}
		}

		$scope.canEdit = function(){
			return $scope.menuItem instanceof Category || $scope.menuItem instanceof Adjustment || $scope.menuItem instanceof Anticipated
		}

		$scope.edit = function(){
			var expense = null
			
			if($scope.menuItem instanceof Category){
				$scope.editCategory = $scope.menuItem
				$scope.openCategory = true

				$scope.saveCategory = function(category){
					categories[category.description] = category
				}
			}
			else if($scope.menuItem instanceof Adjustment){
				$scope.editAdjustment = $scope.menuItem
			}
			else{
				$scope.editAnticipated = $scope.menuItem
			}

			$scope.menuItem = null
		}

		$scope.removeCategory = function(expense){
			categories[expense.category].removeExpense(expense)
			bank.put(expense)
		}

		$scope.expandHidden = function(){
			$scope.showHidden = !$scope.showHidden
		}

		$scope.showCategory = function(category){
			return category.expenses.length || !category.weeks || $scope.showHidden || category.weeks.contains($scope.week)
		}

		$scope.categoryLate = function(category){
			var late = false

			if(category.expenses.length && category.weeks){
				late = !category.weeks.contains($scope.week.index)
			}

			return late
		}

		$scope.overBudget = function(expense){
			return expense.budget? (-expense.amount) > expense.budget : false
		}

		$scope.$watchGroup(['year', 'month', 'week'], resetExpenses)

		$scope.$on('$destroy', function(){
			categoryOff()
			expenseOff()
			incomeOff()
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'Expenses.html'
		, controller: controller
		, scope:
			{ year: '='
			, month: '='
			, week: '='
			}
		})
})
