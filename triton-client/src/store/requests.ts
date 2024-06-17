import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DownloadRequest } from '../api/api-types'

export interface RequestState extends DownloadRequest {}

export interface RequestsState {
	readonly requestById: Record<RequestState['id'], RequestState | undefined>
	readonly requestsByDatasetId: Record<RequestState['dataset_id'], Array<RequestState['id']> | undefined>
}

const initialState: RequestsState = {
	requestById: {},
	requestsByDatasetId: {},
}

export const requestsSlice = createSlice({
	name: 'requests',
	initialState,
	reducers: {
		setRequests: (state, action: PayloadAction<DownloadRequest[]>) => {
			const requests = action.payload
			requests.forEach((d) => {
				state.requestById[d.id] = d

				let requests = state.requestsByDatasetId[d.dataset_id]
				if (!requests) {
					requests = []
				}
				if (requests.findIndex((r) => r === d.id) === -1) {
					requests.push(d.id)
				}
				state.requestsByDatasetId[d.dataset_id] = requests
			})
		},
	},
})

export const RequestsStateActions = requestsSlice.actions
export type RequestsStateAction = ReturnType<typeof RequestsStateActions[keyof typeof RequestsStateActions]>

export default requestsSlice.reducer
