import jsonPath from 'jsonpath';
import { queueAsync } from 'uki';
import md5 from 'blueimp-md5';

const DEFAULT_DOC_QUERY = '{"_id":{"$gt":"_\uffff"}}';

class Selection {
  constructor (mure, selectorList = ['@' + DEFAULT_DOC_QUERY]) {
    if (!(selectorList instanceof Array)) {
      selectorList = [ selectorList ];
    }
    this.selectors = selectorList.map(selectorString => {
      const selector = mure.parseSelector(selectorString);
      if (selector === null) {
        let err = new Error('Invalid selector: ' + selectorString);
        err.INVALID_SELECTOR = true;
        throw err;
      }
      return selector;
    });

    // TODO: optimize and sort this.selectors for better hash equivalence

    this.mure = mure;
  }
  get hash () {
    if (!this._hash) {
      this._hash = md5(JSON.stringify(this.selectorList));
    }
    return this._hash;
  }
  get selectorList () {
    return this.selectors.map(selector => {
      return '@' + selector.docQuery + selector.objQuery +
        Array.from(Array(selector.parentShift)).map(d => '↑').join('') +
        (selector.followLinks ? '→' : '');
    });
  }
  get isCached () {
    return !!this._cachedWrappers;
  }
  invalidateCache () {
    delete this._cachedDocLists;
    delete this._cachedWrappers;
    delete this._summaryCaches;
  }
  async docLists () {
    if (this._cachedDocLists) {
      return this._cachedDocLists;
    }
    this._cachedDocLists = await Promise.all(this.selectors
      .map(d => this.mure.queryDocs({ selector: d.parsedDocQuery })));
    // We want all selections to operate from exactly the same document object,
    // so it's easy / straightforward for Wrappers to just mutate their own value
    // references, and have those changes automatically appear in documents
    // when they're saved... so we actually want to *swap out* matching documents
    // for their cached versions
    for (let i = 0; i < this._cachedDocLists.length; i++) {
      for (let j = 0; j < this._cachedDocLists[i].length; j++) {
        const doc = this._cachedDocLists[i][j];
        if (Selection.CACHED_DOCS[doc._id]) {
          if (Selection.CACHED_DOCS[doc._id].selections.indexOf(this) === -1) {
            // Register as a selection that's using this cache, so we're
            // notified in the event that it gets invalidated
            Selection.CACHED_DOCS[doc._id].selections.push(this);
          }
          // Verify that the doc has not changed (we watch for changes and
          // invalidate caches in mure.getOrInitDb, so this should never happen)
          if (doc._rev !== Selection.CACHED_DOCS[doc._id].cachedDoc._rev) {
            throw new Error('Cached document _rev changed without notification');
          }
          // Swap for the cached version
          this._cachedDocLists[i][j] = Selection.CACHED_DOCS[doc._id].cachedDoc;
        } else {
          // We're the first one to cache this document, so use ours
          Selection.CACHED_DOCS[doc._id] = {
            selections: [this],
            cachedDoc: doc
          };
        }
      }
    }
    return this._cachedDocLists;
  }
  async items (docLists) {
    if (this._cachedWrappers) {
      return this._cachedWrappers;
    }

    // Note: we should only pass in docLists in rare situations (such as the
    // one-off case in followRelativeLink() where we already have the document
    // available, and creating the new selection will result in an unnnecessary
    // query of the database). Usually, we should rely on the cache.
    docLists = docLists || await this.docLists();

    return queueAsync(async () => {
      // Collect the results of objQuery
      this._cachedWrappers = {};
      const addWrapper = item => {
        if (!this._cachedWrappers[item.uniqueSelector]) {
          this._cachedWrappers[item.uniqueSelector] = item;
        }
      };

      for (let index = 0; index < this.selectors.length; index++) {
        const selector = this.selectors[index];
        const docList = docLists[index];

        if (selector.objQuery === '') {
          // No objQuery means that we want a view of multiple documents (other
          // shenanigans mean we shouldn't select anything)
          if (selector.parentShift === 0 && !selector.followLinks) {
            addWrapper(new this.mure.WRAPPERS.RootWrapper({
              mure: this.mure,
              docList
            }));
          }
        } else if (selector.objQuery === '$') {
          // Selecting the documents themselves
          if (selector.parentShift === 0 && !selector.followLinks) {
            docList.forEach(doc => {
              addWrapper(new this.mure.WRAPPERS.DocumentWrapper({
                mure: this.mure,
                doc
              }));
            });
          } else if (selector.parentShift === 1) {
            addWrapper(new this.mure.WRAPPERS.RootWrapper({
              mure: this.mure,
              docList
            }));
          }
        } else {
          // Okay, we need to evaluate the jsonPath
          for (let docIndex = 0; docIndex < docList.length; docIndex++) {
            let doc = docList[docIndex];
            let matchingWrappers = jsonPath.nodes(doc, selector.objQuery);
            for (let itemIndex = 0; itemIndex < matchingWrappers.length; itemIndex++) {
              let { path, value } = matchingWrappers[itemIndex];
              let localPath = path;
              if (this.mure.RESERVED_OBJ_KEYS[localPath.slice(-1)[0]]) {
                // Don't create items under reserved keys
                continue;
              } else if (selector.parentShift === localPath.length) {
                // we parent shifted up to the root level
                if (!selector.followLinks) {
                  addWrapper(new this.mure.WRAPPERS.RootWrapper({
                    mure: this.mure,
                    docList
                  }));
                }
              } else if (selector.parentShift === localPath.length - 1) {
                // we parent shifted to the document level
                if (!selector.followLinks) {
                  addWrapper(new this.mure.WRAPPERS.DocumentWrapper({
                    mure: this.mure,
                    doc
                  }));
                }
              } else {
                if (selector.parentShift > 0 && selector.parentShift < localPath.length - 1) {
                  // normal parentShift
                  localPath.splice(localPath.length - selector.parentShift);
                  value = jsonPath.query(doc, jsonPath.stringify(localPath))[0];
                }
                if (selector.followLinks) {
                  // We (potentially) selected a link that we need to follow
                  Object.values(await this.mure.followRelativeLink(value, doc))
                    .forEach(addWrapper);
                } else {
                  const WrapperType = this.mure.inferType(value);
                  addWrapper(new WrapperType({
                    mure: this.mure,
                    value,
                    path: [`{"_id":"${doc._id}"}`].concat(localPath),
                    doc
                  }));
                }
              }
            }
          }
        }
      }
      return this._cachedWrappers;
    });
  }
  async execute (operation, inputOptions) {
    let outputSpec = await operation.executeOnSelection(this, inputOptions);

    const pollutedDocs = Object.values(outputSpec.pollutedDocs);

    // Write any warnings, and, depending on the user's settings, skip or save
    // the results
    let skipSave = false;
    if (Object.keys(outputSpec.warnings).length > 0) {
      let warningString;
      if (outputSpec.ignoreErrors === 'Stop on Error') {
        skipSave = true;
        warningString = `${operation.humanReadableType} operation failed.\n`;
      } else {
        warningString = `${operation.humanReadableType} operation finished with warnings:\n`;
      }
      warningString += Object.entries(outputSpec.warnings).map(([warning, count]) => {
        if (count > 1) {
          return `${warning} (x${count})`;
        } else {
          return `${warning}`;
        }
      });
      this.mure.warn(warningString);
    }
    let saveSuccessful = false;
    if (!skipSave) {
      // Save the results
      const saveResult = await this.mure.putDocs(pollutedDocs);
      saveSuccessful = saveResult.error !== true;
      if (!saveSuccessful) {
        // There was a problem saving the result
        this.mure.warn(saveResult.message);
      }
    }

    // Any selection that has cached any of the documents that we altered
    // needs to have its cache invalidated
    pollutedDocs.forEach(doc => {
      Selection.INVALIDATE_DOC_CACHE(doc._id);
    });

    // Finally, return this selection, or a new selection, depending on the
    // operation
    if (saveSuccessful && outputSpec.newSelectors !== null) {
      return new Selection(this.mure, outputSpec.newSelectors);
    } else {
      return this;
    }
  }

  /*
   Shortcuts for selection manipulation
   */
  async subSelect (append, mode = 'Replace') {
    return this.selectAll({ context: 'Selector', append, mode });
  }
  async mergeSelection (otherSelection) {
    return this.selectAll({ context: 'Selection', otherSelection, mode: 'Union' });
  }

  /*
   These functions provide statistics / summaries of the selection:
   */
  async getPopulatedInputSpec (operation) {
    if (this._summaryCaches && this._summaryCaches.inputSpecs &&
        this._summaryCaches.inputSpecs[operation.type]) {
      return this._summaryCaches.inputSpecs[operation.type];
    }

    const inputSpec = operation.getInputSpec();
    await inputSpec.populateChoicesFromSelection(this);

    this._summaryCaches = this._summaryCaches || {};
    this._summaryCaches.inputSpecs = this._summaryCaches.inputSpecs || {};
    this._summaryCaches.inputSpecs[operation.type] = inputSpec;
    return inputSpec;
  }
  async histograms (numBins = 20) {
    if (this._summaryCaches && this._summaryCaches.histograms) {
      return this._summaryCaches.histograms;
    }

    const items = await this.items();
    const itemList = Object.values(items);

    let result = {
      raw: {
        typeBins: {},
        categoricalBins: {},
        quantitativeBins: []
      },
      attributes: {}
    };

    const countPrimitive = (counters, item) => {
      // Attempt to count the value categorically
      if (counters.categoricalBins !== null) {
        counters.categoricalBins[item.value] = (counters.categoricalBins[item.value] || 0) + 1;
        if (Object.keys(counters.categoricalBins).length > numBins) {
          // We've encountered too many categorical bins; this likely isn't a categorical attribute
          counters.categoricalBins = null;
        }
      }
      // Attempt to bin the value quantitatively
      if (counters.quantitativeBins !== null) {
        if (counters.quantitativeBins.length === 0) {
          // Init the counters with some temporary placeholders
          counters.quantitativeWrappers = [];
          counters.quantitativeType = item.type;
          if (item instanceof this.mure.WRAPPERS.NumberWrapper) {
            counters.quantitativeScale = this.mure.d3.scaleLinear()
              .domain([item.value, item.value]);
          } else if (item instanceof this.mure.WRAPPERS.DateWrapper) {
            counters.quantitativeScale = this.mure.d3.scaleTime()
              .domain([item.value, item.value]);
          } else {
            // The first value is non-quantitative; this likely isn't a quantitative attribute
            counters.quantitativeBins = null;
            delete counters.quantitativeWrappers;
            delete counters.quantitativeType;
            delete counters.quantitativeScale;
          }
        } else if (counters.quantitativeType !== item.type) {
          // Encountered an item of a different type; this likely isn't a quantitative attribute
          counters.quantitativeBins = null;
          delete counters.quantitativeWrappers;
          delete counters.quantitativeType;
          delete counters.quantitativeScale;
        } else {
          // Update the scale's domain (we'll determine bins later)
          let domain = counters.quantitativeScale.domain();
          if (item.value < domain[0]) {
            domain[0] = item.value;
          }
          if (item.value > domain[1]) {
            domain[1] = item.value;
          }
          counters.quantitativeScale.domain(domain);
        }
      }
    };

    for (let i = 0; i < itemList.length; i++) {
      const item = itemList[i];
      result.raw.typeBins[item.type] = (result.raw.typeBins[item.type] || 0) + 1;
      if (item instanceof this.mure.WRAPPERS.PrimitiveWrapper) {
        countPrimitive(result.raw, item);
      } else {
        if (item.getContents) {
          Object.values(item.getContents()).forEach(childWrapper => {
            const counters = result.attributes[childWrapper.label] = result.attributes[childWrapper.label] || {
              typeBins: {},
              categoricalBins: {},
              quantitativeBins: []
            };
            counters.typeBins[childWrapper.type] = (counters.typeBins[childWrapper.type] || 0) + 1;
            if (childWrapper instanceof this.mure.WRAPPERS.PrimitiveWrapper) {
              countPrimitive(counters, childWrapper);
            }
          });
        }
        // TODO: collect more statistics, such as node degree, set size
        // (and a set's members' attributes, similar to getContents?)
      }
    }

    const finalizeBins = counters => {
      // Clear out anything that didn't see any values
      if (counters.typeBins && Object.keys(counters.typeBins).length === 0) {
        counters.typeBins = null;
      }
      if (counters.categoricalBins &&
          Object.keys(counters.categoricalBins).length === 0) {
        counters.categoricalBins = null;
      }
      if (counters.quantitativeBins) {
        if (!counters.quantitativeWrappers ||
             counters.quantitativeWrappers.length === 0) {
          counters.quantitativeBins = null;
          delete counters.quantitativeWrappers;
          delete counters.quantitativeType;
          delete counters.quantitativeScale;
        } else {
          // Calculate quantitative bin sizes and their counts
          // Clean up the scale a bit
          counters.quantitativeScale.nice();
          // Histogram generator
          const histogramGenerator = this.mure.d3.histogram()
            .domain(counters.quantitativeScale.domain())
            .thresholds(counters.quantitativeScale.ticks(numBins))
            .value(d => d.value);
          counters.quantitativeBins = histogramGenerator(counters.quantitativeWrappers);
          // Clean up some of the temporary placeholders
          delete counters.quantitativeWrappers;
          delete counters.quantitativeType;
        }
      }
    };
    finalizeBins(result.raw);
    Object.values(result.attributes).forEach(finalizeBins);

    this._summaryCaches = this._summaryCaches || {};
    this._summaryCaches.histograms = result;
    return result;
  }
  async getFlatGraphSchema () {
    if (this._summaryCaches && this._summaryCaches.flatGraphSchema) {
      return this._summaryCaches.flatGraphSchema;
    }

    const items = await this.items();
    let result = {
      nodeClasses: {},
      edgeClasses: {},
      missingNodes: false,
      missingEdges: false
    };

    // First pass: identify items by class, and generate pseudo-items that
    // point to classes instead of selectors
    Object.entries(items).forEach(([uniqueSelector, item]) => {
      if (item instanceof this.mure.WRAPPERS.EdgeWrapper) {
        // This is an edge; create / add to a pseudo-item for each class
        let classList = item.getClasses();
        if (classList.length === 0) {
          classList.push('(no class)');
        }
        classList.forEach(edgeClassName => {
          let pseudoEdge = result.edgeClasses[edgeClassName] =
            result.edgeClasses[edgeClassName] || { $nodes: {} };
          // Add our direction counts for each of the node's classes to the pseudo-item
          Object.entries(item.value.$nodes).forEach(([nodeSelector, directions]) => {
            let nodeWrapper = items[nodeSelector];
            if (!nodeWrapper) {
              // This edge refers to a node outside the selection
              result.missingNodes = true;
            } else {
              nodeWrapper.getClasses().forEach(nodeClassName => {
                Object.entries(directions).forEach(([direction, count]) => {
                  pseudoEdge.$nodes[nodeClassName] = pseudoEdge.$nodes[nodeClassName] || {};
                  pseudoEdge.$nodes[nodeClassName][direction] = pseudoEdge.$nodes[nodeClassName][direction] || 0;
                  pseudoEdge.$nodes[nodeClassName][direction] += count;
                });
              });
            }
          });
        });
      } else if (item instanceof this.mure.WRAPPERS.NodeWrapper) {
        // This is a node; create / add to a pseudo-item for each class
        let classList = item.getClasses();
        if (classList.length === 0) {
          classList.push('(no class)');
        }
        classList.forEach(nodeClassName => {
          let pseudoNode = result.nodeClasses[nodeClassName] =
            result.nodeClasses[nodeClassName] || { count: 0, $edges: {} };
          pseudoNode.count += 1;
          // Ensure that the edge class is referenced (directions' counts are kept on the edges)
          Object.keys(item.value.$edges).forEach(edgeSelector => {
            let edgeWrapper = items[edgeSelector];
            if (!edgeWrapper) {
              // This node refers to an edge outside the selection
              result.missingEdges = true;
            } else {
              edgeWrapper.getClasses().forEach(edgeClassName => {
                pseudoNode.$edges[edgeClassName] = true;
              });
            }
          });
        });
      }
    });

    this._summaryCaches = this._summaryCaches || {};
    this._summaryCaches.flatGraphSchema = result;
    return result;
  }
  async getIntersectedGraphSchema () {
    // const items = await this.items();
    throw new Error('unimplemented');
  }
  async allMetaObjIntersections (metaObjs) {
    const items = await this.items();
    let linkedIds = {};
    items.forEach(item => {
      metaObjs.forEach(metaObj => {
        if (item.value[metaObj]) {
          Object.keys(item.value[metaObj]).forEach(linkedId => {
            linkedId = this.mure.idToUniqueSelector(linkedId, item.doc._id);
            linkedIds[linkedId] = linkedIds[linkedId] || {};
            linkedIds[linkedId][item.uniqueSelector] = true;
          });
        }
      });
    });
    let sets = [];
    let setLookup = {};
    Object.keys(linkedIds).forEach(linkedId => {
      let itemIds = Object.keys(linkedIds[linkedId]).sort();
      let setKey = itemIds.join(',');
      if (setLookup[setKey] === undefined) {
        setLookup[setKey] = sets.length;
        sets.push({ itemIds, linkedIds: {} });
      }
      setLookup[setKey].linkedIds[linkedId] = true;
    });
    return sets;
  }
}
// TODO: this way of dealing with cache invalidation causes a memory leak, as
// old selections are going to pile up in CACHED_DOCS after they've lost all
// other references, preventing their garbage collection. Unfortunately things
// like WeakMap aren't enumerable... a good idea would probably be to just
// purge the cache every n minutes or so...?
Selection.DEFAULT_DOC_QUERY = DEFAULT_DOC_QUERY;
Selection.CACHED_DOCS = {};
Selection.INVALIDATE_DOC_CACHE = docId => {
  if (Selection.CACHED_DOCS[docId]) {
    Selection.CACHED_DOCS[docId].selections.forEach(selection => {
      selection.invalidateCache();
    });
    delete Selection.CACHED_DOCS[docId];
  }
};
Selection.INVALIDATE_ALL_CACHES = () => {
  Object.values(Selection.CACHED_DOCS).forEach(({ cachedDoc, selections }) => {
    selections.forEach(selection => {
      selection.invalidateCache();
    });
    delete Selection.CACHED_DOCS[cachedDoc._id];
  });
};
export default Selection;
