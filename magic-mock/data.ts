import { TritonProject, IsLoggedInData } from '../triton-types'
import { ProjectUser, ProjectUsers, UserDetails, UserProjects } from '../triton-types/models/magic'

export const userDetails: UserDetails = {
	firstName: 'firstName',
	lastName: 'lastName',
	email: 'email@email.com',
	accountType: 'External',
} as const

export const projectUser: ProjectUser = {
	...userDetails,
	roleTitle: 'surgeon',
	jobTitle: 'doctor',
} as const

export const projectUsers: ProjectUsers = {
	projectId: '15605',
	name: 'AK_StickleBack_Fish_Ext_Seq',
	users: [projectUser],
} as const

export const userProjects: UserProjects = {
	projects: [
		{
			projectNumber: 'P015605',
			name: 'AK_StickleBack_Fish_Ext_Seq',
			researchArea: 'researchArea',
			organization: 'organization',
			demographic: 'demographic',
			sector: 'sector',
		},
	],
	...userDetails,
} as const

export const isLoggedInData: IsLoggedInData = {
	isLoggedIn: true,
	user: { firstName: 'firstName', lastName: 'lastName', accountType: 'External', email: 'email@email.com' },
} as const

export const tritonProjects: readonly TritonProject[] = [
	{
		external_id: 'P015605',
		external_name: 'AK_StickleBack_Fish_Ext_Seq',
	},
] as const

export default {
	userDetails,
	projectUsers,
	userProjects,
	isLoggedInData,
	tritonProjects,
} as const
