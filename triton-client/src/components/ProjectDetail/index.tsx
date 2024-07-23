import { useEffect, useMemo } from "react"
import { Step } from "react-joyride"
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
    GuidedOnboarding,
    ProjectActionsDropdown,
    ProjectDiskUsage,
} from "@components/."
import {
    selectDisksUsageByRunName,
    selectRequestsByRunName,
} from "@store/selectors"
import "./index.scss"

const { Text, Title } = Typography

function ProjectDetail() {
    const dispatch = useAppDispatch()
    const { projectExternalId = "" } = useParams()
    const project: TritonProject | undefined = useAppSelector(
        (state) => state.projectsState.projectsById[projectExternalId],
    )

    const steps: Step[] = [
        {
            target: ".disk-usage-card",
            content:
                "This is the current status of available space for Globus and SFTP storage.",
        },
        {
            target: ".project-actions-dropdown",
            content: "You can reset SFTP or Globus password here.",
        },
        {
            target: ".data-sets-container",
            content:
                "The datasets that have been released in Freezeman, relating to the project, will be displayed here.",
        },
    ]

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

    const items = useMemo(() => runs.map((run) => runItem(run)), [runs])

    return (
        <div style={{ margin: "0rem 0.5rem" }}>
            <GuidedOnboarding step={steps} />
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
                    <ProjectDiskUsage projectExternalId={projectExternalId} />
                    <div style={{ padding: "0.5rem" }} />
                    <Collapse className="data-sets-container" items={items} />
                </>
            )}
        </div>
    )
}

export default ProjectDetail
