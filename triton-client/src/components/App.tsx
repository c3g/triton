import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { selectIsLoggedIn, selectLoggedInUser } from '../store/auth'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectProjects, selectProjectsLoading } from '../store/projects'

import LandingPage from './Landing'
import ProjectCardList from './ProjectCardList'
import RunDetail from './RunDetail'

import './App.scss'
import './Common.scss'

import { Alert, Layout, Spin } from 'antd'
import { TritonProject } from '../api/api-types'
import { fetchLoginStatus, fetchProjects, fetchConstants } from '../store/thunks'
import { selectConstants } from '../store/constants'

const { Sider, Content } = Layout

function MGCHeader() {
	return (
		<div className="mgc-header">
			<img alt="McGill Genome Center" height="40px" src={require('../static/genome-logo.jpg')} />
		</div>
	)
}

function App() {
	const dispatch = useAppDispatch()
	const isLoggedIn = useAppSelector(selectIsLoggedIn)
	const user = useAppSelector(selectLoggedInUser)
	const projects = useAppSelector<TritonProject[]>(selectProjects)
	const areProjectsLoading = useAppSelector(selectProjectsLoading)
	const constants = useAppSelector(selectConstants)

	useEffect(() => {
		if (!isLoggedIn) dispatch(fetchLoginStatus())
	}, [dispatch, isLoggedIn])

	useEffect(() => {
		if (isLoggedIn) dispatch(fetchProjects())
	}, [dispatch, isLoggedIn])

	useEffect(() => {
		dispatch(fetchConstants())
	}, [dispatch, isLoggedIn])

	let userName
	if (user) {
		userName = `${user.firstName} ${user.lastName}`
	} else {
		userName = 'UNKNOWN'
	}

	return (
		<BrowserRouter>
			<div>
				<Layout style={{ minHeight: '100vh' }}>
					<Sider collapsedWidth="0" breakpoint="lg" width="24rem" className="app-sidebar" theme="light">
						<MGCHeader />
						{areProjectsLoading && <Spin size="large" className="App-spinner" tip="Loading..."></Spin>}
						{projects && !areProjectsLoading && <ProjectCardList projects={projects} />}
						{projects.length === 0 && !areProjectsLoading && (
							<Alert message="No projects associated with this user." type="info" />
						)}
					</Sider>
					<Layout>
						<Content>
							<Routes>
								<Route path="/" element={<LandingPage isLoggedIn={isLoggedIn} userName={userName} />} />
								<Route path="/run/:runName" element={<RunDetail />} />
								<Route path="*" element={<Navigate to="/" replace />} />
							</Routes>
							{constants.globus_project_size && `Globus: ${constants.globus_project_size} GB`}
							{constants.http_project_size && `HTTP: ${constants.http_project_size} GB`}
							{constants.sftp_project_size && `SFTP: ${constants.sftp_project_size} GB`}
						</Content>
					</Layout>
				</Layout>
			</div>
		</BrowserRouter>
	)
}

export default App
