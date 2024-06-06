import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import DatasetList from './DatasetList'
import { useEffect } from 'react'
import { selectConstants } from '../store/constants'
import { fetchConstants } from '../store/thunks'

import './RunDetail.scss'
import { unitWithMagnitude } from '../functions'

function RunDetail() {
	const dispatch = useAppDispatch()
	const { runName: runNameParam } = useParams()
	const runName = runNameParam ?? ''

	const runsByName = useAppSelector((state) => state.runsState.runsByName)
	const project = useAppSelector((state) => state.projectsState.projectsById[runsByName[runName]?.external_project_id ?? -1])
	const constants = useAppSelector(selectConstants)

	useEffect(() => {
		dispatch(fetchConstants())
	}, [dispatch])

	return (
		<div style={{ margin: '1rem 0.5rem' }}>
			{runsByName[runName] && (
				<>
					{ project &&
						<span id={"RunDetail-capacity"}>
							<table>
								<tbody>
									<tr>
										<td>Globus:</td>
										{dataSize(project.globusUsage).map((x) => <td key={x}>{x}</td>)}
										<td>of</td>
										{dataSize(constants.globus_project_size).map((x) => <td key={x}>{x}</td>)}
									</tr>
									<tr>
										<td>SFTP:</td>
										{dataSize(project.sftpUsage).map((x) => <td key={x}>{x}</td>)}
										<td>of</td>
										{dataSize(constants.sftp_project_size).map((x) => <td key={x}>{x}</td>)}
									</tr>
								</tbody>
							</table>
						</span>
					}
					<DatasetList
						runName={runName}
					/>
				</>
			)}
		</div>
	)
}

function dataSize(size: number) {
	const { unit, magnitude } = unitWithMagnitude(size)
	return [
		(size / magnitude).toFixed(2),
		unit,
	]
}

export default RunDetail
