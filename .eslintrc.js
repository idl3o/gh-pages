module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    // Possible Errors
    "no-console": ["warn", { "allow": ["error", "warn", "info"] }],
    "no-debugger": "warn",
    "no-duplicate-case": "error",
    "no-empty": "warn",
    "no-extra-semi": "warn",
    "no-irregular-whitespace": "warn",
    
    // Best Practices
    "curly": ["warn", "multi-line"],
    "default-case": "warn",
    "eqeqeq": ["error", "always", { "null": "ignore" }],
    "no-alert": "warn",
    "no-eval": "error",
    "no-floating-decimal": "warn",
    "no-implied-eval": "error",
    "no-multi-spaces": "warn",
    "no-return-assign": "warn",
    "no-self-compare": "warn",
    "no-useless-concat": "warn",
    "yoda": "warn",
    
    // Variables
    "no-shadow": "warn",
    "no-use-before-define": ["warn", { "functions": false }],
    
    // Stylistic Issues
    "array-bracket-spacing": ["warn", "never"],
    "block-spacing": "warn",
    "brace-style": ["warn", "1tbs", { "allowSingleLine": true }],
    "camelcase": ["warn", { "properties": "never" }],
    "comma-dangle": ["warn", "only-multiline"],
    "comma-spacing": "warn",
    "comma-style": "warn",
    "func-call-spacing": "warn",
    "indent": ["warn", 2, { "SwitchCase": 1 }],
    "key-spacing": "warn",
    "keyword-spacing": "warn",
    "max-len": ["warn", { "code": 100, "ignoreComments": true, "ignoreUrls": true }],
    "new-cap": ["warn", { "newIsCap": true, "capIsNew": false }],
    "no-trailing-spaces": "warn",
    "object-curly-spacing": ["warn", "always"],
    "quotes": ["warn", "single", { "allowTemplateLiterals": true, "avoidEscape": true }],
    "semi": ["warn", "always"],
    "semi-spacing": "warn",
    "space-before-blocks": "warn",
    "space-before-function-paren": ["warn", {
      "anonymous": "always",
      "named": "never",
      "asyncArrow": "always"
    }],
    "space-in-parens": ["warn", "never"],
    "space-infix-ops": "warn",
    
    // ES6
    "arrow-parens": ["warn", "as-needed"],
    "arrow-spacing": "warn",
    "no-duplicate-imports": "warn",
    "no-useless-computed-key": "warn",
    "no-useless-rename": "warn",
    "no-var": "warn",
    "prefer-const": "warn",
    "prefer-template": "warn",
    "template-curly-spacing": "warn"
  },
  "overrides": [
    {
      "files": ["*.test.js", "**/__tests__/**/*.js"],
      "rules": {
        "max-len": "off",
        "no-console": "off"
      }
    }
  ]
};