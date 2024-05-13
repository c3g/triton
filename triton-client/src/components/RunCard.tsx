import { Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { TritonDataset, TritonRun } from '../api/api-types'
import { useAppSelector } from '../store/hooks'
import { useMemo } from 'react'

const { Text } = Typography

export interface RunCardProps {
	run: TritonRun,
}

export function RunCard({ run }: RunCardProps) {
	const datasetsById = useAppSelector((state) => state.datasetsState.datasetsById)
	const datasets = useMemo(() => {
		return run.datasets.reduce<TritonDataset[]>((datasets, id) => {
			const dataset = datasetsById[id]
			if (dataset) {
				datasets.push(dataset)
			}
			return datasets
		}, [])
	}, [datasetsById, run.datasets])
	const lastReleaseDate = datasets.reduce<Date | undefined>((date, d) => {
		const currDate = d.latest_release_update
		if (currDate) {
			if (!date || currDate > date) {
				return new Date(currDate)
			} else {
				return date
			}
		}
		return date
	}, undefined)
	const downloadsReady = datasets.length

	return (
		<>
			<div>
				<Space direction="vertical" style={{ width: '100%' }}>
					<Link to={`/run/${run.name}/`}>
						<Text strong underline>
							{run.name}
						</Text>
					</Link>
					<Space>
						<Text strong>Release Date:</Text>
						<Text>{lastReleaseDate?.toDateString() ?? 'N/A'}</Text>
					</Space>
					<Space>
						<Text strong>{`${downloadsReady} Datasets Available`}</Text>
					</Space>
				</Space>
			</div>
		</>
	)
}
