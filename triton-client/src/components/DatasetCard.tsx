import { Button, Checkbox, Divider, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo } from 'react'
import { DownloadRequest, DownloadRequestType } from '../api/api-types'
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

	const requestByType = useMemo(() => (dataset?.requests ?? []).reduce(
		(requestByType, request) => {
			requestByType[request.type] = request
			return requestByType
		}, {} as Record<DownloadRequestType, DownloadRequest | undefined>),
	[dataset?.requests])
	const supportedDownloadType: DownloadRequestType[] = useMemo(() => ['SFTP', 'GLOBUS'], [])
	const requestDetails = useMemo(() => {
		return supportedDownloadType.map((type) => {
			const req = requestByType[type]
			if (req) {
				const { type, status, expiry_date } = req
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }}>
					{type}
					<Divider type={'vertical'} style={{ backgroundColor: 'black' }}/>
					{status === 'SUCCESS' ? expiry_date ?? '?' : status}
				</Button>
			} else {
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={!totalSize || alreadyRequested} onClick={() => request(type)}>
					{type}
					<Divider type={'vertical'} style={{ backgroundColor: 'black' }}/>
					AVAILABLE
				</Button>
			}
		})
	}, [alreadyRequested, request, requestByType, supportedDownloadType, totalSize])

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
				<Text strong>Dataset #{dataset.id}</Text>
			</Space>
			<Space>
				{
					// middle
					requestDetails
				}
			</Space>
			<Space>
				{
					// right
				}
				<div>
					{!totalSize ? <Spin /> : <DataSize size={totalSize} />}
				</div>
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
