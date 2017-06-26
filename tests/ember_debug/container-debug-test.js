/* globals require */
import { module, test } from 'qunit';
import Ember from "ember";
import { visit } from 'ember-native-dom-helpers';

const { run, A: emberA, Application } = Ember;
const { default: EmberDebug } = require('ember-debug/main');
let port, name, message;
let App;

function setupApp() {
  App = Application.create();
  App.setupForTesting();
  App.injectTestHelpers();

  App.Router.map(function() {
    this.route('simple');
  });
}

module("Container Debug", {
  beforeEach() {
    EmberDebug.Port = EmberDebug.Port.extend({
      init() {},
      send(n, m) {
        name = n;
        message = m;
      }
    });
    run(function() {
      setupApp();
      EmberDebug.set('application', App);
    });
    run(EmberDebug, 'start');
    port = EmberDebug.port;
  },
  afterEach() {
    name = null;
    message = null;
    EmberDebug.destroyContainer();
    run(App, 'destroy');
  }
});

test("#getTypes", async function t(assert) {
  await visit('/simple');

  port.trigger('container:getTypes');
  await wait();

  assert.equal(name, 'container:types');
  let types = emberA(message.types);
  let application = types.findBy('name', 'application');
  assert.ok(application);
  assert.equal(application.count, 1);
  assert.ok(types.findBy('name', 'controller'));
  assert.ok(types.findBy('name', 'route'));
});

test("#getInstances", async function t(assert) {
  await visit('/simple');

  port.trigger('container:getInstances', { containerType: 'controller' });
  await wait();

  assert.equal(name, 'container:instances');
  let instances = emberA(message.instances);
  assert.ok(instances.findBy('name', 'simple'));
});

test("#getInstances on a non existing type", async function t(assert) {
  await visit('/simple');

  port.trigger('container:getInstances', { containerType: 'not-here' });
  await wait();

  assert.equal(name, 'container:instances');
  assert.equal(message.status, 404);
});
