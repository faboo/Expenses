angular.module('expenses')
.filter('order', function(sorter){
	return function(array){
		return sorter.sort(array)
	}
});


