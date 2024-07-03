/*
 * email.ts
 */

import { spawn } from "child_process"
import { logger } from "../logger"

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
