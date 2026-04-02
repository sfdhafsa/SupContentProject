module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
  ],
  settings: {
    react: { version: "detect" },
  },
  overrides: [
    {
      files: ["**/*.js", "**/*.cjs"],
      parserOptions: { sourceType: "commonjs" },
      env: { node: true },
    },
  ],
  rules: {},
};
