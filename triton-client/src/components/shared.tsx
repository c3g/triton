import { dataSize } from "../functions"

export interface SizeProps {
    size: number
}

export function DataSize({ size }: SizeProps) {
    return <>{dataSize(size)}</>
}
