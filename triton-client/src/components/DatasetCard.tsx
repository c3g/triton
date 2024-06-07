import { Button, Modal, Space, Spin, Typography } from 'antd'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadRequest, DownloadRequestType } from '../api/api-types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { ReadsetState } from '../store/readsets'
import { createDownloadRequest, fetchReadsets } from '../store/thunks'
import { selectConstants } from '../store/constants'
import { unitWithMagnitude } from '../functions'
import { SUPPORTED_DOWNLOAD_TYPES } from '../constants'

const { Text } = Typography
interface DatasetCardProps {
	datasetID: number
}

function DatasetCard({ datasetID }: DatasetCardProps) {
	const dispatch = useAppDispatch()
	const dataset = useAppSelector((state) => state.datasetsState.datasetsById[datasetID])
	const project = useAppSelector((state) => dataset?.external_project_id ? state.projectsState.projectsById[dataset.external_project_id] : undefined)
	const constants = useAppSelector(selectConstants)
	const readsetsByDatasetId = useAppSelector((state) => state.readsetsState.readsetsByDatasetId)
	const readsetsById = useAppSelector((state) => state.readsetsState.readsetsById)
	const alreadyRequested = dataset ? dataset.requests.length > 0 : false

	const [updatingRequest, setUpdatingRequest] = useState(false)
	const dispatchCreateRequest = useCallback(async (type: DownloadRequestType) => {
		if (dataset) {
			setUpdatingRequest(true)
			await dispatch(createDownloadRequest(dataset.external_project_id, datasetID, type)).finally(() => setUpdatingRequest(false))
		}
	}, [dataset, datasetID, dispatch])

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
		if (dataset && project && totalSize) {
			const diskUsage = project.diskUsage[downloadType]
			const diskCapacity = constants.diskCapacity[downloadType]
			if (diskUsage + totalSize > diskCapacity) {
				Modal.confirm({
					title: `${downloadType} Project Quota Exceeded`,
					content: `The total size of the datasets will exceed the ${downloadType} project quota. This dataset will be queued until space is freed.`,
					onOk: () => dispatchCreateRequest(downloadType).catch((e) => console.error(e)),
					okText: 'Continue',
					cancelText: 'Cancel',
				})
			} else {
				dispatchCreateRequest(downloadType).catch((e) => console.error(e))
			}
		}
	}, [constants.diskCapacity, dataset, dispatchCreateRequest, project, totalSize])

	const requestByType = useMemo(() => (dataset?.requests ?? []).reduce(
		(requestByType, request) => {
			requestByType[request.type] = request
			return requestByType
		}, {} as Record<DownloadRequestType, DownloadRequest | undefined>),
	[dataset?.requests])
	const requestDetails = useMemo(() => {
		return SUPPORTED_DOWNLOAD_TYPES.map((type) => {
			const req = requestByType[type]
			if (req) {
				const { type, status, expiry_date } = req
				let statusDescription: ReactNode
				if (status === "SUCCESS") {
					statusDescription = ["SUCCESS", "|", `Expires: ${expiry_date ? expiry_date : "-"}`]
				} else if (status === "FAILED") {
					statusDescription = "FAILED"
				} else {
					statusDescription = "QUEUED"
				}
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={updatingRequest}>
					<Space>
						{type}
						{"|"}
						{statusDescription}
					</Space>
				</Button>
			} else {
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={!totalSize || alreadyRequested || updatingRequest || !dataset || !project} onClick={() => request(type)}>
					<Space>
						{type}
						{"|"}
						AVAILABLE
					</Space>
				</Button>
			}
		})
	}, [requestByType, updatingRequest, totalSize, alreadyRequested, dataset, project, request])

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

interface SizeProps {
	size: number
}

function DataSize({ size }: SizeProps) {
	const { unit, magnitude } = unitWithMagnitude(size)
	return (
		<>
			{(size / magnitude).toFixed(2)} {unit}
		</>
	)
}

export default DatasetCard
