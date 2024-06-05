import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import DatasetList from './DatasetList'
import { useEffect, useMemo } from 'react'
import { selectConstants } from '../store/constants'
import { fetchConstants } from '../store/thunks'
import { Col, Row } from 'antd'
import DataSize from './DataSize'
import { DownloadRequestType } from '../api/api-types'


function RunDetail() {
	const dispatch = useAppDispatch()
	const { runName: runNameParam } = useParams()
	const runName = runNameParam ?? ''

	const runsByName = useAppSelector((state) => state.runsState.runsByName)
	const constants = useAppSelector(selectConstants)
	const datasetById = useAppSelector((state) => state.datasetsState.datasetsById)
	const readsetsByDatasetId = useAppSelector((state) => state.readsetsState.readsetsByDatasetId)
	const readsetsById = useAppSelector((state) => state.readsetsState.readsetsById)
	const totalUsage = useMemo(() => {
		const totalUsage: Record<DownloadRequestType, number> = {
			GLOBUS: 0,
			HTTP: 0,
			SFTP: 0,
		}
		for (const dataset of Object.values(datasetById)) {
			if (!dataset) continue
			for (const request of dataset?.requests) {
				for (const readsetId of (readsetsByDatasetId[dataset.id]?.readsets ?? [])) {
					const readset = readsetsById[readsetId]
					if (!readset) continue
					totalUsage[request.type] += readset.total_size
				}
			}
		}
		return totalUsage
	}, [datasetById, readsetsByDatasetId, readsetsById])

	useEffect(() => {
		dispatch(fetchConstants())
	}, [dispatch])

	return (
		<div style={{ margin: '1rem 0.5rem' }}>
			{runsByName[runName] && (
				<>
					<div style={{
						backgroundColor: 'white',
						marginBottom: '0.5rem',
						paddingRight: '1.5rem',
						width: '25rem',
						textAlign: 'center',
					}}>
						<Row>
							<Col span={6}>Globus:</Col> <Col span={6}>{<DataSize size={totalUsage["GLOBUS"]} />}</Col> <Col span={6}>of</Col> <Col span={6}>{<DataSize size={constants.globus_project_size} />}</Col>
						</Row>
						<Row>
							<Col span={6}>SFTP:</Col> <Col span={6}>{<DataSize size={totalUsage["SFTP"]} />}</Col> <Col span={6}>of</Col> <Col span={6}>{<DataSize size={constants.sftp_project_size} />}</Col>
						</Row>
					</div>
					<DatasetList
						runName={runName}
					/>
				</>
			)}
		</div>
	)
}

export default RunDetail
