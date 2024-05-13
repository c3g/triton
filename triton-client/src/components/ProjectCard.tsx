import { useEffect, useMemo } from 'react'
import { TritonProject, TritonRun } from '../api/api-types'
import { isNullish } from '../functions'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchDatasets, fetchRuns } from '../store/thunks'
import { RunCard } from './RunCard'

export interface ProjectCardProps {
	project: TritonProject
}

export function ProjectCard({ project }: ProjectCardProps) {
	const dispatch = useAppDispatch()

	const runsByProjectId = useAppSelector((state) => state.runsState.runsByProjectId[project.external_id])
	const runsByName = useAppSelector((state) => state.runsState.runsByName)
	const runs = useMemo(
		() => runsByProjectId.runs.map((name) => runsByName[name]).filter((run) => !isNullish(run)) as TritonRun[],
		[runsByName, runsByProjectId.runs]
	)

	useEffect(() => {
		dispatch(fetchRuns(project.external_id))
			.then((runs) => {
				if (runs && runs.length > 0) {
					dispatch(fetchDatasets(project.external_id))
				}
			})
	}, [dispatch, project.external_id])

	return (
		<>
			{runs.map((run) => {
				return <RunCard run={run} key={run.name}/>
			})}
		</>
	)
}
