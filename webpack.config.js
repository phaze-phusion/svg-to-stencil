/* global __dirname */

const path                 = require('path'),
      pathRoot             = __dirname,
      MiniCssExtractPlugin = require('mini-css-extract-plugin'),
      HtmlWebpackPlugin    = require('html-webpack-plugin'),
      CssMinimizerPlugin   = require('css-minimizer-webpack-plugin'),
      TerserPlugin         = require('terser-webpack-plugin'),
      CopyPlugin           = require('copy-webpack-plugin'),
      {CleanWebpackPlugin} = require('clean-webpack-plugin'),
      StyleLintPlugin      = require('stylelint-webpack-plugin'),
      webpack              = require('webpack'),
      npmPackage           = require(path.resolve(pathRoot, './package.json'));

const packageName = npmPackage.name;

module.exports = (env, argv) => {
  // Common configurations
  // ------------------------------------------------------
  const config = {
    name: packageName,
    mode: argv.mode,
    entry: path.resolve(pathRoot, './src/index.js'),
    // https://webpack.js.org/configuration/output/
    output: {
      filename: `js/${packageName}.js`,
    },
    target: 'browserslist',
    resolve: {
      extensions: ['.js'],
    },
    stats: {
      children: true,
      // 'errors-warnings'
    }, // 'minimal,  'errors-only', // 'normal'
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 1 } },
            'postcss-loader', // options loaded from postcss.config.js
          ],
        },
        {
          test: /\.scss$/,
          use: [
            argv.mode === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: true,
                url: false,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  outputStyle: 'expanded',
                  includePaths: [
                    path.join(pathRoot, 'src/scss/'),
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.(svg|jpg|png|ico)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].[ext]',
                context: 'src/',
                publicPath: argv.mode === 'development' ? '/' : '../'
              }
            }
          ]
        },
        {
          test: /\.js$/,
          exclude: /(node_modules|local)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [ [ '@babel/preset-env' ] ],
            },
          },
        },
      ],
    },
  }; // Common configurations

  // Development build
  // ------------------------------------------------------
  if (argv.mode === 'development') {
    config.watchOptions = {
      aggregateTimeout: 300,
      poll: 1000,
      ignored: ['node_modules'],
    };

    // https://webpack.js.org/configuration/dev-server/
    config.devServer = {
      hot: true,
      watchFiles: ['src/**/*'],
      static: path.join(pathRoot, 'local'),
      host: 'localhost',
      port: 4400,
    };

    config.performance = false;
    config.devtool     = 'source-map';
    config.plugins     = [
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(npmPackage.version),
      }),
      new MiniCssExtractPlugin({
        filename: 'css/[name].css',
        chunkFilename: 'css/[id].css',
      }),
      new HtmlWebpackPlugin({
        favicon: path.resolve(pathRoot, './src/favicon.ico'),
        inject: true,
        hash: false,
        minify: false,
        template: path.resolve(pathRoot, './src/index.html'),
        filename: 'index.html',
      }),
    ];

  } // IF mode === 'development'


  // Production build
  // ------------------------------------------------------
  if (argv.mode === 'production') {

    config.output.path     = path.resolve(pathRoot, './dist/');
    config.output.filename = `${packageName}.min.js`;
    config.optimization    = {
      minimize: true,
      minimizer: [
        // https://webpack.js.org/plugins/terser-webpack-plugin/
        new TerserPlugin({
          test: /\.js($|\?)/i,
          parallel: true,
          extractComments: false,
          terserOptions: {
            ecma: '2015',
            // Mangle advanced options see:
            // https://lihautan.com/reduce-minified-code-size-by-property-mangling/
            // https://github.com/terser/terser#mangle-options
            mangle: {
              properties: {
                // specify a list of names to be mangled with a regex
                // regex: /(^_)|(^(internalMessage|classNames|highlight|keepOpen|hidden|invalid|serviceError|outOfService|disclaimer|cacheKey|i18n|dataBank)$)/,
                regex: /^_/,
              },
            },
            // https://github.com/terser/terser#compress-options
            // compress: {
            //   unsafe_arrows: true,
            //   // passes: 2,
            // },
            format: {
              comments: false, // Default is 'some'. Can use regex /(?:^!|@(?:license|preserve))/i,
            },
          },
        }),
        new CssMinimizerPlugin({
          include: /\.css$/g,
          minimizerOptions: {
            // map: {
            //   inline: false,
            //   annotation: true,
            // },
            preset: ['default', {discardComments: {removeAll: true}}],
          },
          parallel: true,
        }),
      ],
    };

    // https://webpack.js.org/configuration/performance/
    config.performance = {
      // values are in bytes, Default = 250000 (250KB or 244KiB)
      // KiB = KB * 0.976563
      maxEntrypointSize: (2.5e5), // 244 KiB
      maxAssetSize: (2.5e5),      // 244 KiB
    };

    config.plugins = [
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(npmPackage.version),
      }),
      new CleanWebpackPlugin({
        dry: false,
        verbose: false,
        cleanOnceBeforeBuildPatterns: ['./**/*'], // clean out dist directory
      }),
      // new CopyPlugin({
      //   patterns: [
      //     // { from: 'img/**/*', to: '../dist/', context: 'src/' },
      //     { from: 'src/favicon.ico', to: '../dist/', context: 'src/' },
      //   ],
      // }),
      new MiniCssExtractPlugin({
        filename: `${packageName}.min.css`,
        chunkFilename: '[id].css',
      }),
      new HtmlWebpackPlugin({
        favicon: path.resolve(pathRoot, './src/favicon.ico'),
        inject: true,
        hash: false,
        template: path.resolve(pathRoot, './src/index.html'),
        filename: `${packageName}.html`,
      }),
      new StyleLintPlugin({
        configFile: path.resolve(pathRoot, './stylelint.config.js'),
        files: 'src/scss/*.scss',
      }),
    ];

  } // IF mode === 'production'

  return config;
};
