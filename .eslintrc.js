module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: '2015',
    sourceType: 'module',
    requireConfigFile: false,
    ecmaFeatures: {
      modules: true,
      experimentalObjectRestSpread: true,
      impliedStrict: true,
      arrowFunction: true
    },
    babelOptions: {
      presets: [
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'usage',
            corejs: '3.23.3',
            modules: 'commonjs',
          },
        ],
      ],
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:eslint-comments/recommended',
    'plugin:import/errors',
    'plugin:import/warnings'
  ],
  plugins: [
    'import',
    'babel',
    'promise'
  ],
  env: {
    es6: true,
    browser: true,
    commonjs: true,
    node: false
  },
  ignorePatterns: [
    'dist/',
    'documentation/',
    'node_modules/',
    'local/',
  ],
  // 0 or "off" or 0 - turn the rule off
  // 1 or "warn" - turn the rule on as a warning (doesn't affect exit code)
  // 2 or "error" - turn the rule on as an error (exit code is 1 when triggered)
  rules: {
    // https://www.npmjs.com/package/eslint-plugin-babel#rules
    'babel/new-cap': 1,
    'babel/camelcase': 0,
    'babel/no-invalid-this': 2,
    'babel/object-curly-spacing': 0,
    'babel/quotes': 0,
    'babel/semi': 2,
    'babel/no-unused-expressions': 2,
    'babel/valid-typeof': 2,

    // https://www.npmjs.com/package/eslint-plugin-promise#rules
    'promise/always-return': 1,
    'promise/avoid-new': 0,
    'promise/catch-or-return': 1,
    'promise/no-callback-in-promise': 1,
    'promise/no-nesting': 1,
    'promise/no-native': 0,
    'promise/no-new-statics': 2,
    'promise/no-promise-in-callback': 1,
    'promise/no-return-in-finally': 1,
    'promise/no-return-wrap': 2,
    'promise/param-names': 2,
    'promise/valid-params': 1,

    // https://mysticatea.github.io/eslint-plugin-eslint-comments/rules/
    'eslint-comments/no-duplicate-disable': 2,
    'eslint-comments/no-unlimited-disable': 2,

    // https://www.npmjs.com/package/eslint-plugin-import
    'import/no-unresolved': [2, {commonjs: true}],
    'import/named': 2,
    'import/namespace': 2,
    'import/default': 2,
    'import/export': 2,
    'import/no-namespace': 2,
    'import/no-mutable-exports': 1,
    'import/no-absolute-path': 2,
    'import/no-dynamic-require': 0,
    'import/no-unused-modules': 2
  },
  settings: {
    'import/ignore': [
      '/local/'
    ]
  }
};
