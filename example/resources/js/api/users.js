import url from "../utils/url";
import {
    HandleResponse,
    BaseOptions,
    PostOptions,
    PatchOptions,
    DeleteOptions,
    ParseOptions
} from "../utils/fetchOptions";

export const FetchUsers = (data = null, options = {}) => {
    let fetchOptions = {
        ...BaseOptions
    };

    if (data) {
        fetchOptions.body = JSON.stringify(data);
    }

    fetchOptions = ParseOptions(fetchOptions, options);
    return fetch(url("/api/v1/users?limit=10000"), fetchOptions).then(HandleResponse);
};

export const FetchUser = (data = null, options = {}, user_id) => {
    let fetchOptions = {
        ...BaseOptions
    };
    if (data) {
        fetchOptions.body = JSON.stringify(data);
    }
    fetchOptions = ParseOptions(fetchOptions, options);
    return fetch(url(`/api/v1/users/${user_id}`), fetchOptions).then(HandleResponse);
};

export const AddUser = (data = null, options = {}) => {
    let fetchOptions = {
        ...PostOptions,
        body: JSON.stringify(data)
    };

    fetchOptions = ParseOptions(fetchOptions, options);
    return fetch(url("/api/v1/users"), fetchOptions).then(HandleResponse);
};

export const EditUser = (data = null, options = {}, user_id) => {
    let fetchOptions = {
        ...PatchOptions,
        body: JSON.stringify(data)
    };

    fetchOptions = ParseOptions(fetchOptions, options);
    return fetch(url(`/api/v1/users/${user_id}`), fetchOptions).then(HandleResponse);
};
export const DeleteUser = (data = null, options = {}, user_id) => {
    let fetchOptions = {
        ...DeleteOptions
    };

    fetchOptions = ParseOptions(fetchOptions, options);
    return fetch(url(`/api/v1/users/${user_id}`), fetchOptions).then(HandleResponse);
};
