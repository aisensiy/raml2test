'use strict';

class Test {
  constructor(name) {
    this.name = name || '';
    this.request = {
      server: '',
      path: '',
      method: 'GET',
      params: {},
      query: {},
      headers: {},
      body: ''
    };
    this.response = {
      status: '',
      schema: null,
      headers: null,
      body: null
    };
  }

  viewModel() {
    var result = {
      request: Object.assign({}, this.request),
      response: Object.assign({}, this.response),
      name: this.name
    };

    result.request.url = this.url();
    result.request.query = JSON.stringify(this.request.query, null, 2);
    result.request.body = this.request.body || JSON.stringify({}),
    result.request.headers = this.requestHeaders();
    result.response.schema = JSON.stringify(this.response.schema || '', null, 2);

    return result;
  }

  requestHeaders() {
    return JSON.stringify(this.request.headers);
  }

  url() {
    var path = this.request.server + this.request.path;
    Object.keys(this.request.params).forEach(function (key) {
      if (!this.request.params[key]) return;
      path = path.replace('{' + key + '}', this.request.params[key]);
    }.bind(this));
    return path;
  }
}

const TestFactory = {
  create(name) {
    return new Test(name);
  }
};

module.exports = TestFactory;
