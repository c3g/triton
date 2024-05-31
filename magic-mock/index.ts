import express from 'express'
import * as http from 'http'
import data from './data'
import { MagicReply } from '../triton-types/models/magic'

function makeMagicReply<T>(data: T): MagicReply<T> {
	return {
		ok: true,
		data,
	}
}

const app = express()

app.use('/login', (req, res) => {
	res.redirect('https://newtritonqc.genome.mcgill.ca/api/auth/magic-callback?userID=userID&token=token')
})

app.use('/oauth/token', (req, res) => {
	res.json({ access_token: 'access_token', expires_in: 24 * 60 * 60 })
})

const herculesRouter = express.Router()
app.use('/hercules', herculesRouter)

herculesRouter.use('/userAuthenticated', (req, res) => {
	res.json(makeMagicReply(data.isLoggedInData.isLoggedIn))
})

herculesRouter.use('/userProjects', (req, res) => {
	res.json(makeMagicReply(data.userProjects))
})

herculesRouter.use('/userDetails', (req, res) => {
	res.json(makeMagicReply(data.userDetails))
})

herculesRouter.use('/projectUsers', (req, res) => {
	res.json(makeMagicReply(data.projectUsers))
})

const PORT = 1234
app.set('port', PORT)

const server = http.createServer(app)
server.listen(PORT)
void new Promise((resolve, reject) => {
	server.on('error', (err) => {
		console.error(JSON.stringify(err))
		reject(err)
	})
	server.on('listening', () => console.log(`listening on port ${PORT}`))
})
