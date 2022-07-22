import path from 'path';
import {Configuration as WebpackConfiguration, WebpackPluginInstance} from 'webpack';
import {Configuration as WebpackDevServerConfiguration} from 'webpack-dev-server';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import StyleLintPlugin from 'stylelint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import {default as npmPackage} from './package.json';

/* global __dirname */

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const packageName = npmPackage.name;

module.exports = (env: null, argv: { mode: 'none' | 'development' | 'production' }) => {
  // Common configurations
  // ------------------------------------------------------
  const config: Configuration = {
    name: packageName,
    mode: argv.mode,
    entry: './src/main.ts',
    // https://webpack.js.org/configuration/output/
    output: {
      filename: `[name].js`,
    },
    target: 'browserslist',
    resolve: {
      extensions: ['.ts', '.js'],
    },
    stats: {
      // errorDetails: true,
      children: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          }
        },
        {
          test: /\.(css|scss)$/,
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
            'postcss-loader', // options loaded from postcss.config.js
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  outputStyle: 'expanded',
                  includePaths: [
                    'src/scss.scss',
                    'src/scss/'
                  ],
                },
              },
            },
          ],
        },
        // {
        //   test: /\.(svg|jpg|png)$/i,
        //   use: [
        //     {
        //       loader: 'file-loader',
        //       options: {
        //         name: '[path][name].[ext]',
        //         context: 'src/',
        //         publicPath: argv.mode === 'development' ? '/' : '../'
        //       }
        //     }
        //   ]
        // },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: (argv.mode === 'development' ? '[name].css' : `styles.min.css`),
        chunkFilename: '[id].css',
      }),
      new HtmlWebpackPlugin({
        favicon: './src/favicon.ico',
        inject: true,
        hash: false,
        template: './src/index.html',
        filename: (argv.mode === 'development' ? 'index.html' : `${packageName}.html`),
      }),
      new ForkTsCheckerWebpackPlugin({
        async: false
      }),
    ]
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
      // static: 'local',
      host: 'localhost',
      port: 4600,
    };

    config.performance = false;
    config.devtool = 'source-map';
  } // IF mode === 'development'

  // Production build
  // ------------------------------------------------------
  if (argv.mode === 'production') {
    config.output = {
      filename: `script.min.js`,
      path: path.resolve(__dirname, './dist/'),
    };

    // https://webpack.js.org/configuration/performance/
    config.performance = {
      // values are in bytes, Default = 250000 (250KB or 244KiB)
      // KiB = KB * 0.976563
      maxEntrypointSize: (2.5e5), // 244 KiB
      maxAssetSize: (2.5e5),      // 244 KiB
    };

    config.optimization = {
      minimize: true,
      minimizer: [
        // https://webpack.js.org/plugins/terser-webpack-plugin/
        new TerserPlugin({
          test: /\.js($|\?)/i,
          parallel: true,
          extractComments: false,
          terserOptions: {
            ecma: 2016,
            // Mangle advanced options see:
            // https://lihautan.com/reduce-minified-code-size-by-property-mangling/
            // https://github.com/terser/terser#mangle-options
            mangle: {
              properties: {
                // specify a list of names to be mangled with a regex
                regex: /(^_)|(^app_|p_)/,
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

    config.plugins = [
      new CleanWebpackPlugin({
        dry: false,
        verbose: false,
        cleanOnceBeforeBuildPatterns: ['./**/*'], // clean out dist directory
      }),
      ...(config.plugins as WebpackPluginInstance[]),
      new ESLintPlugin({
        extensions: ['.ts', '.js'],
        exclude: 'node_modules'
      }),
      new StyleLintPlugin({
        configFile: './stylelint.config.js',
        files: 'src/*.scss',
      }),
    ];

  } // IF mode === 'production'

  return config;
};
