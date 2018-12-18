const path = require('path');
module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'index'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /.tsx?$/,
      exclude: '/node_modules/',
      loader: 'ts-loader'
    }]
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.css', '.ts']
  },
  devtool: 'inline-source-map',
  devServer: {
    publicPath: path.join('/dist/'),
    index: 'dist/index.html'
  }
};
