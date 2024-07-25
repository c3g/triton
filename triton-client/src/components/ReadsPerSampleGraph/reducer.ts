import { BarConfig } from "@ant-design/charts"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

const PAGE_SIZE = 10

export interface ReadsPerSampleGraphState {
    mode: "full" | "zoom"
    pageSize: number
    sort: "reads" | "sample"
    order: "ascending" | "descending"
    readsPerSample: {
        sample: string
        reads: number
    }[]
}

export function createInitialState(
    readsPerSample: ReadsPerSampleGraphState["readsPerSample"],
): ReadsPerSampleGraphState {
    return {
        mode: "full",
        pageSize: PAGE_SIZE,
        sort: "reads",
        order: "descending",
        readsPerSample,
    }
}

const slice = createSlice({
    name: "ReadsPerSample",
    initialState: createInitialState([]),
    reducers: {
        setGraphState(
            state,
            action: PayloadAction<Partial<ReadsPerSampleGraphState>>,
        ) {
            Object.assign(state, action.payload)
        },
    },
})

export default slice.reducer

export const actions = slice.actions

// Selectors for ant design bar chart
export function selectAntDesignBarChartConfig(
    state: ReadsPerSampleGraphState,
): CorrectedBarConfig {
    return {
        data: state.readsPerSample,
        sort: {
            by: state.sort === "sample" ? "x" : "y",
            reverse: state.order === "descending",
        },
        xField: "sample",
        yField: "reads",
        scrollbar: {
            x: {
                ratio: selectRatio(state),
            },
        },
    }
}
function selectRatio(state: ReadsPerSampleGraphState) {
    return state.pageSize / state.readsPerSample.length
}
interface CorrectedBarConfig extends Omit<BarConfig, "sort"> {
    sort?: {
        by?: "x" | "y"
        reverse?: boolean
    }
}
