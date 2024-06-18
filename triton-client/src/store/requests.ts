import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TritonRequest } from '../api/api-types'

export interface RequestState extends TritonRequest {}

export interface RequestsState {
	readonly requestById: Record<RequestState['id'], RequestState | undefined>
}

const initialState: RequestsState = {
	requestById: {},
}

export const requestsSlice = createSlice({
	name: 'requests',
	initialState,
	reducers: {
		setRequests: (state, action: PayloadAction<TritonRequest[]>) => {
			const requests = action.payload
			requests.forEach((d) => {
				state.requestById[d.id] = d
			})
		},
	},
})

export const RequestsStateActions = requestsSlice.actions
export type RequestsStateAction = ReturnType<typeof RequestsStateActions[keyof typeof RequestsStateActions]>

export default requestsSlice.reducer
