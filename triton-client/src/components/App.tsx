import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { selectIsLoggedIn, selectLoggedInUser } from "../store/auth"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectProjects, selectProjectsLoading } from "../store/projects"

import LandingPage from "./Landing"
import ProjectCardList from "./ProjectCardList"
import ProjectDetail from "./ProjectDetail"

import "./App.scss"
import "./Common.scss"

import { Alert, Layout, Spin } from "antd"
import { TritonProject } from "../api/api-types"
import { fetchLoginStatus, fetchProjects } from "../store/thunks"

const { Sider, Content } = Layout

function MGCHeader() {
    return (
        <div className="mgc-header">
            <img
                alt="McGill Genome Center"
                height="40px"
                src={require("../static/genome-logo.jpg")}
            />
        </div>
    )
}

function App() {
    const dispatch = useAppDispatch()
    const isLoggedIn = useAppSelector(selectIsLoggedIn)
    const user = useAppSelector(selectLoggedInUser)
    const projects = useAppSelector<TritonProject[]>(selectProjects)
    const areProjectsLoading = useAppSelector(selectProjectsLoading)

    useEffect(() => {
        if (!isLoggedIn) dispatch(fetchLoginStatus())
    }, [dispatch, isLoggedIn])

    useEffect(() => {
        if (isLoggedIn) dispatch(fetchProjects())
    }, [dispatch, isLoggedIn])

    let userName
    if (user) {
        userName = `${user.firstName} ${user.lastName}`
    } else {
        userName = "UNKNOWN"
    }

    return (
        <BrowserRouter>
            <div>
                <Layout style={{ minHeight: "100vh" }}>
                    <Sider
                        collapsedWidth="0"
                        breakpoint="lg"
                        width="24rem"
                        className="app-sidebar"
                        theme="light"
                    >
                        <MGCHeader />
                        {areProjectsLoading && (
                            <Spin
                                size="large"
                                className="App-spinner"
                                tip="Loading..."
                            ></Spin>
                        )}
                        {projects && !areProjectsLoading && (
                            <ProjectCardList projects={projects} />
                        )}
                        {projects.length === 0 && !areProjectsLoading && (
                            <Alert
                                message="No projects associated with this user."
                                type="info"
                            />
                        )}
                    </Sider>
                    <Layout>
                        <Content>
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <LandingPage
                                            isLoggedIn={isLoggedIn}
                                            userName={userName}
                                        />
                                    }
                                />
                                <Route
                                    path="/project/:projectExternalId/"
                                    element={<ProjectDetail />}
                                />
                                <Route
                                    path="*"
                                    element={<Navigate to="/" replace />}
                                />
                            </Routes>
                        </Content>
                    </Layout>
                </Layout>
            </div>
        </BrowserRouter>
    )
}

export default App
