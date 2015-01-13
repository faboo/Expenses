angular.module('expenses', ['ui.router', 'checklist-model'])
.config(function($compileProvider, $locationProvider, $stateProvider, $urlRouterProvider){
	var today = dates.today()

	$locationProvider.html5Mode(true);
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|data):/);

	// ui-router won't key states off query parameters, so we'll handle the
	// state dispatch ourselves
	$urlRouterProvider.when(/.*/, function($state, $match, $stateParams, $location){
		var query = $location.search()
		if(query.trend){
			$state.go('categoryTrend', {trend:query.trend})
		}
		else if(query.year && query.month && query.week){
			query.year = parseInt(query.year)
			query.month = parseInt(query.month)
			query.week = parseInt(query.week)
			$state.go('expenseList', query)
		}
		else{
			today = dates.today()
			$state.go('expenseList', {year: today.year, month: today.month.number, week: today.week.index})
		}
	})

	$stateProvider
		.state('expenseList',
			{ url: '/index.html?year&month&week'
			, params:
				{ year: today.year
				, month: today.month.number
				, week: today.week.index
				}
			, templateUrl: 'expenseList.html'
			, controller: 'expenseList'
			})
		.state('categoryTrend',
			{ url: '/index.html?trend'
			, templateUrl: 'categoryTrend.html'
			, controller: 'categoryTrend'
			})
})
.factory('dropbox', function($location, storage){
	var db
	var hash = location.hash
	var options =
		{ key: 'mcp5cdwjvjfilwv'
		}

	if(hash && hash.match(/access_token=/) && hash.match(/uid=/)){
		hash = hash.match(/access_token=([^&]*).*uid=(.*)$/)
		options.token = hash[1]
		options.uid = hash[2]

		storage.put('dropbox',
			{ id: 'login'
			, token: options.token
			, uid: options.uid
			})
	}
	else if(storage.has('dropbox', 'login')){
		hash = storage.get('dropbox', 'login')
		options.token = hash.token
		options.uid = hash.uid
	}

	if('Dropbox' in window){
		db = new Dropbox.Client(options)
		db.authDriver(new Dropbox.AuthDriver.Redirect(
			{ redirectUrl:
				window.location.protocol+'//'+window.location.host+'/index.html'
			}))
		return db
	}
	else{
		return null
	}
})
.controller('expenseList', function($scope, $timeout, $stateParams, dropbox, dates, server, data, bank, Category){
	$scope.year = parseInt($stateParams.year)
	$scope.month = dates.month($stateParams.month)
	$scope.week = dates.week($stateParams.month, $stateParams.week)
	$scope.uploadOpen = false
	$scope.createCategory = false
	$scope.createAdjustment = false
	$scope.createAnticipated = false
	$scope.dropboxLoaded = !!dropbox
	$scope.dropboxLoggedIn = dropbox && dropbox.isAuthenticated()
	$scope.syncing = false

	$scope.downloadConfig = function(){
		return encodeURIComponent(JSON.stringify(data.all('category')))
	}

	$scope.syncWithDropbox = function(){
		try{
			dropbox.authenticate()
		}
		catch(ex){
			dropbox.reset()
			try{
				dropbox.authenticate()
			}
			catch(ex){
				alert(ex.message)
			}
		}
	}

	
	$timeout(
		function(){
			$scope.syncing = server.syncing()
		},
		3000)

	$('input[type=file]#configUpload').on('change', function(event){
		var file = event.target.files[0]
		var reader = new FileReader()

		$(this).val('')

		reader.onload = function (event){
			bank.putCategory(JSON.parse(event.target.result).map(
				function(category){
					return new Category(category)
				}))
		}
		reader.onerror = function (event){
			alert("Failed to load config")
		}
		reader.onloadend = function (){
		}
		reader.onprogress = function(){
		}
		reader.onabort = function(){
		}
		reader.readAsText(file);
	})

	$scope.$watchGroup(['year', 'month', 'week'], function(){
		$scope.endDate = dates.endDate($scope.year, $scope.month, $scope.week)
	})
})
.controller('categoryTrend', function($scope, $stateParams, bank){
	$scope.year = new Date().getFullYear()
	$scope.category = $stateParams.trend
	$scope.data = bank.expensesByCategory($scope.category, $scope.year)

	$scope.$watch('year', function(){
		$scope.data = bank.expensesByCategory($scope.category, $scope.year)
	})
})
.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event})
            });
        });
    };
})

if(!('contains' in Array.prototype))
	Object.defineProperty(
		Array.prototype,
		'contains',
		{ enumerable: false
		, writable: false
		, configurable: false
		, value: function(elm){ return this.indexOf(elm) > -1 }
		})

if(!('contains' in String.prototype))
	Object.defineProperty(
		String.prototype,
		'contains',
		{ enumerable: false
		, writable: false
		, configurable: false
		, value: function(sub){ return this.match(RegExp.escape(sub)) }
		})

if(!('find' in Array.prototype))
	Object.defineProperty(
		Array.prototype,
		'find',
		{ enumerable: false
		, writable: false
		, configurable: false
		, value:
			function(test, th){
				for(var idx = 0; idx < this.length; idx += 1)
					if(test.call(th, this[idx], idx, this))
						return this[idx]
				return undefined
			}
		})

if(!('findIndex' in Array.prototype))
	Object.defineProperty(
		Array.prototype,
		'findIndex',
		{ enumerable: false
		, writable: false
		, configurable: false
		, value:
			function(test, th){
				for(var idx = 0; idx < this.length; idx += 1)
					if(test.call(th, this[idx], idx, this))
						return idx
				return -1
			}
		})

RegExp.escape = function(str) {
    return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

Bacon.Channel = function(keepHistory){
	var send = function send(sink, value){
		sink(new Bacon.Next(function(){
			return value
		}))
	}.bind(this)
	var flushBuffer = function flushBuffer(){
		while(this.buffer.length){
			var value = this.buffer.unshift();
			this.subscriptions.forEach(function(sink){
				send(sink, value)
			})
		}
	}.bind(this)
	var replayBuffer = function replayBuffer(sink){
		for(var index = 0; index < this.buffer.length; index += 1)
			send(sink, this.buffer[index])
	}.bind(this)

	this.buffer = []
	this.subscriptions = []
	this.stream = function(){
		return Bacon.fromBinder(function(sink){
			this.subscriptions.push(sink)

			if(keepHistory)
				replayBuffer(sink)
			else
				flushBuffer()

			return function(){
				this.subscriptions = 
					this.subscriptions.filter(function (value){
						return value !== sink
					})
			}.bind(this)
		}.bind(this))
	}
	this.push = function(value){
		if(value instanceof Array){
			if(keepHistory)
				this.buffer = this.buffer.concat(value)

			value.forEach(function(value){
				this.subscriptions.forEach(function(sink){
					send(sink, value)
				})
			})
		}
		else{
			if(keepHistory)
				this.buffer.push(value)

			this.subscriptions.forEach(function(sink){
				send(sink, value)
			})
		}

		return this
	}
	this.plug = function(stream){
		stream.onValue(function(value){
			this.push(value)
		}.bind(this))
	}
}
