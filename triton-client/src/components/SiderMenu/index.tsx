import { TritonProject } from "@api/api-types"
import { MGCHeader, ProjectCardList } from "@components/."
import { useAppSelector } from "@store/hooks"
import { selectProjects, selectProjectsLoading } from "@store/projects"
import { Button, Layout, Spin } from "antd"
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { FunctionComponent, useState } from "react"
import "./index.scss"

const SiderMenu: FunctionComponent = () => {
    const { Sider, Content } = Layout
    const projects = useAppSelector<TritonProject[]>(selectProjects)
    const areProjectsLoading = useAppSelector(selectProjectsLoading)
    const [collapsed, setCollapsed] = useState(true)

    return (
        <Sider
            className="sider-project-list"
            collapsedWidth={150}
            theme="light"
            trigger={null}
            width={300}
            collapsible
            collapsed={!collapsed}
        >
            <Content>
                <MGCHeader />

                {/* below code should be refactored to look cleaner */}
                {areProjectsLoading && (
                    <Spin
                        size="large"
                        className="App-spinner"
                        tip="Loading..."
                    ></Spin>
                )}
                {projects && !areProjectsLoading && (
                    <div
                        className={
                            "sider-projects " +
                            (collapsed ? "__isOpened" : "__isClosed")
                        }
                    >
                        <ProjectCardList projects={projects} />
                    </div>
                )}
            </Content>
            <div onClick={() => setCollapsed(!collapsed)}>
                <Button
                    type="default"
                    icon={
                        collapsed ? (
                            <ArrowLeftOutlined />
                        ) : (
                            <ArrowRightOutlined />
                        )
                    }
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        fontSize: "16px",
                        display: "block",
                        width: "100%",
                    }}
                />
            </div>
        </Sider>
    )
}

export default SiderMenu
