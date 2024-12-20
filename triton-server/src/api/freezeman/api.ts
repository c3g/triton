import Axios, { AxiosInstance, AxiosResponse } from "axios"
import type {
    Dataset,
    DatasetFile,
    FMSList,
    FreezemanUser,
    Project,
    ReadsetWithMetrics,
    ReleaseFlagReleased,
} from "../../types/freezeman"
import config from "@root/config"
import { logger } from "@core/logger"
import { getAccessToken, handle401 } from "./authToken"

const LIMS_API_URL = config.lims.url

let axiosInstance: AxiosInstance | undefined

export type Response<T> = AxiosResponse<T, { detail: string }>

export type ListResponse<T> = Response<FMSList<T>>

/** Typing for the auth response */
export interface FreezeManAuthResponse {
    access: string
    refresh: string
}

export const createAuthorizedAxios = (accessToken?: string): AxiosInstance => {
    const instance = Axios.create()

    // Add a request interceptor to set the current access token in the request
    // headers. This has to be done before each request to ensure we are always
    // using an up-to-date token, which is refreshed periodically in the background.
    // If no token is available then the request will be sent with no auth token
    // and the request will fail.
    instance.interceptors.request.use(
        (config) => {
            const token = accessToken ?? getAccessToken()
            if (token !== undefined) {
                config.headers = { Authorization: `Bearer ${token}` }
            } else {
                logger.warn(
                    `token is currently undefined. Freezeman API might fail`,
                )
            }
            return config
        },
        undefined,
        { synchronous: true },
    )

    // This interceptor catches 401 UNAUTHORIZED errors from freezeman and
    // calls a function that will force a new auth token to be retrieved (if possible).
    instance.interceptors.response.use((res) => {
        if (res.status === 401) {
            handle401()
        }
        return res
    })

    // Request logger
    instance.interceptors.request.use((req) => {
        const { baseURL, url, method, params } = req
        logger.debug({ baseURL, url, method, params }, "Freezeman Request")
        return req
    })

    // Response logger
    instance.interceptors.response.use((res) => {
        const {
            status,
            config: { baseURL, url, method, params },
            data,
        } = res
        logger.debug(
            { status, data, config: { baseURL, url, method, params } },
            "Freezeman Response",
        )
        return res
    })

    return instance
}

export const getAuthenticatedAPI = (axios: AxiosInstance) => {
    return {
        Project: {
            list: async (
                ids: readonly string[],
                external: boolean = true,
            ): Promise<ListResponse<Project>> =>
                await axios.get(
                    `${LIMS_API_URL}/projects/?${
                        external ? "external_id__in" : "id__in"
                    }=${ids.join(",")}`,
                ),
        },
        Dataset: {
            listByExternalProjectIds: async (
                externalProjectIds: readonly string[],
            ): Promise<ListResponse<Dataset>> => {
                if (externalProjectIds.length === 0) {
                    throw new Error(
                        "Must provide at least one project id to list datasets",
                    )
                }
                return await axios.get(
                    `${LIMS_API_URL}/datasets/?external_project_id__in=${externalProjectIds.join(
                        ",",
                    )}`,
                )
            },
            list: async (ids: string[]): Promise<ListResponse<Dataset>> => {
                if (ids.length === 0) {
                    throw new Error(
                        "Must provide at least one project id to list datasets",
                    )
                }
                return await axios.get(
                    `${LIMS_API_URL}/datasets/?id__in=${ids.join(",")}`,
                )
            },
            listByReleasedUpdates: async (
                dates: string,
            ): Promise<ListResponse<Dataset>> => {
                return await axios.get(
                    `${LIMS_API_URL}/datasets/?latest_release_update=${dates}`,
                )
            },
            listByValidatedStatusUpdates: async (
                dates: string,
            ): Promise<ListResponse<Dataset>> => {
                return await axios.get(
                    `${LIMS_API_URL}/datasets/?latest_validation_update=${dates}`,
                )
            },
        },
        DatasetFile: {
            listByDatasetId: async (
                id: Dataset["id"],
            ): Promise<ListResponse<DatasetFile>> => {
                const RELEASED: ReleaseFlagReleased = 1
                return await axios.get(
                    `${LIMS_API_URL}/dataset-files/?readset__dataset__id__in=${id}&readset__release_status=${RELEASED}&limit=100000`,
                )
            },
        },
        Readset: {
            listByDatasetId: async (
                datasetId: Dataset["id"],
            ): Promise<ListResponse<ReadsetWithMetrics>> => {
                const RELEASED: ReleaseFlagReleased = 1
                const params = [
                    `dataset__id__in=${datasetId}`,
                    `release_status=${RELEASED}`,
                    `withMetrics=true`,
                ]
                return await axios.get(
                    `${LIMS_API_URL}/readsets/?${params.join("&")}`,
                )
            },
        },
        Users: {
            getUsersByIds: async (
                ids: number[],
            ): Promise<ListResponse<FreezemanUser>> =>
                await axios.get(
                    `${LIMS_API_URL}/users/?id__in=${ids.join(",")}`,
                ),
        },
    } as const
}

export type AuthenticatedAPI = ReturnType<typeof getAuthenticatedAPI>

export const getOrCreateAxiosInstance = async (
    accessToken?: string,
): Promise<AxiosInstance> => {
    if (axiosInstance !== undefined) {
        return axiosInstance
    } else {
        axiosInstance = createAuthorizedAxios(accessToken)
        return axiosInstance
    }
}

export async function getFreezeManAuthenticatedAPI(
    accessToken?: string,
): Promise<AuthenticatedAPI> {
    try {
        const instance = await getOrCreateAxiosInstance(accessToken)
        return getAuthenticatedAPI(instance)
    } catch (err: any) {
        logger.error(err, "Freezeman Authentication")
        throw new Error(`FreezeMan Authentication: ${String(err.message)}`)
    }
}
