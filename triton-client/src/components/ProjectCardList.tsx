import { useNavigate } from "react-router-dom"
import { TritonProject } from "../api/api-types"
import "./Common.scss"
import { Button, Typography } from "antd"

const { Title } = Typography

interface ProjectCardListProps {
    projects: TritonProject[]
}

function ProjectCardList({ projects }: ProjectCardListProps) {
    const navigate = useNavigate()
    return (
        <>
            <Title level={2}>Projects</Title>
            {projects.map((project) => (
                <Button
                    key={project.external_id}
                    block
                    style={{ width: "90%", margin: "0 1rem" }}
                    onClick={() => navigate(`/project/${project.external_id}/`)}
                >
                    <Typography.Text strong>
                        {project.external_name}
                    </Typography.Text>
                </Button>
            ))}
        </>
    )
}

export default ProjectCardList
