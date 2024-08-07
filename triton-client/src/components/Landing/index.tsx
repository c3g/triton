import { Typography, Image, FloatButton, Tooltip, Button } from "antd"
import { Content } from "antd/es/layout/layout"
import { FileTextOutlined, InfoCircleOutlined } from "@ant-design/icons"
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
            <Content className="landing-page-content">
                <Text className="Common-subtitle Landing-user" type="secondary">
                    {isLoggedIn ? `Logged in as ${userName}` : "Logging In.."}
                </Text>
                <Typography.Title level={2}>How to stage</Typography.Title>
                <Content className="faq-container">
                    <div className="faq-section-container">
                        <Typography.Title level={5}>
                            1. You will be able to stage and/or unstage the
                            datasets on either SFTP or GLOBUS. We strongly
                            suggest to use GLOBUS as it is faster than SFTP.
                        </Typography.Title>
                        <Typography.Title level={5}>
                            2. You will be able to stage with either one or the
                            other of the 2 methods available (via SFTP or
                            GLOBUS) for each dataset. Once the datasets are
                            staged, you will a fixed amount of time (7 days) to
                            download the files before they get automatically
                            unstaged from the server. It is necessary that you
                            unstage manually (click on the same button again)
                            the files once you have finished the download in
                            order to continue staging and then download other
                            files.
                        </Typography.Title>
                        <Typography.Title level={5}>
                            3. There are 4 request status when staging the
                            datasets. Unstaging, Stage, Queued and Failed. If
                            you see Queued, it means that the dataset is waiting
                            to have enough space in the disc to start staging.
                            If you see Failed, you can communicate with
                        </Typography.Title>
                        <Typography.Title level={5}>
                            4. There is an info icon {"  "}
                            <Button icon={<InfoCircleOutlined />} /> {"  "}
                            associated to each dataset released. The graph can
                            help you visualize, in more details, the amount of
                            readsets/datasets released.
                        </Typography.Title>
                    </div>
                </Content>
            </Content>
        </div>
    )
}

export default LandingPage
