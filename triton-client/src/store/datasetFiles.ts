import { PayloadAction, SerializedError, createSlice } from '@reduxjs/toolkit'
import { DownloadFile, TritonDatasetFile, TritonReadset } from '../api/api-types'

export interface DownloadFileState {
	readonly downloadFile: DownloadFile
}

export type FileType = 'fastq1' | 'fastq2' | 'bam' | 'bai'

export interface DatasetFileState extends TritonDatasetFile {}

export interface DatasetFilesState {
	readonly datasetFilesById: Record<TritonDatasetFile['datasetFile']['id'], DatasetFileState | undefined>
	readonly datasetFilesByReadsetId: {
		[readsetId in TritonReadset['id']]:
			| {
					readonly loading: boolean
					readonly datasetFiles: ReadonlyArray<TritonReadset['id']>
					readonly error?: SerializedError
			  }
			| undefined
	}
}

const initialState: DatasetFilesState = {
	datasetFilesById: {},
	datasetFilesByReadsetId: {},
}

export const datasetFilesSlice = createSlice({
	name: 'datasetFiles',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<TritonReadset['id']>) => {
			state.datasetFilesByReadsetId[action.payload] = {
				loading: true,
				error: undefined,
				datasetFiles: [],
			}
		},
		setDatasetFilesByReadsetId: (
			state,
			action: PayloadAction<{ readsetId: TritonReadset['id']; datasetFiles: TritonDatasetFile[] }>
		) => {
			const { readsetId, datasetFiles } = action.payload

			state.datasetFilesById = datasetFiles.reduce((datasetFilesById, datasetFile) => {
				datasetFilesById[datasetFile.datasetFile.id] = datasetFile
				return datasetFilesById
			}, state.datasetFilesById)

			state.datasetFilesByReadsetId[readsetId] = {
				loading: false,
				error: undefined,
				datasetFiles: datasetFiles.map((rs) => rs.datasetFile.id),
			}
		},
		setError: (state, action: PayloadAction<{ readsetId: TritonReadset['id']; error: SerializedError }>) => {
			const { readsetId, error } = action.payload
			state.datasetFilesByReadsetId[readsetId] = {
				loading: false,
				datasetFiles: state.datasetFilesByReadsetId[readsetId]?.datasetFiles ?? [],
				error,
			}
		},
	},
})

export const DatasetFilesStateActions = datasetFilesSlice.actions
export type DatasetFilesStateAction = ReturnType<typeof DatasetFilesStateActions[keyof typeof DatasetFilesStateActions]>

export default datasetFilesSlice.reducer
