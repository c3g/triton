import { useParams } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import DatasetList from './DatasetList'


function RunDetail() {
	const { runName: runNameParam } = useParams()
	const runName = runNameParam ?? ''

	const runsByName = useAppSelector((state) => state.runsState.runsByName)

	return (
		<div style={{ margin: '1rem 0.5rem' }}>
			{runsByName[runName] && (
				<DatasetList
					runName={runName}
				/>
			)}
		</div>
	)
}

export default RunDetail
