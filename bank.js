angular.module('expenses')
.service('bank', function(data, dates, Expense, Category, Adjustment, Anticipated, CarryOver){
	function splitCsvLine(line){
		function takeCell(){
			var stopChar
			var stopCharIndex
			var cell

			if(line[0] === '"' || line[0] === '\''){
				stopChar = line[0]
				line = line.substr(1)
				stopCharIndex = line.indexOf(stopChar)
				cell = line.substr(0, stopCharIndex)
				line = line.substr(stopCharIndex + 1)

				if(line[0] === ',' || line[0] === '\n')
					line = line.substr(1)
			}
			else{
				stopCharIndex = line.indexOf(',')

				if(stopCharIndex > -1){
					cell = line.substr(0, stopCharIndex)
					line = line.substr(stopCharIndex + 1)
				}
				else{
					cell = line
					line = ""
				}
			}

			return cell
		}
		var cells = []
		
		while(line.length)
			cells.push(takeCell(line))

		return cells
	}
	function initialize(){
		var today = dates.today()
		data.all('category').map(function(category){
				return new Category(category)
			})
			.forEach(categoryBus.push.bind(categoryBus))

		expenseBus.plug(data.change('expense').map(function(ex){
			return ex['delete']? ex : new Expense(ex)
		}))
		expenseBus.plug(data.change('adjustment').map(function(adj){
			return adj['delete']? adj : new Adjustment(adj)
		}))
		expenseBus.plug(data.change('anticipated').map(function(ant){
			return ant['delete']? ant : new Anticipated(ant)
		}))
		categoryBus.plug(data.change('category').map(function(cat){
			return cat['delete']? cat : new Category(cat)
		}))
		incomeBus.plug(data.change('income'))

		repeatExpenses(today.year, today.month.number - 1, today.week.index)

		initHandlers.forEach(function(handler){
			handler()
		})
	}
	function repeatExpenses(year, month, week){
		var prevWeek = dates.prevWeek(year, month, week)
		expenseBus.push(getTotal(prevWeek.year, prevWeek.month.number - 1, prevWeek.week.index))

		if(!fn.isNumber(month))
			month = month.number - 1
		if(!fn.isNumber(week))
			week = week.index

		data.all('expense', {year: year, month: month})
			.map(function(expense){
				return new Expense(expense)
			})
			.forEach(expenseBus.push.bind(expenseBus))
		data.all('adjustment', {year: year, month: month})
			.map(function(adjustment){
				return new Adjustment(adjustment)
			})
			.forEach(expenseBus.push.bind(expenseBus))
		data.all('anticipated')
			.map(function(anticipated){
				return new Anticipated(anticipated)
			})
			.forEach(expenseBus.push.bind(expenseBus))

		expenseBus.push({end: true, year: year, month: month, week: week})
	}
	function putExpense(expense){
		if(expense instanceof Category)
			throw Error('Can\'t save categories with putExpense')
		if(expense.id.contains('ADJ'))
			throw Error('Can\'t save adjustments with putExpense')
		if(!Array.isArray(expense))
			expense = [expense]

		data.put('expense', expense)
	}
	function putAdjustment(adjustment){
		if(adjustment instanceof Category)
			throw Error('Can\'t save categories with putAdjustment')
		if(!adjustment.id.contains('ADJ'))
			throw Error('Can\'t save expenses with putAdjustment')
		if(!Array.isArray(adjustment))
			adjustment = [adjustment]

		data.put('adjustment', adjustment)
	}
	function putAnticipated(anticipated){
		if(anticipated instanceof Category)
			throw Error('Can\'t save categories with putAnticipated')
		if(!anticipated.id.contains('ANT'))
			throw Error('Can\'t save expenses with putAnticipated')
		if(!Array.isArray(anticipated))
			anticipated = [anticipated]

		data.put('anticipated', anticipated)
	}
	function putCategory(category){
		if(!(category instanceof Category))
			throw Error('Can\'t save expenses with putCategory')
		data.put('category', category)
	}
	function getTotal(year, month, week){
		var id = year+'-'+month+'-'+week
		var date = { year: year, month: month, week: week }

		return data.has('total', id)
			? new CarryOver(fn.assign(data.get('total', id, true), date))
			: new CarryOver(date)
	}

	var initHandlers = []
	var categoryBus = new Bacon.Channel(true)
	var categories = categoryBus
	var expenseBus = new Bacon.Bus()
	var expenses = expenseBus
	var incomeBus = new Bacon.Bus()
	var income = incomeBus

	initialize()

	return (
		{ initialized:
			function(){
				return true
			}
		, onInitialized:
			function(handler){
				if(this.initialized())
					handler()
				else
					initHandlers.push(handler)
			}
		, parseStatement:
			function(text){
				return text.split(/\n/)
					.slice(4)
					.filter(function(line){ return !/^\s*$/.exec(line) })
					.map(function(line){
						return new Expense(splitCsvLine(line))
					})
			}
		, pushStatement:
			function(statement){
				statement.forEach(function(expense){
					if(data.has('expense', expense.id)){
						var old = data.get('expense', expense.id)

						if(old)
							expense.category = old.category
					}
				})
				data.put('expense', statement)
			}
		, putExpense:
			putExpense
		, repeatExpenses:
			repeatExpenses
		, expensesByCategory:
			function(category, year){
				var expenses = data.all('expense', {category: category, year: year})
					.map(fn.asNew(Expense))

				if(category === 'Carry-Over')
					expenses = expenses.concat(
						data.all('total', {year: year})
							.map(fn.asNew(CarryOver)))

				return expenses
					.group(
						function(exp){
							return (exp.month+1) + '/' + (exp.week || dates.week(exp.date).index)
						}
					)
			}
		, getCategory:
			function(id){
				return data.has('category', id)
					?  new Category(data.get('category', id))
					: new Category({ description: id, timestamp: Date.now() })
			}
		, putCategory:
			putCategory
		, removeCategory:
			function(category){
				data.del('category', category)
			}
		, putAdjustment:
			putAdjustment
		, removeAdjustment:
			function(adjustment){
				data.del('adjustment', adjustment)
			}
		, putAnticipated:
			putAnticipated
		, removeAnticipated:
			function(anticipated){
				data.del('anticipated', anticipated)
			}
		, put:
			function(item){
				if(item instanceof Adjustment)
					this.putAdjustment(item)
				else if(item instanceof Expense)
					this.putExpense(item)
				else if(item instanceof Category)
					this.putCategory(item)
				else if(Array.isArray(item))
					item.forEach(this.put.bind(this))
				else
					throw new Error("No put for "+item)
			}
		, getIncome:
			function(week){
				if(week !== undefined)
					return data.has('income', week)
						? data.get('income', week)
						: {value: 0}
				else
					return data.all('income')
			}
		, putIncome:
			function(weeks){
				data.put('income', weeks)
			}
		, getTotal: getTotal
		, putTotal:
			function(year, month, week, revenue, spent){
				var id = year+'-'+month+'-'+week
				
				if(data.has('total', id)){
					var server = data.get('total', id)

					if(server.revenue === revenue && server.spent === spent)
						return
				}

				if(year instanceof CarryOver)
					data.put('total', year)
				else
					data.put(
						'total',
						{ id: year+'-'+month+'-'+week
						, year: year
						, month: month
						, week: week
						, revenue: revenue || 0
						, spent: spent || 0
						, amount: (revenue || 0) - (spent || 0)
						})
			}
		, expenses:
			function(){
				return expenses
			}
		, anticipated:
			function(){
				return anticipated
			}
		, categories:
			function(repeat){
				return categories.stream()
			}
		, income:
			function(){
				return income
			}
		})
})

