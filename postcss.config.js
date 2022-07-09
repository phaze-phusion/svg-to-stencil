module.exports = {
  ident: 'postcss',
  plugins: [
    require('postcss-import')(),
    require('postcss-preset-env')({
      stage: 2,
    }),
  ],
};
