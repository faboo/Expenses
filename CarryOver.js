angular.module('expenses')
.factory('CarryOver', function(Expense, dates){
	function CarryOver(proto){
		this.week = proto.week
		this.revenue = proto.revenue || 0
		this.spent = proto.spent || 0
		this.version = proto.version || -1

		Object.defineProperties(
			this,
			{ id:
				{ get:
					function(){
						return this.year+'-'+this.month+'-'+this.week
					}
				, enumerable: true
				}
			, year:
				{ value: proto.year
				}
			, month:
				{ value: proto.month
				}
			, date:
				{ get:
					function(){
						var date = dates.endDate(this.year, this.month, this.week)

						date.setDate(date.getDate() + 1)

						return date
					}
				}
			, description:
				{ value: 'Carry-Over'
				}
			, category:
				{ value: 'Carry-Over'
				}
			, amount:
				{ get:
					function(){
						return this.revenue - this.spent
					}
				, enumerable: true
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
			, type:
				{ value: 'CARRYOVER'
				}
			})
	}
	CarryOver.prototype = new Expense()

	return CarryOver
})

