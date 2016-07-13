# A tool to translate raml to mocha api test

## Usage

```
npm install -g raml2html
raml2html raml/path -d output.js
```

And then just edit the `output.js` to do what you want for real mocha api test.

Finally run the test:

```
npm install
npm install -g mocha
mocha output.js
```