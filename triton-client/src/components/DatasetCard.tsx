import { Button, Modal, Space, Spin, Typography } from 'antd'
import { ReactNode, ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadRequest, DownloadRequestType, TritonReadset } from '../api/api-types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { ReadsetState } from '../store/readsets'
import { deleteDownloadRequest, createDownloadRequest, fetchReadsets } from '../store/thunks'
import { selectConstants } from '../store/constants'
import { unitWithMagnitude } from '../functions'
import { SUPPORTED_DOWNLOAD_TYPES } from '../constants'
import { CloseCircleOutlined } from '@ant-design/icons'
import { ActionDropdown } from './ActionDropdown'
import { store } from '../store/store'

const { Text } = Typography
interface DatasetCardProps {
	datasetID: number
}

export interface StagingAction {
  action: {name: string, actionCall: () => void}
  icon: ReactElement
}

function DatasetCard({ datasetID }: DatasetCardProps) {
	const dispatch = useAppDispatch()
	const dataset = useAppSelector((state) => state.datasetsState.datasetsById[datasetID])
	const readsetsById = useAppSelector((state) => state.readsetsState.readsetsById)
	const project = useAppSelector((state) => dataset?.external_project_id ? state.projectsState.projectsById[dataset.external_project_id] : undefined)
	const constants = useAppSelector(selectConstants)
	const activeRequest = useMemo<DownloadRequest | undefined>(() => {
		return dataset?.requests[0] ?? undefined
	}, [dataset?.requests])
	const alreadyRequested = !!activeRequest

	const [updatingRequest, setUpdatingRequest] = useState(false)
	const dispatchCreateRequest = useCallback(async (type: DownloadRequestType) => {
		if (dataset) {
			setUpdatingRequest(true)
			await dispatch(createDownloadRequest(dataset.external_project_id, datasetID, type)).finally(() => setUpdatingRequest(false))
		}
	}, [dataset, datasetID, dispatch])

	const readsets = useMemo(() => {
		return Object.values(readsetsById).reduce<TritonReadset[]>((readsets, readset) => {
			if (readset && readset.dataset === datasetID) {
				readsets.push(readset)
			}
			return readsets
		}, [])
	}, [datasetID, readsetsById])
	const totalSize = useMemo(() => readsets.reduce((total, r) => total + r.total_size, 0), [readsets])

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
	
	const deleteRequest = useCallback(() => {
		dispatch(deleteDownloadRequest(datasetID)).catch((e) => console.error(e))
	}, [datasetID, dispatch])

	const requestByType = useMemo(() => (dataset?.requests ?? []).reduce(
		(requestByType, request) => {
			requestByType[request.type] = request
			return requestByType
		}, {} as Record<DownloadRequestType, DownloadRequest | undefined>),
	[dataset?.requests])
	const requestDetails = useMemo(() => {
		return SUPPORTED_DOWNLOAD_TYPES.map((type) => {
			const req = requestByType[type]
			if (req && !req.should_delete) {
				const { type, status, expiry_date } = req
        const actions: StagingAction[] = [
          {action: {name: "Unstage dataset", actionCall: () => deleteRequest()}, icon: <CloseCircleOutlined style={{color: '#c9162b'}}/>}
        ]

        let statusDescription: ReactNode
				if (status === "SUCCESS") {
					statusDescription = ["AVAILABLE", "|", `Expires: ${expiry_date ? expiry_date : "-"}`]
				} else if (status === "FAILED") {
					statusDescription = "FAILED"
				} else {
					statusDescription = "QUEUED"
				}
				const buttonStagingActive = (<Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={updatingRequest}>
					                        <Space>
                                    {type}
                                    {"|"}
                                    {statusDescription}
                                  </Space>
                               </Button>)

				return <ActionDropdown button={buttonStagingActive} actions={actions}/>
			} else {
				return <Button key={type} style={{ paddingLeft: '4', paddingRight: '4' }} disabled={!totalSize || alreadyRequested || updatingRequest || !dataset || !project} onClick={() => request(type)}>
                  <Space>
                    {type}
                    {"|"}
                  {alreadyRequested && type === activeRequest.type? "UNSTAGING" : "READY"}
                  </Space>
				       </Button>
      }
    })
	}, [alreadyRequested, dataset, project, request, updatingRequest, deleteRequest, activeRequest?.type, requestByType, totalSize])

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
