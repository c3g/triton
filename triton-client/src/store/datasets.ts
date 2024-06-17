import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TritonDataset } from '../api/api-types'

export interface DatasetState extends Omit<TritonDataset, 'requests'> {}

export interface DatasetsState {
	readonly datasetsById: Record<DatasetState['id'], DatasetState | undefined>
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
	},
})

export const DatasetsStateActions = datasetsSlice.actions
export type DatasetStateAction = ReturnType<typeof DatasetsStateActions[keyof typeof DatasetsStateActions]>

export default datasetsSlice.reducer
