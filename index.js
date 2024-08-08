import fs from 'fs'
import path from 'path'
import pa11y from 'pa11y'

let folderPath = `/Users/clebersantana/APIS\ design\ Dropbox/PROJETOS-SERVIDOR/MODERNA\ -\ OS\ 809\ -\ PNLD\ EJA\ 2025/06\ -\ Pacotes/04\ -\ HUMANAS_VOL1/07\ -\ 07082024`

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
				'../../../custom-runners/index.cjs'
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
			}
		}
	} catch (error) {
		console.log(error)
	}
}

const getAllFiles = (dirPath, arrayOfFiles) => {
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
}

const runApp = () => {
	try {
		const allFiles = getAllFiles(folderPath)
		const urlList = allFiles
			.filter(file => file.endsWith('.htm') || file.endsWith('.html'))
			.map((file) => pa11y(file, pa11yOptions(path.basename(file).split('.')[0])))

		const results = Promise.all(urlList);

		results.then((results) => {
			fs.writeFile(`results.json`, JSON.stringify(results, null, 2), err => {
				if (err) {
					console.error(err);
				} else {
					// file written successfully
				}
			})
			fs.writeFile(`results.js`, 'var testResults = ' + JSON.stringify(results, null, 2), err => {
				if (err) {
					console.error(err);
				} else {
					// file written successfully
				}
			})
		})

		// console.log(JSON.stringify(results, null, 2))
	} catch (error) {
		console.log(error)
	}
}

runApp()