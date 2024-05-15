import { Middleware, configureStore } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'

import AuthReducer, { AuthState, AuthAction } from './auth'
import ProjectsReducer, { ProjectsState, ProjectsStateAction } from './projects'
import DatasetsReducer, { DatasetsState, DatasetStateAction } from './datasets'
import ReadsetsReducer, { ReadsetsState, ReadsetsStateAction } from './readsets'
import DatasetFilesReducer, { DatasetFilesState, DatasetFilesStateAction } from './datasetFiles'
import RunsReducer, { RunsState, RunsStateAction } from './runs'

export interface RootState {
	readonly auth: AuthState
	readonly projectsState: ProjectsState
	readonly runsState: RunsState
	readonly datasetsState: DatasetsState
	readonly readsetsState: ReadsetsState
	readonly datasetFilesState: DatasetFilesState
}

export type AppAction = AuthAction | ProjectsStateAction | DatasetStateAction | ReadsetsStateAction | DatasetFilesStateAction | RunsStateAction

const loggerMiddleware: [Middleware<{}, RootState>] | [] =
	process.env.NODE_ENV === 'development'
		? [
				createLogger({
					level: 'info',
				}),
		  ]
		: []

export const store = configureStore({
	reducer: {
		auth: AuthReducer,
		projectsState: ProjectsReducer,
		runsState: RunsReducer,
		datasetsState: DatasetsReducer,
		readsetsState: ReadsetsReducer,
		datasetFilesState: DatasetFilesReducer,
	},
	middleware: (getDefaultMiddleware) => getDefaultMiddleware()//.concat(loggerMiddleware),
})

export type AppDispatch = typeof store.dispatch
