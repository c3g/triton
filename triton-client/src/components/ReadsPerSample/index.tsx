import { ReactElement, useEffect, useState } from "react"
import ReadsPerSampleProps from "./interfaces"
import { useAppDispatch } from "@store/hooks"
import { fetchReadsPerSample } from "@store/thunks"
import { Spin, Typography } from "antd"
import { ReadsPerSampleGraph } from "@components/."
import { TritonNumberOfReads } from "@api/api-types"

export default function ReadsPerSample({
    datasetId,
}: ReadsPerSampleProps): ReactElement {
    const dispatch = useAppDispatch()
    const [readsPerSample, setReadsPerSample] = useState<TritonNumberOfReads[]>()
    useEffect(() => {
        dispatch(fetchReadsPerSample(datasetId)).then((readsPerSample) => setReadsPerSample(readsPerSample))
    }, [dispatch, datasetId])

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
                Number of Samples: {readsPerSample?.length ?? 0}
            </Typography.Text>
        </>
    )
}
