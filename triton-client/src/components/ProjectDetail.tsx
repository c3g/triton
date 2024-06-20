import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { useEffect, useMemo } from "react"
import { selectConstants } from "../store/constants"
import {
    fetchConstants,
    fetchDatasets,
    fetchRequests,
    fetchRuns,
} from "../store/thunks"

import "./RunDetail.scss"
import { unitWithMagnitude } from "../functions"
import { SUPPORTED_DOWNLOAD_TYPES } from "../constants"
import { TritonDataset, TritonRun } from "../api/api-types"
import { Collapse, Space, Typography } from "antd"
import DatasetList from "./DatasetList"

const { Text } = Typography

function ProjectDetail() {
    const dispatch = useAppDispatch()
    const { projectExternalId = "" } = useParams()
    const project = useAppSelector(
        (state) => state.projectsState.projectsById[projectExternalId],
    )

    useEffect(() => {
        ;(async () => {
            const runs = await dispatch(fetchRuns(projectExternalId))
            const datasets: TritonDataset[] = []
            for (const run of runs) {
                datasets.push(...(await dispatch(fetchDatasets(run.name))))
            }
            await dispatch(fetchRequests(datasets.map((dataset) => dataset.id)))
        })()
    }, [dispatch, projectExternalId])

    const constants = useAppSelector(selectConstants)
    useEffect(() => {
        dispatch(fetchConstants())
    }, [dispatch])

    const runsByName = useAppSelector((state) => state.runsState.runsByName)
    const runs = useMemo(() => {
        return Object.values(runsByName).reduce<TritonRun[]>((runs, run) => {
            if (run && run.external_project_id === projectExternalId) {
                runs.push(run)
            }
            return runs
        }, [])
    }, [projectExternalId, runsByName])

    return (
        <div style={{ margin: "1rem 0.5rem" }}>
            {project && (
                <>
                    <span id={"RunDetail-capacity"}>
                        <table>
                            <tbody>
                                {SUPPORTED_DOWNLOAD_TYPES.map((type) => (
                                    <tr key={type}>
                                        <td>{type}:</td>
                                        {dataSize(project.diskUsage[type]).map(
                                            (x) => (
                                                <td key={x}>{x}</td>
                                            ),
                                        )}
                                        <td>of</td>
                                        {dataSize(
                                            constants.diskCapacity[type],
                                        ).map((x) => (
                                            <td key={x}>{x}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </span>
                    <Collapse>
                        {runs.map((run) => (
                            <Collapse.Panel
                                extra={
                                    <>
                                        <Space>
                                            <Text
                                                strong
                                            >{`${run.datasets.length} Datasets Available`}</Text>
                                        </Space>
                                    </>
                                }
                                key={run.name}
                                header={<Text strong>{run.name}</Text>}
                                showArrow={false}
                            >
                                <DatasetList runName={run.name} />
                            </Collapse.Panel>
                        ))}
                    </Collapse>
                </>
            )}
        </div>
    )
}

function dataSize(size: number) {
    const { unit, magnitude } = unitWithMagnitude(size)
    return [(size / magnitude).toFixed(2), unit]
}

export default ProjectDetail
