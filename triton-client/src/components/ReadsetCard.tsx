import { Button, Checkbox, Dropdown, MenuProps, Typography } from 'antd'
import { useCallback } from 'react'
import { DownloadRequest, DownloadRequestStatus, DownloadRequestType, TritonReadset } from '../api/api-types'
import { sizeUnitWithScalar } from '../functions'

const { Text } = Typography

type MenuKey = 'request' | 'undo-request' | 'download' | 'delete'
// a null/undefined download status implies it's ready for request
const readsetAvailableActions: { [k in DownloadRequestStatus]: Partial<{ [k in MenuKey]: boolean }> } = {
	REQUESTED: { 'undo-request': true },
	QUEUED: { 'undo-request': true },
	PENDING: {},
	SUCCESS: { download: true, delete: true },
	FAILED: { 'undo-request': true },
}

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
	const { status, expiry_date } = downloadRequest
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
				<div>
					<div>Data available until</div>
					<div>{expiry_date ? expiry_date : '...'}</div>
				</div>
			)
		}
	}
}

interface ReadsetCardProps {
	readset: Omit<TritonReadset, 'requests'> // TODO : do something about this typing
	downloadType: DownloadRequestType
	downloadRequest?: DownloadRequest
	lane: number
	requestDataCallback: (readsetId: TritonReadset['id']) => void
}

function ReadsetCard({ readset, lane, downloadType, downloadRequest, requestDataCallback }: ReadsetCardProps) {
	const menuItems: { label: string; key: MenuKey }[] = [
		{
			label: 'Request',
			key: 'request',
		},
		{
			label: 'Undo Request',
			key: 'undo-request',
		},
		{
			label: 'Download',
			key: 'download',
		},
		{
			label: 'Delete',
			key: 'delete',
		},
	]
	const menuHandle: (readsetId: TritonReadset['id']) => MenuProps['onClick'] = useCallback(
		(readsetId: TritonReadset['id']) => (info) => {
			const key: MenuKey = info.key as MenuKey
			switch (key) {
				case 'request':
					requestDataCallback(readsetId)
					break
				default:
					console.debug(key)
			}
		},
		[requestDataCallback]
	)

	const filteredMenuItems = menuItems.filter(({ key }) => {
		if (!downloadRequest) {
			return key === 'request'
		}
		return readsetAvailableActions[downloadRequest.status][key]
	})
	const isActionDisabled = downloadRequest && downloadRequest.status === 'PENDING'

	return (
		<div
			key={readset.name}
			style={{
				backgroundColor: 'white',
				paddingLeft: '1rem',
				paddingTop: '1rem',
				paddingRight: '1rem',
				height: '5rem',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
					{
						// left
					}
					<Checkbox disabled={isActionDisabled} />
					<div>
						<div>{readset.name}</div>
						{/* <div>Library type:</div> */}
						<div>
							<Text>{`Lane: ${lane}`}</Text>
						</div>
					</div>
				</div>
				<div>
					{
						// middle
					}
				</div>
				<div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
					{
						// right
					}
					{downloadRequest && <DownloadRequestDetail downloadRequest={downloadRequest} />}
					<div>
						<DataSize size={readset.total_size} />
					</div>
					<Dropdown
						menu={{
							items: filteredMenuItems,
							onClick: menuHandle(readset['id']),
						}}
						trigger={['click']}
						disabled={isActionDisabled}
					>
						<Button shape="circle" disabled={isActionDisabled}>
							...
						</Button>
					</Dropdown>
				</div>
			</div>
		</div>
	)
}

export default ReadsetCard
