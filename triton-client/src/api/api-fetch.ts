import { ApiReply } from "./api-types"
import CONFIG from "../config"

export const TRITON_API_BASE_URL = CONFIG.apiBaseUrl

/**
 * A get function that sends a request to the triton api endpoint. The function
 * handles parsing the response and extracting the data.
 *
 * @param route string: Partial path for api url
 * @param options RequestInit: Allows you to customize the request, if needed
 * @returns
 */
export async function tritonGet<T>(
    route: string,
    options: RequestInit = {},
): Promise<T> {
    const mergedOptions: RequestInit = {
        ...options,
        credentials: "include",
        method: "get",
    }
    const url: URL = new URL(route, TRITON_API_BASE_URL)
    const response = await fetch(url, mergedOptions)
    if (response.ok) {
        try {
            const reply = (await response.json()) as ApiReply<T>
            if (!reply.ok) {
                throw new Error(reply.message)
            }
            if (!reply.data) {
                throw new Error("API reply data is undefined")
            }
            return reply.data
        } catch (err) {
            // JSON data could not be parsed from response body
            throw new Error(`Invalid reply from ${route}`)
        }
    } else {
        // HTTP response contains a status code. Throw the response so the caller
        // can handle the code.
        // Convert this to a typed error?
        throw new Error(`${response.status}: ${response.statusText}`)
    }
}

export async function tritonPost<T>(
    route: string,
    options: RequestInit = {},
): Promise<T> {
    const mergedOptions: RequestInit = {
        ...options,
        credentials: "include",
        method: "post",
    }
    const url: URL = new URL(route, TRITON_API_BASE_URL)
    const response = await fetch(url, mergedOptions)
    if (response.ok) {
        try {
            const reply = (await response.json()) as ApiReply<T>
            if (!reply.ok) {
                throw new Error(reply.message)
            }
            if (!reply.data) {
                throw new Error("API reply data is undefined")
            }
            return reply.data
        } catch (err) {
            // JSON data could not be parsed from response body
            throw new Error(`Invalid reply from ${route}`)
        }
    } else {
        // HTTP response contains a status code. Throw the response so the caller
        // can handle the code.
        // Convert this to a typed error?
        throw new Error(`${response.status}: ${response.statusText}`)
    }
}

export async function tritonDelete<T>(
    route: string,
    options: RequestInit = {},
): Promise<T> {
    const mergedOptions: RequestInit = {
        ...options,
        credentials: "include",
        method: "delete",
    }
    const url: URL = new URL(route, TRITON_API_BASE_URL)
    const response = await fetch(url, mergedOptions)
    if (response.ok) {
        try {
            const reply = (await response.json()) as ApiReply<T>
            if (!reply.ok) {
                throw new Error(reply.message)
            }
            if (!reply.data) {
                throw new Error("API reply data is undefined")
            }
            return reply.data
        } catch (err) {
            // JSON data could not be parsed from response body
            throw new Error(`Invalid reply from ${route}`)
        }
    } else {
        // HTTP response contains a status code. Throw the response so the caller
        // can handle the code.
        // Convert this to a typed error?
        throw new Error(`${response.status}: ${response.statusText}`)
    }
}
