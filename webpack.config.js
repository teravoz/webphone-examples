const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack'); 

module.exports = (env) => {
  const isProduction = env && !!env.production;

  return {
    mode: isProduction ? 'production' : 'development',
    devServer: {
      publicPath: '/',
      contentBase: path.join(__dirname, 'src'),
      overlay: true,
      port: 8000
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new Dotenv()
    ],
  };
};