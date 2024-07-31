/*
 * email.ts
 */
import nodemailer from "nodemailer"
import { spawn } from "child_process"
import { logger } from "@core/logger"
import { TritonDataset } from "../../types/api"
import * as email from "../contact-service"
import { formatDateAndTime, mockDataset } from "@notifications/utils"

export async function sendEmail(
    from: string,
    to: string,
    subject: string,
    content: string,
) {
    const sendmail = spawn("sendmail", ["-t"], {
        stdio: ["pipe", "ignore", "pipe"],
    })
    try {
        await new Promise<void>((resolve, reject) => {
            sendmail.stderr.on("data", (data: string) => {
                logger.error(data, "[sendmail]")
                reject(data)
            })
            sendmail.on("exit", () => resolve())
            sendmail.on("disconnect", () => resolve())
            sendmail.on("close", () => resolve())
            sendmail.on("error", (err) => {
                logger.error(err, "[sendmail]")
                reject(err)
            })
            sendmail.stdin.write(
                `To: ${to}\nSubject: ${subject}\nMIME-Version: 1.0\nContent-Type: text/html\n${content}`,
                (err) => {
                    if (err) {
                        logger.error(err, "[sendmail]")
                        reject(err)
                    } else {
                        logger.debug(`Finished writing to ${to}`, "[sendmail]")
                    }
                },
            )
            sendmail.stdin.end()
        })
    } finally {
        sendmail.kill()
    }
}

export const sendNotificationEmail = async (
    releasedDatasets: TritonDataset[],
) => {
    releasedDatasets.map(async (dataset: TritonDataset) => {
        const subject = `The following dataset #${dataset.id} for project '${dataset.external_project_id}' has been released.`
        await email.broadcastEmailsOfProject(
            dataset.external_project_id,
            async (send) => {
                await send(
                    `${subject}`,
                    `${subject}.<br/><br/>
                    The dataset can be downloaded using the Triton platform<br/>
                    Here are the information pertaining to the released dataset:<br/>
                        -   Dataset ID: ${dataset.id}<br/>
                        -   Dataset project id: ${
                            dataset.external_project_id
                        }<br/>
                        -   Dataset project name: ${dataset.project_name}<br/>
                        -   Dataset Lane: ${dataset.lane}<br/>
                        -   Readset count within the Dataset: ${
                            dataset.readset_count
                        }<br/>
                        -   Readset released status count: ${
                            dataset.released_status_count
                        }<br/>
                        -   Readset blocked status count: ${
                            dataset.blocked_status_count
                        }<br/>
                        -   Dataset latest released update date: ${formatDateAndTime(dataset.latest_release_update)}<br/>
                    You can now stage for download (Via Globus or SFTP) in Triton.<br/>

                    This is an automated email, do not reply back.`,
                )
            },
        )
    })
}

export const sendNotificationEmailTest = async (
    datasets: TritonDataset[] = [mockDataset],
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // other mailer can be used but right now default is gmail
        auth: {
            user: "yourGmailForTesting",
            pass: "app password",
        },
    })
    datasets.map((dataset) => {
        const mailOptions = {
            from: "yourGmail if gmail is being used",
            to: "theRecipient",
            subject: "Sending Email using Node.js",
            text: `The dataset can be downloaded using the Triton platform
                    Here are the information pertaining to the released dataset:
                        -   Dataset ID: ${dataset.id}
                        -   Dataset project id: ${dataset.external_project_id}
                        -   Dataset project name: ${dataset.project_name}
                        -   Dataset Lane: ${dataset.lane}
                        -   Readset count within the Dataset: ${
                            dataset.readset_count
                        }
                        -   Readset released status count: ${
                            dataset.released_status_count
                        }
                        -   Readset blocked status count: ${
                            dataset.blocked_status_count
                        }
                        -   Dataset latest released update date: ${formatDateAndTime(dataset.latest_release_update)}
                    You can now stage for download (Via Globus or SFTP) in Triton.

                    Thank you
                    From the Triton Tech team
                    This is an automated email, do not reply back.`,
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log("Email sent: " + info.response)
            }
        })
    })
}
