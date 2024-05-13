import { createSlice, PayloadAction, SerializedError } from '@reduxjs/toolkit'
import { TritonProject } from '../api/api-types'
import { RootState } from './store'
import { ItemsById } from './utils'

export interface ProjectsState {
	loading: boolean
	projects: TritonProject[]
	projectsById: Record<TritonProject['external_id'], TritonProject | undefined> // External project ID is used as key
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
				acc[project.external_id] = project
				return acc
			}, {} as ProjectsState['projectsById'])
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
