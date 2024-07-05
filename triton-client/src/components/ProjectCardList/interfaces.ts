import { TritonProject } from "../../api/api-types"

export interface IProjectCardListProps {
    projects: IProjectCard[]
}

export interface IProjectCard extends TritonProject {}