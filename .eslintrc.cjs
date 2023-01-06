module.exports = {
	extends: ["nodebb"],
	root: true,
	"overrides": [
		{
		  "files": ["**/*.ts", "**/*.tsx"],
		  "extends": [
			"eslint:recommended",
			"plugin:@typescript-eslint/eslint-recommended"
		  ],
		  "parser": "@typescript-eslint/parser",
		  "plugins": ["@typescript-eslint"],
		  "parserOptions": {
			"ecmaFeatures": { "jsx": true },
			"project": "./tsconfig.json"
		  },
		  "rules": {
			"indent": ["error", 2, { "SwitchCase": 1 }],
			"linebreak-style": ["error", "unix"],
			"quotes": ["error", "single"],
			"comma-dangle": ["error", "always-multiline"],
			"@typescript-eslint/no-explicit-any": 0
		  }
		}
	  ]
};