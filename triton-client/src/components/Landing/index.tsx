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
            content:
                "This is the App logo, you can return to the home page with it.",
        },
        {
            target: ".mgc-projects-list",
            content:
                "These are your projects, Close this dialog and click on a project from this list to continue.",
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
            <Text className="Common-subtitle Landing-user" type="secondary">
                {isLoggedIn ? `Logged in as ${userName}` : "Logging In.."}
            </Text>
        </div>
    )
}

export default LandingPage
