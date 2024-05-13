import { combineEpics } from 'redux-observable'
import { catchError, ignoreElements } from 'rxjs/operators'
import { RootState, AppAction } from '../store/store'

// All epics need to be registered here.

type RootEpic = ReturnType<typeof combineEpics<AppAction, AppAction, RootState, any>>

export const rootEpic: RootEpic = (action$, store$, dependencies) => {
	return action$.pipe(
		catchError((error, source) => {
			console.error(error)
			return source
		}),
		ignoreElements()
	)
}
