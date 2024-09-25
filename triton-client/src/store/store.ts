import { SerializedError, configureStore } from "@reduxjs/toolkit"

import AuthReducer, { AuthState, AuthAction } from "./auth"
import ProjectsReducer, { ProjectsState, ProjectsStateAction } from "./projects"
import DatasetsReducer, { DatasetsState, DatasetStateAction } from "./datasets"
import ReadsetsReducer, { ReadsetsState, ReadsetsStateAction } from "./readsets"
import DatasetFilesReducer, {
    DatasetFilesState,
    DatasetFilesStateAction,
} from "./datasetFiles"
import ConstantsReducers, {
    ConstantsState,
    ConstantsStateAction,
} from "./constants"
import RequestReducers, { RequestsState, RequestsStateAction } from "./requests"

export interface RootState {
    readonly auth: AuthState
    readonly projectsState: ProjectsState
    readonly datasetsState: DatasetsState
    readonly requestsState: RequestsState
    readonly readsetsState: ReadsetsState
    readonly datasetFilesState: DatasetFilesState
    readonly constants: ConstantsState
}

export type AppAction =
    | AuthAction
    | ProjectsStateAction
    | DatasetStateAction
    | RequestsStateAction
    | ReadsetsStateAction
    | DatasetFilesStateAction
    | ConstantsStateAction

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
        projectsState: ProjectsReducer,
        datasetsState: DatasetsReducer,
        requestsState: RequestReducers,
        readsetsState: ReadsetsReducer,
        datasetFilesState: DatasetFilesReducer,
        constants: ConstantsReducers,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(), //.concat(loggerMiddleware),
})

export type AppDispatch = typeof store.dispatch

export function convertToSerializedError(err: any): SerializedError {
    if (err instanceof Error) {
        const { name, message, stack, code }: SerializedError = err
        return { name, message, stack, code }
    } else {
        return { name: err.toString(), message: err.toString() }
    }
}
