import { Bar, BarConfig } from "@ant-design/charts"
import { ReadsPerSampleGraphProps } from "./interfaces"

export default function ReadsPerSampleGraph({
    readsPerSample,
}: ReadsPerSampleGraphProps) {
    const data = readsPerSample.sampleReads.map((numberOfReads) => ({
        sample: numberOfReads.sampleName,
        reads: numberOfReads.nbReads,
    }))
    const config: CorrectedBarConfig = {
        data: data,
        sort: {
            by: "y",
            reverse: true,
        },
        xField: "sample",
        yField: "reads",
        slider: {
            x: {
                label: false,
                formatter() {
                    return ""
                },
            },
        },
        axis: {
            x: {
                label: false,
                title: "Samples",
            },
            y: {
                labelAlign: "horizontal", // failed attempt at rotating the labels
                title: "Number of Reads",
                tickLineWidth: 5,
            },
        },
    }

    return (
        <>
            <Bar {...config} />
        </>
    )
}

interface CorrectedBarConfig extends Omit<BarConfig, "sort"> {
    sort?: {
        by?: "x" | "y"
        reverse?: boolean
    }
}
