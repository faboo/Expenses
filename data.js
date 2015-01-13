angular.module('expenses')
.service('data', function($q, storage, server){
	var dbinfo
	var changes = { }
	var initialized = server.available()
		? server.initialize()
		: $q.defer().promise

	function migration(){
		if(server.initialized()){
		}
	}

	function getDbinfo(){
		var serverInfo
		dbinfo = storage.has('meta', 'dbinfo')
			? storage.get('meta', 'dbinfo')
			: {id: 'dbinfo', version: -1}

		if(server.initialized()){
			if(server.has('meta', 'dbinfo')){
				serverInfo = server.get('meta', 'dbinfo')
				reconcile(dbinfo.version, serverInfo.version)
				dbinfo = serverInfo
				storage.put('meta', dbinfo)
			}
			else{
				reconcile(dbinfo.version, -1)
				if(dbinfo.version < 0){
					dbinfo.version = 0
					storage.put('meta', dbinfo)
				}
				server.put('meta', dbinfo)
			}
		}

		return dbinfo
	}

	function bumpDbversion(){
		getDbinfo()
		// While offline, all our writes will be on the same version
		if(server.initialized()){
			dbinfo.version += 1
			server.put('meta', dbinfo)
			storage.put('meta', dbinfo)
		}

		return dbinfo
	}

	function itemDelete(item){
		return {id: item.id, 'delete': true, version: Math.max(bumpDbversion().version, 0)}
	}

	function itemBumpVersion(item){
		item.version = Math.max(bumpDbversion().version, 0)
		return item
	}

	function reconcileSingle(from, item){
		if(server.has(from, item.id)){
			var serverItem = server.get(from, item.id)

			if(!('version' in item))
				item.version = -1

			if(serverItem && serverItem.version > item.version){
				serverItem.uploaded = true
				storage.put(from, serverItem)
				triggerChanges(from, serverItem)
				item = serverItem
			}
			else{
				server.put(from, item)
				item.uploaded = true
				storage.put(from, item)
			}
		}
		else{
			server.put(from, item)
			item.uploaded = true
			storage.put(from, item)
		}

		return item
	}

	function reconcile(localVersion, serverVersion){
		var items
		var table

		for(table in changes)
			storage.all(table, {uploaded: false})
				.forEach(reconcileSingle.curry(table))

		for(; localVersion <= serverVersion; localVersion += 1){
			for(table in changes)
				server.all(table, {version: localVersion})
					.forEach(function(item){
						item.uploaded = true
						storage.put(table, item)
						triggerChanges(table, item)
					})
		}
	}

	function bubbleChanges(event){
		fn.forIn(
			function(items, from){
				//TODO: These are js objects now - revamp this

				// Filter the changed items as we process them so we can reject old
				// items.
				var changed = items.filter(function(item){
					var change = false

					// If we have a copy, we need to check it
					if(storage.has(from, item.id)){
						var stored = storage.get(from, item.id)


						if(item['delete']){
							storage.del(from, item)
							change = true
						}
						// and if it's older than the server's, then the server
						// changed it
						else if(!(item.version < stored.version)){
							item.uploaded = true
							storage.put(from, item)
							change = true
						}
						// but if it's newer, we need to update the server's
						// version, but we won't include it in the changed set
						else{
							server.put(stored)
							stored.uploaded = true
							storage.put(from, stored)
						}
					}
					// If we don't have one already, we'll just store it
					else if(!item['delete']){
						storage.put(from, item)
						change = true
					}

					return change
				})

				// If someone subscribed to this table, update them on what's
				// changed
				if(from in changes && changed.length)
					changes[from].plug(Bacon.sequentially(0, changed))
			},
			event.tables)
	}

	function triggerChanges(to, changed){
		if(!Array.isArray(changed))
			changed = [changed]

		if(to in changes && changed.length)
			changes[to].plug(Bacon.sequentially(0, changed))
	}

	function singlePut(to, item){
		var serverItem

		// Clean-up client side information. Maybe we don't need this if
		// we do the view-end correctly.
		item = fn.filterValues(
			function(value, prop){
				return value !== null
					&& !prop.contains('$')
					&& prop !== 'uploaded'
					&& prop !== 'changed'
			},
			item)
		// NOTE: item is now a *new* object

		if(server.initialized()){
			if(server.has(to, item.id)){
				serverItem = server.get(to, item.id)

				if(serverItem.version > item.version){
					item = serverItem
				}
				else{
					item = itemBumpVersion(item)
					server.put(to, item)
				}
			}
			else{
				item = itemBumpVersion(item)
				server.put(to, item)
			}
			item.uploaded = true
		}
		else{
			item = itemBumpVersion(item)
			item.uploaded = false
		}

		storage.put(to, item)

		return item
	}

	function singleDelete(from, item){
		var serverItem

		if(item.uploaded){
			if(server.initialized()){
				if(server.has(from, item.id)){
					//server.del(from, item)
					serverItem = server.get(from, item.id)

					if(serverItem.version > item.version){
						item = serverItem
						item.uploaded = true
						storage.put(from, item)
					}
					else{
						item = itemDelete(item)
						storage.del(from, item)
						server.put(from, item)
					}
				}
			}
			else{
				storage.put(from, itemDelete(item))
			}
		}
		else{
			storage.del(from, item)
			item = itemDelete(item)
		}

		return item
	}

	getDbinfo()

	initialized.then(
		function(){
			getDbinfo()

			migration()

			server.onChange(bubbleChanges)
		},
		function(error){
			if(console)
				console.error(error)
		})

	return (
		{ change:
			function(to){
				if(!(to in changes))
					changes[to] = new Bacon.Bus() //$q.defer()

				return changes[to]
			}
		, dbinfo:
			function(){
				return dbinfo
			}
		, all:
			function(of, where){
				var itemsById = storage.all(of, where).group(fn.prop('id'))

				if(server.initialized()){
					itemsById = fn.assign(
						itemsById,
						server.all(of, where)
							.filter(function(item){
								return !(item.id in itemsById)
									// This is a little tortured so that we
									// appropriately take the server copy if the
									// server version is undefined
									|| !(item.version < itemsById[item.id].version)
							})
							.map(function(item){
								item.uploaded = true
								return item
							})
							.group(fn.prop('id')))
				}

				// Order doesn't matter, so we can just let them come out in a
				// jumble
				return fn.values(itemsById).flatten()
			}
		, has:
			function(from, id){
				var has = storage.has(from, id)
				var item

				if(has){
					item = storage.get(from, id)

					if(item['delete']){
						has = false

						if(server.initialized()){
							server.del(from, id)
							storage.del(from, id)
						}
					}
				}

				return has
			}
		, get:
			function(from, id, reconcile){
				var item
				
				if(!storage.has(from, id))
					throw new Error('No '+id+' in '+from)

				item = storage.get(from, id)

				if(reconcile && server.initialized())
					item = reconcileSingle(from, item)

				if(item['delete'])
					throw new Error(id+' in '+from+' has been deleted')

				return item
			}
		, put:
			function put(to, items){
				if(!Array.isArray(items))
					items = [items]

				var puts = items.map(singlePut.curry(to))

				triggerChanges(to, puts)
			}
		, del:
			function del(from, items){
				if(!Array.isArray(items))
					items = [items]

				var deletes = items.map(singleDelete.curry(from))

				triggerChanges(from, deletes)
			}
		})
})
