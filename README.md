origraph.js
===========
[![Build Status](https://travis-ci.org/origraph/origraph.js.svg?branch=master)](https://travis-ci.org/origraph/origraph.js)
[![Coverage Status](https://coveralls.io/repos/github/origraph/origraph.js/badge.svg?branch=master)](https://coveralls.io/github/origraph/origraph.js?branch=master)


`origraph.js` is a library for wrangling graph data. Graph constructs (like what is a node, and what is an edge) are deliberately lightweight, so that they are easy to map (and re-map) to data tables, regardless of how the raw data is structured.

Be advised that this is project is *very* work-in-progress, and is being implemented in parallel with [Origraph](https://github.com/origraph/origraph.js), a non-programmer's visual interface for using this library.
Expect frequent sweeping changes and poor documentation for now, especially as we explore and refine what constructs and operations are even important for this graph data wrangling.

# Installation and Usage

## Basic use in the browser
This will make the `window.origraph` global available to your scripts:
```html
<script src="https://cdn.jsdelivr.net/npm/origraph@0.2.8/dist/origraph.umd.js"></script>
```

## Server-side apps or pre-bundled browser apps

Installation:
```bash
npm install origraph
```

Usage example:
```js
const fs = require('fs');
const origraph = require('origraph');

// Load a file
fs.readFile(`miserables.json`, 'utf8', async (err, text) => {
  if (err) { throw err; }

  // Initialize a network model
  const model = origraph.createModel({
    name: 'Les Miserables'
  });

  // This dataset comes in one base class...
  const baseClass = await model.addTextFile({
    name: 'miserables.json',
    text
  });
  // ... that we split up:
  let [ nodeClass, edgeClass ] = baseClass
    .closedTranspose(['nodes', 'links']);
  // We don't need baseClass anymore:
  baseClass.delete();

  // Now for the interpretive part:
  nodeClass = nodeClass.interpretAsNodes();
  nodeClass.setClassName('Characters');
  edgeClass = edgeClass.interpretAsEdges();
  edgeClass.setClassName('Co-occurrence');

  // With classes set up, let's connect them:
  edgeClass.connectToNodeClass({
    nodeClass,
    side: 'source',
    nodeAttribute: 'index',
    edgeAttribute: 'source'
  });
  edgeClass.connectToNodeClass({
    nodeClass,
    side: 'target',
    nodeAttribute: 'index',
    edgeAttribute: 'target'
  });

  // Finally, let's export as GEXF:
  const { data } = await model.formatData({
    format: 'GEXF',
    rawText: true
  });
  fs.writeFile('miserables.gexf', data,
    (err) => {
      if (err) { throw err; }
    });
});
```

Development
===========
## Setup:

```bash
git clone https://github.com/origraph/origraph.js.git
cd origraph.js
npm install
```

## Debugging:
When debugging with the test scripts, launch these as parallel processes:

```
npm run watchcjs
```

```
npm run debug
```

## Debugging in the browser:
When debugging in the browser, launch this in parallel to whatever you're using to debug / serve your web app (make sure to point your app to the built `dist/origraph.umd.js` file):
```
npm run watchumd
```

# Releasing a new version
A list of reminders to make sure we don't forget any steps:

- Update the version number in `package.json`
- Update the release link in this README
- `npm run build`
- `npm run test`
- `git commit -a -m "commit message"`
- `git push`
- (Verify Travis CI doesn't fail)
- `git tag -a #.#.# -m "tag annotation"`
- `git push --tags`
- `npm publish`
- (maybe optional) Edit / document the release on Github, add built files in `dist`
