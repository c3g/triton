import { FunctionComponent, useEffect } from "react"
import { selectConstants } from "@store/constants"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { fetchConstants } from "@store/thunks"
import { Card, Flex, Layout, Progress } from "antd"
import { SUPPORTED_DOWNLOAD_TYPES } from "@common/constants"
import { dataSize } from "@common/functions"
import { ProjectDiskUsageProps } from "./interfaces"
import { Content } from "antd/es/layout/layout"
import { Typography } from "antd"
import "./index.scss"
const { Text, Title } = Typography

const ProjectDiskUsage: FunctionComponent<ProjectDiskUsageProps> = ({
    projectExternalId,
}) => {
    const dispatch = useAppDispatch()
    const constants = useAppSelector(selectConstants)

    useEffect(() => {
        dispatch(fetchConstants())
    }, [dispatch])

    const diskUsage = useAppSelector(
        (state: any) =>
            state.projectsState.projectsById[projectExternalId]?.diskUsage,
    )
    return (
        <Card className="disk-usage-card">
            <Title
                level={4}
                className="disk-usage-title"
                style={{ margin: "1rem 0 0 1rem" }}
                italic
            >
                Disk Usage
            </Title>
            {SUPPORTED_DOWNLOAD_TYPES.map((type, index) => {
                const usage = diskUsage ? diskUsage[type] : 0
                const capacity = constants.diskCapacity[type]
                const [scaledUsage, usageUnit] = diskUsage
                    ? dataSize(diskUsage[type])
                    : []
                const [scaledCapacity, capacityUnit] = dataSize(
                    constants.diskCapacity[type],
                )
                return (
                    <Layout key={index} className="disk-type-usage-layout">
                        <Content className="disk-type-usage-container">
                            <Title level={5}>{type}</Title>
                            <Text>
                                {`${scaledUsage} ${usageUnit} / ${scaledCapacity} ${capacityUnit}`}
                            </Text>

                            <Flex gap="small" vertical>
                                <Progress
                                    percentPosition={{
                                        align: "center",
                                        type: "inner",
                                    }}
                                    size={["100%", 20]}
                                    percent={Number(
                                        ((usage / capacity) * 100).toFixed(2),
                                    )}
                                    strokeColor={
                                        usage < capacity ? "#1890ff" : "#f5222d"
                                    }
                                    showInfo={true}
                                />
                            </Flex>
                        </Content>
                    </Layout>
                )
            })}
        </Card>
    )
}

export default ProjectDiskUsage
