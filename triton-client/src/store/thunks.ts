import apiTriton from '../api/api-triton'
import { DownloadRequestType, ExternalProjectID, TritonDataset, TritonProject, TritonReadset } from '../api/api-types'
import { AuthActions } from './auth'
import { DatasetFilesStateActions } from './datasetFiles'
import { DatasetsStateActions } from './datasets'
import { ProjectState, ProjectsStateActions } from './projects'
import { ReadsetsStateActions } from './readsets'
import { RunsStateActions } from './runs'
import { ConstantsStateActions } from './constants'
import { AppDispatch, RootState, convertToSerializedError } from './store'

export const fetchLoginStatus = () => async (dispatch: AppDispatch, getState: () => RootState) => {
	if (getState().auth.loading) return

	try {
		dispatch(AuthActions.setLoading())
		const reply = await apiTriton.fetchLoginStatus()
		// console.debug(`Logged in succesfully: ${JSON.stringify(reply)}`)
		dispatch(AuthActions.setLoginState(reply))
	} catch (err) {
		dispatch(AuthActions.setLoginError(convertToSerializedError(err)))
		throw err
	}
}

export const fetchProjects = () => async (dispatch: AppDispatch, getState: () => RootState) => {
	if (getState().projectsState.loading) return

	try {
		dispatch(ProjectsStateActions.setLoading())
		const projects = await apiTriton.listProjects()
		// console.debug(`Loaded projects succesfully: ${projects}`)
		dispatch(ProjectsStateActions.setProjects(projects))
		dispatch(RunsStateActions.initializeRunsByProjectId(projects))
		dispatch(DatasetsStateActions.initializeDatasetsByProjectId(projects))
	} catch (err: any) {
		dispatch(ProjectsStateActions.setError(convertToSerializedError(err)))
		throw err
	}
}

export const fetchRuns = (externalProjectId: ExternalProjectID) => async (dispatch: AppDispatch, getState: () => RootState) => {
	if (getState().runsState.runsByProjectId[externalProjectId]?.loading) return

	try {
		dispatch(RunsStateActions.setLoading(externalProjectId))
		const runs = await apiTriton.listRunsForProjects([externalProjectId])
		// console.info('Loaded runs succesfully', runs)
		dispatch(RunsStateActions.setRunsByProjectId({ projectId: externalProjectId, runs }))
		// console.info(getState().runsState.runsById)
		return runs
	} catch (err: any) {
		dispatch(DatasetsStateActions.setError({ projectId: externalProjectId, error: convertToSerializedError(err) }))
		throw err
	}
}

export const fetchDatasets = (externalProjectId: ExternalProjectID) => async (dispatch: AppDispatch, getState: () => RootState) => {
	if (getState().datasetsState.datasetsByProjectId[externalProjectId]?.loading) return
	
	try {
		dispatch(DatasetsStateActions.setLoading(externalProjectId))
		const datasetIds = Object.values(getState().runsState.runsByName).reduce<number[]>((datasetIDs, run) => {
			if (run) {
				datasetIDs.push(...run.datasets)
			}
			return datasetIDs
		}, [])
		// console.info(datasetIds)
		const datasets = await apiTriton.listDatasetsByIds(datasetIds)
		// console.debug(`Loaded datasets succesfully: ${JSON.stringify(datasets)}`)
		dispatch(DatasetsStateActions.setDatasetsByProjectId({ projectId: externalProjectId, datasets }))
		dispatch(ReadsetsStateActions.initializeReadsetsByDatasetIds(datasets))

		return datasets
	} catch (err: any) {
		dispatch(DatasetsStateActions.setError({ projectId: externalProjectId, error: convertToSerializedError(err) }))
		throw err
	}
}

const updateProjectUsage = (projectId: ExternalProjectID) => async (dispatch: AppDispatch, getState: () => RootState) => {
	const readsets = Object.values(getState().readsetsState.readsetsById).reduce<TritonReadset[]>((readsets, readset) => {
		if (readset && readset.dataset && getState().datasetsState.datasetsById[readset.dataset]?.external_project_id === projectId) {
			readsets.push(readset)
		}
		return readsets
	}, [])
	const diskUsage: ProjectState['diskUsage'] = {
		'GLOBUS': 0,
		'SFTP': 0,
	}
	for (const readset of readsets) {
		const dataset = getState().datasetsState.datasetsById[readset.dataset]
		if (dataset) {
			const [request] = dataset.requests
			if (request) {
				diskUsage[request.type] = diskUsage[request.type] + readset.total_size
			}
		}
	}
	dispatch(ProjectsStateActions.setDiskUsage({ projectId, diskUsage }))
}

export const fetchReadsets = (datasetId: TritonDataset['id']) => async (dispatch: AppDispatch, getState: () => RootState) => {
	if (getState().readsetsState.readsetsByDatasetId[datasetId]?.loading) return

	try {
		dispatch(ReadsetsStateActions.setLoading(datasetId))
		const readsets = await apiTriton.listReadsetsForDataset(datasetId)
		// console.debug(`Loaded readsets succesfully: ${JSON.stringify(readsets)}`)
		dispatch(ReadsetsStateActions.setReadsetsByDatasetId({ datasetId, readsets }))

		const projectId = getState().datasetsState.datasetsById[datasetId]?.external_project_id
		if (projectId) {
			dispatch(updateProjectUsage(projectId))
		}

		return readsets
	} catch (err: any) {
		dispatch(ReadsetsStateActions.setError({ datasetId, error: convertToSerializedError(err) }))
		throw err
	}
}

export const fetchDatasetFiles = (readsetId: TritonReadset['id']) => async (dispatch: AppDispatch, getState: () => RootState) => {
	if (getState().datasetFilesState.datasetFilesByReadsetId[readsetId]?.loading) return

	try {
		dispatch(DatasetFilesStateActions.setLoading(readsetId))
		const datasetFiles = await apiTriton.listDatasetFilesForReadset(readsetId)
		// console.debug(`Loaded readsets succesfully: ${JSON.stringify(readsets)}`)
		dispatch(DatasetFilesStateActions.setDatasetFilesByReadsetId({ readsetId, datasetFiles }))

		return datasetFiles
	} catch (err: any) {
		dispatch(DatasetFilesStateActions.setError({ readsetId, error: convertToSerializedError(err) }))
		throw err
	}
}

export const createDownloadRequest = (projectId: ExternalProjectID, datasetID: number, type: DownloadRequestType) =>
	async (dispatch: AppDispatch, getState: () => RootState) => {
		// TODO: check loading state here
		try {
			const response = await apiTriton.createDownloadRequest({ projectID: projectId, datasetID, type } )
			// console.debug(`Loaded datasets succesfully: ${JSON.stringify(datasets)}`)
			dispatch(DatasetsStateActions.setDownloadRequest(response))
			dispatch(updateProjectUsage(projectId))
		} catch (err: any) {
			dispatch(DatasetsStateActions.setError({ projectId, error: convertToSerializedError(err) }))
			throw err
		}
	}

export const fetchConstants = () => async (dispatch: AppDispatch, getState: () => RootState) => {
	try {
		const constants = await apiTriton.getConstants()
		dispatch(ConstantsStateActions.setConstants(constants))
	} catch (err) {
		dispatch(ConstantsStateActions.setError(convertToSerializedError(err)))
		throw err
	}
}
