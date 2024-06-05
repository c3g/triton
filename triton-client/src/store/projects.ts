import { createSlice, PayloadAction, SerializedError } from '@reduxjs/toolkit'
import { TritonProject } from '../api/api-types'
import { RootState } from './store'

export interface ProjectState extends TritonProject {
	sftpUsage: number
	globusUsage: number
}

export interface ProjectsState {
	loading: boolean
	projects: TritonProject[]
	projectsById: Record<TritonProject['external_id'], ProjectState | undefined> // External project ID is used as key
	error?: SerializedError
}

const initialState: ProjectsState = {
	loading: false,
	projects: [],
	projectsById: {},
}

export const projectsSlice = createSlice({
	name: 'projects',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<void>) => {
			state.loading = true
		},
		setProjects: (state, action: PayloadAction<TritonProject[]>) => {
			state.loading = false
			state.projects = action.payload
			state.projectsById = state.projects.reduce((acc, project) => {
				acc[project.external_id] = {
					...project,
					sftpUsage: 0,
					globusUsage: 0,
				}
				return acc
			}, {} as ProjectsState['projectsById'])
		},
		setSFTPUsage: (state, action: PayloadAction<{ projectId: TritonProject['external_id'], usage: number }>) => {
			const project = state.projectsById[action.payload.projectId]
			if (project) {
				project.sftpUsage = action.payload.usage
			}
		},
		setGlobusUsage: (state, action: PayloadAction<{ projectId: TritonProject['external_id'], usage: number }>) => {
			const project = state.projectsById[action.payload.projectId]
			if (project) {
				project.globusUsage = action.payload.usage
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

export const selectProjectsLoading = (state: RootState) => state.projectsState.loading
export const selectProjects = (state: RootState) => state.projectsState.projects

export const ProjectsStateActions = actions
export type ProjectsStateAction = ReturnType<typeof ProjectsStateActions[keyof typeof ProjectsStateActions]>
