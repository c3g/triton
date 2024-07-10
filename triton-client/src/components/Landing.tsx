import { Typography } from "antd"
import "@components/Common.scss"
import "@components/Landing.scss"
const { Title, Text } = Typography

interface UserInformationProps {
    isLoggedIn: boolean
    userName: string
}

function LandingPage({ isLoggedIn, userName }: UserInformationProps) {
    return (
        <>
            <div className="Common-padding">
                <img
                    alt="triton"
                    className="Landing-trident"
                    width={80}
                    src={require("../static/triton.png")}
                />
                <Title className="Common-title Landing-welcome">
                    Welcome to Triton
                </Title>
                <Text className="Common-subtitle Landing-user" type="secondary">
                    {isLoggedIn ? `Logged in as ${userName}` : "Logging In.."}
                </Text>
            </div>
        </>
    )
}

export default LandingPage
