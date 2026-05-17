import js from "@eslint/js";
import unicorn from "eslint-plugin-unicorn";

export default [
  js.configs.recommended,

  {
    files: ["src/**/*.js"],

    plugins: {
      unicorn,
    },

    rules: {
      "no-unused-vars": "warn",

      eqeqeq: "warn",

      "unicorn/filename-case": [
        "warn",
        {
          case: "camelCase",
        },
      ],
    },
  },
];
