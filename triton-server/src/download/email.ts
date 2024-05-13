/*
 * email.ts
 */

import { spawn } from "child_process";
import { logger } from '../logger'


export async function sendEmail(from: string, to: string, subject: string, content: string) {
	return await new Promise<void>((resolve, reject) => {
		const mailx = spawn('mailx', ['-s', subject], {
			stdio: ['pipe', 'ignore', 'pipe']
		})
		mailx.stderr.on('data', (data) => {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			logger.warn(`[mailx] ${data.toString()}`)
		})
		mailx.on('exit', () => resolve())
		mailx.on('disconnect', resolve)
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
			}
			mailx.kill()
		})
	})
}
