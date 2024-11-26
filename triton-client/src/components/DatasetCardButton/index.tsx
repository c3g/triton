import DatasetCardButtonProps from "./interface"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { ActionDropdownProps } from "@components/ActionDropdown/interfaces"
import { ReactNode, useCallback, useState } from "react"
import { Button, Modal, Space, notification } from "antd"
import config from "@common/config"
import { DownloadRequestType } from "@api/api-types"
import { selectConstants } from "@store/constants"
import { selectRequestOfDatasetId, selectTotalDatasetSize } from "@store/selectors"
import ActionDropdown from "@components/ActionDropdown"
import { createDownloadRequest, deleteDownloadRequest, extendStagingRequest } from "@store/thunks"
import { CloseCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"

export default function DatasetCardButton({ datasetID, type }: DatasetCardButtonProps) {
    const dispatch = useAppDispatch()
    const dataset = useAppSelector(
        (state) => state.datasetsState.datasetsById[datasetID],
    )
    const project = useAppSelector((state) =>
        dataset?.external_project_id
            ? state.projectsState.projectsById[dataset.external_project_id]
            : undefined,
    )
    const totalSize = useAppSelector((state) => selectTotalDatasetSize(state, datasetID))
    const request = useAppSelector((state) => {
        const request = selectRequestOfDatasetId(state, datasetID)
        return request?.type === type ? request : undefined
    })
    const alreadyRequested = useAppSelector((state) => Boolean(selectRequestOfDatasetId(state, datasetID)))
    const constants = useAppSelector(selectConstants)


    const [updatingRequest, setUpdatingRequest] = useState(false)
    const dispatchCreateRequest = useCallback(
        async (type: DownloadRequestType) => {
            if (dataset) {
                setUpdatingRequest(true)
                await dispatch(
                    createDownloadRequest(
                        dataset.external_project_id,
                        datasetID,
                        type,
                    ),
                ).finally(() => setUpdatingRequest(false))
            }
        },
        [dataset, datasetID, dispatch],
    )
    const requestDataset = useCallback(
        (downloadType: DownloadRequestType) => {
            if (dataset && project && totalSize) {
                const diskUsage = project.diskUsage[downloadType]
                const diskCapacity = constants.diskCapacity[downloadType]
                if (diskUsage + totalSize > diskCapacity) {
                    Modal.confirm({
                        title: `${downloadType} Project Quota Exceeded`,
                        content: `The total size of the datasets will exceed the ${downloadType} project quota. This dataset will be queued until space is freed.`,
                        onOk: () =>
                            dispatchCreateRequest(downloadType).catch((e) =>
                                console.error(e),
                            ),
                        okText: "Continue",
                        cancelText: "Cancel",
                    })
                } else {
                    dispatchCreateRequest(downloadType).catch((e) =>
                        console.error(e),
                    )
                }
            }
        },
        [
            constants.diskCapacity,
            dataset,
            dispatchCreateRequest,
            project,
            totalSize,
        ],
    )

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
                disabled={updatingRequest}
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
                    request?.status !== "FAILED" && requestDataset(type)
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