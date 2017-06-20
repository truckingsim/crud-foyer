module.exports = (model) => {
    return `
        import * as ${model}Constants from '../constants/${model.toLowerCase()}s';
        import * as ${model}Api from '../api/${model.toLowerCase()}s';

        export const SuccessfulFetch${model}s = (response) => {
            return {
                type: ${model}Constants.FETCH_${model.toUpperCase()},
                response,
            };
        };

        export const FailureFetch${model}s = (err) => {
            return {
                type: ${model}Constants.FETCH_${model.toUpperCase()}_FAILURE,
                err,
            };
        };

        export const SuccessfulFetch${model} = (response) => {
            return {
                type: ${model}Constants.FETCH_${model.toUpperCase()},
                response,
            };
        };
        export const FailureFetch${model} = (err) => {
            return {
                type: ${model}Constants.FETCH_${model.toUpperCase()}_FAILURE,
                err,
            };
        };

        export const SuccessfulAdd${model} = (response) => {
            return {
                type: ${model}Constants.ADD_${model.toUpperCase()},
                response,
            };
        };

        export const FailureAdd${model} = (err) => {
            return {
                type: ${model}Constants.ADD_${model.toUpperCase()}_FAILURE,
                err,
            };
        };

        export const SuccessfulEdit${model} = (response) => {
            return {
                type: ${model}Constants.EDIT_${model.toUpperCase()},
                response,
            };
        };

        export const FailureEdit${model} = (err) => {
            return {
                type: ${model}Constants.EDIT_${model.toUpperCase()}_FAILURE,
                err,
            };
        };

        export const SuccessfulDelete${model} = (response, ${model.toLowerCase()}_id) => {
            return {
                type: ${model}Constants.DELETE_${model.toUpperCase()},
                response,
                ${model.toLowerCase()}_id,
            };
        };

        export const FailureDelete${model} = (err) => {
            return {
                type: ${model}Constants.DELETE_${model.toUpperCase()}_FAILURE,
                err,
            };
        };

        export const Fetch${model}s = () => {
            return (dispatch) => {
                return ${model}Api.Fetch${model}s(null, {}).then((json) => {
                    dispatch(SuccessfulFetch${model}s(json));
                }).catch((err) => {
                    dispatch(FailureFetch${model}s(err));
                    return Promise.reject(err);
                });
            };
        };

        export const Fetch${model} = (${model.toLowerCase()}_id) => {
            return (dispatch) => {
                return ${model}Api.Fetch${model}(null, {}, ${model.toLowerCase()}_id).then((json) => {
                    dispatch(SuccessfulFetch${model}(json));
                }).catch((err) => {
                    dispatch(FailureFetch${model}(err));
                    return Promise.reject(err);
                });
            };
        };

        export const Add${model} = (data) => {
            return (dispatch) => {
                return ${model}Api.Add${model}(data).then((json) => {
                    dispatch(SuccessfulAdd${model}(json));
                }).catch((err) => {
                    dispatch(FailureAdd${model}(err));
                    return Promise.reject(err);
                });
            };
        };

        export const Edit${model} = (data, ${model.toLowerCase()}_id) => {
            return (dispatch) => {
                return ${model}Api.Edit${model}(data, {}, ${model.toLowerCase()}_id).then((json) => {
                    dispatch(SuccessfulEdit${model}(json));
                }).catch((err) => {
                    dispatch(FailureEdit${model}(err));
                    return Promise.reject(err);
                });
            };
        };

        export const Delete${model} = (${model.toLowerCase()}_id) => {
            return (dispatch) => {
                return ${model}Api.Delete${model}(null, {}, ${model.toLowerCase()}_id).then((json) => {
                    dispatch(SuccessfulDelete${model}(json, ${model.toLowerCase()}_id));
                }).catch((err) => {
                    dispatch(FailureDelete${model}(err));
                    return Promise.reject(err);
                });
            };
        };
    `;
};
