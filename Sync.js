angular.module('expenses').directive('sync', function(){
	return (
		{ restrict: 'E'
		, templateUrl: 'Sync.html'
		, scope:
			{ syncing: '='
			}
		})
})
