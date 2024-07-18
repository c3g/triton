import { dataSize } from "@common/functions"

export interface SizeProps {
    size: number
}

export function DataSize({ size }: SizeProps) {
    return <>{dataSize(size)}</>
}
