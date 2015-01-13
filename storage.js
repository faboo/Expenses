//Pieces, Copyright (C) 2012,2014 Ray Wallace
//
//This program is free software; you can redistribute it and/or modify it under
//the terms of the GNU General Public License as published by the Free Software
//Foundation version 2 of the Licens.
//
//This program is distributed in the hope that it will be useful, but WITHOUT
//ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
//FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
//details.
//
//You should have received a copy of the GNU General Public License along with
//this program; if not, write to the Free Software Foundation, Inc., 51 Franklin
//Street, Fifth Floor, Boston, MA  02110-1301, USA.

angular.module('expenses')
.service('storage', function(){
	return (
		{ all:
			function all(of, where){
				var items = []
				var key
				var match = new RegExp('^'+of+'/')

				for (i = 0; i < window.localStorage.length; i++) {
					key = window.localStorage.key(i);
					if(match.test(key)){
						items.push(JSON.parse(window.localStorage.getItem(key)))
					}
				}

				return items.filter(fn.has(where))
			}
		, has:
			function has(from, id){
				return window.localStorage.getItem(from+'/'+id) !== null
			}
		, get:
			function get(from, id){
				return JSON.parse(window.localStorage.getItem(from+'/'+id))
			}
		, put:
			function set(to, items){
				if(!Array.isArray(items))
					items = [items]

				items.forEach(function(item){
					window.localStorage.setItem(to+'/'+item.id, JSON.stringify(item))
				})
			}
		, del:
			function del(from, items){
				if(!Array.isArray(items))
					items = [items]

				items.forEach(function(item){
					window.localStorage.removeItem(from+'/'+item.id)
				})
			}
		})
});
