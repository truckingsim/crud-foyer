module.exports = (model) => {
    return `
        import * as ${model}Constants from '../constants/${model.toLowerCase()}s';
        import * as PreloadConstants from '../constants/preload';

        const ${model.toLowerCase()}s = (state = {}, action) => {
            switch (action.type) {
                case PreloadConstants.SERVER_PRELOAD: {
                    if (action.response) {
                        const ${model.toLowerCase()}sObj = {};
                        if (
                            action.response.${model.toLowerCase()}s &&
                            action.response.${model.toLowerCase()}s.data &&
                            action.response.${model.toLowerCase()}s.data.length
                        ) {
                            action.response.${model.toLowerCase()}s.data.forEach((${model.toLowerCase()}) => {
                                ${model.toLowerCase()}sObj[${model.toLowerCase()}.id] = ${model.toLowerCase()};
                            });
                        }
                        return ${model.toLowerCase()}sObj;
                    }
                    return state;
                }
                case ${model}Constants.FETCH_CLIENTS:
                    if (action.response && action.response.data) {
                        const ${model.toLowerCase()}sObj = {};
                        action.response.data.forEach((${model.toLowerCase()}) => {
                            ${model.toLowerCase()}sObj[${model.toLowerCase()}.id] = ${model.toLowerCase()};
                        });
                        return ${model.toLowerCase()}sObj;
                    }
                    return state;
                case ${model}Constants.EDIT_CLIENT:
                case ${model}Constants.ADD_CLIENT:
                case ${model}Constants.FETCH_CLIENT:
                    if (action.response) {
                        const existingClient = state[action.response.id] || {};
                        const ${model.toLowerCase()} = { ...existingClient, ...action.response };
                        return {
                            ...state,
                            [${model.toLowerCase()}.id]: ${model.toLowerCase()},
                        };
                    }
                    return state;
                case ${model}Constants.DELETE_CLIENT:
                    if (action.${model.toLowerCase()}_id) {
                        const clonedState = { ...state };
                        if (clonedState[action.${model.toLowerCase()}_id]) {
                            delete clonedState[action.${model.toLowerCase()}_id];
                        }
                        return clonedState;
                    }
                    return state;
                case PreloadConstants.BROWSER_PRELOAD:
                default:
                    return state;
            }
        };
        export default ${model.toLowerCase()}s;
    `;
};
