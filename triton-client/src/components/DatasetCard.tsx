import { Button, Modal, Space, Spin, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadRequest, DownloadRequestType } from '../api/api-types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { ReadsetState } from '../store/readsets'
import { createDownloadRequest, fetchReadsets } from '../store/thunks'
import DataSize from './DataSize'
import { selectConstants } from '../store/constants'

const { Text } = Typography
interface DatasetCardProps {
	datasetID: number
}

function DatasetCard({ datasetID }: DatasetCardProps) {
	const dispatch = useAppDispatch()
	const dataset = useAppSelector((state) => state.datasetsState.datasetsById[datasetID])
	const project = useAppSelector((state) => state.projectsState.projectsById[dataset?.external_project_id ?? -1])
	const constants = useAppSelector(selectConstants)
	const readsetsByDatasetId = useAppSelector((state) => state.readsetsState.readsetsByDatasetId)
	const readsetsById = useAppSelector((state) => state.readsetsState.readsetsById)
	const alreadyRequested = dataset ? dataset.requests.length > 0 : false

	const [creatingRequest, setCreatingRequest] = useState(false)
	const dispatchCreateRequest = useCallback(async (type: DownloadRequestType) => {
		if (dataset) {
			setCreatingRequest(true)
			await dispatch(createDownloadRequest(dataset.external_project_id, datasetID, type)).finally(() => setCreatingRequest(false))
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
			if (downloadType === 'GLOBUS') {
				if (project.globusUsage + totalSize > constants.globus_project_size) {
					Modal.confirm({
						title: `Globus Project Quota Exceeded`,
						content: 'The total size of the datasets will exceed the Globus project quota. This dataset will be queued until space is freed.',
						onOk: () => dispatchCreateRequest('GLOBUS').catch((e) => console.error(e)),
						okText: 'Continue',
						cancelText: 'Cancel',
					})
				} else {
					dispatchCreateRequest('GLOBUS').catch((e) => console.error(e))
				}
			} else if (downloadType === 'SFTP') {
				if (project.sftpUsage + totalSize > constants.sftp_project_size) {
					Modal.confirm({
						title: 'SFTP Project Quota Exceeded',
						content: 'The total size of the datasets will exceed the SFTP project quota. This dataset will be queued until space is freed.',
						onOk: () => dispatchCreateRequest('SFTP').catch((e) => console.error(e)),
						okText: 'Continue',
						cancelText: 'Cancel',
					})
				} else {
					dispatchCreateRequest('SFTP').catch((e) => console.error(e))
				}
			}
		}
	}, [constants.globus_project_size, constants.sftp_project_size, dataset, dispatchCreateRequest, project, totalSize])

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
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={creatingRequest}>
					<Space>
						{type}
						{"|"}
						{status === 'SUCCESS' ? expiry_date ?? '?' : status}
					</Space>
				</Button>
			} else {
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={!totalSize || alreadyRequested || creatingRequest} onClick={() => request(type)}>
					<Space>
						{type}
						{"|"}
						AVAILABLE
					</Space>
				</Button>
			}
		})
	}, [alreadyRequested, creatingRequest, request, requestByType, supportedDownloadType, totalSize])

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
