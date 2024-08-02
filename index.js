const fs = require("fs")
const pa11y = require("pa11y")

let folder = 'teste'

const pa11yOptions = (filename) => {
	try {
		return {
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
			}
		}
	} catch (error) {
		console.log(error)
	}
}

const runApp = () => {
	try {
		fs.readdir('./teste', {
			encoding: 'utf-8'
		}, async (error, files) => {
			const urlList = files.map((file) => pa11y(`./${folder}/${file}`, pa11yOptions(file.split('.')[0])))
			const results = await Promise.all(urlList);
			console.log(results[0].issues)
		})
	} catch (error) {
		console.log(error)
	}
}

runApp()