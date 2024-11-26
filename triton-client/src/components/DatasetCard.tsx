import { Button, Col, Modal, Row, Spin } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { ReactNode, useCallback, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { DataSize } from "@components/shared"
import { ReadsPerSample } from "@components/."
import { selectRequestOfDatasetId, selectTotalDatasetSize } from "@store/selectors"
import { SUPPORTED_DOWNLOAD_TYPES } from "@common/constants"
import { Provider } from "react-redux"
import { store } from "@store/store"
import DatasetCardButton from "./DatasetCardButton"

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
    const project = useAppSelector((state) =>
        dataset?.external_project_id
            ? state.projectsState.projectsById[dataset.external_project_id]
            : undefined,
    )
    const totalSize = useAppSelector((state) => selectTotalDatasetSize(state, datasetID))

    const alreadyRequested = !!activeRequest

    const requestDetails = useMemo(() => {
        return SUPPORTED_DOWNLOAD_TYPES.map((type) => (
            <DatasetCardButton
                key={type}
                datasetID={datasetID}
                type={type}
            />
        ))
    }, [
        activeRequest?.type,
        alreadyRequested,
        dataset,
        datasetID,
        dispatch,
        project,
        totalSize,
    ])

    const expiration = useMemo(() => {
        const expiry_date = activeRequest?.expiry_date
        return `Expires: ${expiry_date ? new Date(expiry_date).toLocaleDateString() : "-"}`
    }, [])

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
                    <ReadsPerSample datasetId={datasetID} />
                </Provider>
            ),
            width: "80%",
        })
    }, [datasetID, dataset?.lane, dataset?.run_name, project?.external_name])

    return dataset ? (
        <Row justify={"space-between"} gutter={32} align={"middle"}>
            <Col span={3}>
                <Button
                    type={"text"}
                    icon={<InfoCircleOutlined />}
                    onClick={showModal}
                />
                {`Lane ${dataset.lane}`}
            </Col>
            <Col span={3}>{`Dataset #${datasetID}`}</Col>
            {requestDetails.reduce<ReactNode[]>((cols, r, i) => {
                cols.push(
                    <Col key={`requestDetails-${i}`} span={4}>
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
