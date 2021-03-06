import Table from './Table.js';
import AttrTableMixin from './AttrTableMixin.js';

class PromotedTable extends AttrTableMixin(Table) {
  async _buildCache (resolve, reject) {
    // We override _buildCache because we don't actually want to call _finishItem
    // until all unique values have been seen
    this._unfinishedCache = [];
    this._unfinishedCacheLookup = {};
    this._partialCache = [];
    this._partialCacheLookup = {};
    const iterator = this._iterate();
    let temp = { done: false };
    while (!temp.done) {
      temp = await iterator.next();
      if (!this._partialCache || temp === null) {
        // reset() was called before we could finish; we need to let everyone
        // that was waiting on us know that we can't comply
        this.handleReset(reject);
        return;
      }
      if (!temp.done) {
        this._unfinishedCacheLookup[temp.value.index] = this._unfinishedCache.length;
        this._unfinishedCache.push(temp.value);
      }
    }
    // Okay, now we've seen everything; we can call _finishItem on each of the
    // unique values
    let i = 0;
    for (const value of this._unfinishedCache) {
      if (await this._finishItem(value)) {
        // Okay, this item passed all filters, and is ready to be sent out
        // into the world
        this._partialCacheLookup[value.index] = this._partialCache.length;
        this._partialCache.push(value);
        i++;
        for (let limit of Object.keys(this._limitPromises)) {
          limit = Number(limit);
          // check if we have enough data now to satisfy any waiting requests
          if (limit <= i) {
            for (const { resolve } of this._limitPromises[limit]) {
              resolve(this._partialCache.slice(0, limit));
            }
            delete this._limitPromises[limit];
          }
        }
      }
    }
    // Done iterating! We can graduate the partial cache / lookups into
    // finished ones, and satisfy all the requests
    delete this._unfinishedCache;
    delete this._unfinishedCacheLookup;
    this._cache = this._partialCache;
    delete this._partialCache;
    this._cacheLookup = this._partialCacheLookup;
    delete this._partialCacheLookup;
    for (let limit of Object.keys(this._limitPromises)) {
      limit = Number(limit);
      for (const { resolve } of this._limitPromises[limit]) {
        resolve(this._cache.slice(0, limit));
      }
      delete this._limitPromises[limit];
    }
    delete this._cachePromise;
    this.trigger('cacheBuilt');
    resolve(this._cache);
  }
  async * _iterate () {
    const parentTable = this.parentTable;
    for await (const wrappedParent of parentTable.iterate()) {
      let index = await wrappedParent.row[this._attribute];
      if (typeof index === 'object') {
        // Don't promote [object Object] as a value (ignore unhashable values)
        continue;
      }
      index = String(index);
      if (!this._partialCache) {
        // We were reset!
        return;
      } else if (this._unfinishedCacheLookup[index] !== undefined) {
        const existingItem = this._unfinishedCache[this._unfinishedCacheLookup[index]];
        existingItem.connectItem(wrappedParent);
        wrappedParent.connectItem(existingItem);
      } else {
        const newItem = this._wrap({
          index,
          itemsToConnect: [ wrappedParent ]
        });
        yield newItem;
      }
    }
  }
}
export default PromotedTable;
