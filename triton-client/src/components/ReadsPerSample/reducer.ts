import { DatasetState } from "@store/datasets"

export interface ReadsPerSampleState {
    graphState?: ReadsPerSampleGraphState
}

export type ReadsPerSampleStateAction = {
    type: "setGraphState"
    payload: SetGraphStateAction
}

export type SetGraphStateAction = Partial<ReadsPerSampleGraphState>

export default function reducer(state: ReadsPerSampleState, action) {}

export interface ReadsPerSampleGraphState {
    datasetId: DatasetState["id"]
    mode: "full" | "zoom"
    page: number
    pageSize: number
    sort: "reads" | "sample"
    order: "asc" | "desc"
}
