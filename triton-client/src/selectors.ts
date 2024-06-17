import { DatasetState } from "./store/datasets"
import { RequestState, RequestsState } from "./store/requests"

export function selectRequestByDatasetId(requestById: RequestsState['requestById'], datasetId: DatasetState['id']) {
    return Object.values(requestById).reduce<RequestState[]>((requests, request) => {
        if (request && Number(request.dataset_id) === datasetId) {
            requests.push(request)
        }
        return requests
    }, [])
}