import { OutputSpec } from '../common.js';
import BaseOperation from '../BaseOperation.js';
import ParameterlessMixin from '../ParameterlessMixin.js';

class ConvertContainerToNode extends ParameterlessMixin(BaseOperation) {
  checkItemInputs (item) {
    return item instanceof this.mure.ITEM_TYPES.ContainerItem;
  }
  async executeOnItem (item) {
    if (!this.checkItemInputs(item)) {
      throw new Error(`Item must be a ContainerItem`);
    }
    item.value.$tags = item.value.$tags || {};
    item.value.$edges = item.value.$edges || {};
    return new OutputSpec({
      pollutedDocs: [item.doc]
    });
  }
  async executeOnSelection (selection) {
    const temp = await super.executeOnSelection(selection);
    // Invalidate the selection's cache of items so they're properly wrapped
    // for the next chained operation
    delete selection._cachedItems;
    return temp;
  }
}

export default ConvertContainerToNode;
