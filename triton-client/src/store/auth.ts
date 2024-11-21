import { createSlice, PayloadAction, SerializedError } from "@reduxjs/toolkit"
import { IsLoggedInData, User } from "../api/api-types"
import { RootState } from "./store"

export interface AuthState {
    readonly loading: boolean
    readonly isLoggedIn: boolean
    readonly user?: User
    readonly error?: SerializedError
}

const initialState: AuthState = {
    loading: false,
    isLoggedIn: false,
}

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoading: (state) => {
            state.loading = true
        },
        setLoginState: (state, action: PayloadAction<IsLoggedInData>) => {
            state.loading = false
            state.isLoggedIn = action.payload.isLoggedIn
            state.user = action.payload.user
        },
        setLoginError: (state, action: PayloadAction<SerializedError>) => {
            state.loading = false
            state.error = action.payload
        },
    },
})

const { actions, reducer } = authSlice

export const AuthActions = { ...actions }
export type AuthAction = ReturnType<
    (typeof AuthActions)[keyof typeof AuthActions]
>

export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn
export const selectLoggedInUser = (state: RootState) => state.auth.user

export default reducer
