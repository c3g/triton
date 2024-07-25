import { Bar } from "@ant-design/charts"
import { useMemo, useReducer } from "react"
import reducer, {
    createInitialState,
    selectAntDesignBarChartConfig,
} from "./reducer"
import { ReadsPerSampleGraphProps } from "./interfaces"

export default function ReadsPerSampleGraph({
    datasetId,
    readsPerSample,
}: ReadsPerSampleGraphProps) {
    const data = readsPerSample.sampleReads.map((numberOfReads) => ({
        sample: numberOfReads.sampleName,
        reads: numberOfReads.nbReads,
    }))
    const [state] = useReducer(reducer, createInitialState(data))
    const config = useMemo(() => selectAntDesignBarChartConfig(state), [state])

    return (
        <>
            <Bar key={`${datasetId}`} {...config} />
        </>
    )
}
