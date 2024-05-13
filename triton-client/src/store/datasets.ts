import { createSlice, PayloadAction, SerializedError } from '@reduxjs/toolkit'
import { TritonCreateRequestResponse, TritonDataset, TritonProject } from '../api/api-types'

export interface DatasetsState {
	readonly datasetsById: Record<TritonDataset['id'], TritonDataset | undefined>
	readonly datasetsByProjectId: {
		[projectId in TritonProject['external_id']]: {
			readonly loading: boolean
			readonly datasets: ReadonlyArray<TritonDataset['id']>
			readonly error?: SerializedError
		}
	}
}

const initialState: DatasetsState = {
	datasetsById: {},
	datasetsByProjectId: {},
}

export const datasetsSlice = createSlice({
	name: 'datasets',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<TritonProject['external_id']>) => {
			state.datasetsByProjectId[action.payload] = {
				loading: true,
				datasets: [],
			}
		},
		// Must be called within thunks that initialize projects!
		initializeDatasetsByProjectId: (state, action: PayloadAction<Pick<TritonProject, 'external_id'>[]>) => {
			const projects = action.payload
			projects.forEach(({ external_id: projectId }) => {
				state.datasetsByProjectId[projectId] = {
					loading: false,
					datasets: [],
				}
			})
		},
		setDatasetsByProjectId: (state, action: PayloadAction<{ projectId: TritonProject['external_id']; datasets: TritonDataset[] }>) => {
			const { projectId, datasets } = action.payload
			datasets.forEach((d) => (state.datasetsById[d.id] = d))
			state.datasetsByProjectId[projectId] = {
				loading: false,
				datasets: datasets.map((d) => d.id),
			}
		},
		setDownloadRequest(state, action: PayloadAction<TritonCreateRequestResponse>) {
			const { request } = action.payload
			state.datasetsById[+request.dataset_id]?.requests.push(request)
		},
		setError: (state, action: PayloadAction<{ projectId: TritonProject['external_id']; error: SerializedError }>) => {
			const { projectId, error } = action.payload
			state.datasetsByProjectId[projectId] = {
				loading: false,
				datasets: [],
				error,
			}
		},
	},
})

export const DatasetsStateActions = datasetsSlice.actions
export type DatasetStateAction = ReturnType<typeof DatasetsStateActions[keyof typeof DatasetsStateActions]>

export default datasetsSlice.reducer
