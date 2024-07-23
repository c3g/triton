import { ReactElement, useCallback, useEffect } from "react"
import ReadsPerSampleProps, { ReadsPerSampleButtonProps } from "./interfaces"
import { useAppSelector } from "@store/hooks"
import { selectReadsPerSample } from "@store/selectors"
import { fetchReadsPerSample } from "@store/thunks"
import { store } from "@store/store"
import { Button, Modal, Spin } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { Provider } from "react-redux"

export default function ReadsPerSample({
    datasetId,
}: ReadsPerSampleProps): ReactElement {
    const readsPerSample = useAppSelector((state) =>
        selectReadsPerSample(state, datasetId),
    )
    useEffect(() => {
        // it checks reads per sample existence
        store.dispatch(fetchReadsPerSample(datasetId))
    }, [datasetId])

    return (
        <>
            {readsPerSample ? (
                JSON.stringify(readsPerSample.sampleReads)
            ) : (
                <Spin />
            )}
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
