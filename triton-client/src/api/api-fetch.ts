import { ApiReply, IsLoggedInData } from "./api-types"
import CONFIG from "@common/config"

export const TRITON_API_BASE_URL = CONFIG.apiBaseUrl

/**
 * Asks the Triton server if the user is logged in.
 *
 * If the user is logged in, the server returns the user details.
 *
 * If the user is not logged in, the server returns a 401 error and includes
 * a redirect link that the client can use to redirect to the hercules login page.
 * @returns IsLoggedInData
 */
export async function fetchLoginStatus(): Promise<IsLoggedInData> {
    try {
        // Note, we have to include credentials. This tells the browser to send any cookies we
        // have received from the triton server with the request. We have to
        // do this because the server cookie is from a different origin than the client's origin and
        // fetch won't include cross origin cookies by default. The cookie contains a session id
        // for the user, if a session has been created for them already.

        // We have to use fetch here (instead of tritonGet) to be able to handle the 401 response.
        const response = await fetch(
            TRITON_API_BASE_URL + "user/is-logged-in",
            { credentials: "include" },
        )
        if (response.ok) {
            const reply = (await response.json()) as ApiReply<IsLoggedInData>
            if (reply.ok && reply.data) {
                return reply.data
            }
        } else {
            if (response.status === 401) {
                const login = await response.json()
                if (login.url) {
                    window.location = login.url
                }
            }
        }
    } catch (err) {
        console.error("Unable to fetch login status", err)
    }

    return { isLoggedIn: false }
}

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
        if (response.status === 401) {
            await fetchLoginStatus()
        }
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
            throw new Error(`Invalid reply from ${route}. ${err}.`)
        }
    } else {
        if (response.status === 401) {
            await fetchLoginStatus()
        }
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
        if (response.status === 401) {
            await fetchLoginStatus()
        }
        throw new Error(`${response.status}: ${response.statusText}`)
    }
}
