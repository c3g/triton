import { PayloadAction, SerializedError, createSlice } from "@reduxjs/toolkit"
import { DownloadRequestType, TritonConstants } from "../api/api-types"

export interface ConstantsState {
    diskCapacity: Record<DownloadRequestType, number>
}

const initialState: ConstantsState = {
    diskCapacity: {
        GLOBUS: 0,
        SFTP: 0,
    },
}

export const constantsSlice = createSlice({
    name: "constants",
    initialState,
    reducers: {
        setConstants: (state, action: PayloadAction<TritonConstants>) => {
            state.diskCapacity.GLOBUS = action.payload.globus_project_size
            state.diskCapacity.SFTP = action.payload.sftp_project_size
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