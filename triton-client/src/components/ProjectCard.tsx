import { useEffect, useMemo } from 'react'
import { TritonDataset, TritonProject, TritonRun } from '../api/api-types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchDatasets, fetchRequests, fetchRuns } from '../store/thunks'
import { RunCard } from './RunCard'

export interface ProjectCardProps {
	project: TritonProject
}

export function ProjectCard({ project }: ProjectCardProps) {
	const dispatch = useAppDispatch()

	const runsByName = useAppSelector((state) => state.runsState.runsByName)
	const runs = useMemo(
		() => {
			return Object.values(runsByName).reduce<TritonRun[]>((runs, run) => {
				if (run && run.external_project_id === project.external_id) {
					runs.push(run)
				}
				return runs
			}, [])
		},
		[project.external_id, runsByName]
	)

	useEffect(() => {
		(async () => {
			const runs = await dispatch(fetchRuns(project.external_id))
			const datasets: TritonDataset[] = []
			for (const run of runs) {
				datasets.push(...await dispatch(fetchDatasets(run.name)))
			}
			await dispatch(fetchRequests(datasets.map((dataset) => dataset.id)))
		})()
	}, [dispatch, project.external_id])

	return (
		<>
			{runs.map((run) => {
				return <RunCard run={run} key={run.name}/>
			})}
		</>
	)
}
