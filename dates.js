var dates = (function(){
	var weeks = {
		"31": [
			{ start: 1, end: 8, index: 0 },
			{ start: 9, end: 15, index: 1 },
			{ start: 16, end: 23, index: 2 },
			{ start: 24, end: 31, index: 3 },
		],
		"30": [
			{ start: 1, end: 8, index: 0 },
			{ start: 9, end: 15, index: 1 },
			{ start: 16, end: 23, index: 2 },
			{ start: 24, end: 30, index: 3 },
		],
		"28": [
			{ start: 1, end: 8, index: 0 },
			{ start: 9, end: 15, index: 1 },
			{ start: 16, end: 22, index: 2 },
			{ start: 23, end: 29, index: 3 },
		],
	}
	var months = [
		{ name: 'January'
		, number: 1
		, days: 31
		},
		{ name: 'Febuary'
		, number: 2
		, days: 28
		},
		{ name: 'March'
		, number: 3
		, days: 31
		},
		{ name: 'April'
		, number: 4
		, days: 30
		},
		{ name: 'May'
		, number: 5
		, days: 30
		},
		{ name: 'June'
		, number: 6
		, days: 31
		},
		{ name: 'July'
		, number: 7
		, days: 31
		},
		{ name: 'August'
		, number: 8
		, days: 31
		},
		{ name: 'September'
		, number: 9
		, days: 30
		},
		{ name: 'October'
		, number: 10
		, days: 31
		},
		{ name: 'November'
		, number: 11
		, days: 31
		},
		{ name: 'December'
		, number: 12
		, days: 31
		},
	]

	return (
		{ weeks: weeks
		, months: months
		, startDate:
			function(year, month, week){
				if(fn.isNumber(month))
					month = months[month]

				if(fn.isNumber(week))
					week = weeks[month.days][week]

				return new Date(
					year,
					month.number - 1,
					week.start)
			}
		, endDate:
			function(year, month, week){
				var end

				if(fn.isNumber(month))
					month = months[month]

				if(fn.isNumber(week))
					week = weeks[month.days][week]

				end = new Date(
					year,
					month.number - 1,
					week.end)

				if(end.getMonth() !== month.number - 1)
					end.setDate(end.getDate() - 1)

				return end
			}
		, prevWeek:
			function(year, month, week){
				if(year === undefined){
					var today = this.today()

					year = today.year
					month = today.month
					week = today.week
				}

				if(fn.isNumber(month))
					month = months[month]

				if(fn.isNumber(week))
					week = weeks[month.days][week]

				week = week.index
				month = month.number - 1

				week = week < 1? 3 : week - 1

				if(week === 3){
					month = month - 1

					if(month < 0){
						month = 11 
						year -= 1
					}
				}

				month = months[month]
				week = weeks[month.days][week]

				return (
					{ year: year
					, month: month
					, week: week
					})
			}
		, nextWeek:
			function(year, month, week){
				if(year === undefined){
					var today = this.today()

					year = today.year
					month = today.month
					week = today.week
				}

				week = week.index
				month = month.number - 1

				week = (week+1) % 4

				if(week === 0){
					month = (month+1) % 12

					if(month === 0)
						year += 1
				}

				month = months[month]
				week = weeks[month.days][week]

				return (
					{ year: year
					, month: month
					, week: week
					})
			}
		, today:
			function(){
				var today = new Date()
				var date = today.getDate()
				var year = today.getFullYear()
				var month = months[today.getMonth()]
				var week

				for(var idx = 0; idx < 4; idx += 1)
					if(date >= weeks[month.days][idx].start)
						week = weeks[month.days][idx]

				return (
					{ year: year
					, month: month
					, week: week
					})
			}
		, month:
			function(month){
				return months[month - 1]
			}
		, week:
			function(date, week){
				if(date instanceof Date){
					var month = date.getMonth()
					var day = date.getDate()
					var wks = weeks[months[month].days]
					var week


					for(var idx = 0; idx < 4; idx += 1)
						if(day >= wks[idx].start)
							week = wks[idx]

					return week
				}
				else{
					return weeks[months[date - 1].days][week]
				}
			}
		})
})()

angular.module('expenses')
.service('dates', function(){
	return dates
})
