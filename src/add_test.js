'use strict';

var testFactory = require('./test_factory');

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

module.exports = addTests;