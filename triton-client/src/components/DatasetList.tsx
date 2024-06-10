import { Empty, Spin } from 'antd'
import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import DatasetCard from './DatasetCard'

interface DatasetListProps {
	runName: string
}

function DatasetList({ runName }: DatasetListProps) {
	const datasetIDs = useAppSelector((state) => state.runsState.runsByName[runName]?.datasets)

	const renderDatasets = useMemo(() => {
		if (datasetIDs === undefined)
			return <Spin />
		if (datasetIDs.length === 0)
			return <Empty
				description={'There are no sample data available for request.'}
			/>
		if (datasetIDs.length > 0) {
			return datasetIDs.map((datasetID) => {
				return <DatasetCard
					key={datasetID}
					datasetID={datasetID}
				/>
			})
		}
	}, [datasetIDs])

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '0.25rem',
			}}
		>
			{renderDatasets}
		</div>
	)
}

export default DatasetList
