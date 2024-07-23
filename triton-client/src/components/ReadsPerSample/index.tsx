import { ReactElement, useCallback, useEffect, useMemo, useState } from "react"
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
    const data = useMemo(
        () =>
            readsPerSample.sampleReads.map((numberOfReads) => ({
                sample: numberOfReads.sampleName,
                reads: numberOfReads.nbReads,
            })),
        [readsPerSample],
    )

    const [scrollPercentage, setScrollPercentage] = useState(0)

    const config: CorrectedBarConfig = useMemo(() => {
        return {
            data,
            sort: {
                by: "y",
                reverse: true,
            },
            xField: "sample",
            yField: "reads",
            // https://ant-design-charts.antgroup.com/en/options/plots/component/scrollbar
            scrollbar: {
                x: {
                    ratio: 0.005,
                    slidable: false,
                    scrollable: false,
                    value: scrollPercentage,
                },
            },
        }
    }, [data, scrollPercentage])

    return (
        <>
            <Button
                onClick={() => {
                    setScrollPercentage(
                        Math.max(scrollPercentage - 1 / data.length, 0.0),
                    )
                }}
            >
                Scroll Up
            </Button>
            <Button
                onClick={() => {
                    setScrollPercentage(
                        Math.min(scrollPercentage + 1 / data.length, 1.0),
                    )
                }}
            >
                Scroll Down
            </Button>
            <Bar {...config} />
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
