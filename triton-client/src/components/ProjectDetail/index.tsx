import { Step } from "react-joyride"
import { useParams } from "react-router-dom"
import { Collapse, CollapseProps, Space, Typography } from "antd"
import { TritonProject } from "@api/api-types"
import { useAppSelector } from "@store/hooks"
import { selectConstants } from "@store/constants"
import {
    DatasetList,
    GuidedOnboarding,
    ProjectActionsDropdown,
    ProjectDiskUsage,
} from "@components/."
import "./index.scss"

const { Text, Title } = Typography

function ProjectDetail() {
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
                    <DatasetList externalProjectID={projectExternalId} />
                </>
            )}
        </div>
    )
}

export default ProjectDetail
