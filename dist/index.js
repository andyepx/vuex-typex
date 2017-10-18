"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vuex_1 = require("vuex");
const useRootNamespace = { root: true };
class ModuleBuilderImpl {
    constructor(namespace, _initialState) {
        this.namespace = namespace;
        this._initialState = _initialState;
        this._getters = {};
        this._mutations = {};
        this._actions = {};
        this._plugins = [];
        this._strict = false;
        this._moduleBuilders = {};
    }
    state() {
        if (!this.namespace) {
            return () => this._store.state;
        }
        else if (this.namespace.indexOf("/") < 0) {
            return () => this._store.state[this.namespace];
        }
        else {
            const namespaces = this.namespace.split("/");
            return () => {
                let accessor = this._store.state;
                for (const name of namespaces) {
                    accessor = accessor[name];
                }
                return accessor;
            };
        }
    }
    module(namespace, initialState) {
        const existingModule = this._moduleBuilders[namespace];
        const qualifiedNamespace = qualifyNamespace(this.namespace, namespace);
        if (!initialState) {
            // no second argument: get an existing module
            if (!existingModule) {
                throw new Error(`There is no module named '${qualifiedNamespace}'.  If you meant to create a nested module, then provide initial-state as the second argument.'`);
            }
            return existingModule;
        }
        // both arguments: create a module        
        if (existingModule) {
            throw new Error(`There is already a module named '${qualifiedNamespace}'.  If you meant to get the existing module, then provide no initialState argument.`);
        }
        const nestedBuilder = new ModuleBuilderImpl(qualifiedNamespace, initialState);
        this._moduleBuilders[namespace] = nestedBuilder;
        return nestedBuilder;
    }
    commit(handler, name) {
        const { key, namespacedKey } = qualifyKey(handler, this.namespace, name);
        if (this._mutations[key]) {
            throw new Error(`There is already a mutation named ${key}.`);
        }
        this._mutations[key] = handler;
        return ((payload) => this._store.commit(namespacedKey, payload, useRootNamespace));
    }
    dispatch(handler, name) {
        const { key, namespacedKey } = qualifyKey(handler, this.namespace, name);
        if (this._actions[key]) {
            throw new Error(`There is already an action named ${key}.`);
        }
        this._actions[key] = handler;
        return (payload) => this._store.dispatch(namespacedKey, payload, useRootNamespace);
    }
    read(handler, name) {
        const { key, namespacedKey } = qualifyKey(handler, this.namespace, name);
        if (this._getters[key]) {
            throw new Error(`There is already a getter named ${key}.`);
        }
        this._getters[key] = handler;
        return () => {
            if (this._store.rootGetters) {
                return this._store.rootGetters[namespacedKey];
            }
            return this._store.getters[namespacedKey];
        };
    }
    vuexModule() {
        if (!this._vuexModule) {
            // build nested modules recursively, if any
            const modules = {};
            for (const namespace of Object.keys(this._moduleBuilders)) {
                modules[namespace] = this._moduleBuilders[namespace].vuexModule();
            }
            this._vuexModule = {
                state: this._initialState,
                getters: this._getters,
                mutations: this._mutations,
                actions: this._actions,
                plugins: this._plugins,
                strict: this._strict,
                modules
            };
        }
        return this._vuexModule;
    }
    _provideStore(store) {
        this._store = store;
        forEachValue(this._moduleBuilders, m => m._provideStore(store));
    }
}
function qualifyKey(handler, namespace, name) {
    const key = name || handler.name;
    if (!key) {
        throw new Error(`Vuex handler functions must not be anonymous. Possible causes: fat-arrow functions, uglify.  To fix, pass a unique name as a second parameter after your callback.`);
    }
    return { key, namespacedKey: qualifyNamespace(namespace, key) };
}
function qualifyNamespace(namespace, key) {
    return namespace ? `${namespace}/${key}` : key;
}
class StoreBuilderImpl extends ModuleBuilderImpl {
    constructor() {
        super("", {});
    }
    module(namespace, initialState) {
        if (this._store && initialState) {
            throw new Error("Can't add module after vuexStore() has been called");
        }
        return super.module(namespace, initialState);
    }
    vuexStore(overrideOptions = {}) {
        if (!this._store) {
            const options = Object.assign({}, this.vuexModule(), overrideOptions);
            const store = new vuex_1.Store(options);
            forEachValue(this._moduleBuilders, m => m._provideStore(store));
            this._store = store;
        }
        return this._store;
    }
    reset() {
        this._store = undefined;
        this._moduleBuilders = {};
    }
}
const forEachValue = (dict, loop) => {
    Object.keys(dict).forEach(key => loop(dict[key]));
};
const storeBuilderSingleton = new StoreBuilderImpl();
const namedStoreBuilderMap = Object.create(null);
function getStoreBuilder(name) {
    // the default store builder
    if (!name) {
        return storeBuilderSingleton;
    }
    // a named store builder    
    const builder = namedStoreBuilderMap[name] || (namedStoreBuilderMap[name] = new StoreBuilderImpl());
    return builder;
}
exports.getStoreBuilder = getStoreBuilder;
//# sourceMappingURL=index.js.map