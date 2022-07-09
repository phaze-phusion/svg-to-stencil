module.exports = {
  extends: ['stylelint-config-standard-scss'],
  defaultSeverity: 'warning',
  syntax: 'scss',
  plugins: [
    'stylelint-scss'
  ],
  rules: {
    // Syntax
    'at-rule-disallowed-list': ['debug'],
    'at-rule-no-unknown': null,
    'block-no-empty': true,
    'scss/at-rule-no-unknown': true,
    'declaration-no-important': true,
    'font-family-no-duplicate-names': true,
    'function-calc-no-unspaced-operator': true,
    'max-line-length': 160,
    'max-nesting-depth': 5,
    'media-feature-name-no-unknown': true,
    'no-duplicate-at-import-rules': true,
    'no-extra-semicolons': true,
    'string-quotes': 'single',
    'scss/no-global-function-names': null,

    // Colors
    'alpha-value-notation': 'number',
    'color-function-notation': 'legacy',
    'color-no-invalid-hex': true,
    'hue-degree-notation': 'number',

    // Numbers values
    'number-leading-zero': 'always',
    'number-max-precision': 5,
    'number-no-trailing-zeros': true,

    // Units
    'unit-no-unknown': true,
    'unit-allowed-list': [ 'px', '%', 'em', 'rem', 's', 'fr', 'vw', 'vh' ,'deg'],

    // Letter case
    'unit-case': 'lower',
    'property-case': 'lower',
    'selector-pseudo-class-case': 'lower',
    'selector-pseudo-element-case': 'lower',
    'selector-type-case': 'lower',
    'media-feature-name-case': 'lower',

    // White space
    'at-rule-empty-line-before': null,
    'declaration-block-single-line-max-declarations': 1,
    'block-closing-brace-empty-line-before': null,
    'block-opening-brace-space-before': 'always',
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    'declaration-block-semicolon-newline-after': 'always-multi-line',
    'declaration-block-semicolon-space-before': 'never',
    'declaration-block-trailing-semicolon': 'always',
    'declaration-empty-line-before': null,
    'media-feature-colon-space-after': 'always',
    'media-feature-colon-space-before': 'never',
    'value-list-max-empty-lines': 1,
    'scss/dollar-variable-empty-line-before': null,

    // Comments
    'comment-no-empty': true,
    'comment-whitespace-inside': 'always',
    'no-invalid-double-slash-comments': true,
    'scss/comment-no-empty': null,
    'scss/double-slash-comment-empty-line-before': null,
    'scss/double-slash-comment-whitespace-inside': null,

    // Selectors
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,
    'selector-id-pattern': '[a-zA-Z0-9_-]+',
    'selector-class-pattern': '[a-zA-Z0-9_-]+',
    'scss/dollar-variable-pattern': '[a-z0-9_-]+',
    'scss/percent-placeholder-pattern': '[a-z0-9_-]+',
    'scss/at-mixin-pattern': '[a-z0-9_-]+',
    'property-no-vendor-prefix': [
      true, {
        ignoreProperties: ['appearance', 'text-size-adjust', 'font-smoothing', 'user-select']
      }
    ]
  }
};
