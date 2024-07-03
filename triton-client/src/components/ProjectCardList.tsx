import { TritonProject } from "../api/api-types"
import "./Common.scss"
import { ProjectCard } from "./ProjectCard"
import { Collapse, Typography } from "antd"

const { Title } = Typography

interface ProjectCardListProps {
    projects: TritonProject[]
}

function ProjectCardList({ projects }: ProjectCardListProps) {
    return (
        <>
            <div style={{ padding: "1rem" }}>
                <Title level={2}>Projects</Title>
                <Collapse style={{ border: "none" }}>
                    {projects.map((project) => (
                        <Collapse.Panel
                            key={project.external_id}
                            header={
                                <Typography.Text strong>
                                    {project.external_name}
                                </Typography.Text>
                            }
                            showArrow={false}
                            style={{
                                borderStyle: "solid",
                                borderWidth: "thin",
                                borderColor: "lightgray",
                                borderRadius: "7px",
                                marginBottom: "0.5rem",
                                padding: "9px",
                            }}
                        >
                            <ProjectCard
                                key={project.external_id}
                                project={project}
                            />
                        </Collapse.Panel>
                    ))}
                </Collapse>
            </div>
        </>
    )
}

export default ProjectCardList
