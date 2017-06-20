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

let config = {};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

const processed_options = {};
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

const required_options = ['name'];
const optional_options = ['path', 'initial'];
const start = () => {
    // Path can be defaulted in package.json so check for it.
    processed_options.path = config.boilerplate.output;

    required_options.forEach((arg, index) => {
        // If we already have what we need for this option, we can remove it from the required list.
        if (processed_options[arg]) {
            required_options.splice(index, 1);
        }
    });

    optional_options.forEach((arg, index) => {
        // If we already have what we need for this option, we can remove it from the required list.
        if (processed_options[arg]) {
            optional_options.splice(index, 1);
        }
    });

    // If there are still some options left we need to ask for them.
    if (required_options.length || optional_options.length) {
        const prompt = (option, required = false) => {
            let question = '';
            let defaultValue = '';

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

            if (required) {
                question = `${chalk.bgRed.white('Required')} ${question}`;
            }

            rl.setPrompt(question);

            rl.prompt();

            return defaultValue;
        };

        let active_option = required_options[0] || optional_options[0];
        processed_options[active_option] = prompt(active_option);

        rl.on('line', (line) => {
            console.log();
            if (required_options.indexOf(active_option) > -1 && !line) {
                prompt(active_option, true);
                return;
            }

            processed_options[active_option] = line || processed_options[active_option];

            const required_index = required_options.indexOf(active_option);
            const optional_index = optional_options.indexOf(active_option);
            if (required_index > -1) {
                required_options.splice(required_index, 1);
            } else if (optional_index > -1) {
                optional_options.splice(optional_index, 1);
            }

            if (required_options.length) {
                active_option = required_options[0];
                prompt(active_option);
                return;
            }

            if (optional_options.length) {
                active_option = optional_options[0];
                processed_options[active_option] = prompt(active_option);
                return;
            }

            rl.pause();
        }).on('pause', finish); // eslint-disable-line no-use-before-define
    }
};

const createTemplatedFiles = (realPath, camelCasedName) => {
    const lowerCamelCase = `${camelCasedName.charAt(0).toLowerCase()}${camelCasedName.slice(1)}`;

    return Promise.all(config.templates.map(file => {
        const { boilerplate: { templates } } = config;
        const templatePath = templates.endsWith(path.sep) ? templates : `${templates}${path.sep}`;
        if (file === 'rootReducer.js') {
            const rootReducerTemplate = require(path.resolve(`${templatePath}rootReducer.js`));
            return ensureFileExists(
                path.resolve(`${realPath}reducers${path.sep}index.js`),
                rootReducerTemplate(),
                true,
            );
        }

        if (file === 'initialState.js') {
            const initialStateTemplate = require(path.resolve(`${templatePath}initialState.js`));
            return ensureFileExists(
                path.resolve(`${realPath}stores${path.sep}initialState.js`),
                initialStateTemplate(),
                true
            );
        }

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
            if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes' || !answer.trim()) {
                console.log();
                resolve();
                return;
            }

            reject(`${chalk.bgRed.white.bold('Failure')} Please set the correct directory.`);
        });
    });
};

const processEverything = () => {
    // Process any passed args
    processArgs();
    getTemplates(config.boilerplate.templates).then(start);
};

const finish = () => {
    const { name, path: rootPath, initial } = processed_options;

    if (!name || !rootPath || !initial) {
        throw new Error('Need a valid name, path and intial state value');
    }

    const camelCasedName = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

    const realPath = rootPath.endsWith(path.sep) ? rootPath : `${rootPath}${path.sep}`;

    // Check that paths exists
    checkWriteDirectory(path.resolve(realPath))
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

                    if (file.indexOf(path.sep) === -1) {
                        return ensureDirectoryExists(path.resolve(`${realPath}${dirName}`));
                    }

                    let outputPath = path.resolve(config.boilerplate[file.split(path.sep)[0]]);
                    outputPath = outputPath.endsWith(path.sep) ? outputPath : `${outputPath}${path.sep}`;

                    return ensureDirectoryExists(`${outputPath}${dirName}`);
                }),
            );
        })
        .then(() => createTemplatedFiles(realPath, camelCasedName))
        .then(() => {
            return updateStateAndReducer(realPath, `${name}s`, initial);
        })
        .then(() => process.exit(0))
        .catch((err) => {
            if (err && typeof err === 'string') {
                console.log(err);
            } else {
                console.log();
                console.log(err);
            }

            process.exit(1);
        });
};

fs.access('package.json', fs.constants.F_OK, (err) => {
    if (err) {
        console.log();
        console.log(chalk.bold.bgRed.white('package.json doesn\'t exist, please run this from the project root'));
        process.exit(1);
    }

    config = require(path.resolve(`.${path.sep}package.json`));

    if (!config.boilerplate || !config.boilerplate.templates || !config.boilerplate.output) {
        console.log(chalk.bold.bgRed.white(`boilerplate required to be set in package.json.  See README for examples`));
    }

    processEverything();
});
