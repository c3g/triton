import cron from "node-cron"
import nodemailer from "nodemailer"
import * as email from "./contact-service"
import { TritonDataset } from "./api/api-types"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"

const mockDataset: TritonDataset = {
    id: 987654,
    lane: 123546,
    external_project_id: "project-id-testing",
    project_name: "project name",
    run_name: "test name",
    readset_count: 19,
    released_status_count: 99,
    blocked_status_count: 64,
    latest_release_update: new Date(),
    metric_report_url: `https://datahub-297-p25.p.genap.ca/MGI_validation/2023/A01861_0139.report.html`,
}

export const start = () => {
    console.info("Notification service started to run.")
    cron.schedule("0 * * * *", async () => {
        console.info("Notification service is running at an hourly pace.")

        let releasedDatasets: TritonDataset[] = []

        const freezemanApi = await getFreezeManAuthenticatedAPI()

        const datasetsResponse =
            await freezemanApi.Dataset.listByReleasedUpdates()

        releasedDatasets = datasetsResponse.data.results.map((dataset) => {
            return {
                external_project_id: dataset.external_project_id,
                id: dataset.id,
                lane: dataset.lane,
                readset_count: dataset.readset_count,
                released_status_count: dataset.released_status_count,
                run_name: dataset.run_name,
                latest_release_update: dataset.latest_release_update,
                blocked_status_count: dataset.blocked_status_count,
                project_name: dataset.project_name,
                // metric_report_url: dataset.metric_report_url,
            }
        })

        sendNotificationEmail(releasedDatasets)
    })
}

export const sendNotificationEmailTest = async (
    datasets: TritonDataset[] = [mockDataset]
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "sebastianamouzegar@gmail.com",
            pass: "ohgv wqgc vzlj rytk",
        },
    })
    datasets.map((dataset) => {
        const mailOptions = {
            from: "sebastianamouzegar@gmail.com",
            to: "sebastian.amouzegar@computationalgenomics.ca",
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
                        -   Dataset metric report url: ${
                            dataset.metric_report_url
                        }
                        -   Dataset latest released update date: ${formatDateAndTime(
                            dataset.latest_release_update ?? new Date()
                        )}
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

export const sendNotificationEmail = async (
    releasedDatasets: TritonDataset[] = [mockDataset]
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
                        -   Dataset metric report url: ${
                            dataset.metric_report_url
                        }<br/>
                        -   Dataset latest released update date: ${formatDateAndTime(
                            dataset.latest_release_update ?? new Date()
                        )}<br/>
                    You can now stage for download (Via Globus or SFTP) in Triton.<br/>

                    Thank you<br/>
                    From the Triton Tech team<br/>
                    This is an automated email, do not reply back.,`
                )
            }
        )
    })
}

const formatDateAndTime = (date: Date): string => {
    const cleanedDate = new Date(date)
    return (
        cleanedDate.toLocaleDateString() +
        " " +
        cleanedDate.toLocaleTimeString()
    )
}

export default cron
