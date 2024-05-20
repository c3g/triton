/* eslint-disable @typescript-eslint/restrict-template-expressions */
/*
 * contact-service.ts
 */
/* eslint-disable no-console */

import { Contact } from './download/download-types'
import config from '../config'
import { ExternalProjectID } from './api/api-types'
import { logger } from './logger'
import { defaultDatabaseActions } from './download/actions'
import { sendEmail } from './download/email'
import { getProjectUsers } from './magic/magic_api'

export function start() {
    logger.info('[contacts] Starting service...')
    const intervalID = setInterval(() => {
        void tick()
    }, 30 * 1000)
    void tick()

    const stop = () => {
        logger.info('[contacts] Stopping service...')
        clearInterval(intervalID)
    }

    async function tick() {
        const db = await defaultDatabaseActions()
        const contacts = await db.listReadyContacts()
        logger.debug(`[contacts] Found ${contacts.length} contacts`)
        if (contacts.length === 0) return

        await Promise.allSettled(contacts.filter((contact) => contact.depth === '').map(async (contact) => {            
            await broadcastEmailsOfProject(contact.project_id, async (send) => {
                await send(
                    getCredentialSubjectFor(contact),
                    getCredentialMessageFor(contact),
                )
            })

            logger.info(`[contacts] Removing contact ${JSON.stringify(contact)}`)
            await db.removeContact(contact.project_id, contact.type).catch((error) =>
                logger.error(error, `[contacts] Could not remove contact ${JSON.stringify(contact)}`)
            )
        }))

        const requests = await db.listRequests()
        await Promise.allSettled(requests.map(async (request) => {
            await broadcastEmailsOfProject(request.project_id, async (send) => {
                const completion_date = request.completion_date && new Date(request.completion_date)
                const notification_date = request.notification_date && new Date(request.notification_date)
                const failure_date = request.failure_date && new Date(request.failure_date)
                // TODO: update the notification_date in the database

                if (request.status === 'SUCCESS' && completion_date && (!notification_date || notification_date < completion_date)) {
                    const subject = `The dataset #${request.dataset_id} for project '${request.project_id}' is ready`
                    await send(
                        `${subject}`,
                        `${subject}.<br/>
                        The dataset can be downloaded using ${request.type} using the credential provided to you.`,
                    )
                }
                if (request.status === 'FAILED' && failure_date && (!notification_date || notification_date < failure_date)) {
                    const subject = `The dataset #${request.dataset_id} for project '${request.project_id}' failed to be staged`
                    await send(
                        `${subject}`,
                        `${subject}.`,
                    )
                }
            })
            await db.updateNotificationDate(request.id)
        }))
    }

    return stop
}

async function broadcastEmailsOfProject(projectID: string, fn: (sendEmail: (subject: string, message: string) => Promise<void>) => Promise<void>) {
    const emails = await getEmailsForProject(projectID)

    await Promise.allSettled(
        emails.map(async (to: string) => {
            logger.info(`[contacts] Sending email to ${to}`)
            await fn(async (subject, message) => await sendEmail('', to, subject, message))
                .catch((error) => logger.error(error, `[contacts] Could not send email to ${to}`))
        })
    )
}

function getCredentialSubjectFor(contact: Contact) {
    return contact.status === 'NEW'
        ? `Credentials for ${contact.type} account ${contact.project_id}`
        : `Password reset for ${contact.type} account ${contact.project_id}`
}

function getCredentialMessageFor(contact: Contact) {
    if (contact.type === 'GLOBUS' && contact.status === 'NEW') {
        return `
      Hello,<br/>
      <br/>
      A new Globus account has been created for a project to which you have access.<br/>
      <br/>
      Endpoint: <b>mcgilluniversity#genomecentre-lims</b><br/>
      Username: <b>${contact.project_id}</b><br/>
      Password: <b>${contact.depth ?? ''}</b><br/>
      <br/>
      Thanks.<br/>
      `
    }

    if (contact.type === 'GLOBUS' && contact.status === 'MODIFIED') {
        return `
        Hello,<br/>
        <br/>
        The Globus password has been reset for a project to which you have access.<br/>
        <br/>
        Endpoint: <b>mcgilluniversity#genomecentre-lims</b><br/>
        Username: <b>${contact.project_id}</b><br/>
        Password: <b>${contact.depth ?? ''}</b><br/>
        <br/>
        Thanks.<br/>
        `
    }

    if (contact.type === 'SFTP' && contact.status === 'NEW') {
        return `
        Hello,<br/>
        <br/>
        A new SFTP account has been created for a project to which you have access.<br/>
        <br/>
        Server:   <b>${config.sftp.server}:${config.sftp.port}</b><br/>
        Username: <b>${contact.project_id}</b><br/>
        Password: <b>${contact.depth ?? ''}</b><br/>
        <br/>
        Thanks.<br/>
        `
    }

    if (contact.type === 'SFTP' && contact.status === 'MODIFIED') {
        return `
      Hello,<br/>
      <br/>
      The SFTP password has been reset for a project to which you have access.<br/>
      <br/>
      Server:   <b>${config.sftp.server}:${config.sftp.port}</b><br/>
      Username: <b>${contact.project_id}</b><br/>
      Password: <b>${contact.depth ?? ''}</b><br/>
      <br/>
      Thanks.<br/>
      `
    }

    // maybe hide contact.depth?
    throw new Error(`Unreachable: (${JSON.stringify(contact)})`)
}

async function getEmailsForProject(projectID: ExternalProjectID): Promise<string[]> {
    try {
        const { users } = await getProjectUsers(projectID)
        const emails = users.map((u) => u.email)
        return emails
    } catch (e) {
        const subject = `Error while getting emails for project with ID ${projectID}`

        logger.error(e, `[contacts] ${subject}`)

        const { stack = 'e.stack' } = e instanceof Error ? e : {}
        await sendEmail(
            '',
            config.mail.errorMonitoring,
            subject,
            `ProjectID: ${projectID}<br/><pre>${stack}</pre>`,
        ).catch((error) => logger.error(error, `[contacts] Could not send email to ${config.mail.errorMonitoring}`))
    }

    return []
}

export default {
    start,
}