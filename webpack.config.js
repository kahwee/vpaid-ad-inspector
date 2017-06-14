var path = require('path')

module.exports = {
  entry: {
    'vpaid-ad-inspector': './src/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.html$/,
      use: [{
        loader: 'html-loader',
        options: {
          minimize: true
        }
      }]
    }]
  }
}
