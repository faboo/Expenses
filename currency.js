angular.module('expenses')
.filter('exCurrency', function(sorter){
	return function(number){
		if(!fn.isNumber(number))
			return ""

		var negative = number < 0

		if(negative)
			number = -number

		return (negative? '-$' : '$') + number.toFixed(2)
	}
});


