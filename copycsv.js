angular.module('expenses')
.service('copycsv', function(sorter, copy, Category){
	function line(){
		var text = ""

		for(var index = 0; index < arguments.length; index += 1){
			if(fn.isNumber(arguments[index]))
				text += arguments[index]
			else
				text += '"'+arguments[index]+'"'

			if(index < arguments.length - 1)
				text += '\t'
			else
				text += '\n'
		}

		return text
	}

	function generate(expenses){
		var csv = ""

		sorter.sort(expenses).forEach(function(item){
			if(item instanceof Category && !item.expenses.length){
				if(item.budget)
					csv += line(item.description, '', item.budget, '')
			}
			else{
				if(item.amount < 0)
					csv += line(item.description, '', item.budget||'', item.loss)
				else
					csv += line(item.description, item.gain, item.budget||'', '')
			}
		})

		return csv
	}

	return (
		{ copyExpenses:
			function(expenses){
				var csv = generate(expenses)

				copy.setText(csv)
			}
		})
});
