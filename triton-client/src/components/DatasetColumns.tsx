import { Button, Modal, notification, Spin } from "antd"
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
import { ActionDropdownProps } from "@components/ActionDropdown/interfaces"
import { ActionDropdown, ReadsPerSample } from "@components/."
import { Provider } from "react-redux"
import { store } from "@store/store"
import config from "@common/config"
import { ColumnsType } from "antd/es/table"
import { dataSize } from "@common/functions"
import { RequestState } from "@store/requests"

export interface DatasetColumnSource {
    id: TritonDataset["id"]
    lane: TritonDataset["lane"]
    external_project_id: TritonDataset["external_project_id"]
    latest_release_update: TritonDataset["latest_release_update"]
    isFetchingRequest: boolean
    activeRequest: RequestState | undefined
    totalSize: number
}

export function useDatasetColumns(
    updateDataset: (datasetID: TritonDataset["id"]) => Promise<void>,
) {
    return useMemo(() => {
        const columns: ColumnsType<DatasetColumnSource> = []
        columns.push({
            title: "",
            dataIndex: "id",
            key: "metric",
            width: "1%",
            align: "center",
            render: (id, dataset) => <MetricButton dataset={dataset} />,
        })
        columns.push({
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: "5%",
            sorter: (a, b) => a.id - b.id,
        })
        columns.push({
            title: "Lane",
            dataIndex: "lane",
            key: "lane",
            width: "5%",
            sorter: (a, b) => a.lane - b.lane,
            render: (lane) => <>{`Lane ${lane}`}</>,
        })
        columns.push({
            title: "SFTP",
            dataIndex: "id",
            key: "sftp",
            width: "5%",
            render: (id, dataset) =>
                dataset.isFetchingRequest ? (
                    <Spin />
                ) : (
                    <StagingButton
                        dataset={dataset}
                        type={"SFTP"}
                        updateDataset={updateDataset}
                    />
                ),
        })
        columns.push({
            title: "Globus",
            dataIndex: "id",
            key: "globus",
            width: "5%",
            render: (id, dataset) =>
                dataset.isFetchingRequest ? (
                    <Spin />
                ) : (
                    <StagingButton
                        dataset={dataset}
                        type={"GLOBUS"}
                        updateDataset={updateDataset}
                    />
                ),
        })
        columns.push({
            title: "Expiration",
            dataIndex: "id",
            key: "expiration",
            width: "10%",
            render: (id, { activeRequest }) => (
                <Expiration activeRequest={activeRequest} />
            ),
        })
        columns.push({
            title: "Latest Release Date (UTC)",
            dataIndex: "latest_release_update",
            key: "latest_release_date",
            width: "10%",
            defaultSortOrder: "descend",
            sorter: (a, b) =>
                new Date(a.latest_release_update).getTime() -
                new Date(b.latest_release_update).getTime(),
            render: (date) => {
                if (date) {
                    return new Date(date).toUTCString()
                } else {
                    return "-"
                }
            },
        })
        columns.push({
            title: "Size",
            dataIndex: "id",
            key: "size",
            width: "5%",
            render: (id, { totalSize }) =>
                totalSize !== 0 ? (
                    <>{dataSize(totalSize).join(" ")}</>
                ) : (
                    <Spin />
                ),
        })
        return columns
    }, [])
}

interface MetricProps {
    dataset: DatasetColumnSource
}

function MetricButton({ dataset }: MetricProps) {
    const project = useAppSelector((state) =>
        dataset?.external_project_id
            ? state.projectsState.projectsById[dataset.external_project_id]
            : undefined,
    )

    const showModal = useCallback(() => {
        Modal.info({
            title: `Reads Per Sample for lane ${dataset?.lane} for project ${project?.external_name}`,
            content: (
                <Provider store={store}>
                    <ReadsPerSample datasetId={dataset.id} />
                </Provider>
            ),
            width: "80%",
        })
    }, [dataset.id, dataset?.lane, project?.external_name])

    return (
        <Button
            type={"text"}
            icon={<InfoCircleOutlined />}
            onClick={showModal}
        />
    )
}

interface StagingButtonProps {
    dataset: DatasetColumnSource
    type: DownloadRequestType
    activeRequest: RequestState | undefined
    updateDataset: (datasetID: TritonDataset["id"]) => Promise<void>
}

function StagingButton({ dataset, type, updateDataset }: StagingButtonProps) {
    const totalSize = dataset.totalSize
    const datasetID = dataset.id

    const dispatch = useAppDispatch()
    const [updatingRequest, setUpdatingRequest] = useState(false)

    const activeRequest = dataset.activeRequest
    const alreadyRequested = !!activeRequest
    const currentRequest =
        activeRequest?.type === type ? activeRequest : undefined

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
                )
                    .then(() => {
                        updateDataset(datasetID)
                    })
                    .finally(() => {
                        setUpdatingRequest(false)
                    })
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

    if (
        activeRequest !== undefined &&
        currentRequest == activeRequest &&
        !currentRequest.should_delete &&
        currentRequest.status !== "FAILED"
    ) {
        const { type, status } = currentRequest
        const actions: ActionDropdownProps["actions"] = [
            {
                action: {
                    name: "Unstage dataset",
                    actionCall: async () =>
                        dispatch(deleteDownloadRequest(datasetID)).then(
                            () => {
                                notification.success({
                                    message: "Dataset Unstaging",
                                    description: `Dataset #${datasetID} will be unstaged shortly.`,
                                })
                                updateDataset(datasetID)
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
                icon: <CloseCircleOutlined style={{ color: "#c9162b" }} />,
            },
            {
                action: {
                    name: "Extend staging",
                    actionCall: async () => {
                        await dispatch(extendStagingRequest(datasetID)).catch(
                            (e) => console.error(e),
                        )
                        await updateDataset(datasetID)
                    },
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
                {statusDescription}
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
        if (currentRequest?.should_delete) {
            statusDescription = "UNSTAGING"
        } else if (currentRequest?.status === "FAILED") {
            statusDescription = "FAILED"
        } else {
            statusDescription = "STAGE"
        }
        return (
            <Button
                key={type}
                style={{ paddingLeft: "4", paddingRight: "4" }}
                disabled={
                    totalSize === 0 ||
                    alreadyRequested ||
                    updatingRequest ||
                    project === undefined
                }
                onClick={() =>
                    currentRequest?.status !== "FAILED" && request(type)
                }
            >
                {statusDescription}
            </Button>
        )
    }
}

interface ExpirationProps {
    activeRequest: RequestState | undefined
}

function Expiration({ activeRequest }: ExpirationProps) {
    const expiration = activeRequest?.expiry_date
        ? new Date(activeRequest.expiry_date).toLocaleDateString()
        : "-"
    return <>{expiration}</>
}
