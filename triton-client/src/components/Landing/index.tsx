import { Typography, Image, FloatButton, Tooltip, Button } from "antd"
import { Content } from "antd/es/layout/layout"
import { FileTextOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { UserInformationProps } from "./interfaces"
import { GuidedOnboarding } from "@components/."
import { Step } from "react-joyride"
import "./index.scss"
import { Link } from "react-router-dom"

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
                <Typography.Title level={2}>
                    How to stage Datasets
                </Typography.Title>
                <Content className="faq-container">
                    <div className="faq-section-container">
                        <Typography.Title level={5}>
                            1. Datasets can be staged and/or unstaged using
                            either SFTP or GLOBUS. GLOBUS is strongly
                            recommended, as it is faster than SFTP.
                        </Typography.Title>
                        <Typography.Title level={5}>
                            2. For each dataset, staging can be done using one
                            of the two available methods: SFTP or GLOBUS. Once
                            the datasets have been staged, a fixed period of 7
                            days is provided to download the files before they
                            are automatically unstaged from the server. After
                            the download is completed, the files must be
                            manually unstaged to allow further staging and
                            downloading of other files.
                        </Typography.Title>
                        <Typography.Title level={5}>
                            3. There are five request statuses available when
                            datasets are being staged: "Unstaging", "Staging",
                            "Staged" (shown as "Download"), "Queued", and
                            "Failed". If "Queued" is displayed, the dataset is
                            waiting for sufficient disk space to begin staging.
                            If "Failed" is displayed, please contact us at{" "}
                            <Link to={""}>{"hercules@mcgill.ca"}</Link>
                        </Typography.Title>
                        <Typography.Title level={5}>
                            4. An info icon {"  "}
                            <Button icon={<InfoCircleOutlined />} /> {"  "} is
                            associated with each dataset released. Clicking it
                            will show a graph with reads per sample of that
                            dataset, and the number of readsets.
                        </Typography.Title>
                    </div>
                </Content>
            </Content>
        </div>
    )
}

export default LandingPage
