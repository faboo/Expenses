angular.module('expenses')
.factory('Anticipated', function(Expense){
	function Anticipated(proto){
		if(proto){
			fn.assign(this, proto)
		}
		else{
			this.description = ''
			this.amount = 0.0
			this.check = false
		}

		if((typeof this.date) === 'string')
			this.date = new Date(this.date)
		else
			this.date = new Date()

		if(!this.id)
			this.id = 'ANT'+Date.now()+fn.random(0, 999)

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
				{ value: 'ANTICIPATED'
				}
			, category:
				{ value: null
				}
			})
	}

	return Anticipated
})
