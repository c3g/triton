import { createSlice, PayloadAction, SerializedError } from "@reduxjs/toolkit"
import { DownloadRequestType, TritonProject } from "../api/api-types"
import { RootState } from "./store"

export interface ProjectState extends TritonProject {
    diskUsage: Record<DownloadRequestType, number>
}

export interface ProjectsState {
    loading: boolean
    projects: TritonProject[]
    projectsById: Record<TritonProject["external_id"], ProjectState | undefined> // External project ID is used as key
    error?: SerializedError
}

const initialState: ProjectsState = {
    loading: false,
    projects: [],
    projectsById: {},
}

export const projectsSlice = createSlice({
    name: "projects",
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<void>) => {
            state.loading = true
        },
        setProjects: (state, action: PayloadAction<TritonProject[]>) => {
            state.loading = false
            state.projects = action.payload
            action.payload.forEach((project) => {
                state.projectsById[project.external_id] = {
                    ...project,
                    diskUsage: {
                        GLOBUS: 0,
                        SFTP: 0,
                    },
                }
            })
        },
        setDiskUsage: (
            state,
            action: PayloadAction<{
                projectId: TritonProject["external_id"]
                diskUsage: ProjectState["diskUsage"]
            }>,
        ) => {
            const { projectId, diskUsage } = action.payload
            const project = state.projectsById[projectId]
            if (project) {
                project.diskUsage = {
                    ...project.diskUsage,
                    ...diskUsage,
                }
            }
        },
        setError: (state, action: PayloadAction<SerializedError>) => {
            state.loading = false
            state.error = action.payload
        },
    },
})

const { actions, reducer } = projectsSlice

export default reducer

export const selectProjectsLoading = (state: RootState) =>
    state.projectsState.loading
export const selectProjects = (state: RootState) => state.projectsState.projects

export const ProjectsStateActions = actions
export type ProjectsStateAction = ReturnType<
    (typeof ProjectsStateActions)[keyof typeof ProjectsStateActions]
>
