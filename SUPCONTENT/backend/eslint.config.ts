import * as js from "@eslint/js";
import * as tsParser from "@typescript-eslint/parser";
import * as tsPlugin from "@typescript-eslint/eslint-plugin";
import * as unicorn from "eslint-plugin-unicorn";

const config: any[] = [

  js.configs.recommended,

  {
    files: ["src/**/*.ts"],

    languageOptions: {
      parser: (tsParser as unknown) as any,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },

    plugins: {
      "@typescript-eslint": (tsPlugin as unknown) as any,
      unicorn: (unicorn as unknown) as any,
    },

    rules: {

      // basic rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",

      // naming variables
      "@typescript-eslint/naming-convention":[
        "warn",

        // variables
        {
          selector:"variable",
          format:["camelCase","UPPER_CASE"]
        },

        // functions
        {
          selector:"function",
          format:["camelCase"]
        },

        // classes
        {
          selector:"class",
          format:["PascalCase"]
        },

        // interfaces
        {
          selector:"interface",
          format:["PascalCase"]
        },

        // types
        {
          selector:"typeAlias",
          format:["PascalCase"]
        }

      ],

      // file naming
      "unicorn/filename-case":[
        "warn",
        {
          case:"kebabCase"
        }
      ],

      // good practice
      "eqeqeq":"warn",

    },

  },

];

export default config;