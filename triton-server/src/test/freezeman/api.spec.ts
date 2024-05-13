import { AuthenticatedAPI, getFreezeManAuthenticatedAPI } from '../../freezeman/api'
import type { Dataset, DatasetFile, Project, Readset } from '../../freezeman/models'
import { tritonProjects as magicProjects } from '../../../../magic-mock/data'
import { fetchToken } from '../../freezeman/authToken'

let apis: AuthenticatedAPI
beforeAll(async () => {
	const token = await fetchToken()
	apis = await getFreezeManAuthenticatedAPI(token.access)
})

describe('freezeman authenticated api test', () => {
	const HERCULES_PROJECT_ID = magicProjects[0].external_id

	// the following test assumes that a project with external_id HERCULES_PROJECT_ID exists
	it('test list project', async () => {
		const projects = (await apis.Project.list([HERCULES_PROJECT_ID])).data.results
		expect(projects.length).toBe(1)

		const [project] = projects
		expect(project).toBeDefined()
		if (project !== undefined) {
			expect(project.external_id).toBe(HERCULES_PROJECT_ID)
		}
	})

	// the following test assumes there is a dataset associated with the project named HERCULES_PROJECT_ID
	let datasets: readonly Dataset[] = []
	it('test list dataset', async () => {
		datasets = (await apis.Dataset.listByExternalProjectIds([HERCULES_PROJECT_ID])).data.results
		expect(datasets.length).toBeGreaterThan(0)
	})

	let readsets: readonly Readset[] = []
	it('test list readsets', async () => {
		const readsetsList = await Promise.all(datasets.map(async (dataset) => (await apis.Readset.listByDatasetId(dataset.id)).data.results))
		readsets = readsetsList.reduce((a, b) => [...a, ...b])
		expect(readsets.length).toBeGreaterThanOrEqual(datasets.length)
	})

	let datasetFiles: readonly DatasetFile[] = []
	it('test list dataset files', async () => {
		datasetFiles = (await apis.DatasetFile.listByReadsetIds(readsets.map((readset) => readset.id))).data.results
		expect(datasetFiles.length).toBeGreaterThanOrEqual(readsets.length)
	})
})

describe('freezeman authenticated api negative test', () => {
	const HERCULES_PROJECT_NAME = 'NON_EXISTENT_PROJECT'

	// the following test assumes that a project with external_id HERCULES_PROJECT_NAMAE exists
	it('test list non-existent project', async () => {
		const projects = (await apis.Project.list([HERCULES_PROJECT_NAME])).data.results
		expect(projects.length).toBe(0)
	})

	// the following test assumes there is a dataset associated with the project named HERCULES_PROJECT_NAME
	it('test list dataset of non-existent project', async () => {
		const datasets = (await apis.Dataset.listByExternalProjectIds([HERCULES_PROJECT_NAME])).data.results
		expect(datasets.length).toBe(0)
	})

	it.failing('test list dataset of no projects', async () => {
		await apis.Dataset.list([])
	})

	it.failing('test list dataset files of non-existent project', async () => {
		await apis.DatasetFile.listByReadsetIds([])
	})
})
