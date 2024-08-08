/**
 * Triton accesses data from Hercules using the hercules api.
 * This requires special credentials provided by MedIT. It is not a normal
 * Hercules user login. The Hercules api allows us to get project and user data
 * on behalf of any user.
 *
 * This module handles logging in and getting an auth token, and provides
 * an axios instance that automatically includes the token in the authorization
 * header of all requests made to the api.
 *
 * The token is retrieved the first time a hercules api request is made with
 * the axios instance. The module also handles token expiry and will request a new
 * token when necessary.
 *
 * To make Magic api calls, use `getAuthorizedAxios` to get an Axios instance
 * containing the proper authorization headers.
 */
import axios, { AxiosInstance } from "axios"
import config from "../../config"
import { logger } from "../logger"
import { HttpsProxyAgent } from "https-proxy-agent"

/** Typing for the auth response */
export interface MagicAuthResponse {
    access_token: string
    expires_in: number
}

// We define a module variable to hold the latest auth token received from hercules
let currentToken: string | undefined
// This promise is defined whenever we are making a request for an auth token.
let currentTokenPromise: Promise<string> | undefined
// Module variable to hold the latest axios instance created.
let authorizedAxios: AxiosInstance | undefined

const clientPortalConfig = config.client_portal
const httpsAgent =
    process.env.NODE_ENV === "production"
        ? new HttpsProxyAgent(clientPortalConfig.httpsProxy)
        : undefined

async function getToken(): Promise<string> {
    // If we already have the token then just return it.
    if (currentToken !== undefined) {
        return currentToken
    }

    // If we are already fetching the token then await for it to finish,
    // rather than kicking off a second token request.
    if (currentTokenPromise !== undefined) {
        return await currentTokenPromise
    }

    // Request the token
    currentTokenPromise = requestToken()

    // Create a promise?
    return await currentTokenPromise
}

async function requestToken() {
    // Post an oauth request to hercules using the configured magic credentials and url
    const credentials = `Basic ${Buffer.from(`${clientPortalConfig.user}:${clientPortalConfig.password}`).toString("base64")}`
    const oauthConfig = {
        method: "POST",
        baseURL: clientPortalConfig.url,
        url: "/oauth/token",
        headers: {
            Authorization: credentials,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data: "grant_type=client_credentials",
        httpsAgent,
    }
    logger.debug(
        {
            method: oauthConfig.method,
            baseURL: oauthConfig.baseURL,
            url: oauthConfig.url,
            headers: {
                // TODO: Redact the Authorization header
                Authorization: oauthConfig.headers.Authorization,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: "grant_type=client_credentials",
            httpsAgent,
        },
        "Magic OAuth Request",
    )
    try {
        const response = await axios.request<MagicAuthResponse>(oauthConfig)
        logger.debug(
            {
                status: response.status,
                // TODO: Redact token data
                data: response.data,
            },
            "Magic OAuth Response",
        )

        // TODO
        // TODO verify that the response matches the expected interface
        // TODO verify what response we receive if there is an auth error
        // TODO log auth errors
        // TODO decide on how to handle errors

        // Set the currentToken module variable
        const auth = response.data
        currentToken = auth.access_token

        // Set a timer to flush the token when it reaches its expiry time.
        // The next call to getToken() will request a new token from hercules.
        const timeout = (auth.expires_in - 1) * 1000
        setTimeout(() => {
            currentToken = undefined
            authorizedAxios = undefined
        }, timeout)
        logger.debug(
            {
                currentToken,
            },
            `requestToken: Token will expire in ${timeout} milliseconds`,
        )

        return currentToken
    } catch (error) {
        logger.error({ error }, "Magic OAuth Error")
        throw error
    }
}

const getAuthorizedAxios = async () => {
    // If we already have an authorized axios instance, just return it.
    if (authorizedAxios !== undefined) {
        return authorizedAxios
    }

    // TODO error handling?
    const token = await getToken()

    authorizedAxios = axios.create({
        headers: {
            Authorization: `Bearer ${token}`,
        },
        baseURL: `${clientPortalConfig.url}/hercules`, // all api calls use hercules endpoint
        httpsAgent,
    })

    // TODO Should we include an interceptor that catches 403 errors
    // and clears the token or reauthorizes and attempts the request again?

    authorizedAxios.interceptors.request.use((req) => {
        const { baseURL, url, method, params, headers } = req
        logger.debug({ baseURL, url, method, params, headers }, "Magic Request")
        return req
    })
    authorizedAxios.interceptors.response.use((res) => {
        const {
            status,
            config: { baseURL, url, method, params },
            data,
            headers,
        } = res
        logger.debug(
            { status, data, config: { baseURL, url, method, params }, headers },
            "Magic Response",
        )
        return res
    })

    return authorizedAxios
}

export default getAuthorizedAxios
