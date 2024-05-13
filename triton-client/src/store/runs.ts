import { PayloadAction, SerializedError, createSlice } from "@reduxjs/toolkit";
import { TritonProject, TritonRun } from "../api/api-types";

export interface RunsState {
    readonly runsByName: Record<TritonRun['name'], TritonRun | undefined>,
    readonly runsByProjectId: {
		[projectId in TritonProject['external_id']]: {
			readonly loading: boolean
			readonly runs: ReadonlyArray<TritonRun['name']>
			readonly error?: SerializedError
		}
	}
}
const initialState: RunsState = {
    runsByName: {},
    runsByProjectId: {}
}
export const runsSlice = createSlice({
    name: 'runs',
    initialState: initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<TritonProject['external_id']>) => {
			state.runsByProjectId[action.payload] = {
				loading: true,
				runs: [],
			}
		},
        initializeRunsByProjectId: (state, action: PayloadAction<Pick<TritonProject, 'external_id'>[]>) => {
			const projects = action.payload
			projects.forEach(({ external_id: projectId }) => {
				state.runsByProjectId[projectId] = {
					loading: false,
					runs: [],
				}
			})
		},
        setRunsByProjectId: (state, action: PayloadAction<{ projectId: TritonProject['external_id']; runs: TritonRun[] }>) => {
			const { projectId, runs } = action.payload
			runs.forEach((r) => {
				state.runsByName[r.name] = r
			})
			state.runsByProjectId[projectId] = {
				loading: false,
				runs: runs.map((r) => r.name),
			}
		},
		setError: (state, action: PayloadAction<{ projectId: TritonProject['external_id']; error: SerializedError }>) => {
			const { projectId, error } = action.payload
			state.runsByProjectId[projectId] = {
				loading: false,
				runs: [],
				error,
			}
		},
    }
});
const { actions, reducer } = runsSlice
export default reducer
export const RunsStateActions = actions
export type RunsStateAction = ReturnType<typeof RunsStateActions[keyof typeof RunsStateActions]>
