import { deleteDownloadRequest, extendStagingRequest } from "@api/api-triton"
import DatasetCardButtonProps from "./interface"
import { useAppDispatch } from "@store/hooks"
import { ActionDropdownProps } from "@components/ActionDropdown/interfaces"
import { ReactNode } from "react"
import { Button, Modal, notification } from "antd"
import config from "@common/config"

export default function DatasetCardButton({ datasetID, loading, type, request }: DatasetCardButtonProps) {
    const dispatch = useAppDispatch()

    const extendStagingAction = {
        action: {
            name: "Extend staging",
            actionCall: () =>
                dispatch(extendStagingRequest(datasetID)).catch(
                    (e) => console.error(e),
                ),
        },
        icon: (
            <PlusCircleOutlined style={{ color: "#097969" }} />
        ),
    }

    const actions: ActionDropdownProps["actions"] = []
    let button: ReactNode
    if (request && !request.should_delete && request.status === "SUCCESS") {
        const { type, status } = request
        button = (
            <Button
                key={type}
                style={{ paddingLeft: "4", paddingRight: "4" }}
                disabled={loading}
                onClick={() => {
                    if (status === "SUCCESS") {
                        Modal.info({
                            title: `Dataset successfully staged`,
                            content: [`You can now download the dataset by following the instructions sent to your email.
                                       If you don't see the email, please check your spam folder.
                                       If it's still missing, try resetting your password and checking again.
                                       For further assistance, feel free to contact us at`,
                                ' ',
                                <a key={0} href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
                            ],
                        })
                    }
                }}
            >
                <Space>
                    {type}
                    {"|"}
                    {"DOWNLOAD"}
                </Space>
            </Button>
        )
        actions.push({
            action: {
                name: "Unstage dataset",
                actionCall: () =>
                    dispatch(deleteDownloadRequest(datasetID)).then(
                        () => {
                            notification.success({
                                message: "Dataset Unstaging",
                                description: `Dataset #${datasetID} will be unstaged shortly.`,
                            })
                        },
                        (e) => {
                            notification.error({
                                message: "Error Unstaging Dataset",
                                description: `Dataset #${datasetID} could not be unstaged.`,
                            })
                            console.error(e)
                        },
                    ),
            },
            icon: (
                <CloseCircleOutlined style={{ color: "#c9162b" }} />
            ),
        })
        actions.push(extendStagingAction)
    } else {
        let statusDescription: ReactNode
        if (request && request.should_delete) {
            statusDescription = "UNSTAGING"
        } else if (request?.status) {
            statusDescription = request.status
            actions.push(extendStagingAction)
        } else {
            statusDescription = "STAGE"
        }
        button = (
            <Button
                key={type}
                style={{ paddingLeft: "4", paddingRight: "4" }}
                disabled={
                    !totalSize ||
                    alreadyRequested ||
                    updatingRequest ||
                    !dataset ||
                    !project
                }
                onClick={() =>
                    request?.status !== "FAILED" && request(type)
                }
            >
                <Space>
                    {type}
                    {"|"}
                    {statusDescription}
                </Space>
            </Button>
        )
    }

    if (actions.length > 0) {
        return (
            <ActionDropdown
                key={type}
                button={button}
                actions={actions}
            />
        )
    } else {
        return button
    }

}