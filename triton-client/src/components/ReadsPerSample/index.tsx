import { ReactElement, useCallback, useEffect, useMemo } from "react"
import ReadsPerSampleProps, { ReadsPerSampleButtonProps } from "./interfaces"
import { useAppSelector } from "@store/hooks"
import { selectReadsPerSample } from "@store/selectors"
import { fetchReadsPerSample } from "@store/thunks"
import { store } from "@store/store"
import { Button, Modal, Spin } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { Provider } from "react-redux"
import { DatasetState } from "@store/datasets"
import { BarConfig, Bar } from "@ant-design/charts"
import "./index.scss"

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
                <ReadsPerSampleGraph {...readsPerSample} />
            ) : (
                <Spin />
            )}
        </>
    )
}

interface CorrectedBarConfig extends Omit<BarConfig, "sort"> {
    sort?: {
        by?: "x" | "y"
        reverse?: boolean
    }
}

function ReadsPerSampleGraph(
    readsPerSample: NonNullable<DatasetState["readsPerSample"]>,
) {
    const config: CorrectedBarConfig = useMemo(() => {
        return {
            data: readsPerSample.sampleReads.map((numberOfReads) => ({
                sample: numberOfReads.sampleName,
                reads: numberOfReads.nbReads,
            })),
            sort: {
                by: "y",
                reverse: true,
            },
            xField: "sample",
            yField: "reads",
        }
    }, [readsPerSample])

    return <Bar {...config} />
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
