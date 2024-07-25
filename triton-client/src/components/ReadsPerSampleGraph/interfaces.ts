import { DatasetState } from "@store/datasets"

export interface ReadsPerSampleGraphProps {
    datasetId: number
    readsPerSample: NonNullable<DatasetState["readsPerSample"]>
}
