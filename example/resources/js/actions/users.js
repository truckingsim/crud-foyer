import * as UserConstants from "../constants/users";
import * as UserApi from "../api/users";

export const SuccessfulFetchUsers = response => {
    return {
        type: UserConstants.FETCH_USER,
        response
    };
};

export const FailureFetchUsers = err => {
    return {
        type: UserConstants.FETCH_USER_FAILURE,
        err
    };
};

export const SuccessfulFetchUser = response => {
    return {
        type: UserConstants.FETCH_USER,
        response
    };
};
export const FailureFetchUser = err => {
    return {
        type: UserConstants.FETCH_USER_FAILURE,
        err
    };
};

export const SuccessfulAddUser = response => {
    return {
        type: UserConstants.ADD_USER,
        response
    };
};

export const FailureAddUser = err => {
    return {
        type: UserConstants.ADD_USER_FAILURE,
        err
    };
};

export const SuccessfulEditUser = response => {
    return {
        type: UserConstants.EDIT_USER,
        response
    };
};

export const FailureEditUser = err => {
    return {
        type: UserConstants.EDIT_USER_FAILURE,
        err
    };
};

export const SuccessfulDeleteUser = (response, user_id) => {
    return {
        type: UserConstants.DELETE_USER,
        response,
        user_id
    };
};

export const FailureDeleteUser = err => {
    return {
        type: UserConstants.DELETE_USER_FAILURE,
        err
    };
};

export const FetchUsers = () => {
    return dispatch => {
        return UserApi.FetchUsers(null, {})
            .then(json => {
                dispatch(SuccessfulFetchUsers(json));
            })
            .catch(err => {
                dispatch(FailureFetchUsers(err));
                return Promise.reject(err);
            });
    };
};

export const FetchUser = user_id => {
    return dispatch => {
        return UserApi.FetchUser(null, {}, user_id)
            .then(json => {
                dispatch(SuccessfulFetchUser(json));
            })
            .catch(err => {
                dispatch(FailureFetchUser(err));
                return Promise.reject(err);
            });
    };
};

export const AddUser = data => {
    return dispatch => {
        return UserApi.AddUser(data)
            .then(json => {
                dispatch(SuccessfulAddUser(json));
            })
            .catch(err => {
                dispatch(FailureAddUser(err));
                return Promise.reject(err);
            });
    };
};

export const EditUser = (data, user_id) => {
    return dispatch => {
        return UserApi.EditUser(data, {}, user_id)
            .then(json => {
                dispatch(SuccessfulEditUser(json));
            })
            .catch(err => {
                dispatch(FailureEditUser(err));
                return Promise.reject(err);
            });
    };
};

export const DeleteUser = user_id => {
    return dispatch => {
        return UserApi.DeleteUser(null, {}, user_id)
            .then(json => {
                dispatch(SuccessfulDeleteUser(json, user_id));
            })
            .catch(err => {
                dispatch(FailureDeleteUser(err));
                return Promise.reject(err);
            });
    };
};
