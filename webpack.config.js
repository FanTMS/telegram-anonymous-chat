const path = require('path');

module.exports = {
  // ... другие настройки webpack ...
  
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [/node_modules\/@twa-dev\/sdk/]
      }
    ]
  },
  
  ignoreWarnings: [
    {
      module: /node_modules\/@twa-dev\/sdk/
    }
  ]
}; 