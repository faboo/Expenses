angular.module('expenses')
.service('server', function(dropbox, $q){
	var initDefer = $q.defer()
	var datastore

	function escapeId(id){
		return id.replace(/ |'/g, '_')
	}

	function externField(value){
		if(value.toArray)
			return value.toArray()
		else
			return value
	}

	function extern(item){
		if(item.isDeleted())
			return { id: item.get('id'), 'delete': true, version: item.get('version') }
		else
			return fn.mapValues(externField, item.getFields())
	}

	return (
		{ available:
			function(){
				return dropbox && dropbox.isAuthenticated()
			}
		, syncing:
			function(){
				return this.available() && (!this.initialized() || datastore.getSyncStatus().uploading)
			}
		, initialize:
			function(success){
				var manager = dropbox.getDatastoreManager()

				manager.openDefaultDatastore(function (error, opened){
					if(error){
						initDefer.reject(error)
					}
					else{
						datastore = opened
						if(success)
							success()
						initDefer.resolve()
					}
				})

				return initDefer.promise
			}
		, initialized:
			function(){
				return !!datastore
			}
		, onInitialized:
			function(handler){
				initDefer.promise.then(handler)
			}
		, onChange:
			function(of, handler){
				if(!datastore)
					throw new Error('Server not initialized')

				// We'll handle our own local changes, in case we're disconnected.

				if(handler)
					datastore.recordsChanged.addListener(function(event){
						if(!event.isLocal())
							handler({
								from: of,
								items: event.affectedRecordsForTable(of).map(extern)
							})
					})
				else
					datastore.recordsChanged.addListener(function(event){
						if(!event.isLocal())
							of({
								tables: fn.mapValues(
									function(items){
										return items.map(extern)
									},
									event.affectedRecordsByTable())
							})
					})
			}
		, all:
			function all(of, where){
				if(!datastore)
					throw new Error('Server not initialized')
				var table = datastore.getTable(of)
				var items

				items = table.query(where)

				return items.map(function(item){
						return fn.mapValues(externField, item.getFields())
					})
			}
		, has:
			function has(from, id){
				if(!datastore)
					throw new Error('Server not initialized')
				var table = datastore.getTable(from)

				return table.get(escapeId(id)) !== null
			}
		, get:
			function get(from, id){
				if(!datastore)
					throw new Error('Server not initialized')
				var table = datastore.getTable(from)

				return extern(table.get(escapeId(id)))
			}
		, put:
			function set(to, items){
				if(!datastore)
					throw new Error('Server not initialized')
				var table = datastore.getTable(to)

				if(!Array.isArray(items))
					items = [items]

				items.forEach(function(item){
					var write =
						fn.filterValues(
							function(value, prop){
								return value !== null && !prop.contains('$')
							},
							item)
					var record = table.getOrInsert(
						escapeId(item.id),
						write)
					
					record.update(write)
				})
			}
		, del:
			function del(from, items){
				if(!datastore)
					throw new Error('Server not initialized')
				var table = datastore.getTable(from)

				if(!Array.isArray(items))
					items = [items]

				items.forEach(function(item){
					table.get(escapeId(item.id)).deleteRecord()
				})
			}
		})
});
