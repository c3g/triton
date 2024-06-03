import { PayloadAction, SerializedError, createSlice } from "@reduxjs/toolkit"
import { TritonConstants } from "../api/api-types"

export interface ConstantsState extends Omit<TritonConstants, 'id'> {}

const initialState: ConstantsState = {
    http_project_size: 0,
    globus_project_size: 0,
    sftp_project_size: 0
}

export const constantsSlice = createSlice({
    name: "constants",
    initialState,
    reducers: {
        setConstants: (state, action: PayloadAction<ConstantsState>) => {
            state.http_project_size = action.payload.http_project_size
            state.globus_project_size = action.payload.globus_project_size
            state.sftp_project_size = action.payload.sftp_project_size
        },
        setError(state, action: PayloadAction<SerializedError>) {
            console.error('Error fetching constants:', action.payload)
        }
    },
})

export type ConstantsStateAction = ReturnType<typeof constantsSlice.actions[keyof typeof constantsSlice.actions]>
export const ConstantsStateActions = constantsSlice.actions

export default constantsSlice.reducer

export const selectConstants = (state: { constants: ConstantsState }) => state.constants