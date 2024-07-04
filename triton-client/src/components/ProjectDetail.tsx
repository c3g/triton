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

import { dataSize } from "../functions"
import { SUPPORTED_DOWNLOAD_TYPES } from "../constants"
import { TritonDataset, TritonRun } from "../api/api-types"
import {
    Button,
    Col,
    Collapse,
    CollapseProps,
    Progress,
    Row,
    Space,
    Typography,
    notification,
} from "antd"
import DatasetList from "./DatasetList"
import {
    selectDisksUsageByRunName,
    selectRequestsByRunName,
} from "../selectors"
import { resetPassword } from "../api/api-triton"

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
            for (const dataset of datasets) {
                await dispatch(fetchReadsets(dataset.id))
            }
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
                    <Button
                        onClick={() => {
                            resetPassword(projectExternalId, "SFTP").then(
                                () =>
                                    notification.success({
                                        message: "Password Reset",
                                        description: `The SFTP password is scheduled for reset for the project ${project.external_name}.`,
                                    }),
                                (reason) => {
                                    notification.error({
                                        message: "Error",
                                        description: `The SFTP password could not be reset for the project ${project.external_name}. ${reason}`,
                                    })
                                },
                            )
                        }}
                        style={{ float: "right" }}
                    >
                        Reset <b>SFTP</b> Password
                    </Button>
                    <Button
                        onClick={() => {
                            resetPassword(projectExternalId, "GLOBUS").then(
                                () =>
                                    notification.success({
                                        message: "Password Reset",
                                        description: `The Globus password is scheduled for reset for the project ${project.external_name}.`,
                                    }),
                                (reason) =>
                                    notification.error({
                                        message: "Error",
                                        description: `The Globus password could not be reset for the project ${project.external_name}. ${reason}.`,
                                    }),
                            )
                        }}
                        style={{ float: "right" }}
                    >
                        Reset <b>Globus</b> Password
                    </Button>
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
                        <Col span={2}>
                            <b>{`${type}`}</b>
                        </Col>
                        <Col
                            span={4}
                        >{`${scaledUsage} ${usageUnit} / ${scaledCapacity} ${capacityUnit}`}</Col>
                        <Col span={2}>
                            {`(${Math.round((usage / capacity) * 100)}%)`}
                        </Col>
                        <Col span={14}>
                            <Progress
                                percent={(usage / capacity) * 100}
                                strokeColor={
                                    usage < capacity ? "#1890ff" : "#f5222d"
                                }
                                showInfo={false}
                            />
                        </Col>
                    </Row>
                )
            })}
        </>
    )
}

export default ProjectDetail
