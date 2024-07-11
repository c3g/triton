import { TritonProject } from "../../api/api-types"

export interface ProjectCardListProps {
    projects: ProjectCard[]
}

export interface ProjectCard extends TritonProject {}
