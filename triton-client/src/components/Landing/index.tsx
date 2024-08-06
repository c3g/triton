import { Typography, Image, FloatButton, Tooltip } from "antd"
import { Content } from "antd/es/layout/layout"
import { FileTextOutlined } from "@ant-design/icons"
import { UserInformationProps } from "./interfaces"
import { GuidedOnboarding } from "@components/."
import { Step } from "react-joyride"
import "./index.scss"

const { Title, Text } = Typography

function LandingPage({ isLoggedIn, userName }: UserInformationProps) {
    const steps: Step[] = [
        {
            target: ".onboarding-start-float-button",
            content: "The Triton app guide will now start, Click on Next.",
        },
        {
            target: ".mgc-header-logo",
            content: "This is the App logo, you can return to the home page with it.",
        },
        {
            target: ".mgc-projects-list",
            content: "These are your projects, Close this dialog and click on a project from this list to continue.",
        },
    ]
    return (
        <div className="Common-padding">
            <GuidedOnboarding step={steps} />
            <Content className="logo-title-onboarding-header-container">
                <div className="logo-title-header">
                    <Image
                        preview={false}
                        alt="triton"
                        className="Landing-trident"
                        width={80}
                        src={require("@static/triton.png")}
                    />
                    <Title className="Common-title Landing-welcome">
                        Welcome to Triton
                    </Title>
                </div>
                <Tooltip title="Start Onboarding guide">
                    <FloatButton
                        className="onboarding-start-float-button"
                        shape={"square"}
                        icon={<FileTextOutlined />}
                    />
                </Tooltip>
            </Content>
            <Content className="landing-page-content">
                <Text className="Common-subtitle Landing-user" type="secondary">
                    {isLoggedIn ? `Logged in as ${userName}` : "Logging In.."}
                </Text>
                <Typography.Title level={2}>Guide</Typography.Title>
                <Content className="faq-container">
                    <div className="faq-section-container">
                        <Typography.Title level={5}>1. The Triton app landing page is where you will always start.</Typography.Title>
                        <Typography.Title level={5}>2. The App logo will help you return to this page when you click on it.</Typography.Title>
                        <Typography.Title level={5}>3. These are your projects, Close this dialog and click on a project from this list to continue.</Typography.Title>
                    </div>
                    <div className="faq-section-container">
                        <Typography.Title level={5}>4. The second page will have several status of available space for Globus and SFTP storage allocated to your project.</Typography.Title>
                        <Typography.Title level={5}>5. You will be able to reset SFTP or Globus password in the next page. It will be on the top right corner of the next page.</Typography.Title>
                        <Typography.Title level={5}>6. You will see the datasets that have been released in Freezeman, relating to the project, will be displayed in a collapsable container of the next page.</Typography.Title>
                    </div>
                    <div className="faq-section-container">
                        <Typography.Title level={5}>7. You will be able to stage and/or unstage the files on either SFTP or GLOBUS.</Typography.Title>
                        <Typography.Title level={5}>8. Once you stage the files, you will a fixed amount of time (7 days) to download the files before they get automatically unstaged from the server.</Typography.Title>
                        <Typography.Title level={5}>9. There is an info icon associated to each dataset released. The graph can help you visualize, in more details, the amount of readsets/datasets released.</Typography.Title>
                    </div>
                </Content>
            </Content>
        </div>
    )
}

export default LandingPage
