import fs from 'fs'
import path from 'path'
import pa11y from 'pa11y'
import puppeteer from 'puppeteer'
import handleFsError from './helpers/fs-validator.js'

let folderPath = `/Users/design21/Downloads/2b1187ea3ce52384b5e6bbb67d965ab4`

const errosFsResult = handleFsError(folderPath)

const browser = await puppeteer.launch()

// criar verificação se todos os links dos sumarios estão indo para o href certo

const pa11yOptions = (filename) => {
	try {
		// Translation mapping for common HTMLCS errors
		const errorTranslations = {
			// Accessibility errors
			'WCAG2AA.Principle1.Guideline1_1.1_1_1': 'Imagens devem ter texto alternativo (alt)',
			'WCAG2AA.Principle1.Guideline1_3.1_3_1': 'Tabelas devem ter cabeçalhos apropriados',
			'WCAG2AA.Principle1.Guideline1_4.1_4_3': 'Contraste de cores insuficiente',
			'WCAG2AA.Principle2.Guideline2_4.2_4_2': 'Página deve ter um título único e descritivo',
			'WCAG2AA.Principle2.Guideline2_4.2_4_4': 'Links devem ter texto descritivo',
			'WCAG2AA.Principle2.Guideline2_4.2_4_6': 'Cabeçalhos devem ser descritivos',
			'WCAG2AA.Principle3.Guideline3_2.3_2_2': 'Formulários devem ter labels apropriados',
			'WCAG2AA.Principle3.Guideline3_3.3_3_2': 'Formulários devem ter mensagens de erro claras',
			
			// Common HTML structure errors
			'WCAG2AA.Principle4.Guideline4_1.4_1_1': 'Elementos HTML inválidos ou mal formados',
			'WCAG2AA.Principle4.Guideline4_1.4_1_2': 'Elementos interativos devem ter roles ARIA apropriados',
			
			// Language and text errors
			'WCAG2AA.Principle3.Guideline3_1.3_1_1': 'Documento deve ter atributo lang definido',
			'WCAG2AA.Principle3.Guideline3_1.3_1_2': 'Mudanças de idioma devem ser marcadas',
			
			// Navigation errors
			'WCAG2AA.Principle2.Guideline2_4.2_4_1': 'Página deve ter uma estrutura de navegação clara',
			'WCAG2AA.Principle2.Guideline2_4.2_4_5': 'Múltiplas formas de navegação devem estar disponíveis'
		};

		return {
			includeNotices: true,
			includeWarnings: true,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type"
			},
			reporter: "json",
			runners: [
				'htmlcs',
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
			browser: browser,
			// Modified translation function
			beforeScript: (page) => {
				page.evaluateOnNewDocument((translations) => {
					// Wait for HTMLCS to be available
					const waitForHTMLCS = setInterval(() => {
						if (window.HTMLCS) {
							clearInterval(waitForHTMLCS);
							
							// Override the getTranslation method
							window.HTMLCS.getTranslation = function(code) {
								// Try to get the translation from our mapping
								const translation = translations[code];
								if (translation) {
									return translation;
								}
								
								// If no translation is found, try to get it from HTMLCS's default translations
								const defaultTranslation = window.HTMLCS._getTranslation(code);
								if (defaultTranslation) {
									return defaultTranslation;
								}
								
								// If no translation is found at all, return the code
								return code;
							};
							
							// Store the original getTranslation method
							window.HTMLCS._getTranslation = window.HTMLCS.getTranslation;
						}
					}, 100);
				}, errorTranslations);
			}
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