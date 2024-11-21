import Axios, { AxiosResponse } from "axios"
import config from "@root/config"
import { logger } from "@core/logger"
import jwtDecode from "jwt-decode"
import { clearTimeout } from "timers"

/**
 * Freezeman API Auth Token Management
 *
 * This module is responsible for managing the freezeman login for triton-server.
 *
 * The server logs in to freezeman just like any other user, with a name and password.
 * The problem with this is that freezeman tokens expire. This module's job is to
 * fetch an auth token and then keep it alive by continually refreshing the token.
 *
 * If the auth token expires, or if an auth error of some kind occurs then the module
 * must reauthorize automatically since we cannot just restart the triton server if
 * an error occurs.
 *
 * If a token cannot be fetched for some reason (a temporary networking glitch, or
 * a freezeman server reboot) the the module will try every N seconds to log in,
 * indefinitely.
 *
 * Whenever an access token is received, a timer is started that counts down until there
 * are N seconds left before the token is due to expire. The token is then refreshed, and
 * the timer is restarted for the next refresh cycle.
 *
 * If any freezeman api call results in a 401 UNAUTHORIZED response then the current
 * auth is trashed and a new auth is initialized.
 *
 * When triton-server starts up, it must call `initializeFreezemanAPIAuthorization`
 * to fetch the initial auth tokens and start the refresh loop.
 *
 * The function `getAccessToken` will return the current auth token, or undefined if
 * auth has failed and the token is unavailable.
 *
 */

export type Response<T> = AxiosResponse<T, { detail: string }>

// Freezeman api configuration fields.
const LIMS_API_URL = config.lims.url
const LIMS_USERNAME = config.lims.username
const LIMS_PASSWORD = config.lims.password

// The freezeman auth tokens data structure.
interface FreezemanAuthTokens {
    readonly access: string
    readonly refresh: string
}

// This is the data structure we get when we jwtDecode a freezeman
// access or refresh token.
interface DecodedToken {
    exp: number // expiry date
    jti: string // token
    token_type: "access" | "refresh"
    user_id: number // freezeman user id
}

// If a token request fails then we keep trying every N seconds to log in.
const AUTH_RETRY_TIME = 3 // seconds

// We need to refresh the access token before it expires. This constant
// specifies how soon before the expiry time we should refresh.
const DELAY_BEFORE_REFRESH = 90 // seconds

/**
 * AuthLoopState is used to control the sequence in which things happen
 * and to try to keep the code from becoming too complicated.
 */
enum AuthLoopState {
    IDLE = "IDLE",
    START_FETCH = "START_FETCH",
    SCHEDULE_REFRESH = "SCHEDULE_REFRESH",
    REFRESH_NOW = "REFRESH_NOW",
    ABORT = "ABORT",
}

const loggingPrefix = "Freezeman Auth"

function debugMsg(loopState: AuthLoopState, message: string) {
    return `${loggingPrefix} [${loopState}]: ${message}`
}

// The module maintains one instance of a FreezemanAPIAuthorization at
// any one time. If a failure occurs, the current auth instance is trashed
// and a new instance is started up.
let authHandler: FreezemanAPIAuthorization | undefined

/**
 * Create the initial freezeman authorization. This should be called once
 * when triton-server starts up.
 */
export function initializeFreezemanAPIAuthorization() {
    // Sanity check
    if (authHandler) {
        authHandler.trash()
    }

    authHandler = new FreezemanAPIAuthorization()
    authHandler.init()
}

/**
 * Get the freezeman access token, if available. Returns undefined if no
 * auth is available.
 * @returns An access token or undefined
 */
export function getAccessToken() {
    return authHandler?.getAccessToken()
}

/**
 * This function is called by the freezeman http handler if it receives a 401
 * response from freezeman.
 */
export function handle401() {
    // If we get an UNAUTHORIZED error from freezeman then trash the current
    // authorization and begin a new one.
    logger.debug(`Resetting auth due to 401 error`)
    resetAuth()
}

/**
 * This private function trashes the current auth (if any) and creates
 * a new instance.
 */
function resetAuth() {
    logger.debug(`Freezeman Auth: resetting authorization`)
    if (authHandler) {
        authHandler.trash()
    }
    initializeFreezemanAPIAuthorization()
}

/**
 * Manages the fetch, refresh and error handling for a pair of auth tokens.
 *
 * Token management is implemented as a state machine, to try to keep the code
 * as comprehensible as possible.
 *
 * A class was used to facilitate error handling. If an error occurs and we
 * need to reinitialize auth it can be complicated because there can be pending
 * timers and pending promises which have not yet been resolved to worry about.
 * The easiest way to handle that is to create a new instance, and let the old
 * instance die gracefully.
 */
class FreezemanAPIAuthorization {
    authTokens?: FreezemanAuthTokens
    state = AuthLoopState.IDLE

    retryFetchTimer: ReturnType<typeof setTimeout> | undefined
    refreshTimer: ReturnType<typeof setTimeout> | undefined

    constructor() {
        this.state = AuthLoopState.IDLE
    }

    /**
     * Get the current freezeman access token.
     * @returns string or undefined
     */
    getAccessToken() {
        return this.authTokens?.access
    }

    /**
     * Fetch the initial auth token and start the refresh loop.
     */
    init() {
        this.#changeState(AuthLoopState.START_FETCH)
    }

    /**
     * Stop the auth loop and clean up.
     */
    trash() {
        this.#changeState(AuthLoopState.ABORT)
    }

    /**
     * Transition from one state to another.
     * @param state AuthLoopState
     */
    #changeState(state: AuthLoopState) {
        this.state = state
        try {
            switch (this.state) {
                case AuthLoopState.IDLE: {
                    // NOOP
                    break
                }

                case AuthLoopState.START_FETCH: {
                    this.#fetchInitialToken()
                    break
                }

                case AuthLoopState.SCHEDULE_REFRESH: {
                    this.#scheduleRefresh()
                    break
                }

                case AuthLoopState.REFRESH_NOW: {
                    this.#refreshToken()
                    break
                }

                case AuthLoopState.ABORT: {
                    this.#abort()
                    break
                }
            }
        } catch (error) {
            // An unexpected error has occured and the auth state is in an uncertain state.
            // Trash the authorization and start a new one. (This will never happen, of course...)
            logger.error(`${loggingPrefix} Unexpected error in state loop.`)
            logger.error(error)
            resetAuth()
        }
    }

    /**
     * Log in to freezeman to fetch a pair of tokens.
     * If an error occurs, set up a timer to retry the log in after N seconds.
     */
    #fetchInitialToken() {
        fetchToken(LIMS_USERNAME, LIMS_PASSWORD)
            .then((auth) => {
                // Ignore result if the auth was aborted while waiting for the response.
                if (this.state !== AuthLoopState.ABORT) {
                    logger.debug(debugMsg(this.state, "Received token."))
                    this.authTokens = auth
                    this.#changeState(AuthLoopState.SCHEDULE_REFRESH)
                }
            })
            .catch((error) => {
                // Ignore result if the auth was aborted while waiting for the response.
                if (this.state !== AuthLoopState.ABORT) {
                    logger.debug(debugMsg(this.state, "Failed to fetch token"))
                    logger.error({
                        message: `${error.message}`,
                        hints: [
                            `Is LIMS running?`,
                            `Does user '${LIMS_USERNAME}' exist in LIMS?`,
                            `Does it have the correct password?`,
                            `Is the certificate valid or up-to-date?`,
                        ],
                        method: error.config.method,
                        url: error.config.url,
                    })

                    // Try fetching again in N seconds

                    // Sanity check
                    if (this.retryFetchTimer) {
                        clearTimeout(this.retryFetchTimer)
                        this.retryFetchTimer = undefined
                        logger.debug(
                            debugMsg(
                                this.state,
                                "Retry timer is already scheduled!",
                            ),
                        )
                    }

                    this.retryFetchTimer = setTimeout(() => {
                        this.retryFetchTimer = undefined
                        this.#changeState(AuthLoopState.START_FETCH)
                    }, AUTH_RETRY_TIME * 1000)
                }
            })
    }

    /**
     * Compute the time at which the access token should be refreshed then set up a timer
     * to trigger the refresh.
     */
    #scheduleRefresh() {
        if (this.authTokens) {
            // Set a timer to trigger DELAY_BEFORE_REFRESH seconds before the token is due to expire.
            // (Unless it is due to expire sooner than DELAY_BEFORE_REFRESH seconds, or the token has
            // already expired, in which case refresh immediately).

            const decodedAccess = jwtDecode<DecodedToken>(
                this.authTokens.access,
            )
            const expiry = decodedAccess.exp // date in seconds
            const now = Date.now() / 1000 // now in seconds

            const secondsUntilRefresh =
                expiry < now
                    ? 0
                    : Math.max(expiry - now - DELAY_BEFORE_REFRESH, 0)

            logger.debug(
                debugMsg(
                    this.state,
                    `Will refresh token in ${secondsUntilRefresh} seconds.`,
                ),
            )

            // Sanity check
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer)
                this.refreshTimer = undefined
                logger.debug(
                    debugMsg(this.state, "Refresh timer is already scheduled!"),
                )
            }

            this.refreshTimer = setTimeout(() => {
                this.refreshTimer = undefined
                this.#changeState(AuthLoopState.REFRESH_NOW)
            }, secondsUntilRefresh * 1000)
        } else {
            throw new Error(
                `Freezeman auth loop error: expected authTokens to be defined in REFRESH.`,
            )
        }
    }

    /**
     * Try to refresh the current access token.
     *
     * If successful, schedule the next refresh.
     *
     * If it fails, do a fresh login.
     */
    #refreshToken() {
        if (this.authTokens) {
            refreshToken(this.authTokens.refresh)
                .then((auth) => {
                    // Ignore result if auth was aborted while waiting for response.
                    if (this.state !== AuthLoopState.ABORT) {
                        logger.debug(
                            debugMsg(
                                AuthLoopState.REFRESH_NOW,
                                "Received refreshed token",
                            ),
                        )
                        this.authTokens = auth
                        this.#changeState(AuthLoopState.SCHEDULE_REFRESH)
                    }
                })
                .catch((error) => {
                    // Ignore error if auth was aborted while waiting for response.
                    if (this.state !== AuthLoopState.ABORT) {
                        logger.error(
                            `Freezeman auth token refresh failed. Will try to fetch new token.`,
                        )
                        logger.error({
                            message: error.message,
                            method: error.config.method,
                            url: error.config.url,
                        })
                        this.authTokens = undefined
                        this.#changeState(AuthLoopState.START_FETCH)
                    }
                })
        } else {
            throw new Error(
                `Freezeman auth failure - expected authTokens to be defined in REFRESH_NOW..`,
            )
        }
    }

    /**
     * The auth has been trashed. Stop any pending timers.
     * Any outstanding promises will complete, but will be ignored due to the ABORT state.
     */
    #abort() {
        // Abort the authorization. Stop any pending timers.
        if (this.retryFetchTimer) {
            clearTimeout(this.retryFetchTimer)
            this.retryFetchTimer = undefined
        }
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer)
            this.refreshTimer = undefined
        }
    }
}

/**
 * Log in to freezeman.
 * @param username
 * @param password
 * @returns FreezemanAuthTokens
 */
export async function fetchToken(
    username: string | undefined = LIMS_USERNAME,
    password: string | undefined = LIMS_PASSWORD,
): Promise<FreezemanAuthTokens> {
    const response = await Axios.post(`${LIMS_API_URL}/token/`, {
        username,
        password,
    })
    if (response.status === 200) {
        // TODO check the actual return code
        return response.data
    } else {
        throw new Error(
            `Unable to fetch freezeman auth token. ${response.status}: ${response.statusText}`,
        )
    }
}

/**
 * Refresh the current access token. Returns a fresh pair of access and refresh tokens.
 * @param refreshToken
 * @returns FreezemanAuthTokens
 */
async function refreshToken(
    refreshToken: string,
): Promise<FreezemanAuthTokens> {
    const response = await Axios.post(`${LIMS_API_URL}/token/refresh/`, {
        refresh: refreshToken,
    })
    if (response.status === 200) {
        return response.data
    } else {
        throw new Error(
            `Unable to refresh freezeman auth token. ${response.status}: ${response.statusText}`,
        )
    }
}
