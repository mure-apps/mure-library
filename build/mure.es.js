import PouchDB from 'pouchdb';
import { Model } from 'uki';

var docs = {"name":"docs","description":"The core app / landing page for Mure","author":"Alex Bigelow","icon":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIxLjAuMiwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0U2QUIwMjt9Cgkuc3Qxe29wYWNpdHk6MC4zO2ZpbGw6Izc1NzBCMztlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDJ7b3BhY2l0eTowLjQ1O2ZpbGw6I0U2QUIwMjtlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDN7b3BhY2l0eTowLjU1O2ZpbGw6Izc1NzBCMztlbmFibGUtYmFja2dyb3VuZDpuZXcgICAgO30KCS5zdDR7b3BhY2l0eTowLjI7ZmlsbDojRTZBQjAyO2VuYWJsZS1iYWNrZ3JvdW5kOm5ldyAgICA7fQoJLnN0NXtmaWxsOiM3NTcwQjM7fQo8L3N0eWxlPgo8cG9seWdvbiBjbGFzcz0ic3QwIiBwb2ludHM9IjMzOS4zLDQwNy4zIDI1Niw1MDYgMTcyLjcsNDA3LjMgIi8+Cjxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMjE0LjEsMzcyLjIgMjk3LjUsMjczLjUgMzgwLjgsMzcyLjIgIi8+Cjxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iNTA2LDI3My41IDQyMi43LDM3Mi4yIDMzOS4zLDI3My41ICIvPgo8cG9seWdvbiBjbGFzcz0ic3QzIiBwb2ludHM9IjI1NiwyMzguNSAzMzkuMywxMzkuOCA0MjIuNywyMzguNSAiLz4KPHBvbHlnb24gY2xhc3M9InN0MiIgcG9pbnRzPSIyNTYsMjczLjUgMTcyLjcsMzcyLjIgODkuMywyNzMuNSAiLz4KPHBvbHlnb24gY2xhc3M9InN0MyIgcG9pbnRzPSI2LDIzOC41IDg5LjMsMTM5LjggMTcyLjcsMjM4LjUgIi8+Cjxwb2x5Z29uIGNsYXNzPSJzdDQiIHBvaW50cz0iMjk3LjUsMTM5LjggMjE0LjEsMjM4LjUgMTMwLjgsMTM5LjggIi8+Cjxwb2x5Z29uIGNsYXNzPSJzdDUiIHBvaW50cz0iMTcyLjcsMTA0LjcgMjU2LDYgMzM5LjMsMTA0LjcgIi8+Cjwvc3ZnPgo="};
var appList = {
	docs: docs,
	"data-binder": {"name":"data-binder","description":"A Mure app that is responsible for (re)binding data to graphics","author":"Alex Bigelow","icon":"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIxLjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe29wYWNpdHk6MC42O2ZpbGw6I0U2QUIwMjt9Cgkuc3Qxe29wYWNpdHk6MC4zO2ZpbGw6I0U2QUIwMjt9Cgkuc3Qye29wYWNpdHk6MC42O2ZpbGw6Izc1NzBCMzt9Cgkuc3Qze2ZpbGw6Izc1NzBCMzt9Cgkuc3Q0e29wYWNpdHk6MC4zO2ZpbGw6Izc1NzBCMzt9Cgkuc3Q1e2ZpbGw6I0U2QUIwMjt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTExOS43LDI2Ny43di0yMy40YzU5LjYsMCw3Ny4zLTE5LjcsODMuMi0yNi4xYzE0LjEtMTUuNywxOS0zNy40LDI0LjItNjAuNGM1LjQtMjQsMTEtNDguOSwyNy45LTY4LjMKCQlDMjc0LjEsNjcuNiwzMDQuNiw1NywzNDguMyw1N3YyMy40Yy0zNi41LDAtNjEuMyw4LTc1LjgsMjQuNWMtMTMsMTQuOS0xNy43LDM1LjgtMjIuNyw1OGMtNS42LDI0LjktMTEuNCw1MC42LTI5LjYsNzAuOQoJCUMxOTkuNywyNTYuNiwxNjYuOCwyNjcuNywxMTkuNywyNjcuN3oiLz4KCTxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0xMTkuNyw0NTV2LTIzLjRjMzQuNCwwLDk0LjMtNDAuMiwxNjQuNC0xMTAuM2wxNi42LDE2LjZDMjQ3LjEsMzkxLjMsMTcyLjQsNDU1LDExOS43LDQ1NXoiLz4KCTxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik03LjUsMjk5LjVjMzIuNy0yNi43LDU2LjYtNDcuMiw1Ni42LTYzLjhjMC0xMS03LTE2LjItMTcuOC0xNi4yYy05LjEsMC0xNi4yLDUuOC0yMi44LDExLjZMNiwyMTMuMwoJCWMxMy4zLTEzLjUsMjUuNy0xOS43LDQ1LTE5LjdjMjYuMywwLDQ0LjcsMTUuOSw0NC43LDQwLjJjMCwxOS43LTIwLjUsNDEuNC00MC42LDU4LjRjNi44LTAuOCwxNi0xLjUsMjItMS41aDI0Ljd2MjcuOEg3LjVWMjk5LjV6IgoJCS8+Cgk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNOC4yLDEwMy45SDM5VjM5LjNIMTMuNFYxOC41YzE1LTIuOCwyNC44LTYuMywzNC43LTEyLjJoMjQuOHY5Ny43aDI2Ljh2MjcuMkg4LjJWMTAzLjl6Ii8+Cgk8cGF0aCBjbGFzcz0ic3Q0IiBkPSJNNi41LDQ4OC43bDE0LjgtMjAuNWM4LDYuOCwxOC4yLDExLjQsMjcuMywxMS40YzExLjgsMCwyMC4xLTMuOCwyMC4xLTExLjRjMC05LjEtNi42LTE0LjQtMzMuNC0xNC40VjQzMQoJCWMyMS42LDAsMjkuNi01LjMsMjkuNi0xMy43YzAtNy4yLTUuNy0xMS0xNS4yLTExYy04LjcsMC0xNS42LDMuNC0yMy45LDkuOUw5LjUsMzk2LjRjMTIuMy05LjksMjYuMi0xNS42LDQxLjgtMTUuNgoJCWMyNy43LDAsNDYuMywxMi4xLDQ2LjMsMzRjMCwxMS42LTcuOCwyMC4zLTIyLDI2djAuOGMxNC44LDQuMiwyNS44LDEzLjcsMjUuOCwyOC44YzAsMjIuOC0yMy4zLDM1LjMtNDkuMywzNS4zCgkJQzMxLjUsNTA1LjgsMTYsNDk5LjMsNi41LDQ4OC43eiIvPgoJPHJlY3QgeD0iMzA1LjQiIHk9IjE5MS42IiBjbGFzcz0ic3Q0IiB3aWR0aD0iMTI0LjkiIGhlaWdodD0iMTI0LjkiLz4KCTxjaXJjbGUgY2xhc3M9InN0MiIgY3g9IjQzNy43IiBjeT0iNzQuNSIgcj0iNjguMyIvPgoJPHBvbHlnb24gY2xhc3M9InN0MyIgcG9pbnRzPSI0MjcuMSwzNjkuMiAzNDguMyw1MDUuOCA1MDYsNTA1LjggCSIvPgoJPHBhdGggY2xhc3M9InN0NSIgZD0iTTM1My45LDQ0OS4yYy0zNC42LDAtNjUtNC41LTkwLjMtMTMuM2MtMjMuOC04LjMtNDMuOS0yMC43LTU5LjgtMzYuOGMtNTMtNTMuNy01MS44LTE0MC01MC45LTIwOS4zCgkJYzAuNi00NC44LDEuMi04Ny4yLTE0LTEwMi41Yy00LjYtNC43LTEwLjctNi44LTE5LjItNi44VjU3YzE0LjgsMCwyNi45LDQuNiwzNS45LDEzLjhjMjIsMjIuMywyMS40LDY3LjMsMjAuNywxMTkuMwoJCWMtMC45LDY4LjMtMiwxNDUuNyw0NC4yLDE5Mi41YzI4LjcsMjkuMSw3Mi4zLDQzLjIsMTMzLjUsNDMuMlY0NDkuMnoiLz4KPC9nPgo8L3N2Zz4K"}
};

class Mure extends Model {
  constructor () {
    super();
    this.appList = appList;
    // Check if we're even being used in the browser (mostly useful for getting
    // access to the applist in all-apps-dev-server.js)
    if (typeof document === 'undefined' || typeof window === undefined) {
      return;
    }

    // Funky stuff to figure out if we're debugging (if that's the case, we want to use
    // localhost instead of the github link for all links)
    let windowTitle = document.getElementsByTagName('title')[0];
    windowTitle = windowTitle ? windowTitle.textContent : '';
    this.debugMode = window.location.hostname === 'localhost' && windowTitle.startsWith('Mure');

    // Figure out which app we are (or null if the mure library is being used somewhere else)
    this.currentApp = window.location.pathname.replace(/\//g, '');
    if (!this.appList[this.currentApp]) {
      this.currentApp = null;
    }

    // Create / load the local database of files
    this.lastFile = null;
    this.db = this.getOrInitDb();

    this.loadUserLibraries = false;
    this.runUserScripts = false;

    // default error handling (apps can listen for / display error messages in addition to this):
    this.on('error', errorMessage => { console.warn(errorMessage); });
    this.catchDbError = errorObj => { this.trigger('error', 'Unexpected error reading PouchDB:\n' + errorObj.stack); };

    // in the absence of a custom dialogs, just use window.prompt:
    this.prompt = window.prompt;
    this.confirm = window.confirm;
  }
  getOrInitDb () {
    let db = new PouchDB('mure');
    db.get('userPrefs').then(prefs => {
      this.lastFile = prefs.currentFile;
    }).catch(errorObj => {
      if (errorObj.message === 'missing') {
        return db.put({
          _id: 'userPrefs',
          currentFile: null
        });
      } else {
        this.catchDbError(errorObj);
      }
    });
    db.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', change => {
      if (change.id === 'userPrefs') {
        if (this.lastFile !== change.doc.currentFile) {
          // Different filename... a new one was opened, or the current file was deleted
          this.lastFile = change.doc.currentFile;
          // This will have changed the current file list
          this.getFileList().then(fileList => {
            this.trigger('fileListChange', fileList);
          });
        }
        // Whether we have a new file, or the current one was updated, fire a fileChange event
        this.getFile(change.doc.currentFile).then(fileBlob => {
          this.trigger('fileChange', fileBlob);
        });
      } else if (change.deleted && change.id !== this.lastFile) {
        // If a file is deleted that wasn't opened, it won't ever cause a change
        // to userPrefs. So we need to fire fileListChange immediately.
        this.getFileList().then(fileList => {
          this.trigger('fileListChange', fileList);
        });
      }
    }).on('error', errorObj => {
      this.catchDbError(errorObj);
    });
    return db;
  }
  setCurrentFile (filename) {
    return this.db.get('userPrefs').then(prefs => {
      prefs.currentFile = filename;
      return this.db.put(prefs);
    }).catch(this.catchDbError);
  }
  getCurrentFilename () {
    return this.db.get('userPrefs').then(prefs => {
      return prefs.currentFile;
    });
  }
  getFile (filename) {
    if (filename) {
      return this.db.getAttachment(filename, filename);
    } else {
      return Promise.resolve(null);
    }
  }
  signalSvgLoaded (loadUserLibrariesFunc, runUserScriptsFunc) {
    // Only load the SVG's linked libraries + embedded scripts if we've been told to
    let callback = this.runUserScripts ? runUserScriptsFunc : () => {};
    if (this.loadUserLibraries) {
      loadUserLibrariesFunc(callback);
    }
    this.trigger('svgLoaded');
  }
  on (eventName, callback) {
    if (!Mure.VALID_EVENTS[eventName]) {
      throw new Error('Unknown event name: ' + eventName);
    } else {
      super.on(eventName, callback);
    }
  }
  customizeConfirmDialog (showDialogFunction) {
    this.confirm = showDialogFunction;
  }
  customizePromptDialog (showDialogFunction) {
    this.prompt = showDialogFunction;
  }
  openApp (appName) {
    window.open('/' + appName, '_blank');
  }
  getSvgBlob (filename) {
    return this.db.getAttachment(filename, filename)
      .catch(this.catchDbError);
  }
  saveSvgBlob (filename, blob) {
    let dbEntry = {
      _id: filename,
      _attachments: {}
    };
    dbEntry._attachments[filename] = {
      content_type: blob.type,
      data: blob
    };
    return this.db.get(filename).then(existingDoc => {
      // the file exists... overwrite the document
      dbEntry._rev = existingDoc._rev;
      return this.db.put(dbEntry);
    }).catch(errorObj => {
      if (errorObj.message === 'missing') {
        // the file doesn't exist yet...
        return this.db.put(dbEntry);
      } else {
        this.catchDbError(errorObj);
      }
    });
  }
  getFileList () {
    return this.db.allDocs()
      .then(response => {
        let result = [];
        response.rows.forEach(d => {
          if (d.id !== 'userPrefs') {
            result.push(d.id);
          }
        });
        return result;
      }).catch(this.catchDbError);
  }
  getFileRevisions () {
    return this.db.allDocs()
      .then(response => {
        let result = {};
        response.rows.forEach(d => {
          if (d.id !== 'userPrefs') {
            result[d.id] = d.value.rev;
          }
        });
        return result;
      }).catch(this.catchDbError);
  }
  uploadSvg (fileObj) {
    let filename = fileObj.name;
    return this.getFileRevisions().then(revisionDict => {
      // Ask multiple times if the user happens to enter another filename that already exists
      while (revisionDict[filename]) {
        let newName = this.prompt.call(window,
          fileObj.name + ' already exists. Pick a new name, or leave it the same to overwrite:',
          fileObj.name);
        if (!newName) {
          return null;
        } else if (newName === filename) {
          return filename;
        } else {
          filename = newName;
        }
      }
      return filename;
    }).then(filename => {
      if (filename) {
        return this.saveSvgBlob(filename, fileObj).then(() => {
          return this.setCurrentFile(filename);
        });
      }
    }).catch(this.catchDbError);
  }
  deleteSvg (filename) {
    if (this.confirm.call(window, 'Are you sure you want to delete ' + filename + '?')) {
      return Promise.all([this.db.get(filename), this.getCurrentFilename()]).then(promiseResults => {
        let existingDoc = promiseResults[0];
        let currentFile = promiseResults[1];
        return this.db.remove(existingDoc._id, existingDoc._rev)
          .then(removeResponse => {
            if (filename === currentFile) {
              this.setCurrentFile(null).catch(this.catchDbError);
            }
            return removeResponse;
          });
      }).catch(this.catchDbError);
    }
  }
  downloadSvg (filename) {
    this.getSvgBlob(filename).then(blob => {
      // create a fake link...
      let a = document.createElement('a');
      a.style = 'display:none';
      let url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.parentNode.removeChild(a);
    }).catch(this.catchDbError);
  }
}

Mure.VALID_EVENTS = {
  fileListChange: true,
  fileChange: true,
  error: true,
  svgLoaded: true
};

let mure = new Mure();

export default mure;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVyZS5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL211cmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFBvdWNoREIgZnJvbSAncG91Y2hkYic7XG5pbXBvcnQgYXBwTGlzdCBmcm9tICcuL2FwcExpc3QuanNvbic7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJ3VraSc7XG5cbmNsYXNzIE11cmUgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXBwTGlzdCA9IGFwcExpc3Q7XG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgZXZlbiBiZWluZyB1c2VkIGluIHRoZSBicm93c2VyIChtb3N0bHkgdXNlZnVsIGZvciBnZXR0aW5nXG4gICAgLy8gYWNjZXNzIHRvIHRoZSBhcHBsaXN0IGluIGFsbC1hcHBzLWRldi1zZXJ2ZXIuanMpXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHdpbmRvdyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRnVua3kgc3R1ZmYgdG8gZmlndXJlIG91dCBpZiB3ZSdyZSBkZWJ1Z2dpbmcgKGlmIHRoYXQncyB0aGUgY2FzZSwgd2Ugd2FudCB0byB1c2VcbiAgICAvLyBsb2NhbGhvc3QgaW5zdGVhZCBvZiB0aGUgZ2l0aHViIGxpbmsgZm9yIGFsbCBsaW5rcylcbiAgICBsZXQgd2luZG93VGl0bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGl0bGUnKVswXTtcbiAgICB3aW5kb3dUaXRsZSA9IHdpbmRvd1RpdGxlID8gd2luZG93VGl0bGUudGV4dENvbnRlbnQgOiAnJztcbiAgICB0aGlzLmRlYnVnTW9kZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2xvY2FsaG9zdCcgJiYgd2luZG93VGl0bGUuc3RhcnRzV2l0aCgnTXVyZScpO1xuXG4gICAgLy8gRmlndXJlIG91dCB3aGljaCBhcHAgd2UgYXJlIChvciBudWxsIGlmIHRoZSBtdXJlIGxpYnJhcnkgaXMgYmVpbmcgdXNlZCBzb21ld2hlcmUgZWxzZSlcbiAgICB0aGlzLmN1cnJlbnRBcHAgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXFwvL2csICcnKTtcbiAgICBpZiAoIXRoaXMuYXBwTGlzdFt0aGlzLmN1cnJlbnRBcHBdKSB7XG4gICAgICB0aGlzLmN1cnJlbnRBcHAgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSAvIGxvYWQgdGhlIGxvY2FsIGRhdGFiYXNlIG9mIGZpbGVzXG4gICAgdGhpcy5sYXN0RmlsZSA9IG51bGw7XG4gICAgdGhpcy5kYiA9IHRoaXMuZ2V0T3JJbml0RGIoKTtcblxuICAgIHRoaXMubG9hZFVzZXJMaWJyYXJpZXMgPSBmYWxzZTtcbiAgICB0aGlzLnJ1blVzZXJTY3JpcHRzID0gZmFsc2U7XG5cbiAgICAvLyBkZWZhdWx0IGVycm9yIGhhbmRsaW5nIChhcHBzIGNhbiBsaXN0ZW4gZm9yIC8gZGlzcGxheSBlcnJvciBtZXNzYWdlcyBpbiBhZGRpdGlvbiB0byB0aGlzKTpcbiAgICB0aGlzLm9uKCdlcnJvcicsIGVycm9yTWVzc2FnZSA9PiB7IGNvbnNvbGUud2FybihlcnJvck1lc3NhZ2UpOyB9KTtcbiAgICB0aGlzLmNhdGNoRGJFcnJvciA9IGVycm9yT2JqID0+IHsgdGhpcy50cmlnZ2VyKCdlcnJvcicsICdVbmV4cGVjdGVkIGVycm9yIHJlYWRpbmcgUG91Y2hEQjpcXG4nICsgZXJyb3JPYmouc3RhY2spOyB9O1xuXG4gICAgLy8gaW4gdGhlIGFic2VuY2Ugb2YgYSBjdXN0b20gZGlhbG9ncywganVzdCB1c2Ugd2luZG93LnByb21wdDpcbiAgICB0aGlzLnByb21wdCA9IHdpbmRvdy5wcm9tcHQ7XG4gICAgdGhpcy5jb25maXJtID0gd2luZG93LmNvbmZpcm07XG4gIH1cbiAgZ2V0T3JJbml0RGIgKCkge1xuICAgIGxldCBkYiA9IG5ldyBQb3VjaERCKCdtdXJlJyk7XG4gICAgZGIuZ2V0KCd1c2VyUHJlZnMnKS50aGVuKHByZWZzID0+IHtcbiAgICAgIHRoaXMubGFzdEZpbGUgPSBwcmVmcy5jdXJyZW50RmlsZTtcbiAgICB9KS5jYXRjaChlcnJvck9iaiA9PiB7XG4gICAgICBpZiAoZXJyb3JPYmoubWVzc2FnZSA9PT0gJ21pc3NpbmcnKSB7XG4gICAgICAgIHJldHVybiBkYi5wdXQoe1xuICAgICAgICAgIF9pZDogJ3VzZXJQcmVmcycsXG4gICAgICAgICAgY3VycmVudEZpbGU6IG51bGxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNhdGNoRGJFcnJvcihlcnJvck9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGIuY2hhbmdlcyh7XG4gICAgICBzaW5jZTogJ25vdycsXG4gICAgICBsaXZlOiB0cnVlLFxuICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgfSkub24oJ2NoYW5nZScsIGNoYW5nZSA9PiB7XG4gICAgICBpZiAoY2hhbmdlLmlkID09PSAndXNlclByZWZzJykge1xuICAgICAgICBpZiAodGhpcy5sYXN0RmlsZSAhPT0gY2hhbmdlLmRvYy5jdXJyZW50RmlsZSkge1xuICAgICAgICAgIC8vIERpZmZlcmVudCBmaWxlbmFtZS4uLiBhIG5ldyBvbmUgd2FzIG9wZW5lZCwgb3IgdGhlIGN1cnJlbnQgZmlsZSB3YXMgZGVsZXRlZFxuICAgICAgICAgIHRoaXMubGFzdEZpbGUgPSBjaGFuZ2UuZG9jLmN1cnJlbnRGaWxlO1xuICAgICAgICAgIC8vIFRoaXMgd2lsbCBoYXZlIGNoYW5nZWQgdGhlIGN1cnJlbnQgZmlsZSBsaXN0XG4gICAgICAgICAgdGhpcy5nZXRGaWxlTGlzdCgpLnRoZW4oZmlsZUxpc3QgPT4ge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdmaWxlTGlzdENoYW5nZScsIGZpbGVMaXN0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGV0aGVyIHdlIGhhdmUgYSBuZXcgZmlsZSwgb3IgdGhlIGN1cnJlbnQgb25lIHdhcyB1cGRhdGVkLCBmaXJlIGEgZmlsZUNoYW5nZSBldmVudFxuICAgICAgICB0aGlzLmdldEZpbGUoY2hhbmdlLmRvYy5jdXJyZW50RmlsZSkudGhlbihmaWxlQmxvYiA9PiB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKCdmaWxlQ2hhbmdlJywgZmlsZUJsb2IpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoY2hhbmdlLmRlbGV0ZWQgJiYgY2hhbmdlLmlkICE9PSB0aGlzLmxhc3RGaWxlKSB7XG4gICAgICAgIC8vIElmIGEgZmlsZSBpcyBkZWxldGVkIHRoYXQgd2Fzbid0IG9wZW5lZCwgaXQgd29uJ3QgZXZlciBjYXVzZSBhIGNoYW5nZVxuICAgICAgICAvLyB0byB1c2VyUHJlZnMuIFNvIHdlIG5lZWQgdG8gZmlyZSBmaWxlTGlzdENoYW5nZSBpbW1lZGlhdGVseS5cbiAgICAgICAgdGhpcy5nZXRGaWxlTGlzdCgpLnRoZW4oZmlsZUxpc3QgPT4ge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcignZmlsZUxpc3RDaGFuZ2UnLCBmaWxlTGlzdCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pLm9uKCdlcnJvcicsIGVycm9yT2JqID0+IHtcbiAgICAgIHRoaXMuY2F0Y2hEYkVycm9yKGVycm9yT2JqKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGI7XG4gIH1cbiAgc2V0Q3VycmVudEZpbGUgKGZpbGVuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZGIuZ2V0KCd1c2VyUHJlZnMnKS50aGVuKHByZWZzID0+IHtcbiAgICAgIHByZWZzLmN1cnJlbnRGaWxlID0gZmlsZW5hbWU7XG4gICAgICByZXR1cm4gdGhpcy5kYi5wdXQocHJlZnMpO1xuICAgIH0pLmNhdGNoKHRoaXMuY2F0Y2hEYkVycm9yKTtcbiAgfVxuICBnZXRDdXJyZW50RmlsZW5hbWUgKCkge1xuICAgIHJldHVybiB0aGlzLmRiLmdldCgndXNlclByZWZzJykudGhlbihwcmVmcyA9PiB7XG4gICAgICByZXR1cm4gcHJlZnMuY3VycmVudEZpbGU7XG4gICAgfSk7XG4gIH1cbiAgZ2V0RmlsZSAoZmlsZW5hbWUpIHtcbiAgICBpZiAoZmlsZW5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmRiLmdldEF0dGFjaG1lbnQoZmlsZW5hbWUsIGZpbGVuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gIH1cbiAgc2lnbmFsU3ZnTG9hZGVkIChsb2FkVXNlckxpYnJhcmllc0Z1bmMsIHJ1blVzZXJTY3JpcHRzRnVuYykge1xuICAgIC8vIE9ubHkgbG9hZCB0aGUgU1ZHJ3MgbGlua2VkIGxpYnJhcmllcyArIGVtYmVkZGVkIHNjcmlwdHMgaWYgd2UndmUgYmVlbiB0b2xkIHRvXG4gICAgbGV0IGNhbGxiYWNrID0gdGhpcy5ydW5Vc2VyU2NyaXB0cyA/IHJ1blVzZXJTY3JpcHRzRnVuYyA6ICgpID0+IHt9O1xuICAgIGlmICh0aGlzLmxvYWRVc2VyTGlicmFyaWVzKSB7XG4gICAgICBsb2FkVXNlckxpYnJhcmllc0Z1bmMoY2FsbGJhY2spO1xuICAgIH1cbiAgICB0aGlzLnRyaWdnZXIoJ3N2Z0xvYWRlZCcpO1xuICB9XG4gIG9uIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFNdXJlLlZBTElEX0VWRU5UU1tldmVudE5hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZXZlbnQgbmFtZTogJyArIGV2ZW50TmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1cGVyLm9uKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuICBjdXN0b21pemVDb25maXJtRGlhbG9nIChzaG93RGlhbG9nRnVuY3Rpb24pIHtcbiAgICB0aGlzLmNvbmZpcm0gPSBzaG93RGlhbG9nRnVuY3Rpb247XG4gIH1cbiAgY3VzdG9taXplUHJvbXB0RGlhbG9nIChzaG93RGlhbG9nRnVuY3Rpb24pIHtcbiAgICB0aGlzLnByb21wdCA9IHNob3dEaWFsb2dGdW5jdGlvbjtcbiAgfVxuICBvcGVuQXBwIChhcHBOYW1lKSB7XG4gICAgd2luZG93Lm9wZW4oJy8nICsgYXBwTmFtZSwgJ19ibGFuaycpO1xuICB9XG4gIGdldFN2Z0Jsb2IgKGZpbGVuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZGIuZ2V0QXR0YWNobWVudChmaWxlbmFtZSwgZmlsZW5hbWUpXG4gICAgICAuY2F0Y2godGhpcy5jYXRjaERiRXJyb3IpO1xuICB9XG4gIHNhdmVTdmdCbG9iIChmaWxlbmFtZSwgYmxvYikge1xuICAgIGxldCBkYkVudHJ5ID0ge1xuICAgICAgX2lkOiBmaWxlbmFtZSxcbiAgICAgIF9hdHRhY2htZW50czoge31cbiAgICB9O1xuICAgIGRiRW50cnkuX2F0dGFjaG1lbnRzW2ZpbGVuYW1lXSA9IHtcbiAgICAgIGNvbnRlbnRfdHlwZTogYmxvYi50eXBlLFxuICAgICAgZGF0YTogYmxvYlxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuZGIuZ2V0KGZpbGVuYW1lKS50aGVuKGV4aXN0aW5nRG9jID0+IHtcbiAgICAgIC8vIHRoZSBmaWxlIGV4aXN0cy4uLiBvdmVyd3JpdGUgdGhlIGRvY3VtZW50XG4gICAgICBkYkVudHJ5Ll9yZXYgPSBleGlzdGluZ0RvYy5fcmV2O1xuICAgICAgcmV0dXJuIHRoaXMuZGIucHV0KGRiRW50cnkpO1xuICAgIH0pLmNhdGNoKGVycm9yT2JqID0+IHtcbiAgICAgIGlmIChlcnJvck9iai5tZXNzYWdlID09PSAnbWlzc2luZycpIHtcbiAgICAgICAgLy8gdGhlIGZpbGUgZG9lc24ndCBleGlzdCB5ZXQuLi5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGIucHV0KGRiRW50cnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYXRjaERiRXJyb3IoZXJyb3JPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGdldEZpbGVMaXN0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5kYi5hbGxEb2NzKClcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICByZXNwb25zZS5yb3dzLmZvckVhY2goZCA9PiB7XG4gICAgICAgICAgaWYgKGQuaWQgIT09ICd1c2VyUHJlZnMnKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChkLmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSkuY2F0Y2godGhpcy5jYXRjaERiRXJyb3IpO1xuICB9XG4gIGdldEZpbGVSZXZpc2lvbnMgKCkge1xuICAgIHJldHVybiB0aGlzLmRiLmFsbERvY3MoKVxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIHJlc3BvbnNlLnJvd3MuZm9yRWFjaChkID0+IHtcbiAgICAgICAgICBpZiAoZC5pZCAhPT0gJ3VzZXJQcmVmcycpIHtcbiAgICAgICAgICAgIHJlc3VsdFtkLmlkXSA9IGQudmFsdWUucmV2O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KS5jYXRjaCh0aGlzLmNhdGNoRGJFcnJvcik7XG4gIH1cbiAgdXBsb2FkU3ZnIChmaWxlT2JqKSB7XG4gICAgbGV0IGZpbGVuYW1lID0gZmlsZU9iai5uYW1lO1xuICAgIHJldHVybiB0aGlzLmdldEZpbGVSZXZpc2lvbnMoKS50aGVuKHJldmlzaW9uRGljdCA9PiB7XG4gICAgICAvLyBBc2sgbXVsdGlwbGUgdGltZXMgaWYgdGhlIHVzZXIgaGFwcGVucyB0byBlbnRlciBhbm90aGVyIGZpbGVuYW1lIHRoYXQgYWxyZWFkeSBleGlzdHNcbiAgICAgIHdoaWxlIChyZXZpc2lvbkRpY3RbZmlsZW5hbWVdKSB7XG4gICAgICAgIGxldCBuZXdOYW1lID0gdGhpcy5wcm9tcHQuY2FsbCh3aW5kb3csXG4gICAgICAgICAgZmlsZU9iai5uYW1lICsgJyBhbHJlYWR5IGV4aXN0cy4gUGljayBhIG5ldyBuYW1lLCBvciBsZWF2ZSBpdCB0aGUgc2FtZSB0byBvdmVyd3JpdGU6JyxcbiAgICAgICAgICBmaWxlT2JqLm5hbWUpO1xuICAgICAgICBpZiAoIW5ld05hbWUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChuZXdOYW1lID09PSBmaWxlbmFtZSkge1xuICAgICAgICAgIHJldHVybiBmaWxlbmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaWxlbmFtZSA9IG5ld05hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWxlbmFtZTtcbiAgICB9KS50aGVuKGZpbGVuYW1lID0+IHtcbiAgICAgIGlmIChmaWxlbmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zYXZlU3ZnQmxvYihmaWxlbmFtZSwgZmlsZU9iaikudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2V0Q3VycmVudEZpbGUoZmlsZW5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaCh0aGlzLmNhdGNoRGJFcnJvcik7XG4gIH1cbiAgZGVsZXRlU3ZnIChmaWxlbmFtZSkge1xuICAgIGlmICh0aGlzLmNvbmZpcm0uY2FsbCh3aW5kb3csICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlICcgKyBmaWxlbmFtZSArICc/JykpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbdGhpcy5kYi5nZXQoZmlsZW5hbWUpLCB0aGlzLmdldEN1cnJlbnRGaWxlbmFtZSgpXSkudGhlbihwcm9taXNlUmVzdWx0cyA9PiB7XG4gICAgICAgIGxldCBleGlzdGluZ0RvYyA9IHByb21pc2VSZXN1bHRzWzBdO1xuICAgICAgICBsZXQgY3VycmVudEZpbGUgPSBwcm9taXNlUmVzdWx0c1sxXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIucmVtb3ZlKGV4aXN0aW5nRG9jLl9pZCwgZXhpc3RpbmdEb2MuX3JldilcbiAgICAgICAgICAudGhlbihyZW1vdmVSZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsZW5hbWUgPT09IGN1cnJlbnRGaWxlKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudEZpbGUobnVsbCkuY2F0Y2godGhpcy5jYXRjaERiRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZVJlc3BvbnNlO1xuICAgICAgICAgIH0pO1xuICAgICAgfSkuY2F0Y2godGhpcy5jYXRjaERiRXJyb3IpO1xuICAgIH1cbiAgfVxuICBkb3dubG9hZFN2ZyAoZmlsZW5hbWUpIHtcbiAgICB0aGlzLmdldFN2Z0Jsb2IoZmlsZW5hbWUpLnRoZW4oYmxvYiA9PiB7XG4gICAgICAvLyBjcmVhdGUgYSBmYWtlIGxpbmsuLi5cbiAgICAgIGxldCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgYS5zdHlsZSA9ICdkaXNwbGF5Om5vbmUnO1xuICAgICAgbGV0IHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgYS5ocmVmID0gdXJsO1xuICAgICAgYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcbiAgICAgIGEuY2xpY2soKTtcbiAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gICAgICBhLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYSk7XG4gICAgfSkuY2F0Y2godGhpcy5jYXRjaERiRXJyb3IpO1xuICB9XG59XG5cbk11cmUuVkFMSURfRVZFTlRTID0ge1xuICBmaWxlTGlzdENoYW5nZTogdHJ1ZSxcbiAgZmlsZUNoYW5nZTogdHJ1ZSxcbiAgZXJyb3I6IHRydWUsXG4gIHN2Z0xvYWRlZDogdHJ1ZVxufTtcblxubGV0IG11cmUgPSBuZXcgTXVyZSgpO1xuZXhwb3J0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
