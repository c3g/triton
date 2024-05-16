import { PayloadAction, SerializedError, createSlice } from '@reduxjs/toolkit'
import { DownloadRequest, TritonDataset, TritonReadset } from '../api/api-types'

export interface DownloadRequestState {
	readonly loading: boolean
	readonly error?: SerializedError
	readonly downloadRequest?: DownloadRequest
}
export interface ReadsetState extends TritonReadset {}

export interface ReadsetsState {
	readonly readsetsById: Record<TritonReadset['id'], ReadsetState | undefined>
	readonly readsetsByDatasetId: {
		[datasetId in TritonDataset['id']]:
			| {
					readonly loading: boolean
					readonly readsets: ReadonlyArray<ReadsetState['id']>
					readonly error?: SerializedError
			  }
			| undefined
	}
}

const initialState: ReadsetsState = {
	readsetsById: {},
	readsetsByDatasetId: {},
}

export const readsetsSlice = createSlice({
	name: 'readsets',
	initialState,
	reducers: {
		// General Readset actions and reducers

		setLoading: (state, action: PayloadAction<TritonDataset['id']>) => {
			state.readsetsByDatasetId[action.payload] = {
				loading: true,
				readsets: [],
			}
		},
		// Must be called in fetchDatasets
		initializeReadsetsByDatasetIds: (state, action: PayloadAction<Pick<TritonDataset, 'id'>[]>) => {
			const datasets = action.payload
			datasets.forEach(({ id: datasetId }) => {
				state.readsetsByDatasetId[datasetId] = {
					loading: false,
					readsets: [],
				}
			})
		},
		setReadsetsByDatasetId: (state, action: PayloadAction<{ datasetId: TritonDataset['id']; readsets: TritonReadset[] }>) => {
			const { datasetId, readsets } = action.payload
			state.readsetsById = readsets.reduce((readsetsById, readset) => {
				readsetsById[readset.id] = readset

				return state.readsetsById
			}, state.readsetsById)
			state.readsetsByDatasetId[datasetId] = {
				loading: false,
				readsets: readsets.map((rs) => rs.id),
			}
		},
		setError: (state, action: PayloadAction<{ datasetId: TritonDataset['id']; error: SerializedError }>) => {
			const { datasetId, error } = action.payload
			state.readsetsByDatasetId[datasetId] = {
				loading: false,
				readsets: [],
				error,
			}
		},
	},
})

export const ReadsetsStateActions = readsetsSlice.actions
export type ReadsetsStateAction = ReturnType<typeof ReadsetsStateActions[keyof typeof ReadsetsStateActions]>

export default readsetsSlice.reducer
