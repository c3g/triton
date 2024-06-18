import { createSelector } from "@reduxjs/toolkit"
import { RootState } from "./store/store"

const selectRequestById = (state: RootState) => state.requestsState.requestById
export const selectRequestOfDatasetId = createSelector([selectRequestById, (_, datasetID: number) => datasetID], (requestById, datasetID) => {
    for (const requestId in requestById) {
        const request = requestById[requestId]
        if (request && Number(request.dataset_id) === datasetID) {
            return request
        }
    }
})