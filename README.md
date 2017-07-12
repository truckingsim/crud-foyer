# crud-foyer
Lightly opinionated mostly configurable cli tool to generate redux files for new models

---
## The opinionated parts

If you want to use this to update your rootReducer or initialState (which it totally can) it assumes they will be named a certain way and in a certain directory.

* For the rootReducer that's `/path/to/js/reducers` for the directory and it assumes the file will be named `index.js`
  * On top of this it assumes that if you set the combineReducer function to a variable you named the variable `rootReducer`.  I'm looking for ways to remove this, but for now that's how it works.
* For initialState it assumes the file will live in `/path/to/js/stores` and is named `initialState.js`.  It also assumes that you set your initialState object to a variable called `initialState`.  Again looking for ways to remove this, but for now that's how it works.

Everything from this point on is totally configurable, these are the only non-configurable pieces.  This is due to us actually updating the files using an AST.  See `updateStateAndReducer.js` in `crud-foyer` root.

---

## How to use it

### Install 

```
npm install -g crud-foyer
```

### package.json updates

Before running it you will need to update your package.json to include a boilerplate key that looks something like:

```js
{
    "name": "example",
    "dependencies": {},
    ...
    "boilerplate": {
        "templates": "./templates",
        "output": "./resources/js",
        "additional_dirs": [
            "stores"
        ],
        "tests": "./tests/js"
    }
}
```

Where `templates` and `output` are required, and `additional_dirs` is optional. 

`templates` is the relative location of your templates directory.

`output` is the root of where all the generated files should go.  This should be your project JS root.

`additional_dirs` are extra directories that you want to make sure are created, any item in this list uses `output` as its root.

`tests` is an example of a custom directory and custom templates that get stored in a separate location from the project js root.  Relative directories are relative to the package.json not your JS root (if your JS root lives elsewhere).  The key can be any value as long as it matches the name of a folder in your templates directory.  The value is the output of the files that live in folder that matches the key in the templates directory.

I know that's not the most clear explination, see the example directory in this project for an example of the layout and the package.json structure.

### Template files and their contents

Template files themselves should be named by the folder you want to contain the models you are creating so for redux for example we want our user model to live in `actions`, `constants` and `reducers`.  So we would create an `actions.js`, `constants.js` and `reducers.js` in the template folder.  After you create the file it's contents need to `export` a function that returns a string.

```javascript
/**
  * @param {String} model - This is name of the model you passed in.  It will passed in when we call the function
  *
  * @return {String}
*/
module.exports = function(model) {
    return `some templated text, model name: ${model}`;
}
```

Because `require` the template from node, you can do node logic you want to do in the function or template file as long it returns a string.

## Running crud-foyer

Now that you have updated your package.json and created your template files you are now ready to run `crud-foyer` to do so run the following in your project root where the package.json lives.

```
crud-foyer
```

You can optionally pass in args to give answers to questions it will ask before it asks them.  Output of `-h|--help`:

![screenshot from 2017-07-12 08-48-42](https://user-images.githubusercontent.com/992973/28118479-2916d28c-66df-11e7-88f1-96f1e4b94eb8.png)

## How it works

crud-foyer takes a configurable object from package.json (we'll get to details on that later), parses it, recurses over the directory and uses those templates to create multiple files automatically based on the structure of your templates each time its called.

So lets assume your app currently has this strcuture below. Your project JS is going to be in `resources/js` and your tests will live in `tests/js`.

```
├── package.json
├── resources
│   └── js
├── templates
│   ├── actions.js
│   ├── api.js
│   ├── constants.js
│   ├── initialState.js
│   ├── reducers.js
│   ├── rootReducer.js
│   └── tests
│       ├── actions.js
│       └── reducers.js
├── tests
│   └── js
└── yarn.lock
```

After running crud-foyer to create the files for a new model called user your file/folder structure will now look like this:

```
├── package.json
├── resources
│   └── js
│       ├── actions
│       │   └── users.js
│       ├── api
│       │   └── users.js
│       ├── constants
│       │   └── users.js
│       ├── reducers
│       │   ├── index.js
│       │   └── users.js
│       └── stores
│           └── initialState.js
├── templates
│   ├── actions.js
│   ├── api.js
│   ├── constants.js
│   ├── initialState.js
│   ├── reducers.js
│   ├── rootReducer.js
│   └── tests
│       ├── actions.js
│       └── reducers.js
├── tests
│   └── js
│       ├── actions
│       │   └── users.js
│       └── reducers
│           └── users.js
└── yarn.lock
```

We went from 6 directories and 10 files to 13 directories and 18 files. It only needs to create the directories one time if they don't exist.  To prove this we'll run curd-foyer one more time to create a model called `client`.  Our file structure now looks like this:

```
├── package.json
├── resources
│   └── js
│       ├── actions
│       │   ├── clients.js
│       │   └── users.js
│       ├── api
│       │   ├── clients.js
│       │   └── users.js
│       ├── constants
│       │   ├── clients.js
│       │   └── users.js
│       ├── reducers
│       │   ├── clients.js
│       │   ├── index.js
│       │   └── users.js
│       └── stores
│           └── initialState.js
├── templates
│   ├── actions.js
│   ├── api.js
│   ├── constants.js
│   ├── initialState.js
│   ├── reducers.js
│   ├── rootReducer.js
│   └── tests
│       ├── actions.js
│       └── reducers.js
├── tests
│   └── js
│       ├── actions
│       │   ├── clients.js
│       │   └── users.js
│       └── reducers
│           ├── clients.js
│           └── users.js
└── yarn.lock
```

13 directories, 24 files.  Since the directories were already created it didn't need to do that again, it only needed to add the files.

So when you run crud-foyer we take the file name from the root of the template directory (as long as its a file, we'll get to tests in a minute), uses that as the folder name in the project JS root (`resources/js`).  It then creates a file using a plural version of the model name using the contents of template file.  The template files exports a function that we can pass params to so you can use template strings (or any other way of templating) to create files that output contents that match the model name.  You can see a working example of this in the example folder, clone the repo and run `crud-foyer` in the example folder (you don't need to do a yarn/npm install as long as you have curd-foyer installed globally).

In addition to creating new files we can update the rootReducer and initialState assuming they live within the limitations listed above.  If they do we get an AST of the current file, manipulate that AST to add in the new values, and then regenerate the code based off of that.

If you have run anything in the example directory and want to clean it up from `example/` run `yarn run example-cleanup` and it will remove the files created.
