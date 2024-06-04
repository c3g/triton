import { sizeUnitWithScalar } from "../functions"

export interface SizeProps {
	size: number
}

export function DataSize({ size }: SizeProps) {
	const { unit, size: magnitude } = sizeUnitWithScalar(size)
	return (
		<>
			{(size / magnitude).toFixed(2)} {unit}
		</>
	)
}

export default DataSize
