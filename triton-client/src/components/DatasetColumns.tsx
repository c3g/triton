import { Button, Modal, notification, Space } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { ReactNode, useCallback, useMemo, useState } from "react"
import { CloseCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { DownloadRequestType, TritonDataset } from "@api/api-types"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import {
    deleteDownloadRequest,
    createDownloadRequest,
    extendStagingRequest,
} from "@store/thunks"
import { selectConstants } from "@store/constants"
import { DataSize } from "@components/shared"
import { ActionDropdownProps } from "@components/ActionDropdown/interfaces"
import { ActionDropdown, ReadsPerSample } from "@components/."
import { selectRequestOfDatasetId } from "@store/selectors"
import { Provider } from "react-redux"
import { store } from "@store/store"
import config from "@common/config"
import { ColumnsType } from "antd/es/table"

export function useDatasetColumns(totalSize: number) {
    return useMemo(() => {
        const columns: ColumnsType<TritonDataset> = []
        columns.push({
            title: "Metric",
            dataIndex: "id",
            key: "metric",
            render: (id, dataset) => <MetricButton dataset={dataset} />,
        })
        columns.push({
            title: "ID",
            dataIndex: "id",
            key: "id",
        })
        columns.push({
            title: "Lane",
            dataIndex: "lane",
            key: "lane",
        })
        columns.push({
            title: "SFTP",
            dataIndex: "id",
            key: "sftp",
            render: (id, dataset) => (
                <StagingButton
                    dataset={dataset}
                    type={"SFTP"}
                    totalSize={totalSize}
                />
            ),
        })
        columns.push({
            title: "Globus",
            dataIndex: "id",
            key: "globus",
            render: (id, dataset) => (
                <StagingButton
                    dataset={dataset}
                    type={"GLOBUS"}
                    totalSize={totalSize}
                />
            ),
        })
        columns.push({
            title: "Expiration",
            dataIndex: "id",
            key: "expiration",
            render: (id) => <Expiration datasetID={id} />,
        })
        columns.push({
            title: "Size",
            dataIndex: "id",
            key: "size",
            render: (id) => <DataSize size={id} />,
        })
        return columns
    }, [totalSize])
}

interface MetricProps {
    dataset: TritonDataset
}

function MetricButton({ dataset }: MetricProps) {
    const project = useAppSelector((state) =>
        dataset?.external_project_id
            ? state.projectsState.projectsById[dataset.external_project_id]
            : undefined,
    )

    const showModal = useCallback(() => {
        Modal.info({
            title: [
                `Reads Per Sample for lane ${dataset?.lane} of run `,
                <i key={"run"}>{dataset?.run_name}</i>,
                ` for project `,
                <i key={"external_name"}>{project?.external_name}</i>,
            ],
            content: (
                <Provider store={store}>
                    <ReadsPerSample datasetId={dataset.id} />
                </Provider>
            ),
            width: "80%",
        })
    }, [dataset.id, dataset?.lane, dataset?.run_name, project?.external_name])

    return (
        <Button
            type={"text"}
            icon={<InfoCircleOutlined />}
            onClick={showModal}
        />
    )
}

interface StagingButtonProps {
    dataset: TritonDataset
    type: DownloadRequestType
    totalSize: number
}

function StagingButton({ dataset, type, totalSize }: StagingButtonProps) {
    const dispatch = useAppDispatch()
    const [updatingRequest, setUpdatingRequest] = useState(false)

    const req = useAppSelector((state) =>
        selectRequestOfDatasetId(state, dataset.id),
    )
    const project = useAppSelector((state) =>
        dataset?.external_project_id
            ? state.projectsState.projectsById[dataset.external_project_id]
            : undefined,
    )
    const constants = useAppSelector(selectConstants)

    const dispatchCreateRequest = useCallback(
        async (type: DownloadRequestType) => {
            if (dataset) {
                setUpdatingRequest(true)
                await dispatch(
                    createDownloadRequest(
                        dataset.external_project_id,
                        dataset.id,
                        type,
                    ),
                ).finally(() => setUpdatingRequest(false))
            }
        },
        [dataset, dispatch],
    )

    const request = useCallback(
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

    if (req && !req.should_delete && req.status !== "FAILED") {
        const { type, status } = req

        const actions: ActionDropdownProps["actions"] = [
            {
                action: {
                    name: "Unstage dataset",
                    actionCall: () =>
                        dispatch(deleteDownloadRequest(dataset.id)).then(
                            () => {
                                notification.success({
                                    message: "Dataset Unstaging",
                                    description: `Dataset #${dataset.id} will be unstaged shortly.`,
                                })
                            },
                            (e) => {
                                notification.error({
                                    message: "Error Unstaging Dataset",
                                    description: `Dataset #${dataset.id} could not be unstaged.`,
                                })
                                console.error(e)
                            },
                        ),
                },
                icon: <CloseCircleOutlined style={{ color: "#c9162b" }} />,
            },
            {
                action: {
                    name: "Extend staging",
                    actionCall: () =>
                        dispatch(extendStagingRequest(dataset.id)).catch((e) =>
                            console.error(e),
                        ),
                },
                icon: <PlusCircleOutlined style={{ color: "#097969" }} />,
            },
        ]

        let statusDescription: ReactNode
        if (status === "SUCCESS") {
            statusDescription = "DOWNLOAD"
        } else {
            statusDescription = "QUEUED"
        }
        const buttonStagingActive = (
            <Button
                key={type}
                style={{ paddingLeft: "4", paddingRight: "4" }}
                disabled={updatingRequest}
                onClick={() => {
                    if (status === "SUCCESS") {
                        Modal.info({
                            title: `Dataset successfully staged`,
                            content: [
                                `You can now download the dataset by following the instructions sent to your email.
                                   If you don't see the email, please check your spam folder.
                                   If it's still missing, try resetting your password and checking again.
                                   For further assistance, feel free to contact us at`,
                                " ",
                                <a
                                    key={0}
                                    href={`mailto:${config.supportEmail}`}
                                >
                                    {config.supportEmail}
                                </a>,
                            ],
                        })
                    }
                }}
            >
                <Space>
                    {type}
                    {"|"}
                    {statusDescription}
                </Space>
            </Button>
        )

        return (
            <ActionDropdown
                key={type}
                button={buttonStagingActive}
                actions={actions}
            />
        )
    } else {
        let statusDescription: ReactNode
        if (req && req.should_delete) {
            statusDescription = "UNSTAGING"
        } else if (req?.status === "FAILED") {
            statusDescription = "FAILED"
        } else {
            statusDescription = "STAGE"
        }
        return (
            <Button
                key={type}
                style={{ paddingLeft: "4", paddingRight: "4" }}
                disabled={
                    !totalSize ||
                    req?.type === type ||
                    updatingRequest ||
                    !dataset ||
                    !project
                }
                onClick={() => req?.status !== "FAILED" && request(type)}
            >
                <Space>
                    {type}
                    {"|"}
                    {statusDescription}
                </Space>
            </Button>
        )
    }
}

interface ExpirationProps {
    datasetID: number
}

function Expiration({ datasetID }: ExpirationProps) {
    const req = useAppSelector((state) =>
        selectRequestOfDatasetId(state, datasetID),
    )
    const expiration = req?.expiry_date
        ? new Date(req.expiry_date).toLocaleDateString()
        : "-"
    return <>{expiration}</>
}
