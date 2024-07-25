import { ReactElement, useCallback, useEffect } from "react"
import ReadsPerSampleProps, { ReadsPerSampleButtonProps } from "./interfaces"
import { useAppSelector } from "@store/hooks"
import { selectReadsPerSample } from "@store/selectors"
import { fetchReadsPerSample } from "@store/thunks"
import { store } from "@store/store"
import { Button, Modal, Spin, Typography } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { Provider } from "react-redux"
import "./index.scss"
import ReadsPerSampleGraph from "@components/ReadsPerSampleGraph"

export default function ReadsPerSample({
    datasetId,
}: ReadsPerSampleProps): ReactElement {
    useEffect(() => {
        store.dispatch(fetchReadsPerSample(datasetId))
    }, [datasetId])

    const readsPerSample = useAppSelector((state) =>
        selectReadsPerSample(state, datasetId),
    )

    return (
        <>
            <Typography.Paragraph>
                <ul>
                    <li>
                        Move the top and bottom slider to pan view and zoom
                        in/out.
                    </li>
                    <li>Hover over bar to see more details</li>
                </ul>
            </Typography.Paragraph>
            {readsPerSample ? (
                <ReadsPerSampleGraph readsPerSample={readsPerSample} />
            ) : (
                <Spin />
            )}
            <Typography.Text strong>
                Number of Samples: {readsPerSample?.sampleReads.length}
            </Typography.Text>
        </>
    )
}

export function ReadsPerSampleButton({
    datasetId,
}: ReadsPerSampleButtonProps): ReactElement {
    const showModal = useCallback(() => {
        Modal.info({
            title: `Reads Per Sample of dataset #${datasetId}`,
            content: (
                <Provider store={store}>
                    <ReadsPerSample datasetId={datasetId} />
                </Provider>
            ),
            width: "80%",
        })
    }, [datasetId])
    return (
        <Button
            type={"text"}
            icon={<InfoCircleOutlined />}
            onClick={showModal}
        />
    )
}
