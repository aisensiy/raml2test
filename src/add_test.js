'use strict';

var raml2obj = require('raml2obj');
var testFactory = require('./test_factory');
var fs = require('fs');
var beautify = require('js-beautify').js_beautify;
var Mustache = require('mustache');

function parseHeaders(raml) {
  if (!raml) return {};

  var headers = {};

  Object.keys(raml).forEach(function (key) {
    var v = raml[key];
    headers[key] = v.example;
  });

  return headers;
}

function addTests(raml, parent, tests) {
  if (!raml || !raml.resources) return;
  raml.resources.forEach(function (resource) {
    var path = resource.relativeUri;
    var params = {};

    if (parent) {
      path = parent.path + path;
      params = Object.assign({}, parent.params);
    }

    if (resource.uriParameters) {
      Object.keys(resource.uriParameters).forEach(function (key) {
        params[key] = resource.uriParameters[key].exmaple;
      });
    }

    resource.methods = resource.methods || [];

    resource.methods.forEach(function (api) {
      var method = api.method.toUpperCase();

      Object.keys(api.responses || {}).forEach(function (status) {
        var res = api.responses[status];

        var testName = `${method} ${path} -> ${status}`
        var test = testFactory.create(testName);
        tests.push(test);
        test.request.path = path;
        test.request.method = method;
        test.request.headers = parseHeaders(api.headers);
        var apiBody = api.body || {};

        var contentType = Object.keys(apiBody).find(function (type) {
          return !!type.match(/^application\/(.*\+)?json/i);
        });
        if (contentType) {
          test.request.body = apiBody[contentType].example;
        }
        test.request.params = params;
        test.response.status = status;

        if (res && res.body) {
          if (contentType && res.body[contentType] && res.body[contentType].schema) {
            test.response.schema = JSON.parse(res.body[contentType].schema);
          } else {
            var contentType = Object.keys(res.body).find(function (type) {
              return !!type.match(/^application\/(.*\+)?json/i);
            });
            if (contentType && res.body[contentType] && res.body[contentType].schema) {
              test.response.schema = JSON.parse(res.body[contentType].schema);
            }
          }
        }
      });
    });
    addTests(resource, {path: path, params: params}, tests);
  });
}

// source can either be a filename, url, file contents (string) or parsed RAML object.
// Returns a promise.
var source = 'fixtures/order.raml';
var tests = [];
var template = 'templates /template.mustache';

var options = {
  server: 'http://localhost:8088'
};

raml2obj.parse(source).then(function (ramlObj) {
  addTests(ramlObj, null, tests);
  generateTest(ramlObj, options, template, tests);
}).catch(function (err) {
  console.warn('error in parse');
  console.warn(err);
});

function generateTest(ramlObj, options, template, tests) {
  var server = options.server || ramlObj.baseUri;
  if (!server) {
    throw new Error('no api endpoint');
  }

  tests.forEach(function (test) {
    test.request.server = server;
  });

  fs.readFile(template, function (err, data) {
    if (err) throw err;

    var output = Mustache.render(data.toString(), {
      tests: tests.map(function (e) {
        return e.viewModel();
      })
    });

    console.log(beautify(output, {indent_size: 2}));
  });
}
