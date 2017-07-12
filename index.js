#!/usr/bin/env node

/* eslint-disable no-console, global-require, import/no-unresolved, import/no-dynamic-require */

const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const getUsage = require('command-line-usage');
const path = require('path');
const format = require('prettier-eslint');
const recursive = require('recursive-readdir');

const updateStateAndReducer = require(path.resolve(`${__dirname}/updateStateAndReducer.js`));

// Will be filled through the various processing methods
let config = {};

// Used by multiple methods, pause streams rather than create new ones.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Used in both processing passed in args and showing when -h|--help is used.
const arg_options = [
    {
        name: 'help',
        description: 'Display this usage guide.',
        alias: 'h',
        type: Boolean,
    },
    {
        name: 'name',
        alias: 'n',
        type: String,
        typeLabel: '[underline]{name}',
        description: 'Name of the model to be created (use singular version of name, i.e. user NOT users)',
    },
    {
        name: 'initial',
        alias: 'i',
        type: String,
        typeLabel: '[underline]{initialValue}',
        description: 'Value used in initialState, defaults to [bold]{`Object`} if not provided',
    },
    {
        name: 'yes',
        alias: 'y',
        type: Boolean,
        description: 'By using this arg you skip any confirmations for writing or updating files',
    }
];

// If -h|--help is an arg, short circuit and show the help.
if (Object.keys(argv).indexOf('h') > -1 || Object.keys(argv).indexOf('help') > -1) {
    const usage = getUsage([
        { header: 'Add Model', content: `
            Use this script to add a new model to the JS code.
            If no options are provided will ask for the information that is needed.
        ` },
        { header: 'Options', optionList: arg_options },
    ]);
    console.log(usage);
    process.exit();
}

// Separate from config in that it releates only to arg options.
const processed_options = {};

/**
 * Used to ensure a directory exists.  If the error is that it exists, we
 *   resolve the promise, all other errors get rejected.
 *
 * @param {String} dirPath
 * @param {String} mask
 */
const ensureDirectoryExists = (dirPath, mask) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirPath, mask, (err) => {
            const shortDirPath = dirPath.split(process.cwd())[1];
            if (err) {
                if (err.code === 'EEXIST') {
                    console.log(`${chalk.green('Success')} .${shortDirPath} already exists`);
                    resolve(); // ignore the error if the folder already exists
                } else {
                    reject(err); // something else went wrong
                }
            } else {
                console.log(`${chalk.green('Success')} .${shortDirPath} directory created`);
                resolve(); // successfully created folder
            }
        });
    });
};

/**
 * Used to ensure a file exists.  If the error is that it exists, we resolve
 *   the promise, all other errors get rejected.
 *
 * @param {String} filePath - Path to file to check for existence.
 * @param {String} data - String to write to file if file doesn't exist.
 * @param {Boolean} noFail - True if should resolve if file exists already.
 *
 * @return {Promise}
 */
const ensureFileExists = (filePath, data, noFail = false) => {
    return new Promise((resolve, reject) => {
        const prettyData = format({
            text: data,
            filePath: path.resolve(`.${path.sep}.eslintrc.js`),
        });
        fs.writeFile(filePath, prettyData, { flag: 'wx' }, (err) => {
            const shortFilePath = filePath.split(process.cwd())[1];
            if (err) {
                if (!noFail) {
                    // eslint-disable-next-line max-len
                    console.log(`${chalk.bgRed.white.bold('Failure')} .${chalk.bold(shortFilePath)} already exists. This can only be used for new models`);
                    reject(err);
                } else {
                    console.log(`${chalk.green('Success')} .${shortFilePath} already exists, not writing to it.`);
                    resolve();
                }
            } else {
                console.log(`${chalk.green('Success')} .${shortFilePath} created`);
                resolve();
            }
        });
    });
};

/**
 * Processes the args that are passed in through the command line
 *   makes sure they exist as an option and if they do adds them
 *   to the processed_options object.
 *
 * @return {Object}
 */
const processArgs = () => {
    Object.keys(argv).forEach((arg) => {
        const arg_obj = arg_options.find((option) => {
            return option.name === arg || option.alias === arg;
        });

        if (arg_obj) {
            processed_options[arg_obj.name] = argv[arg];
        }
    });

    return processed_options;
};

/**
 *
 * @param {String} templatesPath
 *
 * @return {Array.<String>}
 */
const getTemplates = (templatesPath) => {
    let abssTemplatePath = path.resolve(templatesPath);
    abssTemplatePath = abssTemplatePath.endsWith(path.sep) ? abssTemplatePath : `${abssTemplatePath}${path.sep}`;

    return recursive(templatesPath).then((files) => {
        const mappedFiles = files.map(file => {
            return path.resolve(file).replace(abssTemplatePath, '');
        });

        config.templates = mappedFiles;
    });
};

/**
 * Any values in `required_options` must match a name in `arg_options`.
 *  If in this list, we check if the arg is passed in from the cli.
 *  If it is, we move on to optional options, if it isn't passed in
 *  through the cli we will ask for it. They can not skip it, must give
 *  a non-empty response.
*/
const required_options = ['name'];

/**
 * Any values in `optional_options` match a name in `arg_options`.
 *  We will check if it is already passed in like above, the only
 *  difference being if not passed in an empty response is a valid
 *  value.  Also normally have defaults above that we will use if
 *  available.
*/
const optional_options = ['path', 'initial'];

/**
 * This func asks all the questions.  Is ran after `processEverything`
 *   has ran the getTemplates functions and the returned promise resolves.
 */
const start = () => {
    // Path can be defaulted in package.json so check for it.
    processed_options.path = config.boilerplate.output;

    required_options.forEach((arg, index) => {
        /*
         * If we already have what we need for this option, we can remove
         * it from the required list.
        */
        if (processed_options[arg]) {
            required_options.splice(index, 1);
        }
    });

    optional_options.forEach((arg, index) => {
        /**
         * If we already have what we need for this option, we can remove it
         * from the optional list.
        */
        if (processed_options[arg]) {
            optional_options.splice(index, 1);
        }
    });

    // If there are still some options left we need to ask for them.
    if (required_options.length || optional_options.length) {
        const prompt = (option, required = false) => {
            let question = '';
            let defaultValue = '';

            // Not happy having the questions here, but for now this works.
            switch (option) {
                case 'name':
                    question = `
                        What is the singular version of the name of the model you want to create (i.e. user NOT users):
                    `;
                    break;
                case 'path':
                    question = `
                        What is the root path of JS in this project [.${path.sep}resources${path.sep}js${path.sep}]:
                    `;
                    defaultValue = './resources/js/';
                    break;
                case 'initial':
                    question = 'Initial state value? [{}]:';
                    defaultValue = '{}';
                    break;
                default:
                    break;
            }

            question = `${chalk.dim('question')} ${question.trim()} `;

            /**
             * If the user responsed with an empty response to a required
             *  question, add a red and white `Required` prefix to the question
             *  until a non-empty response is given.
            */
            if (required) {
                question = `${chalk.bgRed.white('Required')} ${question}`;
            }

            // Set the prompt with any updates and prompt for the question
            rl.setPrompt(question);
            rl.prompt();

            /*
             * Return defaultValue so that on onptional questions if an
             *   empty response is given we can use that.
            */
            return defaultValue;
        };

        /*
         * Required and optional_options array's are manipulated as each option
         *   gets an answer.  So it will always be the first element in the
         *   array for the next question, check for a required first, then
         *   ask the optional questions.
        */
        let active_option = required_options[0] || optional_options[0];

        /*
         * The defaultValue gets set, always for required questions this
         *  is an empty string which is invalid, and for optional it's
         *  optional.  If the user answers with a non-empty response
         *  this value gets overriden below.
        */
        processed_options[active_option] = prompt(active_option);

        rl.on('line', (line) => {
            // Blank new line
            console.log();

            // Keep asking for a required option until we get a valid response
            if (required_options.indexOf(active_option) > -1 && !line) {
                prompt(active_option, true);
                return;
            }

            /*
             * Again required options will always have value based on the `if`
             *  logic above.  So use that value, or the default value if an
             *  empty response was given for an optional question.
            */
            processed_options[active_option] = line || processed_options[active_option];

            /**
             * Find the index of the currently asked question and then splice
             *   it from the array so the index's get updated and our logic
             *   for finding the next question above will work, since the
             *   indexes in an array get updated after splicing.
            */
            const required_index = required_options.indexOf(active_option);
            const optional_index = optional_options.indexOf(active_option);
            if (required_index > -1) {
                required_options.splice(required_index, 1);
            } else if (optional_index > -1) {
                optional_options.splice(optional_index, 1);
            }

            // If there are any required questions left, ask those first.
            if (required_options.length) {
                active_option = required_options[0];
                prompt(active_option);
                return;
            }

            // Finally any optional questions, left ask those.
            if (optional_options.length) {
                active_option = optional_options[0];
                processed_options[active_option] = prompt(active_option);
                return;
            }

            /**
             * If no more questions pause the readline interface because we will
             * use it later.  Pausing also triggers the next step, the `finish`
             * functional call.
            */

            rl.pause();
        }).on('pause', finish); // eslint-disable-line no-use-before-define
    }
};

/**
 * Maps over all the templates that need to be created and creates the files
 *   based on either model name, or hard-coded name depending on the file.
 *   Calls `ensureFileExists`.
 *
 * @param {String} realPath - Path to write files to
 * @param {String} camelCasedName - Camel cased version of model name
 *
 * @return {Promise}
 */
const createTemplatedFiles = (realPath, camelCasedName) => {
    /**
     * Since some files will need both lowerCased for the first Character
     *   and others upper cased for the firstCharacter have both ready to go.
     *
     * @TODO - Clean this up, its nasty figure out a better way to handle
     *         the naming
    */
    const lowerCamelCase = `${camelCasedName.charAt(0).toLowerCase()}${camelCasedName.slice(1)}`;

    return Promise.all(config.templates.map(file => {
        const { boilerplate: { templates } } = config;

        // Make sure the template path ends with a path seperator
        const templatePath = templates.endsWith(path.sep) ? templates : `${templates}${path.sep}`;

        /**
         * The first of hard-coded file names, this is one of the few
         *   opinionated things, it assumes you will use combineReducers and
         *   since you do that, you will have a rootReducer file and it will
         *   be named index.js in the reducers folder.
         *
         * If you do not have a file named rootReducer.js then it just skips
         *   this part so its not required.  You are only forced into the
         *   naming scheme if have a template called rootReducer.js.
         *
         * @TODO - See if we can remove some of strictness about this if not
         *         all of it and let this be configured somehow.
        */
        if (file === 'rootReducer.js') {
            const rootReducerTemplate = require(path.resolve(`${templatePath}rootReducer.js`));
            return ensureFileExists(
                path.resolve(`${realPath}reducers${path.sep}index.js`),
                rootReducerTemplate(),
                true,
            );
        }

        /**
         * The second opinionated hard-coded name, initialState.js.  We assume
         * that if you want an initialState you will want it with the same file
         * name in the stores directory.
         */
        if (file === 'initialState.js') {
            const initialStateTemplate = require(path.resolve(`${templatePath}initialState.js`));
            return ensureFileExists(
                path.resolve(`${realPath}stores${path.sep}initialState.js`),
                initialStateTemplate(),
                true
            );
        }

        /**
         * All other templates are completely configurable as to their naming,
         *   structure and output.  We do use the model as the name of the file
         *   as we assume that all other templates are created on a per model
         *   basis.
         *
         * We allow for custom directories to be defined (i.e. for testing)
         *   seperate from where the normal JS files go, so we check to see
         *   if the file ends in a path seperator, if it does it's a custom
         *   directory and we don't handle that in this function.
        */
        if (file.indexOf(path.sep) > -1) {
            // File is in a folder logic to make it is different
            const pathParts = file.split(path.sep);

            if (pathParts && config.boilerplate[pathParts[0]]) {
                const template = require(path.resolve(`${templatePath}${file}`));
                let outputPath = path.resolve(config.boilerplate[pathParts[0]]);
                outputPath = outputPath.endsWith(path.sep) ? outputPath : `${outputPath}${path.sep}`;

                const dirName = path.basename(file, '.js');
                return ensureFileExists(
                    path.resolve(`${outputPath}${dirName}${path.sep}${lowerCamelCase}s.js`),
                    template(camelCasedName)
                );
            }
        }

        const template = require(path.resolve(`${templatePath}${file}`));
        const dirName = path.basename(file, '.js');
        return ensureFileExists(
            path.resolve(`${realPath}${dirName}${path.sep}${lowerCamelCase}s.js`),
            template(camelCasedName)
        );
    }));
};

/**
 * Using the same readline interface we paused when asking questons, or the one
 *   created earlier if no questions where asked, make sure we are writing to
 *   the right directory before doing any writes.  This is skippable by passing
 *   in a `-y|--yes` to the command line args.
 *
 * @param {String} realPath - Path we are going to write files to.
 *
 * @return {Promise}
 */
const checkWriteDirectory = (realPath) => {
    return new Promise((resolve, reject) => {
        if (!realPath) {
            reject(`${chalk.bgRed.white.bold('Failure')} Please set the correct directory.`);
            return;
        }

        // Skip this part if they passed in --yes or -y
        if (processed_options.yes) {
            console.log();
            resolve();
            return;
        }

        rl.question(`About to write to ${chalk.bold(realPath)}.  Is this the correct directory [y]: `, (answer) => {
            /**
             * If y || yes || `an empty string` meaning you agree to the default
             * resolve denoting that the user agrees to write all files.
            */
            if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes' || !answer.trim()) {
                console.log();
                resolve();
                return;
            }

            // If anything else is given as an answer reject.
            reject(`${chalk.bgRed.white.bold('Failure')} Please set the correct directory.`);
        });
    });
};

/**
 * Kicks off everything by first proccessing the args, then the template list,
 *   finally calling start once the template list is fully populated by
 *   recursing over the template directory.
 */
const processEverything = () => {
    // Process any passed args
    processArgs();
    getTemplates(config.boilerplate.templates).then(start);
};

/**
 * Called by start if there are no questions to ask, or all the questions have
 *   been asked.  Checks write permissions then actually does all the writing.
 */
const finish = () => {
    const { name, path: rootPath, initial } = processed_options;

    // If somehow we still don't have everything need fail.
    if (!name || !rootPath || !initial) {
        throw new Error('Need a valid name, path and intial state value');
    }

    const camelCasedName = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

    // Since this path is used in multiple places, do the path.sep check here.
    const realPath = rootPath.endsWith(path.sep) ? rootPath : `${rootPath}${path.sep}`;

    // Check that we are writing to the correct directory first
    checkWriteDirectory(path.resolve(realPath))
        /**
         * Check that paths exists that we want to write all non-custom
         *   directory JS to.
        */
        .then(() => ensureDirectoryExists(path.resolve(realPath)))
        .then(() => {
            return Promise.all(
                // Remove the 2 reserved file names that aren't directorys
                config.templates.filter(file => {
                    return file !== 'initialState.js' && file !== 'rootReducer.js';
                })
                // Add aditional directories to be created
                .concat(config.boilerplate.additional_dirs || [])
                // Map over all directories that need to exist and return promise
                .map(file => {
                    const dirName = path.basename(file, '.js');

                    /**
                     * If the string is not a custom directory just check based
                     *   off of `dirName`.
                    */
                    if (file.indexOf(path.sep) === -1) {
                        return ensureDirectoryExists(path.resolve(`${realPath}${dirName}`));
                    }

                    /**
                     * If a custom directory, resolve the path and then do the
                     *   directory check.
                    */
                    let outputPath = path.resolve(config.boilerplate[file.split(path.sep)[0]]);
                    outputPath = outputPath.endsWith(path.sep) ? outputPath : `${outputPath}${path.sep}`;

                    return ensureDirectoryExists(`${outputPath}${dirName}`);
                }),
            );
        })
        // Create all the templated files
        .then(() => createTemplatedFiles(realPath, camelCasedName))
        /**
         * Update the existing files by creating an AST, updating the AST and
         *   regenerating the code off of the updated AST.
        */
        .then(() => {
            return updateStateAndReducer(realPath, `${name}s`, initial);
        })
        // All updates are done exit successfully
        .then(() => process.exit(0))
        // If any step above fails catch
        .catch((err) => {
            if (err && typeof err === 'string') {
                // If a string error console log directly
                console.log(err);
            } else {
                /**
                 * If not its going to be multiple line, put a blank line to
                 * make it easier to read
                */
                console.log();
                console.log(err);
            }

            // Exit with a non 0 code to denote a failure.
            process.exit(1);
        });
};

/**
 * Finally we have defined all our functions, make sure we are in a root
 *   directory by making sure package.json exists and has the boilerplate key we
 *   need set inside of it.
 */
fs.access('package.json', fs.constants.F_OK, (err) => {
    if (err) {
        console.log();
        console.log(chalk.bold.bgRed.white('package.json doesn\'t exist, please run this from the project root'));
        process.exit(1);
    }

    config = require(path.resolve(`.${path.sep}package.json`));

    if (!config.boilerplate || !config.boilerplate.templates || !config.boilerplate.output) {
        console.log(chalk.bold.bgRed.white(`boilerplate required to be set in package.json.  See README for examples`));
        process.exit(1);
    }

    processEverything();
});
