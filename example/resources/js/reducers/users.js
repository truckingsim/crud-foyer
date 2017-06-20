import * as UserConstants from "../constants/users";
import * as PreloadConstants from "../constants/preload";

const users = (state = {}, action) => {
    switch (action.type) {
        case PreloadConstants.SERVER_PRELOAD: {
            if (action.response) {
                const usersObj = {};
                if (action.response.users && action.response.users.data && action.response.users.data.length) {
                    action.response.users.data.forEach(user => {
                        usersObj[user.id] = user;
                    });
                }
                return usersObj;
            }
            return state;
        }
        case UserConstants.FETCH_CLIENTS:
            if (action.response && action.response.data) {
                const usersObj = {};
                action.response.data.forEach(user => {
                    usersObj[user.id] = user;
                });
                return usersObj;
            }
            return state;
        case UserConstants.EDIT_CLIENT:
        case UserConstants.ADD_CLIENT:
        case UserConstants.FETCH_CLIENT:
            if (action.response) {
                const existingClient = state[action.response.id] || {};
                const user = { ...existingClient, ...action.response };
                return {
                    ...state,
                    [user.id]: user
                };
            }
            return state;
        case UserConstants.DELETE_CLIENT:
            if (action.user_id) {
                const clonedState = { ...state };
                if (clonedState[action.user_id]) {
                    delete clonedState[action.user_id];
                }
                return clonedState;
            }
            return state;
        case PreloadConstants.BROWSER_PRELOAD:
        default:
            return state;
    }
};
export default users;
