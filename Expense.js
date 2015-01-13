angular.module('expenses')
.value('Expense', function Expense(proto){
	if(Array.isArray(proto)){
		fn.assign(
			this,
			{ id: proto[0]
			, date: new Date(proto[1])
			, type: proto[2]
			, description: proto[3]
			, category: null
			, amount: proto[4]? parseFloat(proto[4]) : parseFloat(proto[5])
			, balance: parseFloat(proto[6])
			, checkId: proto[7]
			, timestamp: Date.now()
			})
	}
	else if(proto){
		fn.assign(this, proto)
		this.date = new Date(this.date)
	}

	Object.defineProperties(
		this,
		{ uploaded:
			{ writable: true
			, value: false
			}
		, loss:
			{ get:
				function(){
					return '=' + (-this.amount)
				}
			}
		, gain:
			{ get:
				function(){
					return '=' + this.amount
				}
			}
		, year:
			{ get:
				function(){
					return this.date.getFullYear()
				}
			, enumerable: true
			}
		, month:
			{ get:
				function(){
					return this.date.getMonth()
				}
			, enumerable: true
			}
		})
})
