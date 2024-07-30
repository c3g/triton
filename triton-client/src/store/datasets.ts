import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TritonDataset, TritonReadsPerSample } from "@api/api-types"

export interface DatasetState extends Omit<TritonDataset, "requests"> {
    readsPerSample?: TritonReadsPerSample
}

export interface DatasetsState {
    readonly datasetsById: Record<DatasetState["id"], DatasetState | undefined>
}

const initialState: DatasetsState = {
    datasetsById: {},
}

export const datasetsSlice = createSlice({
    name: "datasets",
    initialState,
    reducers: {
        setDatasets: (state, action: PayloadAction<TritonDataset[]>) => {
            const datasets = action.payload
            datasets.forEach((d) => (state.datasetsById[d.id] = d))
        },
        setReadsPerSample: (
            state,
            action: PayloadAction<{
                datasetId: DatasetState["id"]
                readsPerSample: TritonReadsPerSample
            }>,
        ) => {
            const dataset = state.datasetsById[action.payload.datasetId]
            if (dataset) {
                dataset.readsPerSample = action.payload.readsPerSample
            }
        },
    },
})

export const DatasetsStateActions = datasetsSlice.actions
export type DatasetStateAction = ReturnType<
    (typeof DatasetsStateActions)[keyof typeof DatasetsStateActions]
>

export default datasetsSlice.reducer
