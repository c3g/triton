import { TritonProject } from "@api/api-types";
import { MGCHeader, ProjectCardList } from "@components/.";
import { useAppSelector } from "@store/hooks";
import { selectProjects, selectProjectsLoading } from "@store/projects";
import { Alert, Layout, Spin } from "antd"
import { FunctionComponent, useEffect, useState } from "react";
import { SiderMenuProps } from "./interfaces";

const SiderMenu: FunctionComponent<SiderMenuProps> = ({isOpened}) => {
    const { Sider, Content } = Layout
    const projects = useAppSelector<TritonProject[]>(selectProjects)
    const areProjectsLoading = useAppSelector(selectProjectsLoading)
    const [isCollapsed, setIsCollapsed] = useState(isOpened)

    useEffect(()=>{
        setIsCollapsed(isOpened)
    },[isOpened])

    return (
        <Sider
            collapsedWidth="0"
            theme="light"
            trigger={null}
            collapsible
            collapsed={isCollapsed}
            >

            <MGCHeader />
            <Content>
            {/* below code should be refactored to look cleaner */}
            {areProjectsLoading && (
                <Spin
                    size="large"
                    className="App-spinner"
                    tip="Loading..."
                ></Spin>
            )}
            {projects && !areProjectsLoading && (
                <ProjectCardList projects={projects} />
            )}
            {projects.length === 0 && !areProjectsLoading && (
                <Alert
                    message="No projects associated with this user."
                    type="info"
                />
            )}
            </Content>
        </Sider>
     );
}

export default SiderMenu;