import fs from 'fs'
import path from 'path'
import pa11y from 'pa11y'
import puppeteer from 'puppeteer'
import handleFsError from './helpers/fs-validator.js'

let folderPath = `/Users/design21/Downloads/ce4bd9725c545ac9bdf70564d47e28bd`

const errosFsResult = handleFsError(folderPath)

const browser = await puppeteer.launch()

// criar verificação se todos os links dos sumarios estão indo para o href certo

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
				'../../../helpers/custom-runners/index.cjs'
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
				headless: true,
				devtools: true,
			},
			browser: browser
		}
	} catch (error) {
		console.log(error)
	}
}

const getAllFiles = (dirPath, arrayOfFiles) => {
	try {
		const files = fs.readdirSync(dirPath)

		arrayOfFiles = arrayOfFiles || []

		files.forEach((file) => {
			if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
				arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles)
			} else {
				arrayOfFiles.push(path.join(dirPath, file))
			}
		})

		return arrayOfFiles
	} catch (error) {
		console.log(error)
	}
}


const runApp = () => {
	try {
		const allFiles = getAllFiles(folderPath)
		const urlList = allFiles
			.filter(file => file.endsWith('.htm') || file.endsWith('.html'))
			.map((file) => pa11y(file, pa11yOptions(path.basename(file).split('.')[0])))

		let results = Promise.all(urlList);

		results.then((results) => {

			fs.writeFile(`results.json`, JSON.stringify([errosFsResult, ...results], null, 2), err => {
				if (err) {
					console.error(err);
				}
			})
			fs.writeFile(`results.js`, 'var testResults = ' + JSON.stringify([errosFsResult, ...results], null, 2), err => {
				if (err) {
					console.error(err);
				}
			})
			browser.close();
		})

		// console.log(JSON.stringify(results, null, 2))
	} catch (error) {
		console.log(error)
	}

}

runApp()