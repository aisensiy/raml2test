var raml2obj = require('raml2obj');
var fs = require('fs');
var addTests = require('./add_test');
var beautify = require('js-beautify').js_beautify;
var Mustache = require('mustache');

function run(source, template, options, cb) {
  var tests = [];
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

      var result = beautify(output, {indent_size: 2});
      cb && cb(result);
    });
  }
}

module.exports = run;
