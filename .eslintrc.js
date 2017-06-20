module.exports = {
    "env": {
        "browser": true,
    },
    "extends": [
        "airbnb",
        "prettier",
    ],
    "plugins": [
        "react",
        "jsx-a11y",
        "import",
    ],
    "rules": {
        "curly": ["error", "all"],
        "no-confusing-arrow": ["error"],
        "indent": ["error", 4, {
            SwitchCase: 1
        }],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "semi": [
            "error",
            "always"
        ],
        "arrow-body-style": ["off"],
        "no-trailing-spaces": ["error", {
            "skipBlankLines": true
        }],
        "max-len": ["error", {"code": 120, "ignoreUrls": true}],
        "no-underscore-dangle": ["error", { allowAfterThis: true, allow: [
            "_source",
            "__default",
            "__APP_INITIAL_STATE__",
        ]}],
        "func-names": ["off"],
        "no-empty": ["error", { "allowEmptyCatch": true }],
        "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
        "no-unused-expressions": ["error", { "allowShortCircuit": true }],
        "import/no-named-as-default": ["off"],
        "import/prefer-default-export": ["off"],
        "import/no-extraneous-dependencies": ["error", {
            "devDependencies": true,
            "optionalDependencies": false,
            "peerDependencies": false
        }],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],

        // @TODO: Remove these rules when we can and actually fix this
        'jsx-a11y/href-no-hash': ['off'],
        'jsx-a11y/no-static-element-interactions': ['off'],
        'camelcase': ['off'],
    },
};
