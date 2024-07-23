import { createSelector } from "@reduxjs/toolkit"
import { RootState } from "@store/store"
import { DownloadRequestType } from "@api/api-types"
import { RequestState } from "@store/requests"
import { ReadsetState } from "@store/readsets"
import { DatasetState } from "@store/datasets"

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

export const selectDatasetsByRunName = createSelector(
    [selectDatasetsById, (_, runName: string) => runName],
    (datasetsById, runName) => {
        const datasets: DatasetState[] = []
        for (const datasetId in datasetsById) {
            const dataset = datasetsById[datasetId]
            if (dataset && dataset.run_name === runName) {
                datasets.push(dataset)
            }
        }
        return datasets
    },
)
export const selectReadsetsByRunName = createSelector(
    [selectDatasetsByRunName, selectReadsetsById],
    (datasets, readsetsById) => {
        const datasetIds = new Set(datasets.map((dataset) => dataset.id))
        const readsets: ReadsetState[] = []
        for (const readsetId in readsetsById) {
            const readset = readsetsById[readsetId]
            if (readset && datasetIds.has(readset.dataset)) {
                readsets.push(readset)
            }
        }
        return readsets
    },
)
export const selectRequestsByRunName = createSelector(
    [selectDatasetsByRunName, selectRequestById],
    (datasets, requestById) => {
        const datasetIds = new Set(datasets.map((dataset) => dataset.id))
        const requests: RequestState[] = []
        for (const requestId in requestById) {
            const request = requestById[requestId]
            if (request && datasetIds.has(Number(request.dataset_id))) {
                requests.push(request)
            }
        }
        return requests
    },
)
export const selectDisksUsageByRunName = createSelector(
    [selectReadsetsByRunName, selectRequestsByRunName],
    (readsets, requests) => {
        return readsets.reduce<Record<DownloadRequestType, number>>(
            (diskUsage, readset) => {
                const request = requests.find(
                    (request) => Number(request.dataset_id) === readset.dataset,
                )
                if (request) {
                    diskUsage[request.type] =
                        (diskUsage[request.type] || 0) + readset.total_size
                }
                return diskUsage
            },
            {
                GLOBUS: 0,
                SFTP: 0,
            },
        )
    },
)

export const selectReadsPerSample = createSelector(
    [(_, datasetID: number) => datasetID, selectDatasetsById],
    (datasetID, datasetsById) => {
        const dataset = datasetsById[datasetID]
        if (dataset) {
            return dataset.readsPerSample
        }
    },
)
