import Introspectable from '../../Common/Introspectable.js';
import InputSpec from './InputSpec.js';
import InputOption from './InputOption.js';
import OutputSpec from './OutputSpec.js';

class BaseOperation extends Introspectable {
  constructor (mure) {
    super();
    this.mure = mure;
  }
  getInputSpec () {
    const result = new InputSpec();
    result.addOption(new InputOption({
      parameterName: 'ignoreErrors',
      choices: ['Stop on Error', 'Ignore'],
      defaultValue: 'Stop on Error'
    }));
    return result;
  }
  potentiallyExecutableOnItem (item) {
    return true;
  }
  async canExecuteOnInstance (item, inputOptions) {
    return inputOptions.ignoreErrors !== 'Stop on Error';
  }
  async executeOnInstance (item, inputOptions) {
    throw new Error('unimplemented');
  }
  getItemsInUse (inputOptions) {
    const itemsInUse = {};
    Object.values(inputOptions).forEach(argument => {
      if (argument && argument.uniqueSelector) {
        itemsInUse[argument.uniqueSelector] = true;
      }
    });
    return itemsInUse;
  }
  async potentiallyExecutableOnSelection (selection) {
    const items = await selection.items();
    return Object.values(items).some(item => this.potentiallyExecutableOnItem(item));
  }
  async canExecuteOnSelection (selection, inputOptions) {
    const itemsInUse = this.getItemsInUse(inputOptions);
    const items = await selection.items();
    const canExecuteInstances = (await Promise.all(Object.values(items)
      .map(item => {
        return itemsInUse[item.uniqueSelector] || this.canExecuteOnInstance(item, inputOptions);
      })));
    if (inputOptions.ignoreErrors === 'Stop on Error') {
      return canExecuteInstances.every(canExecute => canExecute);
    } else {
      return canExecuteInstances.some(canExecute => canExecute);
    }
  }
  async executeOnSelection (selection, inputOptions) {
    const itemsInUse = this.getItemsInUse(inputOptions);
    const items = await selection.items();
    const outputSpecPromises = Object.values(items).map(item => {
      if (itemsInUse[item.uniqueSelector]) {
        return new OutputSpec(); // Ignore items that are inputOptions
      } else {
        return this.executeOnInstance(item, inputOptions);
      }
    });
    return OutputSpec.glomp(await Promise.all(outputSpecPromises));
  }
}
Object.defineProperty(BaseOperation, 'type', {
  get () {
    return /(.*)Operation/.exec(this.name)[1];
  }
});

export default BaseOperation;
