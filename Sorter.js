angular.module('expenses')
.service('sorter', function(Category){
	function compareString(left, right){
		if(left < right)
			return -1
		if(right < left)
			return 1
		return 0
	}
	function compare(left, right){
		var comp = 0

		if(left.constructor !== right.constructor)
			if(left instanceof Category)
				comp = -1
			else
				comp = 1
		else if(left instanceof Category)
			if(left.order >= 0)
 				if(right.order >= 0)
					comp = left.order - right.order
				else
					comp = -1
			else if(right.order >= 0)
				comp = 1
			else
				comp = compareString(left.description, right.description)
		else
			comp = compareString(left.description, right.description)

		return comp
	}

	return (
		{ compare: compare
		, sort: function(array){
			return array.slice().sort(compare)
		}
		})
});

