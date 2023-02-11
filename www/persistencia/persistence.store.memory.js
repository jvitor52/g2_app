try {
    if (!window) {
        window = {};
        //exports.console = console;
    }
} catch (e) {
    window = {};
    exports.console = console;
}

var persistence = (window && window.persistence) ? window.persistence : {};

if (!persistence.store) {
    persistence.store = {};
}

persistence.store.memory = {};

persistence.store.memory.config = function(persistence, dbname) {
    var argspec = persistence.argspec;
    dbname = dbname || 'persistenceData';

    var allObjects = {};

    persistence.getAllObjects = function() { return allObjects; };

    var defaultAdd = persistence.add;

    persistence.add = function(obj) {
        if (!this.trackedObjects[obj.id]) {
            defaultAdd.call(this, obj);
            var entityName = obj._type;
            if (!allObjects[entityName]) {
                allObjects[entityName] = new persistence.LocalQueryCollection();
                allObjects[entityName]._session = persistence;
            }
            allObjects[entityName].add(obj);
        }
        return this;
    };

    var defaultRemove = persistence.remove;

    persistence.remove = function(obj) {
        defaultRemove.call(this, obj);
        var entityName = obj._type;
        allObjects[entityName].remove(obj);
    };

    persistence.schemaSync = function(tx, callback, emulate) {
        var args = argspec.getArgs(arguments, [
            { name: "tx", optional: true, check: persistence.isTransaction, defaultValue: null },
            { name: "callback", optional: true, check: argspec.isCallback(), defaultValue: function() {} },
            { name: "emulate", optional: true, check: argspec.hasType('boolean') }
        ]);

        args.callback();
    };

    persistence.flush = function(tx, callback) {
        var args = argspec.getArgs(arguments, [
            { name: "tx", optional: true, check: persistence.isTransaction },
            { name: "callback", optional: true, check: argspec.isCallback(), defaultValue: function() {} }
        ]);

        var fns = persistence.flushHooks;
        var session = this;
        persistence.asyncForEach(fns, function(fn, callback) {
            fn(session, tx, callback);
        }, function() {
            var trackedObjects = persistence.trackedObjects;
            for (var id in trackedObjects) {
                if (trackedObjects.hasOwnProperty(id)) {
                    if (persistence.objectsToRemove.hasOwnProperty(id)) {
                        delete trackedObjects[id];
                    } else {
                        trackedObjects[id]._dirtyProperties = {};
                    }
                }
            }
            args.callback();
        });
    };

    persistence.transaction = function(callback) {
        setTimeout(function() {
            callback({ executeSql: function() {} });
        }, 0);
    };

    persistence.loadFromLocalStorage = function(callback) {
        var dump = window.localStorage.getItem(dbname);
        if (dump) {
            this.loadFromJson(dump, callback);
        } else {
            callback && callback();
        }
    };

    persistence.saveToLocalStorage = function(callback) {
        this.dumpToJson(function(dump) {
            window.localStorage.setItem(dbname, dump);
            if (callback) {
                callback();
            }
        });
    };

    persistence.reset = function(tx, callback) {
        var args = argspec.getArgs(arguments, [
            { name: "tx", optional: true, check: persistence.isTransaction, defaultValue: null },
            { name: "callback", optional: true, check: argspec.isCallback(), defaultValue: function() {} }
        ]);
        tx = args.tx;
        callback = args.callback;

        allObjects = {};
        this.clean();
        callback();
    };

    persistence.close = function() {};

    function makeLocalClone(otherColl) {
        var coll = allObjects[otherColl._entityName];
        if (!coll) {
            coll = new persistence.LocalQueryCollection();
        }
        coll = coll.clone();
        coll._filter = otherColl._filter;
        coll._prefetchFields = otherColl._prefetchFields;
        coll._orderColumns = otherColl._orderColumns;
        coll._limit = otherColl._limit;
        coll._skip = otherColl._skip;
        coll._reverse = otherColl._reverse;
        return coll;
    }

    persistence.DbQueryCollection.prototype.list = function(tx, callback) {
        var args = argspec.getArgs(arguments, [
            { name: 'tx', optional: true, check: persistence.isTransaction, defaultValue: null },
            { name: 'callback', optional: false, check: argspec.isCallback() }
        ]);
        tx = args.tx;
        callback = args.callback;

        var coll = makeLocalClone(this);
        coll.list(null, callback);
    };


    persistence.DbQueryCollection.prototype.destroyAll = function(tx, callback) {
        var args = argspec.getArgs(arguments, [
            { name: 'tx', optional: true, check: persistence.isTransaction, defaultValue: null },
            { name: 'callback', optional: true, check: argspec.isCallback(), defaultValue: function() {} }
        ]);
        tx = args.tx;
        callback = args.callback;

        var coll = makeLocalClone(this);
        coll.destroyAll(null, callback);
    };


    persistence.DbQueryCollection.prototype.count = function(tx, callback) {
        var args = argspec.getArgs(arguments, [
            { name: 'tx', optional: true, check: persistence.isTransaction, defaultValue: null },
            { name: 'callback', optional: false, check: argspec.isCallback() }
        ]);
        tx = args.tx;
        callback = args.callback;

        var coll = makeLocalClone(this);
        coll.count(null, callback);
    };

    persistence.ManyToManyDbQueryCollection = function(session, entityName) {
        this.init(session, entityName, persistence.ManyToManyDbQueryCollection);
        this._items = [];
    };

    persistence.ManyToManyDbQueryCollection.prototype = new persistence.LocalQueryCollection();

    persistence.ManyToManyDbQueryCollection.prototype.initManyToMany = function(obj, coll) {
        this._obj = obj;
        this._coll = coll;
    };

    persistence.ManyToManyDbQueryCollection.prototype.add = function(item, recursing) {
        persistence.LocalQueryCollection.prototype.add.call(this, item);
        if (!recursing) {
            var meta = persistence.getMeta(this._obj._type);
            var inverseProperty = meta.hasMany[this._coll].inverseProperty;
            persistence.get(item, inverseProperty).add(this._obj, true);
        }
    };

    persistence.ManyToManyDbQueryCollection.prototype.remove = function(item, recursing) {
        persistence.LocalQueryCollection.prototype.remove.call(this, item);
        if (!recursing) {
            var meta = persistence.getMeta(this._obj._type);
            var inverseProperty = meta.hasMany[this._coll].inverseProperty;
            persistence.get(item, inverseProperty).remove(this._obj, true);
        }
    };
};

try {
    exports.config = persistence.store.memory.config;
    exports.getSession = function() { return persistence; };
} catch (e) {}