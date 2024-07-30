import { ReactElement, useEffect } from "react"
import ReadsPerSampleProps from "./interfaces"
import { useAppSelector } from "@store/hooks"
import { selectReadsPerSample } from "@store/selectors"
import { fetchReadsPerSample } from "@store/thunks"
import { store } from "@store/store"
import { Spin, Typography } from "antd"
import { ReadsPerSampleGraph } from "@components/."

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
