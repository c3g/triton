import { FunctionComponent, useEffect } from "react";
import { selectConstants } from "@store/constants";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchConstants } from "@store/thunks";
import { Col, Flex, Layout, Progress, Row } from "antd"
import { SUPPORTED_DOWNLOAD_TYPES } from "../../constants"
import { dataSize } from "../../functions"
import { ProjectDiskUsageProps } from "./interfaces";
import { Content } from "antd/es/layout/layout";
import { Typography } from "antd"
import "./index.scss"
const { Text, Title } = Typography

const ProjectDiskUsage: FunctionComponent<ProjectDiskUsageProps> = ({ projectExternalId }) => {
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
        <>
            {SUPPORTED_DOWNLOAD_TYPES.map((type) => {
                const usage = diskUsage ? diskUsage[type] : 0
                const capacity = constants.diskCapacity[type]
                const [scaledUsage, usageUnit] = diskUsage
                    ? dataSize(diskUsage[type])
                    : []
                const [scaledCapacity, capacityUnit] = dataSize(
                    constants.diskCapacity[type],
                )
                return (
                    <Layout>
                        <Content className="disk-type-usage-container">
                            <Title level={5}>
                                {type}
                            </Title>
                            <Text>
                                {`${scaledUsage} ${usageUnit} / ${scaledCapacity} ${capacityUnit}`}
                            </Text>

                            <Flex gap="small" vertical>
                                <Progress
                                    percentPosition={{ align: 'center', type: 'inner' }}
                                    size={["100%", 20]}
                                    percent={(usage / capacity) * 100}
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
        </>
     );
}

export default ProjectDiskUsage;