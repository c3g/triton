import { Empty } from 'antd'
import { useCallback } from 'react'
import { DownloadRequestStatus, DownloadRequestType, TritonReadset } from '../api/api-types'
import { useAppDispatch } from '../store/hooks'
import { ReadsetState } from '../store/readsets'
import { createDownloadRequest } from '../store/thunks'
import ReadsetCard from './ReadsetCard'

interface ReadsetListProps {
	laneByReadsets: { [num: number]: number }
	external_project_id: string
	readsets: ReadsetState[]
	downloadType: DownloadRequestType
	downloadStatus: DownloadRequestStatus | null
}

function ReadsetList({ laneByReadsets, external_project_id, readsets, downloadType, downloadStatus }: ReadsetListProps) {
	const dispatch = useAppDispatch()

	const requestDataCallback = useCallback(
		async (readsetId: TritonReadset['id']) => {
			await dispatch(createDownloadRequest(external_project_id, readsetId, downloadType))
		},
		[dispatch, external_project_id, downloadType]
	)

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '0.25rem',
			}}
		>
			{readsets.length === 0 ? (
				<Empty
					description={
						downloadStatus ? (
							<>
								There are no sample data that are
								<b style={{ marginLeft: '0.25rem' }}>{downloadStatus.toUpperCase()}</b>.
							</>
						) : (
							'There are no sample data available for request.'
						)
					}
				/>
			) : (
				readsets.map((readset) => {
					return <></>
				})
			)}
		</div>
	)
}

export default ReadsetList
