import fs from 'fs'
import pa11y from 'pa11y'

let folder = 'teste'

const pa11yOptions = (filename) => {
	try {
		return {
			includeNotices: true,
			includeWarnings: true,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type"
			},
			reporter: "json",
			runners: [
				// 'htmlcs',
				'../../../custom-runners'
			],
			actions: [
				//`screen capture ${folder}/${filename}.png`
			],
			log: {
				debug: console.log,
				error: console.error,
				info: console.info
			},
			level: 'error',
			chromeLaunchConfig: {
				headless: false,
				devtools: true,
			}
		}
	} catch (error) {
		console.log(error)
	}
}

const runApp = () => {
	try {
		fs.readdir(`./${folder}`, {
			encoding: 'utf-8'
		}, async (error, files) => {
			const urlList = files
				.filter(file => file.endsWith('.htm') || file.endsWith('.html'))
				.map((file) => pa11y(`./${folder}/${file}`, pa11yOptions(file.split('.')[0])))

			const results = await Promise.all(urlList);

			fs.writeFile(`${folder}.json`, JSON.stringify(results), {
				encoding: 'utf-8'
			}, (err) => {
				throw err
			})

			console.log(JSON.stringify(results, null, 2))
		})
	} catch (error) {
		console.log(error)
	}
}

runApp()