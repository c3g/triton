import apiTriton from "../api/api-triton"
import {
    DownloadRequestType,
    ExternalProjectID,
    TritonDataset,
    TritonReadset,
    TritonRun,
} from "../api/api-types"
import { AuthActions } from "./auth"
import { DatasetFilesStateActions } from "./datasetFiles"
import { DatasetsStateActions } from "./datasets"
import { ProjectState, ProjectsStateActions } from "./projects"
import { ReadsetsStateActions } from "./readsets"
import { RunsStateActions } from "./runs"
import { ConstantsStateActions } from "./constants"
import { AppDispatch, RootState, convertToSerializedError } from "./store"
import { RequestsStateActions } from "./requests"
import { selectRequestOfDatasetId } from "../selectors"

export const fetchLoginStatus =
    () => async (dispatch: AppDispatch, getState: () => RootState) => {
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

export const fetchProjects =
    () => async (dispatch: AppDispatch, getState: () => RootState) => {
        if (getState().projectsState.loading) return

        try {
            dispatch(ProjectsStateActions.setLoading())
            const projects = await apiTriton.listProjects()
            // console.debug(`Loaded projects succesfully: ${projects}`)
            dispatch(ProjectsStateActions.setProjects(projects))
        } catch (err: any) {
            dispatch(
                ProjectsStateActions.setError(convertToSerializedError(err)),
            )
            throw err
        }
    }

export const fetchRuns =
    (externalProjectId: ExternalProjectID) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const runs = await apiTriton.listRunsForProjects([
                externalProjectId,
            ])
            // console.info('Loaded runs succesfully', runs)
            dispatch(RunsStateActions.setRuns(runs))
            // console.info(getState().runsState.runsById)
            return runs
        } catch (err: any) {
            throw err
        }
    }

export const fetchDatasets =
    (runName: TritonRun["name"]) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const run = getState().runsState.runsByName[runName]
            if (!run) {
                return []
            }

            // console.info(datasetIds)
            const datasets = await apiTriton.listDatasetsByIds(run.datasets)
            // console.debug(`Loaded datasets succesfully: ${JSON.stringify(datasets)}`)
            dispatch(DatasetsStateActions.setDatasets(datasets))

            return datasets
        } catch (err: any) {
            throw err
        }
    }

export const fetchRequests =
    (datasetIds: Array<TritonDataset["id"]>) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const requests =
                await apiTriton.listRequestsByDatasetIds(datasetIds)
            // console.debug(`Loaded datasets succesfully: ${JSON.stringify(datasets)}`)
            dispatch(RequestsStateActions.setRequests(requests))
            const projectIDs: Set<string> = new Set()
            for (const datasetId of datasetIds) {
                const projectId =
                    getState().datasetsState.datasetsById[datasetId]
                        ?.external_project_id
                if (projectId) {
                    projectIDs.add(projectId)
                }
            }
            projectIDs.forEach((projectId) =>
                dispatch(updateProjectUsage(projectId)),
            )

            return requests
        } catch (err: any) {
            throw err
        }
    }

const updateProjectUsage =
    (projectId: ExternalProjectID) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        const readsets = Object.values(
            getState().readsetsState.readsetsById,
        ).reduce<TritonReadset[]>((readsets, readset) => {
            if (
                readset &&
                readset.dataset &&
                getState().datasetsState.datasetsById[readset.dataset]
                    ?.external_project_id === projectId
            ) {
                readsets.push(readset)
            }
            return readsets
        }, [])
        const diskUsage: ProjectState["diskUsage"] = {
            GLOBUS: 0,
            SFTP: 0,
        }
        for (const readset of readsets) {
            const request = selectRequestOfDatasetId(
                getState(),
                readset.dataset,
            )
            if (request) {
                diskUsage[request.type] =
                    diskUsage[request.type] + readset.total_size
            }
        }
        dispatch(ProjectsStateActions.setDiskUsage({ projectId, diskUsage }))
    }

export const fetchReadsets =
    (datasetId: TritonDataset["id"]) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const readsets = await apiTriton.listReadsetsForDataset(datasetId)
            // console.debug(`Loaded readsets succesfully: ${JSON.stringify(readsets)}`)
            dispatch(ReadsetsStateActions.setReadsets(readsets))

            const projectId =
                getState().datasetsState.datasetsById[datasetId]
                    ?.external_project_id
            if (projectId) {
                dispatch(updateProjectUsage(projectId))
            }

            return readsets
        } catch (err: any) {
            throw err
        }
    }

export const fetchDatasetFiles =
    (readsetId: TritonReadset["id"]) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const datasetFiles =
                await apiTriton.listDatasetFilesForReadset(readsetId)
            // console.debug(`Loaded readsets succesfully: ${JSON.stringify(readsets)}`)
            dispatch(DatasetFilesStateActions.setDatasetFiles(datasetFiles))

            return datasetFiles
        } catch (err: any) {
            throw err
        }
    }

export const createDownloadRequest =
    (
        projectId: ExternalProjectID,
        datasetID: number,
        type: DownloadRequestType,
    ) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        // TODO: check loading state here
        try {
            const response = await apiTriton.createDownloadRequest({
                projectID: projectId,
                datasetID,
                type,
            })
            // console.debug(`Loaded datasets succesfully: ${JSON.stringify(datasets)}`)
            dispatch(RequestsStateActions.setRequests([response.request]))
            dispatch(updateProjectUsage(projectId))
        } catch (err: any) {
            throw err
        }
    }

export const fetchConstants =
    () => async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const constants = await apiTriton.getConstants()
            dispatch(ConstantsStateActions.setConstants(constants))
        } catch (err) {
            dispatch(
                ConstantsStateActions.setError(convertToSerializedError(err)),
            )
            throw err
        }
    }

export const deleteDownloadRequest =
    (datasetID: number) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const response = await apiTriton.deleteDownloadRequest(datasetID)
            // console.debug(`Loaded datasets succesfully: ${JSON.stringify(datasets)}`)
            dispatch(RequestsStateActions.setRequests([response.request]))
        } catch (err: any) {
            throw err
        }
    }

export const extendStagingRequest =
    (datasetID: number) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        try {
            const response = await apiTriton.extendStagingRequest(datasetID)
            dispatch(RequestsStateActions.setRequests([response]))
        } catch (err: any) {
            throw err
        }
    }
