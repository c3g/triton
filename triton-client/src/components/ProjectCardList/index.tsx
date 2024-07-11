import "@components/Common.scss"
import { useNavigate } from "react-router-dom"
import { Button, Typography } from "antd"
import { ProjectCard, ProjectCardListProps } from "./interfaces"

export default function ProjectCardList({ projects }: ProjectCardListProps) {
    const navigate = useNavigate()
    const { Title } = Typography
    return (
        <>
            <Title level={2}>Projects</Title>
            {projects.map((project: ProjectCard) => (
                <Button
                    key={project.external_id}
                    block
                    onClick={() => navigate(`/project/${project.external_id}/`)}
                    style={{ width: "90%", margin: "0 1rem" }}
                >
                    <Typography.Text strong>
                        {project.external_name}
                    </Typography.Text>
                </Button>
            ))}
        </>
    )
}
