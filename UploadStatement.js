angular.module('expenses')
.directive('uploadStatement', function(){
	function controller($scope, $element, bank){
		var dialog = $element.find('dialog')[0];

		$scope.parsedStatement = null

		$element.find('input[type=file]').on('change', function(event){
			var file = event.target.files[0];
			var reader = new FileReader();

			$(this).val('')

			reader.onload = function (event){
				$scope.$apply(function(){
					$scope.parsedStatement = bank.parseStatement(event.target.result)
				})
			}
			reader.onerror = function (event){
				alert("Failed to load texture image")
			}
			reader.onloadend = function (){
			}
			reader.onprogress = function(){
			}
			reader.onabort = function(){
			}
			reader.readAsText(file);
		})

		$scope.close = function(){
			$scope.parsedStatement = null
			$scope.open = false
		}

		$scope.accept = function(){
			bank.pushStatement($scope.parsedStatement)

			$scope.close()
		}

		$scope.reject = function(){
			$scope.parsedStatement = null
		}

		$scope.$watch('open', function(open){
			if(open)
				dialog.showModal()
			else if(dialog.open)
				dialog.close()
		})
	}

	return (
		{ restrict: 'E'
		, templateUrl: 'UploadStatement.html'
		, scope:
			{ open: '='
			}
		, controller: controller
		})
})
