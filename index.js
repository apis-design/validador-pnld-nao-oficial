import fs from "fs"
import pa11y from "pa11y"


let folder = 'teste'

const pa11yOptions = (filename) => {
	try {
		return {
			reporter: "json",
			runners: [
				//'htmlcs',
				'check-shortned-urls'
			],
			actions: [
				// `screen capture ${folder}/${filename}.png`
			]
		}
	} catch (error) {
		console.log(error)
	}
}

const createValidation = () => {
	try {
		fs.readdir('./teste', {
			encoding: 'utf-8'
		}, async (error, files) => {
			const urlList = files.map((i) => pa11y(`./${folder}/${i}`, pa11yOptions(i.split('.')[0])))
			const results = await Promise.all(urlList);
			console.log(results[0].issues)
		})
	} catch (error) {
		console.log(error)
	}
}

createValidation()