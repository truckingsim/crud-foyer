module.exports = (model) => {
    return `
        import url from '../utils/url';
        import {
            HandleResponse,
            BaseOptions,
            PostOptions,
            PatchOptions,
            DeleteOptions,
            ParseOptions,
        } from '../utils/fetchOptions';

        export const Fetch${model}s = (data = null, options = {}) => {
            let fetchOptions = {
                ...BaseOptions,
            };

            if (data) {
                fetchOptions.body = JSON.stringify(data);
            }

            fetchOptions = ParseOptions(fetchOptions, options);
            return fetch(url('/api/v1/${model.toLowerCase()}s?limit=10000'), fetchOptions).then(HandleResponse);
        };

        export const Fetch${model} = (data = null, options = {}, ${model.toLowerCase()}_id) => {
            let fetchOptions = {
                ...BaseOptions,
            };
            if (data) {
                fetchOptions.body = JSON.stringify(data);
            }
            fetchOptions = ParseOptions(fetchOptions, options);
            return fetch(
                url(\`/api/v1/${model.toLowerCase()}s/\${${model.toLowerCase()}_id}\`), fetchOptions
            ).then(HandleResponse);
        };


        export const Add${model} = (data = null, options = {}) => {
            let fetchOptions = {
                ...PostOptions,
                body: JSON.stringify(data),
            };

            fetchOptions = ParseOptions(fetchOptions, options);
            return fetch(url('/api/v1/${model.toLowerCase()}s'), fetchOptions).then(HandleResponse);
        };

        export const Edit${model} = (data = null, options = {}, ${model.toLowerCase()}_id) => {
            let fetchOptions = {
                ...PatchOptions,
                body: JSON.stringify(data),
            };

            fetchOptions = ParseOptions(fetchOptions, options);
            return fetch(
                url(\`/api/v1/${model.toLowerCase()}s/\${${model.toLowerCase()}_id}\`), fetchOptions
            ).then(HandleResponse);
        };
        export const Delete${model} = (data = null, options = {}, ${model.toLowerCase()}_id) => {
            let fetchOptions = {
                ...DeleteOptions,
            };

            fetchOptions = ParseOptions(fetchOptions, options);
            return fetch(
                url(\`/api/v1/${model.toLowerCase()}s/\${${model.toLowerCase()}_id}\`), fetchOptions
            ).then(HandleResponse);
        };
    `;
};
