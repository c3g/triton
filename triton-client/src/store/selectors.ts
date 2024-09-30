import { createSelector } from "@reduxjs/toolkit"
import { RootState } from "@store/store"
import { ExternalProjectID } from "@api/api-types"
import { DatasetState } from "@store/datasets"
import { ReadsetState } from "./readsets"

export const selectRequestById = (state: RootState) =>
    state.requestsState.requestById
export const selectDatasetsById = (state: RootState) =>
    state.datasetsState.datasetsById
export const selectReadsetsById = (state: RootState) =>
    state.readsetsState.readsetsById

export const selectRequestOfDatasetId = createSelector(
    [(_, datasetID: number) => datasetID, selectRequestById],
    (datasetID, requestById) => {
        for (const requestId in requestById) {
            const request = requestById[requestId]
            if (request && Number(request.dataset_id) === datasetID) {
                return request
            }
        }
    },
)

export const selectDatasetsByExternalProjectID = createSelector(
    [selectDatasetsById, (_, projectID: ExternalProjectID) => projectID],
    (datasetsById, projectID) => {
        const datasets: DatasetState[] = []
        for (const datasetId in datasetsById) {
            const dataset = datasetsById[datasetId]
            if (dataset && dataset.external_project_id === projectID) {
                datasets.push(dataset)
            }
        }
        return datasets
    },
)

export const selectReadsetsByDatasetID = createSelector(
    [selectReadsetsById, (_, datasetID: number) => datasetID],
    (readsetsById, datasetID) => {
        const readsets: ReadsetState[] = []
        for (const readsetId in readsetsById) {
            const readset = readsetsById[readsetId]
            if (readset && readset.dataset === datasetID) {
                readsets.push(readset)
            }
        }
        return readsets
    },
)
