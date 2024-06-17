import { createSelector } from "@reduxjs/toolkit"
import { RequestState } from "./store/requests"
import { RootState } from "./store/store"



const selectRequestById = (state: RootState) => state.requestsState.requestById
export const selectRequestByDatasetId = createSelector([selectRequestById, (_, datasetID: number) => datasetID], (requestById, datasetID) => {
    return Object.values(requestById).reduce<RequestState[]>((requests, request) => {
        if (request && Number(request.dataset_id) === datasetID) {
            requests.push(request)
        }
        return requests
    }, [])
})