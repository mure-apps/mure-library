import Introspectable from '../Common/Introspectable.js';
import TriggerableMixin from '../Common/TriggerableMixin.js';

class Table extends TriggerableMixin(Introspectable) {
  constructor (options) {
    super();
    this._mure = options.mure;
    this.tableId = options.tableId;
    if (!this._mure || !this.tableId) {
      throw new Error(`mure and tableId are required`);
    }

    this._expectedAttributes = options.attributes || {};
    this._observedAttributes = {};
    this._derivedTables = options.derivedTables || {};

    this._derivedAttributeFunctions = {};
    if (options.derivedAttributeFunctions) {
      for (const [attr, stringifiedFunc] of Object.entries(options.derivedAttributeFunctions)) {
        this._derivedAttributeFunctions[attr] = this._mure.hydrateFunction(stringifiedFunc);
      }
    }
  }
  _toRawObject () {
    const result = {
      tableId: this.tableId,
      attributes: this._attributes,
      derivedTables: this._derivedTables,
      usedByClasses: this._usedByClasses,
      derivedAttributeFunctions: {}
    };
    for (const [attr, func] of Object.entries(this._derivedAttributeFunctions)) {
      result.derivedAttributeFunctions[attr] = this._mure.dehydrateFunction(func);
    }
    return result;
  }
  get name () {
    throw new Error(`this function should be overridden`);
  }
  async * iterate (options = { reset: false, limit: Infinity }) {
    // Generic caching stuff; this isn't just for performance. ConnectedTable's
    // algorithm requires that its parent tables have pre-built indexes (we
    // technically could implement it differently, but it would be expensive,
    // requires tricky logic, and we're already building indexes for some tables
    // like AggregatedTable anyway)
    if (options.reset) {
      this.reset();
    }
    if (this._cache) {
      for (const finishedItem of Object.values(this._cache)) {
        yield finishedItem;
      }
      return;
    }

    yield * await this._buildCache(options);
  }
  reset () {
    delete this._partialCache;
    delete this._cache;
    for (const derivedTable of this.derivedTables) {
      derivedTable.reset();
    }
    this.trigger('reset');
  }
  async * _buildCache (options) {
    // TODO: in large data scenarios, we should build the cache / index
    // externally on disk
    this._partialCache = {};
    const limit = options.limit;
    delete options.limit;
    const iterator = this._iterate(options);
    let completed = false;
    for (let i = 0; i < limit; i++) {
      const temp = await iterator.next();
      if (!this._partialCache) {
        // iteration was cancelled; return immediately
        return;
      }
      if (temp.done) {
        completed = true;
        break;
      } else {
        this._finishItem(temp.value);
        this._partialCache[temp.value.index] = temp.value;
        yield temp.value;
      }
    }
    if (completed) {
      this._cache = this._partialCache;
    }
    delete this._partialCache;
  }
  async * _iterate (options) {
    throw new Error(`this function should be overridden`);
  }
  _finishItem (wrappedItem) {
    for (const [attr, func] of Object.entries(this._derivedAttributeFunctions)) {
      wrappedItem.row[attr] = func(wrappedItem);
    }
    for (const attr of Object.keys(wrappedItem.row)) {
      this._observedAttributes[attr] = true;
    }
    wrappedItem.trigger('finish');
  }
  _wrap (options) {
    options.table = this;
    const classObj = this.classObj;
    return classObj ? classObj._wrap(options) : new this._mure.WRAPPERS.GenericWrapper(options);
  }
  _getAllAttributes () {
    const allAttrs = {};
    for (const attr in this._expectedAttributes) {
      allAttrs[attr] = true;
    }
    for (const attr in this._observedAttributes) {
      allAttrs[attr] = true;
    }
    for (const attr in this._derivedAttributeFunctions) {
      allAttrs[attr] = true;
    }
    return allAttrs;
  }
  get attributes () {
    return Object.keys(this._getAllAttributes());
  }
  deriveAttribute (attribute, func) {
    this._derivedAttributeFunctions[attribute] = func;
    this.reset();
  }
  _deriveTable (options) {
    const newTable = this._mure.createTable(options);
    this._derivedTables[newTable.tableId] = true;
    this._mure.saveTables();
    return newTable;
  }
  _getExistingTable (options) {
    // Check if the derived table has already been defined
    const existingTableId = this.derivedTables.find(tableObj => {
      return Object.entries(options).every(([optionName, optionValue]) => {
        if (optionName === 'type') {
          return tableObj.constructor.name === optionValue;
        } else {
          return tableObj['_' + optionName] === optionValue;
        }
      });
    });
    return (existingTableId && this._mure.tables[existingTableId]) || null;
  }
  aggregate (attribute) {
    const options = {
      type: 'AggregatedTable',
      attribute
    };
    return this._getExistingTable(options) || this._deriveTable(options);
  }
  expand (attribute, delimiter) {
    const options = {
      type: 'ExpandedTable',
      attribute,
      delimiter
    };
    return this._getExistingTable(options) || this._deriveTable(options);
  }
  closedFacet (attribute, values) {
    return values.map(value => {
      const options = {
        type: 'FilteredTable',
        attribute,
        value
      };
      return this._getExistingTable(options) || this._deriveTable(options);
    });
  }
  async * openFacet (options) {
    const values = {};
    const attribute = options.attribute;
    delete options.attribute;
    for await (const wrappedItem of this.iterate(options)) {
      const value = wrappedItem.row[attribute];
      if (!values[value]) {
        values[value] = true;
        const options = {
          type: 'FilteredTable',
          attribute,
          value
        };
        yield this._getExistingTable(options) || this._deriveTable(options);
      }
    }
  }
  connect (otherTableList) {
    const newTable = this._mure.createTable({ type: 'ConnectedTable' });
    this._derivedTables[newTable.tableId] = true;
    for (const otherTable of otherTableList) {
      otherTable._derivedTables[newTable.tableId] = true;
    }
    this._mure.saveTables();
    return newTable;
  }
  get classObj () {
    return Object.values(this._mure.classes).find(classObj => {
      return classObj.table === this;
    });
  }
  get parentTables () {
    return Object.values(this._mure.tables).reduce((agg, tableObj) => {
      if (tableObj.derivedTables[this.tableId]) {
        agg.push(tableObj);
      }
    }, []);
  }
  get derivedTables () {
    return Object.keys(this._derivedTables).map(tableId => {
      return this._mure.tables[tableId];
    });
  }
  delete () {
    if (Object.keys(this._derivedTables).length > 0 || this.classObj) {
      throw new Error(`Can't delete in-use table ${this.tableId}`);
    }
    for (const parentTable of this.parentTables) {
      delete parentTable.derivedTables[this.tableId];
    }
    delete this._mure.tables[this.tableId];
    this._mure.saveTables();
  }
}
Object.defineProperty(Table, 'type', {
  get () {
    return /(.*)Table/.exec(this.name)[1];
  }
});
export default Table;
