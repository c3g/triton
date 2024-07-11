import { Button, Col, Modal, Row, Space, Spin } from "antd"
import { ReactNode, useCallback, useMemo, useState } from "react"
import { CloseCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { DownloadRequest, DownloadRequestType } from "@api/api-types"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { ReadsetState } from "@store/readsets"
import {
    deleteDownloadRequest,
    createDownloadRequest,
    extendStagingRequest,
} from "@store/thunks"
import { selectConstants } from "@store/constants"
import { DataSize } from "@components/shared"
import { ActionDropdownProps } from "@components/ActionDropdown/interfaces"
import { ActionDropdown } from "@components/."
import { selectRequestOfDatasetId } from "../selectors"
import { SUPPORTED_DOWNLOAD_TYPES } from "../constants"

interface DatasetCardProps {
    datasetID: number
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
            if (req && !req.should_delete && req.status !== "FAILED") {
                const { type, status } = req
                const actions: ActionDropdownProps["actions"] = [
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
                                    content: `You can now download the dataset using the instruction sent to your email.`,
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
                            alreadyRequested ||
                            updatingRequest ||
                            !dataset ||
                            !project
                        }
                        onClick={() =>
                            req?.status !== "FAILED" && request(type)
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

    const expiration = useMemo(() => {
        const expiry_date = activeRequest?.expiry_date
        return `Expires: ${expiry_date ? new Date(expiry_date).toLocaleDateString() : "-"}`
    }, [])

    return dataset ? (
        <Row justify={"space-between"} gutter={32}>
            <Col span={3}>Dataset #{dataset.id}</Col>
            {requestDetails.reduce<ReactNode[]>((cols, r, i) => {
                cols.push(
                    <Col key={`requestDetails-${i}`} span={3}>
                        {r}
                    </Col>,
                )
                return cols
            }, [])}
            <Col span={3}>{activeRequest && expiration}</Col>
            <Col span={3} style={{ textAlign: "right" }}>
                {totalSize ? <DataSize size={totalSize} /> : <Spin />}
            </Col>
        </Row>
    ) : (
        <Spin />
    )
}

export default DatasetCard
