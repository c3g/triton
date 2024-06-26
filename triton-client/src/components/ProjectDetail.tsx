import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { useEffect, useMemo } from "react"
import { selectConstants } from "../store/constants"
import {
    fetchConstants,
    fetchDatasets,
    fetchReadsets,
    fetchRequests,
    fetchRuns,
} from "../store/thunks"

import { unitWithMagnitude } from "../functions"
import { SUPPORTED_DOWNLOAD_TYPES } from "../constants"
import { TritonDataset, TritonRun } from "../api/api-types"
import {
    Col,
    Collapse,
    CollapseProps,
    Progress,
    Row,
    Space,
    Typography,
} from "antd"
import DatasetList from "./DatasetList"
import {
    selectDisksUsageByRunName,
    selectRequestsByRunName,
} from "../selectors"

const { Text, Title } = Typography

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
            await Promise.all(
                datasets.map(async (dataset) =>
                    dispatch(fetchReadsets(dataset.id)),
                ),
            )
        })()
    }, [dispatch, projectExternalId])

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
        <div style={{ margin: "0rem 0.5rem" }}>
            {project && (
                <>
                    <Title level={2} style={{ marginTop: "0.5rem" }}>
                        {project.external_name}
                    </Title>
                    <ProjectDiskUsage projectExternalId={projectExternalId} />
                    <Collapse items={runs.map((run) => runItem(run))} />
                </>
            )}
        </div>
    )
}

function runItem(run: TritonRun): NonNullable<CollapseProps["items"]>[number] {
    function Extra({ run }: { run: TritonRun }) {
        const requests = useAppSelector((state) =>
            selectRequestsByRunName(state, run.name),
        )
        const diskUsage = useAppSelector((state) =>
            selectDisksUsageByRunName(state, run.name),
        )
        const constants = useAppSelector(selectConstants)
        return (
            <Space size={"middle"}>
                {`SFTP: ${((diskUsage.SFTP / constants.diskCapacity.SFTP) * 100).toFixed(2)}%`}
                {`GLOBUS: ${((diskUsage.GLOBUS / constants.diskCapacity.GLOBUS) * 100).toFixed(2)}%`}
                <Text
                    strong
                >{`${requests.filter((r) => r.status === "SUCCESS" || r.should_delete).length}/${run.datasets.length} Datasets Ready for Download`}</Text>
            </Space>
        )
    }

    return {
        extra: <Extra run={run} />,
        label: <b>{run.name}</b>,
        key: run.name,
        showArrow: true,
        children: <DatasetList runName={run.name} />,
    }
}

function ProjectDiskUsage({
    projectExternalId,
}: {
    projectExternalId: string
}) {
    const dispatch = useAppDispatch()
    const constants = useAppSelector(selectConstants)
    useEffect(() => {
        dispatch(fetchConstants())
    }, [dispatch])

    const diskUsage = useAppSelector(
        (state) =>
            state.projectsState.projectsById[projectExternalId]?.diskUsage,
    )

    return (
        <>
            {SUPPORTED_DOWNLOAD_TYPES.map((type) => {
                const usage = diskUsage ? diskUsage[type] : 0
                const capacity = constants.diskCapacity[type]
                const [scaledUsage, usageUnit] = diskUsage
                    ? dataSize(diskUsage[type])
                    : []
                const [scaledCapacity, capacityUnit] = dataSize(
                    constants.diskCapacity[type],
                )
                return (
                    <Row key={type} gutter={[16, 16]}>
                        <Col span={1}>
                            <b>{`${type}`}</b>
                        </Col>
                        {/** essential whitespaces... */}
                        <Col></Col>
                        <Col
                            span={3}
                        >{`${scaledUsage} ${usageUnit} / ${scaledCapacity} ${capacityUnit}`}</Col>
                        {/** essential whitespaces... */}
                        <Col></Col>
                        <Col pull={1}>
                            <Progress
                                percent={(usage / capacity) * 100}
                                strokeColor={
                                    usage < capacity ? "#1890ff" : "#f5222d"
                                }
                                showInfo={false}
                                size={[800, 20]}
                            />
                        </Col>
                        <Col pull={1}>
                            <Text>{`${((usage / capacity) * 100).toFixed(
                                2,
                            )}%`}</Text>
                        </Col>
                    </Row>
                )
            })}
        </>
    )
}

function dataSize(size: number) {
    const { unit, magnitude } = unitWithMagnitude(size)
    return [(size / magnitude).toFixed(2), unit] as const
}

export default ProjectDetail
