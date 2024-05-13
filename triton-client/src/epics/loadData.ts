import { Epic } from 'redux-observable'
import { RootState, AppAction } from '../store/store'

type TritonEpic = Epic<AppAction, AppAction, RootState, any>
