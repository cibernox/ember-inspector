/* globals require */
/* eslint no-empty:0 */
let name;
import Ember from "ember";
import { module, test } from 'qunit';

const { run, Application, Object: EmberObject } = Ember;
const { default: EmberDebug } = require('ember-debug/main');
let port, adapter;
let App;
let EmberInspector;

function setupApp() {
  App = Application.create();
  App.setupForTesting();
  App.injectTestHelpers();

}

module("Ember Debug", {
  beforeEach() {
    EmberDebug.Port = EmberDebug.Port.extend({
      init() {},
      send(n/*, m*/) {
        name = n;
      }
    });
    run(function() {
      setupApp();
      EmberDebug.set('application', App);
    });
    run(EmberDebug, 'start');
    EmberInspector = EmberDebug;
    port = EmberDebug.port;
    adapter = EmberDebug.get('port.adapter');
  },
  afterEach() {
    name = null;
    EmberDebug.destroyContainer();
    run(App, 'destroy');
  }
});


function cantSend(obj, assert) {
  try {
    EmberInspector.inspect(obj);
    assert.ok(false);
  } catch (e) {}
}

test("EmberInspector#inspect sends inspectable objects", function(assert) {
  let obj = EmberObject.create();
  EmberInspector.inspect(obj);
  assert.equal(name, "objectInspector:updateObject");
  name = null;
  obj = [];
  EmberInspector.inspect(obj);
  assert.equal(name, "objectInspector:updateObject");
  cantSend(1, assert);
  cantSend({}, assert);
  cantSend("a", assert);
  cantSend(null, assert);
});

test("Errors are caught and handled by EmberDebug", async function t(assert) {
  assert.expect(1);
  const error = new Error('test error');
  port.on('test:errors', () => {
    throw error;
  });

  const handleError = adapter.handleError;
  adapter.reopen({
    handleError(e) {
      assert.equal(e, error, 'Error handled');
    }
  });

  port.messageReceived('test:errors', {});

  await wait();
  adapter.reopen({ handleError });
});
