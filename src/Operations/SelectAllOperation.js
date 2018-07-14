import Selection from '../Selection.js';
import BaseOperation from './Common/BaseOperation.js';
import OutputSpec from './Common/OutputSpec.js';
import ContextualOption from './Common/ContextualOption.js';
import InputOption from './Common/InputOption.js';

class SelectAllOperation extends BaseOperation {
  getInputSpec () {
    const result = super.getInputSpec();
    const context = new ContextualOption({
      parameterName: 'context',
      choices: ['Children', 'Parents', 'Nodes', 'Edges', 'Members'],
      hiddenChoices: ['Selector', 'Selector List', 'Selection'],
      defaultValue: 'Children'
    });
    result.addOption(context);

    const direction = new InputOption({
      parameterName: 'direction',
      choices: ['Ignore', 'Forward', 'Backward'],
      defaultValue: 'Ignore'
    });
    context.specs['Nodes'].addOption(direction);
    context.specs['Edges'].addOption(direction);

    // Extra settings for hidden modes:
    context.specs['Selector'].addOption(new InputOption({
      parameterName: 'append',
      defaultValue: '[*]',
      openEnded: true
    }));
    context.specs['Selector List'].addOption(new InputOption({
      paramterName: 'selectorList',
      defaultValue: []
    }));
    context.specs['Selection'].addOption(new InputOption({
      parameterName: 'otherSelection'
    }));

    const mode = new InputOption({
      parameterName: 'mode',
      choices: ['Replace', 'Union', 'XOR'],
      defaultValue: 'Replace'
    });
    context.specs['Selector'].addOption(mode);
    context.specs['Selector List'].addOption(mode);
    context.specs['Selection'].addOption(mode);
  }
  async canExecuteOnInstance (item, inputOptions) {
    if (await super.canExecuteOnInstance(item, inputOptions)) {
      return true;
    }
    if (inputOptions.context === 'Children') {
      return item instanceof this.mure.CONSTRUCTS.ItemConstruct ||
        item instanceof this.mure.CONSTRUCTS.DocumentConstruct;
    } else if (inputOptions.context === 'Parents') {
      return !(item instanceof this.mure.CONSTRUCTS.DocumentConstruct ||
        item instanceof this.mure.CONSTRUCTS.RootConstruct);
    } else if (inputOptions.context === 'Nodes') {
      return item instanceof this.mure.CONSTRUCTS.NodeConstruct ||
        item instanceof this.mure.CONSTRUCTS.EdgeConstruct;
    } else if (inputOptions.context === 'Edges') {
      return item instanceof this.mure.CONSTRUCTS.NodeConstruct ||
        item instanceof this.mure.CONSTRUCTS.EdgeConstruct;
    } else if (inputOptions.context === 'Members') {
      return item instanceof this.mure.CONSTRUCTS.SetConstruct ||
        item instanceof this.mure.CONSTRUCTS.SupernodeConstruct;
    } else if (inputOptions.context === 'Selector') {
      return this.mure.parseSelector(item.uniqueSelector + inputOptions.append) !== null;
    } else {
      return false;
    }
  }
  async executeOnInstance (item, inputOptions) {
    const output = new OutputSpec();
    const direction = inputOptions.direction || 'Ignore';
    const forward = direction === 'Forward' ? true
      : direction === 'Backward' ? false
        : null;
    if (inputOptions.context === 'Children' &&
       (item instanceof this.mure.CONSTRUCTS.ItemConstruct ||
        item instanceof this.mure.CONSTRUCTS.DocumentConstruct)) {
      output.addSelectors((await item.contentConstructs())
        .map(childConstruct => childConstruct.uniqueSelector));
    } else if (inputOptions.context === 'Parents' &&
             !(item instanceof this.mure.CONSTRUCTS.DocumentConstruct ||
               item instanceof this.mure.CONSTRUCTS.RootConstruct)) {
      output.addSelectors([item.parentConstruct.uniqueSelector]);
    } else if (inputOptions.context === 'Nodes' &&
               item instanceof this.mure.CONSTRUCTS.EdgeConstruct) {
      output.addSelectors(await item.nodeSelectors(forward));
    } else if (inputOptions.context === 'Nodes' &&
               item instanceof this.mure.CONSTRUCTS.NodeConstruct) {
      output.addSelectors(await Promise.all((await item.edgeConstructs(forward))
        .map(edge => edge.nodeSelectors(forward))));
    } else if (inputOptions.context === 'Edges' &&
               item instanceof this.mure.CONSTRUCTS.NodeConstruct) {
      output.addSelectors(await item.edgeSelectors(forward));
    } else if (inputOptions.context === 'Edges' &&
               item instanceof this.mure.CONSTRUCTS.EdgeConstruct) {
      output.addSelectors(await Promise.all((await item.nodeConstructs(forward))
        .map(node => node.edgeSelectors(forward))));
    } else if (inputOptions.context === 'Members' &&
              (item instanceof this.mure.CONSTRUCTS.SetConstruct ||
               item instanceof this.mure.CONSTRUCTS.SupernodeConstruct)) {
      output.addSelectors(await item.memberConstructs());
    } else if (inputOptions.context === 'Selector') {
      const newString = item.uniqueSelector + inputOptions.append;
      const newSelector = this.mure.parseSelector(newString);
      if (newSelector === null) {
        output.warn(`Invalid selector: ${newString}`);
      } else {
        output.addSelectors([newString]);
      }
    } else {
      output.warn(`Can't select ${inputOptions.context} from ${item.type}`);
    }
    return output;
  }
  async canExecuteOnSelection (selection, inputOptions) {
    if (inputOptions.context === 'Selector List') {
      return inputOptions.selectorList instanceof Array;
    } else if (inputOptions.context === 'Selection') {
      return inputOptions.otherSelection instanceof Selection;
    } else {
      return super.canExecuteOnSelection(selection, inputOptions);
    }
  }
  async executeOnSelection (selection, inputOptions) {
    let otherSelectorList = inputOptions.selectorList ||
      (inputOptions.otherSelection && inputOptions.otherSelection.selectorList);
    if (otherSelectorList) {
      const output = new OutputSpec();
      if (inputOptions.mode === 'Union') {
        output.addSelectors(selection.selectorList.concat(otherSelectorList));
      } else if (inputOptions.mode === 'XOR') {
        output.addSelectors(otherSelectorList
          .filter(selector => selection.selectorList.indexOf(selector) === -1)
          .concat(selection.selectorList
            .filter(selector => otherSelectorList.indexOf(selector) === -1)));
      } else { // if (inputOptions.mode === 'Replace') {
        output.addSelectors(otherSelectorList);
      }
      return output;
    } else {
      return super.executeOnSelection(selection, inputOptions);
    }
  }
}

export default SelectAllOperation;
