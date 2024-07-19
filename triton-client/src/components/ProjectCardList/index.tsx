import "@components/Common.scss"
import { useNavigate } from "react-router-dom"
import { List, Typography, Avatar } from "antd"
import { ProjectCard, ProjectCardListProps } from "./interfaces"
import projectIcon from "@static/project-icon.png"

export default function ProjectCardList({ projects }: ProjectCardListProps) {
    const navigate = useNavigate()
    const { Title, Text } = Typography
    const items = projects
    return (
        <List
            className="mgc-projects-list"
            size="large"
            header={
                <Title className="mgc-triton-user-projects" level={3}>
                    Projects
                </Title>
            }
            bordered
            dataSource={items}
            renderItem={(item: ProjectCard) => (
                <List.Item
                    onClick={() => navigate(`/project/${item.external_id}/`)}
                    style={{ cursor: "pointer" }}
                >
                    <List.Item.Meta
                        avatar={<Avatar src={projectIcon} />}
                        title={<Text>{item.external_name}</Text>}
                    />
                </List.Item>
            )}
        />
    )
}
