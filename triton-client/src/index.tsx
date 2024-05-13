import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './components/App'

import 'antd/dist/antd.css' // or 'antd/dist/antd.less'
import './index.css'

// Log the environment that was used to build the client so that we can verify
// that the right build is running in dev/prod.
console.log(`ENVIRONMENT: ${process.env.NODE_ENV}`)

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
	<React.StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</React.StrictMode>
)
