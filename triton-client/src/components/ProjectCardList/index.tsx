import "@components/Common.scss"
import { useNavigate } from "react-router-dom"
import { List, Typography, Avatar, Divider } from "antd"
import { ProjectCard, ProjectCardListProps } from "./interfaces"
import projectIcon from "@static/project-icon.png"
import InfiniteScroll from "react-infinite-scroll-component"

export default function ProjectCardList({ projects }: ProjectCardListProps) {
    const navigate = useNavigate()
    const { Title, Text } = Typography
    const items = projects
    return (
        <div
            id="scrollableDiv"
            style={{
                height: "90vh",
                overflow: "auto",
                border: "1px solid rgba(140, 140, 140, 0.35)",
            }}>
            <InfiniteScroll
                loader={(<Divider plain/>)}
                dataLength={items.length}
                hasMore={items.length < 100}
                endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
                scrollableTarget="scrollableDiv"
                next={() => console.log("All the projects have been loaded.")}>
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
                            onClick={() =>
                                navigate(`/project/${item.external_id}/`)
                            }
                            style={{ cursor: "pointer" }}
                        >
                            <List.Item.Meta
                                style={{ alignItems: "flex-end" }}
                                avatar={<Avatar src={projectIcon} />}
                                title={<Text>{item.external_name}</Text>}
                            />
                        </List.Item>
                    )}
                />
            </InfiniteScroll>
        </div>
    )
}
