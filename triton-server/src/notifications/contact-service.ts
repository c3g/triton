/*
 * contact-service.ts
 */
/* eslint-disable no-console */

import { Contact } from "../types/download"
import config from "@root/config"
import { ExternalProjectID } from "../types/api"
import { logger } from "@core/logger"
import { defaultDatabaseActions } from "@database/download/actions"
import { sendEmail } from "@notifications/emails"
import { getProjectUsers } from "@api/magic/magic_api"

export function start() {
    logger.info("[contacts] Starting service...")
    const intervalID = setInterval(() => {
        void tick()
    }, config.cron.contactService)
    void tick()

    const stop = () => {
        logger.info("[contacts] Stopping service...")
        clearInterval(intervalID)
    }

    async function tick() {
        const db = await defaultDatabaseActions()
        const contacts = await db.listReadyContacts()

        logger.debug(`[contacts] Found ${contacts.length} contacts`)
        await Promise.allSettled(
            contacts
                .filter((contact) => contact.depth)
                .map(async (contact) => {
                    if (contact.depth !== null) {
                        await broadcastEmailsOfProject(
                            contact.project_id,
                            async (send) => {
                                await send(
                                    getCredentialSubjectFor(contact),
                                    getCredentialMessageFor(contact),
                                )
                            },
                        )

                        logger.info(`[contacts] Removing contact ${contact.id}`)
                        await db
                            .removeContact(contact.project_id, contact.type)
                            .catch((error) =>
                                logger.error(
                                    error,
                                    `[contacts] Could not remove contact ${contact.id}`,
                                ),
                            )
                    }
                }),
        )

        const requests = await db.listRequests()
        logger.debug(`[contacts] Found ${requests.length} requests`)
        await Promise.allSettled(
            requests.map(async (request) => {
                logger.debug(
                    `[contacts] Processing request: ${JSON.stringify(request)}`,
                )
                const completionDate =
                    request.completion_date && new Date(request.completion_date)
                const notificationDate =
                    request.notification_date &&
                    new Date(request.notification_date)
                const failureDate =
                    request.failure_date && new Date(request.failure_date)

                if (
                    request.status === "SUCCESS" &&
                    completionDate &&
                    (!notificationDate || notificationDate < completionDate)
                ) {
                    const subject = `The dataset #${request.dataset_id} for project '${request.project_id}' is ready`
                    await broadcastEmailsOfProject(
                        request.project_id,
                        async (send) => {
                            await send(
                                `${subject}`,
                                `${subject}.<br/>
                                The dataset can be downloaded using ${request.type} using the credential provided to you.<br/>
                                If you forgot your credential or didn't receive it, you can reset your password in the data portal.<br/><br/>
                                If you have any other issues please contact us at ${config.mail.techSupport}.<br/><br/>
                                Thank You.<br/>`,
                            )
                        },
                    )
                    await db.updateNotificationDate(request.id)
                }
                if (
                    request.status === "FAILED" &&
                    failureDate &&
                    (!notificationDate || notificationDate < failureDate)
                ) {
                    const subject = `The dataset #${request.dataset_id} for project '${request.project_id}' failed to be staged`
                    await broadcastEmailsOfProject(
                        request.project_id,
                        async (send) => {
                            await send(
                                `${subject}`,
                                `${subject}.<br/><br/>
                                Please contact us at ${config.mail.techSupport}.<br/><br/>
                                Thank You.<br/>`,
                            )
                        },
                    )
                    await db.updateNotificationDate(request.id)
                }
            }),
        )
    }

    return stop
}

export async function broadcastEmailsOfProject(
    projectID: string,
    fn: (
        sendEmail: (subject: string, message: string) => Promise<void>,
    ) => Promise<void>,
) {
    const emails = await getEmailsForProject(projectID)

    return await Promise.allSettled(
        emails.map(async (to: string) => {
            await fn(async (subject, message) => {
                logger.info(`[contacts] Sending email to ${to}`)
                await sendEmail("", to, subject, message)
            }).catch((error) => {
                logger.error(error, `[contacts] Could not send email to ${to}`)
                throw error
            })
        }),
    )
}

function getCredentialSubjectFor(contact: Contact) {
    return contact.status === "NEW"
        ? `Credentials for project ${contact.project_id} through ${contact.type}`
        : `Password reset for project ${contact.project_id} through ${contact.type}`
}

function getCredentialMessageFor(contact: Contact) {
    const ENDING = `If you have any issues please contact us at ${config.mail.techSupport}.<br/><br/>
    Thank You.<br/>`

    if (contact.type === "GLOBUS" && contact.status === "NEW") {
        return `
        Hello,<br/>
        <br/>
        A new Globus account has been created for the project ${
            contact.project_id
        }.<br/>
        <br/>
        Endpoint: <b>mcgilluniversity#genomecentre-lims</b><br/>
        Username: <b>${contact.project_id}</b><br/>
        Password: <b>${contact.depth ?? "ERROR COULD NOT GENERATE PASSWORD"}</b><br/><br/>
        ${ENDING}`
    }

    if (contact.type === "GLOBUS" && contact.status === "MODIFIED") {
        return `
        Hello,<br/>
        <br/>
        The Globus password has been reset for the project ${
            contact.project_id
        }.<br/>
        <br/>
        Endpoint: <b>mcgilluniversity#genomecentre-lims</b><br/>
        Username: <b>${contact.project_id}</b><br/>
        Password: <b>${contact.depth ?? "ERROR COULD NOT GENERATE PASSWORD"}</b><br/><br/>
        ${ENDING}
        `
    }

    if (contact.type === "SFTP" && contact.status === "NEW") {
        return `
        Hello,<br/>
        <br/>
        A new SFTP account has been created for the project ${
            contact.project_id
        }.<br/>
        <br/>
        Server:   <b>${config.sftp.server}</b><br/>
        Port:     <b>${config.sftp.port}</b><br/>
        Username: <b>${contact.project_id}</b><br/>
        Password: <b>${contact.depth ?? "ERROR COULD NOT GENERATE PASSWORD"}</b><br/><br/>
        ${ENDING}
        `
    }

    if (contact.type === "SFTP" && contact.status === "MODIFIED") {
        return `
        Hello,<br/>
        <br/>
        The SFTP password has been reset for the project ${
            contact.project_id
        }.<br/>
        <br/>
        Server:   <b>${config.sftp.server}</b><br/>
        Port:     <b>${config.sftp.port}</b><br/>
        Username: <b>${contact.project_id}</b><br/>
        Password: <b>${contact.depth ?? "ERROR COULD NOT GENERATE PASSWORD"}</b><br/><br/>
        ${ENDING}
        `
    }

    throw new Error(`Unreachable contact: ${contact.id}`)
}

async function getEmailsForProject(
    projectID: ExternalProjectID,
): Promise<string[]> {
    try {
        const { users } = await getProjectUsers(projectID)
        const emails = users.map((u) => u.email)
        return emails
    } catch (e) {
        const subject = `Error while getting emails for project with ID ${projectID}`

        logger.error(e, `[contacts] ${subject}`)

        const { stack = "e.stack" } = e instanceof Error ? e : {}
        await sendEmail(
            "",
            config.mail.errorMonitoring,
            subject,
            `ProjectID: ${projectID}<br/><pre>${stack}</pre>`,
        ).catch((error) =>
            logger.error(
                error,
                `[contacts] Could not send email to ${config.mail.errorMonitoring}`,
            ),
        )
    }

    return []
}

export default {
    start,
}
