import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { TritonRun } from "../api/api-types"

export interface RunsState {
    readonly runsByName: Record<TritonRun["name"], TritonRun | undefined>
}
const initialState: RunsState = {
    runsByName: {},
}
export const runsSlice = createSlice({
    name: "runs",
    initialState: initialState,
    reducers: {
        setRuns: (state, action: PayloadAction<TritonRun[]>) => {
            const runs = action.payload
            runs.forEach((r) => {
                state.runsByName[r.name] = r
            })
        },
    },
})

const { actions, reducer } = runsSlice
export default reducer
export const RunsStateActions = actions
export type RunsStateAction = ReturnType<
    (typeof RunsStateActions)[keyof typeof RunsStateActions]
>
