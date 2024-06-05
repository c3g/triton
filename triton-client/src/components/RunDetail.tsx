import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import DatasetList from './DatasetList'
import { useEffect } from 'react'
import { selectConstants } from '../store/constants'
import { fetchConstants } from '../store/thunks'
import { Col, Row } from 'antd'
import DataSize from './DataSize'

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
						<div style={{
							backgroundColor: 'white',
							marginBottom: '0.5rem',
							paddingRight: '1.5rem',
							width: '25rem',
							textAlign: 'center',
						}}>
							<Row>
								<Col span={6}>Globus:</Col> <Col span={6}>{<DataSize size={project.globusUsage} />}</Col> <Col span={6}>of</Col> <Col span={6}>{<DataSize size={constants.globus_project_size} />}</Col>
							</Row>
							<Row>
								<Col span={6}>SFTP:</Col> <Col span={6}>{<DataSize size={project.sftpUsage} />}</Col> <Col span={6}>of</Col> <Col span={6}>{<DataSize size={constants.sftp_project_size} />}</Col>
							</Row>
						</div>
					}
					<DatasetList
						runName={runName}
					/>
				</>
			)}
		</div>
	)
}

export default RunDetail
