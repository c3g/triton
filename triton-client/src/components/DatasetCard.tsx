import { Button, Checkbox, Space, Spin, Typography } from 'antd'
import { useCallback, useEffect, useMemo } from 'react'
import { DownloadRequest, DownloadRequestStatus, DownloadRequestType } from '../api/api-types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { ReadsetState } from '../store/readsets'
import { createDownloadRequest, fetchReadsets } from '../store/thunks'
import { sizeUnitWithScalar } from '../functions'

const { Text } = Typography
interface DatasetCardProps {
	datasetID: number
}

function DatasetCard({ datasetID }: DatasetCardProps) {
	const dispatch = useAppDispatch()
	const dataset = useAppSelector((state) => state.datasetsState.datasetsById[datasetID])
	const readsetsByDatasetId = useAppSelector((state) => state.readsetsState.readsetsByDatasetId)
	const readsetsById = useAppSelector((state) => state.readsetsState.readsetsById)
	const alreadyRequested = dataset ? dataset.requests.length > 0 : false

	const readsets = useMemo(() => {
		return readsetsByDatasetId[datasetID]?.readsets.reduce((readsets, id) => {
			const readset = readsetsById[id]
			if (readset) {
				readsets ??= []
				readsets.push(readset)
			}
			return readsets
		}, [] as ReadsetState[] | undefined)
	}, [datasetID, readsetsByDatasetId, readsetsById])
	const totalSize = useMemo(() => readsets?.reduce((total, r) => total + r.total_size, 0), [readsets])

	useEffect(() => {
		dispatch(fetchReadsets(datasetID))
	}, [datasetID, dispatch])

	const request = useCallback((downloadType: DownloadRequestType) => {
		if (dataset) {
			dispatch(createDownloadRequest(dataset.external_project_id, datasetID, downloadType)).catch((e) => console.error(e))
		}
	}, [dataset, datasetID, dispatch])

	return dataset ? (<div
		style={{
			backgroundColor: 'white',
			paddingLeft: '1rem',
			paddingTop: '1rem',
			paddingRight: '1rem',
			height: '4rem',
		}}
	>
		<div style={{ display: 'flex', justifyContent: 'space-between' }}>
			<Space>
				{
					// left
				}
				<Checkbox disabled={false} />
				<Text strong>Lane {dataset.lane}</Text>
			</Space>
			<Space>
				{
					// middle
					dataset.requests.map((r) => <DownloadRequestDetail downloadRequest={r} />)
				}
			</Space>
			<Space>
				{
					// right
				}
				<div>
					{!totalSize ? <Spin /> : <DataSize size={totalSize} />}
				</div>
				<Button onClick={() => request('SFTP')} disabled={!totalSize && alreadyRequested}>SFTP</Button>
				<Button onClick={() => request('GLOBUS')} disabled={!totalSize && alreadyRequested}>GLOBUS</Button>
			</Space>
		</div>
	</div>
	) : <Spin />
}

export default DatasetCard


interface SizeProps {
	size: number
}

function DataSize({ size }: SizeProps) {
	const { unit, size: magnitude } = sizeUnitWithScalar(size)
	return (
		<>
			{(size / magnitude).toFixed(2)} {unit}
		</>
	)
}

interface DownloadRequestDetailProps {
	downloadRequest: DownloadRequest
}

function DownloadRequestDetail({ downloadRequest }: DownloadRequestDetailProps) {
	const { type, status, expiry_date } = downloadRequest
	switch (status as DownloadRequestStatus) {
		case 'REQUESTED': {
			return <>REQUESTED</>
		}
		case 'PENDING': {
			return <>PENDING</>
		}
		case 'FAILED': {
			return <>FAILED</>
		}
		case 'QUEUED': {
			return <>QUEUED</>
		}
		case 'SUCCESS': {
			return (
				<Space direction='vertical'>
					<Text>{type}</Text>
					<Text>{`Data available until ${expiry_date ? expiry_date : '?'}`}</Text>
				</Space>
			)
		}
	}
}