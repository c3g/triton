/*
 * download.js
 *
 * This file includes everything related to the downloads database.
 */

// import util from 'util'
import config from "../../../config"
import { Kysely, Transaction } from "kysely"
import {
    Database as TritonNotificationDatabase,
    NewDownloadFile,
    DownloadFile,
    NewDownloadRequest,
    DownloadRequest,
    DownloadRequestID,
    DownloadDatasetID,
    Contact,
} from "../../types/download"
import { createSQLite } from "./sqlite-database"

export type DatabaseActions = Awaited<ReturnType<typeof createActions>>
export async function createActions(db: Kysely<TritonNotificationDatabase>) {
    async function listRequestByDatasetId(
        datasetId: DownloadDatasetID,
    ): Promise<DownloadRequest | undefined> {
        return await db
            .selectFrom("requests")
            .where("dataset_id", "=", datasetId)
            .selectAll()
            .executeTakeFirst()
    }

    async function listRequests() {
        return await db.selectFrom("requests").selectAll().execute()
    }

    async function getRequest(datasetId: DownloadDatasetID) {
        return await db
            .selectFrom("requests")
            .where("dataset_id", "=", datasetId)
            .selectAll()
            .executeTakeFirstOrThrow()
    }

    async function getRequestByID(id: DownloadRequestID) {
        return await db
            .selectFrom("requests")
            .where("id", "=", id)
            .selectAll()
            .executeTakeFirstOrThrow()
    }

    async function createRequest(
        request: Pick<
            NewDownloadRequest,
            "dataset_id" | "project_id" | "type" | "requester"
        >,
        files: NewDownloadFile[],
    ) {
        return await db.transaction().execute(async (trx) => {
            const values: NewDownloadRequest = {
                ...request,
                status: "REQUESTED",
                creation_date: currentDateToString(),
                should_delete: 0,
            }
            const insertedFiles = await insertFiles(files, trx)
            const newRequest = await trx
                .insertInto("requests")
                .values(values)
                .returningAll()
                .executeTakeFirstOrThrow()
            return {
                files: insertedFiles,
                request: newRequest,
            }
        })
    }

    async function extendRequest(datasetID: DownloadDatasetID) {
        const daysToExpire: number = (
            await db
                .selectFrom("constants")
                .select("expiry_days")
                .executeTakeFirstOrThrow()
        ).expiry_days
        const expiryDate = new Date(
            Date.now() + daysToExpire * 24 * 60 * 60 * 1000,
        )

        return await db
            .updateTable("requests")
            .set({ expiry_date: expiryDate.toISOString() })
            .where("dataset_id", "=", datasetID)
            .where("status", "=", "SUCCESS")
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async function deleteRequest(datasetID: DownloadDatasetID) {
        const deletedRequest = await db
            .updateTable("requests")
            .set({ should_delete: 1 })
            .where("dataset_id", "=", datasetID)
            .returningAll()
            .executeTakeFirstOrThrow()
        return { request: deletedRequest }
    }

    async function insertFiles(
        files: NewDownloadFile[],
        trx?: Transaction<TritonNotificationDatabase>,
    ) {
        if (files.length === 0) {
            throw new Error("Cannot insert 0 files")
        }
        return await (trx ?? db)
            .insertInto("files")
            .values(files)
            .onConflict((oc) =>
                oc.columns(["dataset_id", "source"]).doUpdateSet({
                    destination: (eb) => eb.ref("excluded.destination"),
                }),
            )
            .returningAll()
            .execute()
    }

    async function listFilesByDatasetId(
        datasetId: DownloadDatasetID,
    ): Promise<DownloadFile[]> {
        return await db
            .selectFrom("files")
            .where("dataset_id", "=", datasetId)
            .selectAll()
            .execute()
    }

    async function listReadyContacts(): Promise<Contact[]> {
        return await db
            .selectFrom("contacts")
            .where("depth", "is not", null)
            .selectAll()
            .execute()
    }

    async function removeContact(
        projectID: Contact["project_id"],
        type: Contact["type"],
    ): Promise<unknown> {
        return await db
            .deleteFrom("contacts")
            .where("project_id", "=", projectID)
            .where("type", "=", type)
            .executeTakeFirstOrThrow()
    }

    async function resetContactPassword(
        projectID: Contact["project_id"],
        type: Contact["type"],
    ): Promise<Contact | undefined> {
        return await db
            .insertInto("contacts")
            .values({
                project_id: projectID,
                type: type,
                status: "MODIFIED",
                depth: null,
            })
            .onConflict((oc) =>
                oc.columns(["project_id", "type"]).doUpdateSet({
                    depth: null,
                }),
            )
            .returningAll()
            .executeTakeFirst()
    }

    async function updateNotificationDate(requestID: DownloadRequestID) {
        return await db
            .updateTable("requests")
            .set({ notification_date: currentDateToString() })
            .where("id", "=", requestID)
            .returningAll()
            .executeTakeFirstOrThrow()
    }

    async function getConstants() {
        return await db
            .selectFrom("constants")
            .selectAll()
            .executeTakeFirstOrThrow(
                () => new Error("Could not find entries in constants table"),
            )
    }

    async function getLatestReleaseNotificationDate() {
        return await db
            .selectFrom("notification_dates")
            .select("last_released_notification_date")
            .executeTakeFirst()
    }

    async function updateLatestReleaseNotificationDate(date: string) {
        return await db
            .updateTable("notification_dates")
            .set({ last_released_notification_date: date })
            .returning("last_released_notification_date")
            .executeTakeFirstOrThrow()
    }

    async function getLatestValidatedNotificationDate() {
        return await db
            .selectFrom("notification_dates")
            .select("last_validated_notification_date")
            .executeTakeFirst()
    }

    async function updateLatestValidatedNotificationDate(date: string) {
        return await db
            .updateTable("notification_dates")
            .set({ last_validated_notification_date: date })
            .returning("last_validated_notification_date")
            .executeTakeFirstOrThrow()
    }

    return {
        createRequest,
        deleteRequest,
        extendRequest,
        getConstants,
        getLatestReleaseNotificationDate,
        getRequest,
        getRequestByID,
        insertFiles,
        listFilesByDatasetId,
        listReadyContacts,
        listRequestByDatasetId,
        listRequests,
        removeContact,
        resetContactPassword,
        updateNotificationDate,
        updateLatestReleaseNotificationDate,
        getLatestValidatedNotificationDate,
        updateLatestValidatedNotificationDate,
    }
}

let actions: DatabaseActions | null = null
export async function defaultDatabaseActions(): Promise<DatabaseActions> {
    if (!actions) {
        const db = await createSQLite(config.paths.downloadDB, undefined)
        actions = await createActions(db)
    }

    return actions
}

/*
 * Current downloads
 *
 * Used to warn users before deleting files that are being downloaded by
 * someone else.
 */

/**
 * @type {Object.<string, number>}
 * number of files being currently downloaded for each datasetID.
 */
interface DatasetDownloads {
    [key: string]: number
}

const datasetsDownloads: DatasetDownloads = {}

export function isDatasetDownloading(datasetID: number) {
    const value = datasetsDownloads[datasetID] ?? 0
    return value > 0
}

export function setDatasetDownloading(datasetID: number, value: boolean) {
    if (datasetsDownloads[datasetID] === undefined)
        datasetsDownloads[datasetID] = 0

    if (value) datasetsDownloads[datasetID]++
    else datasetsDownloads[datasetID]--

    /*
     * Avoid keeping a list of all datasets in memory,
     * we just keep what's being currently downloaded.
     */
    if (datasetsDownloads[datasetID] === 0) delete datasetsDownloads.datasetID
}

// Helpers

function currentDateToString() {
    return new Date().toISOString()
}
