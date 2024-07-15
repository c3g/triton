import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { selectIsLoggedIn, selectLoggedInUser } from "@store/auth"
import { useAppDispatch, useAppSelector } from "@store/hooks"

import {
    ProjectDetail,
    LandingPage,
    SiderMenu,
} from "@components/."

import "@components/App.scss"
import "@components/Common.scss"

import { Button, Layout } from "antd"
import { fetchLoginStatus, fetchProjects } from "@store/thunks"
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons"

const { Content } = Layout

function App() {
    const dispatch = useAppDispatch()
    const isLoggedIn = useAppSelector(selectIsLoggedIn)
    const user = useAppSelector(selectLoggedInUser)
    const userName:string = (user != undefined) ? `${user.firstName} ${user.lastName}`:  "UNKNOWN"
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        if (!isLoggedIn) dispatch(fetchLoginStatus())
    }, [dispatch, isLoggedIn])

    useEffect(() => {
        if (isLoggedIn) dispatch(fetchProjects())
    }, [dispatch, isLoggedIn])


    return (
        <BrowserRouter>
            <Layout style={{ minHeight: "100vh" }}>
                <SiderMenu isOpened={collapsed}/>
                <Layout>
                    <Content>
                    <Button
                      type="text"
                      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => setCollapsed(!collapsed)}
                      style={{
                        fontSize: '16px',
                        width: 64,
                        height: 64,
                      }}
                    />
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
        </BrowserRouter>
    )
}

export default App