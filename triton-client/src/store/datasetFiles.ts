import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { DownloadFile, TritonDatasetFile } from "../api/api-types"

export interface DownloadFileState {
    readonly downloadFile: DownloadFile
}

export interface DatasetFileState extends TritonDatasetFile {}

export interface DatasetFilesState {
    readonly datasetFilesById: Record<
        TritonDatasetFile["datasetFile"]["id"],
        DatasetFileState | undefined
    >
}

const initialState: DatasetFilesState = {
    datasetFilesById: {},
}

export const datasetFilesSlice = createSlice({
    name: "datasetFiles",
    initialState,
    reducers: {
        setDatasetFiles: (
            state,
            action: PayloadAction<TritonDatasetFile[]>,
        ) => {
            const datasetFiles = action.payload
            datasetFiles.forEach((datasetFile) => {
                state.datasetFilesById[datasetFile.datasetFile.id] = datasetFile
            })
        },
    },
})

export const DatasetFilesStateActions = datasetFilesSlice.actions
export type DatasetFilesStateAction = ReturnType<
    (typeof DatasetFilesStateActions)[keyof typeof DatasetFilesStateActions]
>

export default datasetFilesSlice.reducer
