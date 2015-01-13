angular.module('expenses')
.value('Category', function Category(proto){
	if(proto){
		fn.assign(this, proto)
	}
	else{
		this.id = ""
		this.budget = null
		this.auto = false
		this.weeks = []
		this.hide = false
		this.descriptionTest = null
		this.amountTest = null
		this.timestamp = Date.now()
		this.order = null
	}
	Object.defineProperties(
		this,
		{ description:
			{ get:
				function(){
					return this.id
				}
			}
		, expenses:
			{ writable: true
			, value: []
			}
		, uploaded:
			{ writable: true
			, value: false
			}
		, addExpense:
			{ value:
				function(expense){
					expense.category = this.description
					this.expenses.push(expense)
					this.expenses = this.expenses.uniqBy(fn.prop('id'))
				}
			}
		, removeExpense:
			{ value:
				function(expense){
					expense.category = null
					//_(this.expenses).remove({id: expense.id})
					this.expenses = this.expenses.delBy(fn.has({id: expense.id}))
				}
			}
		, amount:
			{ get:
				function(){
					return this.expenses
						.reduce(function(accum, expense){
							return accum + expense.amount
						},
						0)
				}
			}
		, loss:
			{ get:
				function(){
					return '=' + this.expenses.map(function(exp){
						return exp.amount < 0? -exp.amount : '(-'+exp.amount+')'
					}).join('+')
				}
			}
		, gain:
			{ get:
				function(){
					return '=' + this.expenses.map(function(exp){
						return exp.amount > 0? exp.amount : '('+exp.amount+')'
					}).join('+')
				}
			}
		})
})
