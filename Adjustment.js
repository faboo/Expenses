angular.module('expenses')
.factory('Adjustment', function(Expense){
	function Adjustment(proto){
		if(proto){
			fn.assign(this, proto)
			this.date = new Date(this.date)
		}
		else{
			this.id = 'ADJ'+Date.now()+fn.random(0, 999)
			this.timestamp = Date.now()
		}
		delete this.balance

		Object.defineProperties(
			this,
			{ loss:
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
			, type:
				{ value: 'ADJUSTMENT'
				}
			})
	}
	Adjustment.prototype = new Expense()

	return Adjustment
})
