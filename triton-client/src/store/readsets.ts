import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { TritonReadset } from "../api/api-types"

export interface ReadsetState extends TritonReadset {}

export interface ReadsetsState {
    readonly readsetsById: Record<TritonReadset["id"], ReadsetState | undefined>
}

const initialState: ReadsetsState = {
    readsetsById: {},
}

export const readsetsSlice = createSlice({
    name: "readsets",
    initialState,
    reducers: {
        setReadsets: (state, action: PayloadAction<TritonReadset[]>) => {
            const readsets = action.payload
            readsets.forEach((readset) => {
                state.readsetsById[readset.id] = readset
            })
        },
    },
})

export const ReadsetsStateActions = readsetsSlice.actions
export type ReadsetsStateAction = ReturnType<
    (typeof ReadsetsStateActions)[keyof typeof ReadsetsStateActions]
>

export default readsetsSlice.reducer
