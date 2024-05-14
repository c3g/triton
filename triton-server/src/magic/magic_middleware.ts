import Express from 'express'
import asyncHandler from 'express-async-handler'
import { getUserDetails, isUserAuthenticated } from './magic_api'
import config from '../../config'

/**
 * This module handles the user login in Triton.
 *
 * Users have to log in to Magic (Hercules) via the Hercules login page before
 * they can use Triton.
 *
 * magicAuthMiddleware is an express router middleware function that checks to
 * see if the user is logged in before handling any requests.
 *
 * If the user is logged in then the request will be handled normally.
 *
 * If the user is not logged in then a 401 error response is sent, including a link
 * to the hercules login page. The client redirects to that link when it receives the 401.
 *
 * After logging in, the user clicks the Data Portal button which contains a link back
 * to the Triton server. The link includes the user's login name and an auth token, and starts
 * with "/api/auth/magic-callback/".
 *
 * The magicCallbackHandler function handles this reply. It grabs the user name and
 * token and adds them to the user's session. The user name and token are needed
 * by every call we make to magic to request the user's data. The response then redirects
 * to the triton client endpoint.
 *
 * The middleware also checks that the user is still logged in. The user can decide
 * to log out of Hercules at any time, and Triton is not notified. As such, we always
 * have to check that the user is still logged in before handling their requests.
 */

/**
 * This middleware checks every request. It verifies that the user is logged in to Magic
 * before allowing the request to be processed.
 *
 * We have to "poll" the magic server before every api request since the user can log out
 * of Magic at any point.
 *
 * If the user is not logged in then a 401 error is returned, along with a link to
 * the hercules login page, which the client uses to redirect the user to the login page.
 *
 * @param req
 * @param res
 * @param next
 */
const magicAuthMiddleware = asyncHandler(async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
	let isAuthenticated = false

	// Verify that the user is logged in. If the user is logged in then their session
	// contains credentials and userDetails.
	const credentials = req.session?.credentials
	const userDetails = req.session?.userDetails

	// Ask Magic if the user's token is still valid. The user can log out in Hercules any time,
	// so we always have to verify that the user is still logged in.
	if (credentials && userDetails) {
		// TODO: Is checking this on every request too heavy? Maybe this middleware should only
		// be run on /api requests?
		isAuthenticated = await isUserAuthenticated(credentials.userId, credentials.token)
		if (!isAuthenticated) {
			// User token is no longer valid. Flush the session info and force a new login.
			req.session.credentials = undefined
			req.session.userDetails = undefined
		}
	}

	// If authenticated then let the next router handle the request.
	if (isAuthenticated) {
		next()
	} else {
		// Ideally, the server would automatically redirect the client to the Hercules login page.
		// However, Hercules is rejecting the redirect, probably because of cross-origin protections.
		// As a work-around, the server will return a 401 error, and the client will have to catch
		// that error and handle the redirect itself. The server includes the Hercules login link
		// as part of the 401 error.

		// res.redirect(302, config.client_portal.loginUrl)

		// Respond with a 401 error and include the hercules login page url, which the client
		// will use to "redirect" to the login page.
		res.status(401).json({ url: config.client_portal.loginUrl })
	}
})

/**
 * Handles the magic-callback request sent by Hercules when the user clicks the Data Portal
 * button to navigate to triton.
 */
const magicCallbackHandler = asyncHandler(async (req, res, next) => {
	// userID and token are included as parameters in the magic-callback request.
	const userId = req.query.userID as string
	const token = req.query.token as string

	// Verify that the user is still logged in with the token.
	const isAuthenticated = await isUserAuthenticated(userId, token)
	if (!isAuthenticated) {
		throw Error('Not authenticated')
	}

	// Ask Magic for the user's details.
	const userDetails = await getUserDetails(userId, token)

	// Store the user details and their login credentials in the session.
	// We need the user id and token because triton has to check if the user is
	// still logged in before every request it makes to magic on behalf of the user.
	req.session.userDetails = userDetails
	req.session.credentials = { userId, token }
	req.session.save((err) => {
		if (err !== undefined) console.error(err)
	})

	// Redirect the user to the triton client web app
	res.redirect(config.client.url)
})

const router = Express.Router()

// Note: The magic-callback handler needs a chance to receive the callback
// and set up the user's login state before the middleware is called.
// If the middleware gets it first then it won't find the session login info
// and will just redirect again, back to the login page.
router.use('/api/auth/magic-callback', magicCallbackHandler)
router.use(magicAuthMiddleware)

export default router
