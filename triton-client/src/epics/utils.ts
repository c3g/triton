import { SerializedError } from '@reduxjs/toolkit'

/**
 * Catch statements accept anything. This function attempts to convert whatever
 * was caught into an Error object.
 * @param err : any
 * @returns An Error object
 */
export function convertToSerializedError(err: any): SerializedError {
	if (err instanceof Error) {
		const { name, message, stack, code }: SerializedError = err
		return { name, message, stack, code }
	} else {
		return { name: err.toString(), message: err.toString() }
	}
}
