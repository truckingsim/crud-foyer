#!/usr/bin/env node

/* eslint-disable no-console, global-require, import/no-unresolved, import/no-dynamic-require */

const esprima = require('esprima');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const escodegen = require('escodegen');
const format = require('prettier-eslint');

const config = {};

/**
 * Esprima has no public api to create Property instances, so parse a simple
 *   string that can give us the private Property instance we need to manipulate
 *   the AST.
 *
 * @param {string} name - name for the key of the new property
 * @param {string} type - value for the new property
 */
const getNewProperty = (name, type = '{}') => {
    return esprima.parse(`const obj = {${name}: ${type}};`).body[0].declarations[0].init.properties[0];
};

/**
 * Esprima has no public api to create PropertyShorthand instances either, so
 *   parse a simple string that can give us the private PropertyShorthand
 *   instance we need to manipulate the AST.
 *
 * @param {string} name
 */
const getNewPropertyShorthand = (name) => {
    return esprima.parse(`const obj = { ${name} };`).body[0].declarations[0].init.properties[0];
};

/**
 * I'm sure you are noticing a pattern here, but Esprima has no public api to
 *   get ImportNamedDeclarations, so parse a simple string that can give us
 *   the private ImportNamedDeclaration instance we need to manipulate the AST.
 *
 * @param {string} name
 * @param {string} importPath
 */
const getNewImport = (name, importPath) => {
    return esprima.parse(`import ${name} from '${importPath}';`, { sourceType: 'module'}).body[0];
};

/**
 * The variable initialState can be anywhere in the file, so find all variable
 * delcarations (we obviously don't want imports or exports).  Loop over those
 * declarations until we find one called initialState.  Return its init value
 * for manipulating.
 *
 * @param {object} parsed
 */
const findInitialState = (parsed) => {
    const variableDeclarations = parsed.body.filter(declaration => {
        return declaration.type === 'VariableDeclaration';
    });

    let variable = null;
    variableDeclarations.find(varDec => {
        variable = varDec.declarations.find(declaration => {
            if (declaration.type !== 'VariableDeclarator') {
                return false;
            }

            return declaration.id && declaration.id.name === 'initialState';
        });

        return variable;
    });

    if (!variable) {
        throw new Error('Could not find a variable called iniitialState!');
    }

    return variable.init;
};

/**
 * We need to find the first argument of combinedReducer, which is an object.
 *   Its common to both assign the combineReducer to a variable or export
 *   default directly so look for both instances.  Loop over all instances
 *   until we find one called rootReducer.  This only works if the export is
 *   a named export or if the combineReducer is set to a variable.
 *
 * @param {object} parsed
 */
const findCombineReducersArgument = (parsed) => {
    const variableOrExportDeclarations = parsed.body.filter(declaration => {
        const type = declaration.type;
        if (type === 'ExportNamedDeclaration' || type === 'VariableDeclaration') {
            return true;
        }

        return false;
    });

    let args = null;
    variableOrExportDeclarations.find(varDec => {
        let declarations = null;
        if (varDec.type === 'ExportNamedDeclaration') {
            declarations = varDec.declaration.declarations;
        } else {
            declarations = varDec.declarations;
        }

        const reducer = declarations.find(declaration => {
            return declaration.id && declaration.id.name === 'rootReducer';
        });

        args = reducer.init.arguments;

        return args;
    });

    return args;
};

/**
 * We need to find index of the last import from the parsed AST so we can
 *   insert the new import for the new reducer at the bottom of those
 *   but before any variable declarations or exports.
 *
 * @param {object} parsed
 */
const findIndexOfLastImport = (parsed) => {
    let index = 0;
    parsed.body.find(declaration => {
        if (declaration.type === 'ImportDeclaration') {
            index += 1;
            return false;
        }

        return true;
    });

    return index;
};

/**
 * Find the initalState variable and update it.
 *
 * @param {string} name
 * @param {string} defaultValue
 */
const updateInitialState = (name, defaultValue) => {
    const { path: rootPath } = config;

    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(`${rootPath}stores/initialState.js`), (err, contents) => {
            if (err) {
                reject(err);
            }

            // Parse current initial state
            const parsed = esprima.parse(contents.toString('utf8'), { sourceType: 'module' });

            // Find where initalState is set
            const obj = findInitialState(parsed);

            // Push in new property
            obj.properties.push(getNewProperty(name, defaultValue));

            // Regenerate code from updated ast
            const generated = escodegen.generate(parsed);

            // Format code to match our style/standards
            const prettyData = format({
                text: generated,
                filePath: path.resolve('./.eslintrc.js'),
            });

            resolve(prettyData);
        });
    });
};

/**
 * Find the first argument of combineReducers and update it, as well as adding
 *   the new import for the new reducer.
 *
 * @param {string} name
 */
const updateRootReducer = (name) => {
    const { path: rootPath } = config;

    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(`${rootPath}reducers/index.js`), (err, contents) => {
            if (err) {
                reject(err);
            }

            // Parse existing root reducer file
            const parsed = esprima.parse(contents.toString('utf8'), { sourceType: 'module' });


            parsed.body.splice(findIndexOfLastImport(parsed), 0, getNewImport(name, `./${name}`));

            const args = findCombineReducersArgument(parsed);
            args[0].properties.push(getNewPropertyShorthand(name));

            const generated = escodegen.generate(parsed);
            const prettyData = format({
                text: generated,
                filePath: path.resolve('./.eslintrc.js'),
            });


            resolve(prettyData);
        });
    });
};

/**
 * Helper method for creating a promise around writing the file.  Also
 *   format, prettify and auto fix linting errors.
 *
 * @param {string} filePath
 * @param {string} data
 */
const writeFile = (filePath, data) => {
    return new Promise((resolve, reject) => {
        const prettyData = format({
            text: data,
            filePath: path.resolve('./.eslintrc.js'),
        });

        fs.writeFile(filePath, prettyData, { flag: 'w' }, (err) => {
            const shortFilePath = filePath.split(process.cwd())[1];
            if (err) {
                // eslint-disable-next-line max-len
                console.log(`${chalk.bgRed.white.bold('Failure')} ${err}`);
                reject(err);
            } else {
                console.log(`${chalk.green('Success')} updated .${shortFilePath}`);
                resolve();
            }
        });
    });
};

/**
 * Method called from index.js waits for both rootReducer update and
 *   initialState update to be done before writing them.
 *
 * @param {string} rootPath
 * @param {string} name
 * @param {string} defaultValue
 */
const init = (rootPath, name, defaultValue) => {
    config.path = rootPath;

    return Promise.all([updateInitialState(name, defaultValue), updateRootReducer(name)]).then(values => {
        const initialState = values[0];
        const rootReducer = values[1];

        return new Promise((resolve, reject) => {
            Promise.all([
                writeFile(path.resolve(`${rootPath}stores/initialState.js`), initialState),
                writeFile(path.resolve(`${rootPath}reducers/index.js`), rootReducer),
            ]).then(resolve).catch(reject);
        });
    });
};

module.exports = init;
