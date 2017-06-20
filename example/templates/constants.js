module.exports = (model) => {
    return `
        export const FETCH_${model.toUpperCase()}S = 'FETCH_${model.toUpperCase()}S';
        export const FETCH_${model.toUpperCase()}S_FAILURE = 'FETCH_${model.toUpperCase()}S_FAILURE';

        export const FETCH_${model.toUpperCase()} = 'FETCH_${model.toUpperCase()}';
        export const FETCH_${model.toUpperCase()}_FAILURE = 'FETCH_${model.toUpperCase()}_FAILURE';

        export const ADD_${model.toUpperCase()} = 'ADD_${model.toUpperCase()}';
        export const ADD_${model.toUpperCase()}_FAILURE = 'ADD_${model.toUpperCase()}_FAILURE';

        export const EDIT_${model.toUpperCase()} = 'EDIT_${model.toUpperCase()}';
        export const EDIT_${model.toUpperCase()}_FAILURE = 'EDIT_${model.toUpperCase()}_FAILURE';

        export const DELETE_${model.toUpperCase()} = 'DELETE_${model.toUpperCase()}';
        export const DELETE_${model.toUpperCase()}_FAILURE = 'DELETE_${model.toUpperCase()}_FAILURE';
    `;
};
