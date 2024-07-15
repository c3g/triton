import { Typography, Image } from "antd"
import { Content } from "antd/es/layout/layout"

const { Title, Text } = Typography

interface UserInformationProps {
    isLoggedIn: boolean
    userName: string
}

function LandingPage({ isLoggedIn, userName }: UserInformationProps) {
    return (
        <div className="Common-padding">
            <Content style={{ display:"flex", alignItems:"center", justifyContent: "flex-start" }}>
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
            </Content>
            <Text className="Common-subtitle Landing-user" type="secondary">
                {isLoggedIn ? `Logged in as ${userName}` : "Logging In.."}
            </Text>
        </div>
    )
}

export default LandingPage