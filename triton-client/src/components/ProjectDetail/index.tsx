import { useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { Collapse, CollapseProps, Space, Typography } from "antd"
import { TritonDataset, TritonProject, TritonRun } from "@api/api-types"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { selectConstants } from "@store/constants"
import {
    fetchDatasets,
    fetchReadsets,
    fetchRequests,
    fetchRuns,
} from "@store/thunks"
import {
    DatasetList,
    ProjectActionsDropdown,
    ProjectDiskUsage,
} from "@components/."
import {
    selectDisksUsageByRunName,
    selectRequestsByRunName,
} from "../../store/selectors"
import "./index.scss"

const { Text, Title } = Typography

function ProjectDetail() {
    const dispatch = useAppDispatch()
    const { projectExternalId = "" } = useParams()
    const project: TritonProject | undefined = useAppSelector(
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

    function runItem(
        run: TritonRun,
    ): NonNullable<CollapseProps["items"]>[number] {
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
                    <Text strong>
                        {`${requests.filter((r) => r.status === "SUCCESS" || r.should_delete).length}/${run.datasets.length} Datasets Ready for Download`}
                    </Text>
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

    return (
        <div style={{ margin: "0rem 0.5rem" }}>
            {project && (
                <>
                    <div className="project-title-container">
                        <Title level={2} style={{ margin: "1rem 1rem" }}>
                            {project.external_name}
                        </Title>
                        <ProjectActionsDropdown
                            projectExternalId={projectExternalId}
                            project={project}
                        />
                    </div>
                    <Title level={4} style={{ margin: "1rem 0 0 1rem" }} italic>
                        Disk Usage
                    </Title>
                    <ProjectDiskUsage projectExternalId={projectExternalId} />
                    <Collapse items={runs.map((run) => runItem(run))} />
                </>
            )}
        </div>
    )
}

export default ProjectDetail
