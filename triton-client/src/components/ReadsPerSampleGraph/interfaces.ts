import { DatasetState } from "@store/datasets"

export interface ReadsPerSampleGraphProps {
    readsPerSample: NonNullable<DatasetState["readsPerSample"]>
}
