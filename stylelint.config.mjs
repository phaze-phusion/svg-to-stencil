export default {
  extends: ['stylelint-config-standard-scss'],
  defaultSeverity: 'error',
  maxWarnings: 0,
  rules: {
    // https://stylelint.io/user-guide/rules/list
    // and https://github.com/kristerkari/stylelint-scss

    // Syntax
    'max-nesting-depth': 5,
    'string-no-newline': true,


    // At-rules
    'no-invalid-position-at-import-rule': [true, {ignoreAtRules: ['use']}], // OR null
    'no-duplicate-at-import-rules': true,
    'at-rule-empty-line-before': null,
    'at-rule-disallowed-list': ['debug'],
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'scss/at-function-parentheses-space-before': 'always',
    'scss/at-function-pattern': '^([a-z]{2,})((-|_)[a-z]+)*$',
    'scss/at-each-key-value-single-line': true,
    'scss/at-if-no-null': true,
    'scss/at-if-closing-brace-newline-after': 'always-last-in-chain',
    'scss/at-if-closing-brace-space-after': 'always-intermediate',
    'scss/at-else-if-parentheses-space-before': 'always',
    'scss/at-else-closing-brace-newline-after': 'always-last-in-chain',
    'scss/at-else-closing-brace-space-after': 'always-intermediate',
    'scss/at-mixin-pattern': '^([a-z]{2,})((-|_)[a-z]+)*$', // '[a-z0-9_-]+',
    'scss/at-mixin-argumentless-call-parentheses': 'always',
    'scss/at-mixin-parentheses-space-before': null,
    'scss/no-duplicate-mixins': true,


    // Operators
    'scss/operator-no-unspaced': true,
    'scss/operator-no-newline-before': true,
    'scss/operator-no-newline-after': true,
    'scss/selector-no-redundant-nesting-selector': [true, {ignoreKeywords: ['when']}],


    // Declaration
    'block-no-empty': true,
    'declaration-no-important': true,
    'declaration-block-single-line-max-declarations': 1,
    'declaration-empty-line-before': null,


    // Comments
    'comment-no-empty': true,
    'comment-whitespace-inside': 'always',
    'no-invalid-double-slash-comments': true,
    'scss/comment-no-empty': null, // empty comments exist when code blocks are commented out
    'scss/comment-no-loud': true,
    'scss/double-slash-comment-empty-line-before': null,
    'scss/double-slash-comment-whitespace-inside': 'always', // null,


    // Functions
    'function-calc-no-unspaced-operator': true,
    'function-name-case': 'lower',
    'function-url-quotes': 'always',
    'function-url-scheme-disallowed-list': ['data'],
    'scss/no-global-function-names': null,
    'scss/function-quote-no-quoted-strings-inside': true,
    'scss/function-unquote-no-unquoted-strings-inside': true,


    // Media
    'media-feature-name-no-unknown': true,
    'scss/media-feature-value-dollar-variable': 'always',


    // Selectors
    'selector-max-id': 1,
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-colon-notation': 'double',
    'selector-pseudo-element-no-unknown': true,
    'selector-type-case': 'lower',
    'selector-type-no-unknown': [true, {ignoreTypes: ['/^mat-/', 'material']}],
    'selector-no-qualifying-type': [true, {ignore: ['attribute']}],
    'selector-id-pattern': '^([a-z][a-z0-9]+)((-|__)[a-z0-9]+)*$', // '[a-zA-Z0-9_-]+',
    'selector-class-pattern': [ // '[a-zA-Z0-9_-]+',
      '^([a-z][a-z0-9]+)((-{1,2}|__)[a-z0-9]+)*$',
      {'resolveNestedSelectors': true}
    ],
    'selector-no-vendor-prefix': [
      true,
      {
        'ignoreSelectors': [
          '/::-(webkit-input|moz)-placeholder/',
          '/.*::-webkit-(outer|inner)-spin-button/'
        ]
      },
    ],
    'scss/percent-placeholder-pattern': '^([a-z]{2,})((-{1,2}|__)[a-z0-9]+)*$', // '[a-z0-9_-]+',


    // Properties
    'property-no-vendor-prefix': [true, {ignoreProperties: ['appearance', 'text-size-adjust', 'font-smoothing', 'user-select']}],
    'shorthand-property-no-redundant-values': true,
    'declaration-property-value-no-unknown': null, // Should be true, but scss rules haven't caught upto this rule that was introduced in Stylelint 15
    'declaration-block-no-duplicate-properties': [true, {ignore: ['consecutive-duplicates-with-different-values']}],
    'declaration-block-no-redundant-longhand-properties': [true, {ignoreShorthands: ['font']}],
    'scss/declaration-nested-properties': 'never',
    'declaration-property-unit-disallowed-list': {
      'font-size': [
        'xx-small',
        'x-small',
        'small',
        'medium',
        'large',
        'x-large',
        'xx-large',
        'xxx-large',
        'smaller',
        'larger',
        '%'
      ]
    },


    // Values
    'value-keyword-case': null,
    'value-no-vendor-prefix': true,
    'scss/dollar-variable-colon-space-after': 'at-least-one-space',
    'scss/dollar-variable-empty-line-before': null,
    'scss/dollar-variable-pattern': '[a-z0-9_-]+',


    // Colors
    'alpha-value-notation': 'number',
    'color-function-notation': 'legacy',
    'color-hex-length': 'short',
    'color-named': [ 'never', { ignore: ['inside-function'] } ],
    'color-no-invalid-hex': true,
    'hue-degree-notation': 'number',


    // Fonts
    'font-family-no-duplicate-names': true,
    'font-family-name-quotes': 'always-where-recommended',
    'font-weight-notation': 'numeric',


    // Units
    'unit-no-unknown': true,
    'unit-allowed-list': ['px', '%', 'em', 'rem', 's', 'fr', 'vw', 'vh', 'deg'],
    'length-zero-no-unit': true,
    'number-max-precision': 5,
    'scss/dimension-no-non-numeric-values': true,
  }
};
