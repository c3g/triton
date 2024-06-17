import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TritonDataset, TritonRequestResponse } from '../api/api-types'

export interface DatasetsState {
	readonly datasetsById: Record<TritonDataset['id'], TritonDataset | undefined>
}

const initialState: DatasetsState = {
	datasetsById: {},
}

export const datasetsSlice = createSlice({
	name: 'datasets',
	initialState,
	reducers: {
		setDatasets: (state, action: PayloadAction<TritonDataset[]>) => {
			const datasets = action.payload
			datasets.forEach((d) => (state.datasetsById[d.id] = d))
		},
		setDownloadRequest(state, action: PayloadAction<TritonRequestResponse>) {
			const { request } = action.payload
			state.datasetsById[+request.dataset_id]?.requests.push(request)
		},
	},
})

export const DatasetsStateActions = datasetsSlice.actions
export type DatasetStateAction = ReturnType<typeof DatasetsStateActions[keyof typeof DatasetsStateActions]>

export default datasetsSlice.reducer
