import Table from './Table.js';
import SingleParentMixin from './SingleParentMixin.js';

class FacetedTable extends SingleParentMixin(Table) {
  constructor (options) {
    super(options);
    this._attribute = options.attribute;
    this._value = options.value;
    if (!this._attribute === undefined || !this._value === undefined) {
      throw new Error(`attribute and value are required`);
    }
  }
  _toRawObject () {
    const obj = super._toRawObject();
    obj.attribute = this._attribute;
    obj.value = this._value;
    return obj;
  }
  get name () {
    return `${this.parentTable.name}[${this._value}]`;
  }
  async * _iterate (options) {
    let index = 0;
    const parentTable = this.parentTable;
    for await (const wrappedParent of parentTable.iterate(options)) {
      const includeItem = () => {
        const newItem = this._wrap({
          index,
          row: Object.assign({}, wrappedParent.row)
        });
        newItem.connectItem(parentTable.tableId, wrappedParent);
        wrappedParent.connectItem(this.tableId, newItem);
        this._finishItem(newItem);
        index++;
        return newItem;
      };
      if (this._attribute === null) {
        if (wrappedParent.index === this._value) {
          yield includeItem();
        }
      } else {
        if (wrappedParent.row[this._attribute] === this._value) {
          yield includeItem();
        }
      }
    }
  }
}
export default FacetedTable;