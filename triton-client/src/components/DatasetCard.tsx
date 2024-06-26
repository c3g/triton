import { Button, Modal, Space, Spin, Typography } from "antd"
import { ReactNode, ReactElement, useCallback, useMemo, useState } from "react"
import { DownloadRequest, DownloadRequestType } from "../api/api-types"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { ReadsetState } from "../store/readsets"
import {
    deleteDownloadRequest,
    createDownloadRequest,
    extendStagingRequest,
} from "../store/thunks"
import { selectConstants } from "../store/constants"
import { unitWithMagnitude } from "../functions"
import { SUPPORTED_DOWNLOAD_TYPES } from "../constants"
import { CloseCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { ActionDropdown } from "./ActionDropdown"
import { selectRequestOfDatasetId } from "../selectors"

const { Text } = Typography
interface DatasetCardProps {
    datasetID: number
}

export interface StagingAction {
    action: { name: string; actionCall: () => void }
    icon: ReactElement
}

function DatasetCard({ datasetID }: DatasetCardProps) {
    const dispatch = useAppDispatch()
    const dataset = useAppSelector(
        (state) => state.datasetsState.datasetsById[datasetID],
    )
    const activeRequest = useAppSelector((state) =>
        selectRequestOfDatasetId(state, datasetID),
    )

    const readsetsById = useAppSelector(
        (state) => state.readsetsState.readsetsById,
    )
    const project = useAppSelector((state) =>
        dataset?.external_project_id
            ? state.projectsState.projectsById[dataset.external_project_id]
            : undefined,
    )
    const constants = useAppSelector(selectConstants)
    const alreadyRequested = !!activeRequest

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

    const readsets = useMemo(() => {
        return Object.values(readsetsById).reduce<ReadsetState[]>(
            (readsets, readset) => {
                if (readset && readset.dataset === datasetID) {
                    readsets.push(readset)
                }
                return readsets
            },
            [],
        )
    }, [datasetID, readsetsById])
    const totalSize = useMemo(
        () => readsets.reduce((total, r) => total + r.total_size, 0),
        [readsets],
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

    const requestByType = useMemo(() => {
        const requestByType: Record<
            DownloadRequestType,
            DownloadRequest | undefined
        > = {
            GLOBUS: undefined,
            SFTP: undefined,
        }
        if (activeRequest) {
            requestByType[activeRequest.type] = activeRequest
        }
        return requestByType
    }, [activeRequest])

    const requestDetails = useMemo(() => {
        return SUPPORTED_DOWNLOAD_TYPES.map((type) => {
            const req = requestByType[type]
            if (req && !req.should_delete) {
                const { type, status, expiry_date } = req
                const actions: StagingAction[] = [
                    {
                        action: {
                            name: "Unstage dataset",
                            actionCall: () =>
                                dispatch(
                                    deleteDownloadRequest(datasetID),
                                ).catch((e) => console.error(e)),
                        },
                        icon: (
                            <CloseCircleOutlined style={{ color: "#c9162b" }} />
                        ),
                    },
                    {
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
                    },
                ]

                let statusDescription: ReactNode
                if (status === "SUCCESS") {
                    statusDescription = [
                        "AVAILABLE",
                        "|",
                        `Expires: ${expiry_date ? new Date(expiry_date).toLocaleDateString() : "-"}`,
                    ]
                } else if (status === "FAILED") {
                    statusDescription = "FAILED"
                } else {
                    statusDescription = "QUEUED"
                }
                const buttonStagingActive = (
                    <Button
                        key={type}
                        style={{ paddingLeft: "4", paddingRight: "4" }}
                        disabled={updatingRequest}
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
                return (
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
                        onClick={() => request(type)}
                    >
                        <Space>
                            {type}
                            {"|"}
                            {alreadyRequested && type === activeRequest.type
                                ? "UNSTAGING"
                                : "READY"}
                        </Space>
                    </Button>
                )
            }
        })
    }, [
        activeRequest?.type,
        alreadyRequested,
        dataset,
        datasetID,
        dispatch,
        project,
        request,
        requestByType,
        totalSize,
        updatingRequest,
    ])

    return dataset ? (
        <div
            style={{
                backgroundColor: "white",
                paddingLeft: "1rem",
                paddingTop: "1rem",
                paddingRight: "1rem",
                height: "4rem",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Space>
                    {
                        // left
                    }
                    <Text strong>Dataset #{dataset.id}</Text>
                </Space>
                <Space>
                    {
                        // middle
                        requestDetails
                    }
                </Space>
                <Space>
                    {
                        // right
                    }
                    <div>
                        {!totalSize ? <Spin /> : <DataSize size={totalSize} />}
                    </div>
                </Space>
            </div>
        </div>
    ) : (
        <Spin />
    )
}

interface SizeProps {
    size: number
}

function DataSize({ size }: SizeProps) {
    const { unit, magnitude } = unitWithMagnitude(size)
    return (
        <>
            {(size / magnitude).toFixed(2)} {unit}
        </>
    )
}

export default DatasetCard
