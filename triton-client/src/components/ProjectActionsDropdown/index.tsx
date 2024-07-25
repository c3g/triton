import { FunctionComponent } from "react"
import { Dropdown, notification, Space, Button } from "antd"
import { FolderFilled, DownOutlined, AntCloudOutlined } from "@ant-design/icons"
import { resetPassword } from "@api/api-triton"
import { ProjectActionsDropdownProps } from "./interfaces"
import {
    DownloadRequestType,
    ExternalProjectID,
    TritonProject,
} from "@api/api-types"

const ProjectActionsDropdown: FunctionComponent<
    ProjectActionsDropdownProps
> = ({ projectExternalId, project }) => {
    async function resetTypePassword(
        projectExternalId: ExternalProjectID,
        type: DownloadRequestType,
        project: TritonProject
    ) {
        await resetPassword(projectExternalId, type).then(
            () =>
                notification.success({
                    message: "Password Reset",
                    description: `The ${type} password is scheduled for reset for the project ${project.external_name}.`,
                }),
            (reason) => {
                notification.error({
                    message: "Error",
                    description: `The ${type} password could not be reset for the project ${project.external_name}. ${reason}`,
                })
            }
        )
    }

    const items = [
        {
            label: "For Globus",
            key: "GLOBUS",
            icon: <AntCloudOutlined />,
            onClick: (e) =>
                resetTypePassword(projectExternalId, e.key, project),
        },
        {
            label: "For SFTP",
            key: "SFTP",
            icon: <FolderFilled />,
            onClick: (e) =>
                resetTypePassword(projectExternalId, e.key, project),
        },
    ]
    const menuProps = {
        items,
    }

    return (
        <Dropdown menu={menuProps} className="project-actions-dropdown">
            <Button>
                <Space>
                    Reset Password
                    <DownOutlined />
                </Space>
            </Button>
        </Dropdown>
    )
}

export default ProjectActionsDropdown
