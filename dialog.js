if(!window.HTMLDialogElement){

angular.module('expenses').directive('dialog', function(){
	return (
		{ restrict: 'E'
		, transclude: true
		, template: '<div class="backdrop"><ng-transclude></ng-transclude></div>'
		, link:
			function(scope, element, attrs){
				var dom = element[0]

				element.hide()
				element.addClass('polyfill')
				element.prop('open', false)

				dom.showModal = function(){
					element.prop('open', true)
					element.show()
				}
				dom.close = function(){
					element.prop('open', false)
					element.hide()
				}
			}
		})
})

}
