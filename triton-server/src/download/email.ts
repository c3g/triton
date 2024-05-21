/*
 * email.ts
 */

import { spawn } from "child_process";
import { logger } from '../logger'


export async function sendEmail(from: string, to: string, subject: string, content: string) {
	const mailx = spawn('mailx', ['-s', subject], {
		stdio: ['pipe', 'ignore', 'pipe']
	})
	try {
		await new Promise<void>((resolve, reject) => {
			mailx.stderr.on('data', (data) => {
				logger.warn(`[mailx] ${data.toString()}`)
			})
			mailx.on('exit', () => resolve())
			mailx.on('disconnect', () => resolve())
			mailx.on('close', () => resolve())
			mailx.on('error', (err) => {
				logger.error(err, '[mailx]')
				reject(err)
			})
			mailx.stdin.write(`${content}\n`, (err) => {
				if (err) {
					logger.error(err, '[mail]')
					reject(err)
				} else {
					logger.debug(`[mailx] Finished writing to ${to}`)
					resolve()
				}
			})
		})
	} catch (err) {
		throw err
	} finally {
		mailx.kill()
	}
}
