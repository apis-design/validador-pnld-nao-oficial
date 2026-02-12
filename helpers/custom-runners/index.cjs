'use strict';

const path = require('path');
const scriptsPath = path.resolve('helpers/custom-runners/scripts');

const runner = module.exports = {};

runner.supports = '^8.0.0 || ^8.0.0-alpha || ^8.0.0-beta';

runner.scripts = [
	`${scriptsPath}/jquery-3.7.1.slim.min.js`,
	`${scriptsPath}/chai-5.1.1.js`
];

runner.run = (options, pa11y) => {

	function runCode() {
		// Array que acumula o resultado de todos os testes
		let results = []

		/** 
		 * Executa um teste e registra ele na array results 
		 * @param {string} testDescription - 
		 * @param {function} testFunction - 
		 * */
		function testar(testDescription, testFunction) {
			let initialLength = results.length;
			let status;
			let errorMessage = null;

			try {
				testFunction()
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}

			if (results.length === initialLength) {
				results.push({
					code: testDescription,
					message: testDescription,
					type: 'notice',
					runnerExtras: {
						status: status,
						errorMessage: errorMessage,
						category: getCategory(testDescription)
					}
				});
			}
		}

		/**
		 * Determina a categoria de um teste baseado no texto
		 * @param {string} text - Texto para análise
		 * @returns {string} Categoria
		 */
		function getCategory(text) {
			const lower = text.toLowerCase();
			const categories = {
				'Glossário': ['glossario', 'glossários'],
				'Estrutura': ['estrutura', 'nav', 'navegação'],
				'IDs': ['id'],
				'Listas': ['lista'],
				'Títulos': ['titulo', 'títulos'],
				'Imagens': ['imagem'],
				'Lang': ['lang'],
				'Links': ['link'],
				'Nomenclatura': ['nomenclatura'],
				'Localizacao': ['localizacao'],
				'Conteudo': ['conteudo'],
				'Metadados': ['metadado'],
			};

			for (const [category, keywords] of Object.entries(categories)) {
				if (keywords.some(keyword => lower.includes(keyword))) {
					return category;
				}
			}
			return 'outros';
		}

		/*
		 *	Teste: Todos os assets carregaram corretamente
		 *	Descrição: Checa se imagens, scripts, arquivos CSS e outros assets foram carregados
		 *  Tentei usar o page.on, mas esse é o contexto errado pra isso. Esse método run 
		 *  é rodado dentro do browser e o page pertence ao puppeteer.
		 *  A solução é, ou desenvolver um código que faz essa checagem no browser ou
		 *  levar esse teste para o contexto do puppeteer
		 */
		// let assetsWithErrors = []
		// Escuta os eventos de request falha e response recebida
		// page.on('requestfailed', request => {
		// 	assetsWithErrors.push({
		// 			url: request.url(),
		// 			error: request.failure().errorText
		// 	});
		// });
		// testar('Todos os assets carregaram corretamente', () => { 
		// 	expect(assetsWithErrors).to.be.empty
		// })


		// - Todas as imagens tem o atributo alt
		testar('Todas as tags <img> têm atributo alt (mesmo que vazio)', () => {
			let status;
			let errorMessage = null;
			try {
				const images = $('img');
				images.each(function () {
					expect($(this).attr('alt')).to.not.be.undefined
				});
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'Todas as tags <img> têm atributo alt (mesmo que vazio)',
				message: status === 'passed' ? 'Todas as tags <img> têm atributo alt (mesmo que vazio)' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('imagem')
				}
			});
		})




		// Não funciona porque estamos no contexto errado. 
		//
		// let externalResources = [];
		// page.on('request', request => {
		// 	const url = new URL(request.url());
		// 	if (url.origin !== location.origin) {
		// 		externalResources.push(request.url());
		// 	}
		// });
		// 
		// testar('Nenhum recurso externo está sendo acessado', () => {
		// 	expect(externalResources).to.be.empty;
		// });

		// – tag HTML possui atributo lang 
		testar('tag HTML possui atributo lang', () => {
			let status;
			let errorMessage = null;
			try {
				const htmlTag = $('html');
				expect(htmlTag.attr('lang')).to.not.be.undefined
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'tag HTML possui atributo lang',
				message: status === 'passed' ? 'tag HTML possui atributo lang' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('lang')
				}
			});
		})


		// – atributo lang da tag HTML é igual a pt-BR (ou espanhol ou inglês???)
		testar('A tag HTML tem o atributo lang com um dos seguintes valores (pt-BR, es, en)', () => {
			let status;
			let errorMessage = null;
			try {
				const htmlTag = $('html');
				const valoresPermitidos = ['pt-br', 'es', 'en']
				expect(valoresPermitidos.includes(htmlTag.attr('lang').toLowerCase())).to.equal(true);
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'A tag HTML tem o atributo lang com um dos seguintes valores (pt-BR, es, en)',
				message: status === 'passed' ? 'A tag HTML tem o atributo lang com um dos seguintes valores (pt-BR, es, en)' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('lang')
				}
			});
		})


		// – tag meta viewport existe e está configurada de forma acessível
		testar('A tag meta viewport existe e está configurada de forma acessível', () => {
			let status;
			let errorMessage = null;
			try {
				const metaViewport = $('head>meta[name=viewport]');
				expect(metaViewport.length).to.equal(1);
				if (metaViewport.attr('content') !== "width=device-width, initial-scale=1.0") {
					throw new Error("Meta viewport deve ter content='width=device-width, initial-scale=1.0'");
				}
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'A tag meta viewport existe e está configurada de forma acessível',
				message: status === 'passed' ? 'A tag meta viewport existe e está configurada de forma acessível' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('metadado')
				}
			})
		})

		// – Todos os assets são locais
		testar('Todos os assets são locais', () => {
			let status;
			let errorMessage = null;
			try {
				// Verifica imagens
				$('img').each(function () {
					const src = $(this).attr('src');
					if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
						throw new Error('Imagem externa encontrada: ' + src);
					}
				});

				// Verifica scripts
				$('script').each(function () {
					const src = $(this).attr('src');
					if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
						throw new Error('Script externo encontrado: ' + src);
					}
				});

				// Verifica estilos CSS
				$('link[rel=stylesheet]').each(function () {
					const href = $(this).attr('href');
					if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
						throw new Error('CSS externo encontrado: ' + href);
					}
				});
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'Todos os assets são locais',
				message: status === 'passed' ? 'Todos os assets são locais' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('estrutura')
				}
			})
		})

		// – Não tem nenhum link <a href> apontando para fora do livro
		testar('Nenhum link <a href> aponta para fora do livro', () => {
			let status;
			let errorMessage = null;
			try {
				function listarLinksExternos() {
					let linksExternos = [];
					$('a').each(function () {
						let href = $(this).attr('href');
						if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('www'))) {
							linksExternos.push(href);
						}
					});
					return linksExternos
				}

				const result = listarLinksExternos();
				expect(result.length).to.equal(0);
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'Nenhum link <a href> aponta para fora do livro',
				message: status === 'passed' ? 'Nenhum link <a href> aponta para fora do livro' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('link')
				}
			})
		})

		// – Glossários tem link de ida e de volta
		testar('Glossários tem link de ida e de volta válidos', () => {
			function verificarIdsInternos() {
				var resultado = true;

				// Coleta todos os IDs de links de ida
				var idsDeIda = [];
				$('a[href^="#"]').each(function () {
					var id = $(this).attr('href').substring(1); // Remove o "#"
					if (id && idsDeIda.indexOf(id) === -1) {
						idsDeIda.push(id);
					}
				});

				// Verifica se cada ID é um ID de um termo no glossário
				idsDeIda.forEach(function (id) {
					if ($('#' + id).length === 0) {
						results.push({
							code: 'ID de glossário inválido',
							message: 'O ID de ida "#' + id + '" não corresponde a um termo no glossário.',
							type: 'error',
							runnerExtras: {
								status: 'not passed',
								errorMessage: 'ID de glossário inválido: ' + id,
								category: getCategory('glossario')
							}
						});
					}
				});

				return resultado;
			}

			function verificarLinksDeIdaEVoltaGlossario() {
				var idsInternosOk = verificarIdsInternos();
				var resultado = true;

				if (!idsInternosOk) {
					results.push({
						code: 'Problemas com IDs internos do glossário',
						message: 'Há problemas com alguns IDs internos.',
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'IDs internos do glossário inválidos',
							category: getCategory('glossario')
						}
					});
					return;
				}

				// Itera sobre cada link na página principal
				$('a[href^="#"]').each(function () {
					var linkIda = $(this).attr('href');
					var linkIdaId = $(this).attr('id');
					var termoId = linkIda.substring(1); // Remove o "#"
					var termo = $('#' + termoId);

					// Verifica se o termo existe no glossário
					if (termo.length === 0) {
						results.push({
							code: 'Link de ida inválido no glossário',
							message: 'O link de ida "' + linkIda + '" não leva a um termo existente.',
							type: 'error',
							runnerExtras: {
								status: 'not passed',
								errorMessage: 'Link de ida inválido: ' + linkIda,
								category: getCategory('glossario')
							}
						});
						resultado = false;
						return; // Encerra a iteração atual
					}

					// Verifica se o link de volta dentro do termo é correto
					var linkVolta = termo.next('dd').find('a');
					var linkVoltaId = linkVolta.attr('href');

					if (linkVoltaId === linkIdaId) {
						results.push({
							code: 'Link de volta correto no glossário',
							message: 'O link de volta dentro do termo "' + termoId + '" está correto.',
							type: 'notice',
							runnerExtras: {
								status: 'passed',
								info: 'Link de volta válido',
								category: getCategory('glossario')
							}
						});
						resultado = true;
					}
				});

				return resultado
			}

			const result = verificarLinksDeIdaEVoltaGlossario();
			expect(result).to.equal(true);
		})

		// – Glossários tem a formatação correta (dt, dl, dd)
		testar('Glossários tem a formatação correta (dt, dl, dd)', () => {
			function verificarGlossario() {
				let valido = true;

				$('dl').each(function () {
					let $dl = $(this);
					let termos = $dl.find('dt');
					let definicoes = $dl.find('dd');

					if (termos.length === 0 || definicoes.length === 0) {
						results.push({
							code: 'Glossário vazio ou incompleto',
							message: 'Erro: O elemento <dl> está vazio ou não contém <dt> e <dd>.',
							type: 'error',
							runnerExtras: {
								status: 'not passed',
								errorMessage: 'Glossário vazio ou sem termos/definições',
								category: getCategory('glossario')
							}
						});
						valido = false;
						return;
					}

					if (termos.length !== definicoes.length) {
						results.push({
							code: 'Número de termos e definições não correspondem',
							message: 'Erro: O número de <dt> não corresponde ao número de <dd>.',
							type: 'error',
							runnerExtras: {
								status: 'not passed',
								errorMessage: 'Número de dt e dd diferentes',
								category: getCategory('glossario')
							}
						});
						valido = false;
					}

					termos.each(function (index) {
						let $dt = $(this);
						let $dd = definicoes.eq(index);

						if (!$dd.length || $dd.prev().get(0) !== $dt.get(0)) {
							results.push({
								code: 'Estrutura de glossário inválida',
								message: 'Erro: O elemento <dt> não tem uma <dd> correspondente imediatamente após.',
								type: 'error',
								runnerExtras: {
									status: 'not passed',
									errorMessage: 'dt sem dd correspondente',
									category: getCategory('glossario')
								}
							});
							valido = false;
							return false; // Interrompe o loop se houver um erro
						}
					});
				});

				return valido
			}

			const result = verificarGlossario();
			expect(result).to.equal(true);

		})

		// – Não tem IDs duplicados
		testar('Não há IDs duplicados na página', () => {
			function verificarIdsDuplicados() {
				var ids = [];
				var duplicates = [];

				$('[id]').each(function () {
					var id = $(this).attr('id');
					if (ids.indexOf(id) === -1) {
						ids.push(id);
					} else if (duplicates.indexOf(id) === -1) {
						duplicates.push(id);
					}
				});
				return duplicates
			}
			const result = verificarIdsDuplicados();

			if (result.length > 0) {
				result.forEach(duplicates => {
					results.push({
						code: 'ID duplicado encontrado: ' + duplicates,
						message: 'ID duplicado encontrado: ' + duplicates,
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'ID duplicado: ' + duplicates,
							category: getCategory('id')
						}
					});
				})
			} else {
				expect(result.length).to.equal(0);
			}

		});

		// – lista de um item
		testar('Não tem listas com somente um item', () => {
			const invalidLists = $('ul, ol').filter(function () {
				return $(this).children('li').length === 1;
			});
			const count = invalidLists.length;
			if (count > 0) {
				invalidLists.each(function () {
					const listHtml = $(this).prop('outerHTML');
					results.push({
						code: 'Lista com somente um item',
						message: 'Encontrada lista com somente um item: ' + listHtml.substring(0, 100) + '...',
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'Lista com um item encontrado',
							category: getCategory('lista')
						}
					});
				});
			} else {
				expect(count).to.equal(0);
			}
		})

		// – salto hierárquico
		testar('O documento não contém salto hierárquico de títulos', () => {
			function checkHeadingHierarchy() {
				const errors = [];
				const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

				let lastLevel = 0;

				headings.forEach(heading => {
					const currentLevel = parseInt(heading.tagName.substring(1));

					if (currentLevel > lastLevel + 1) {
						errors.push({
							element: heading,
							expectedLevel: lastLevel + 1,
							currentLevel: currentLevel
						});
					}

					lastLevel = currentLevel;
				});

				return errors;
			}

			const errors = checkHeadingHierarchy();

			if (errors.length > 0) {
				errors.forEach(error => {
					results.push({
						code: 'Salto hierárquico de títulos',
						message: 'Saltos hierárquicos encontrados:' + `Esperado: ${error.expectedLevel}, Encontrado: ${error.currentLevel} em ${error.element.outerHTML}`,
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'Saltos hierárquicos encontrados.',
							category: getCategory('titulo')
						}
					});
				})
			} else {
				expect(errors.length).to.equal(0);
			}
		});

		// – Separador de página (n sei bem como testar ele pq o edital não exige uma markup muito específica)
		//      Tem que ler a spec do PNLD, entender como deve ser a section
		// 

		// Esses testes tem que ocorrer no index.html
		// 5.8 Criação da página principal 
		// 		5.8.1 Doctype
		// Todo arquivo HTML deverá iniciar com a tag DOCTYPE de acordo com a tecnologia escolhida, o HTML5, conforme exemplificado no item 4.1.
		testar('tag DOCTYPE de acordo com a tecnologia escolhida', () => {
			var hasDoctype = document.doctype !== null;
			if (!hasDoctype) {
				results.push({
					code: 'tag DOCTYPE de acordo com a tecnologia escolhida',
					message: 'DOCTYPE não encontrado',
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'DOCTYPE não encontrado.',
						category: getCategory('estrutura')
					}
				});
			} else {
				var doctypeString = '<!DOCTYPE ' + document.doctype.name + '>';
				if (doctypeString === '<!DOCTYPE html>') {
					results.push({
						code: 'tag DOCTYPE de acordo com a tecnologia escolhida',
						message: 'DOCTYPE correto.',
						type: 'notice',
						runnerExtras: {
							status: 'passed',
							errorMessage: null,
							category: getCategory('estrutura')
						}
					});
				} else {
					results.push({
						code: 'tag DOCTYPE de acordo com a tecnologia escolhida',
						message: 'DOCTYPE incorreto: ' + doctypeString,
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'DOCTYPE incorreto.',
							category: getCategory('estrutura')
						}
					});
				}
			}
		});
		// 		5.8.2 Head
		// Na página inicial é obrigatório a inclusão da tag <head> com alguns metadados.
		testar('Tag Head incluída na página', () => {
			const tagHead = $('head');
			if (tagHead.length === 1) {
				results.push({
					code: 'Tag Head incluída na página',
					message: 'Tag <head> presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('estrutura')
					}
				});
			} else {
				results.push({
					code: 'Tag Head incluída na página',
					message: `Esperado 1 tag <head>, encontrado ${tagHead.length}.`,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Número incorreto de tags <head>.',
						category: getCategory('estrutura')
					}
				});
			}
		});
		// - Definir o charset de todos os arquivos para "UTF-8"
		testar('Tag meta charset presente e com valor UTF-8', () => {
			const metaCharset = $('head>meta[charset]');
			if (metaCharset.length === 1 && metaCharset.attr('charset') === 'UTF-8') {
				results.push({
					code: 'Tag meta charset presente e com valor UTF-8',
					message: 'Meta charset UTF-8 presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
			} else {
				let message = 'Meta charset UTF-8 não encontrado corretamente.';
				if (metaCharset.length !== 1) {
					message += ` Encontrado ${metaCharset.length} meta[charset].`;
				} else if (metaCharset.attr('charset') !== 'UTF-8') {
					message += ` Valor encontrado: ${metaCharset.attr('charset')}.`;
				}
				results.push({
					code: 'Tag meta charset presente e com valor UTF-8',
					message: message,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Meta charset incorreto.',
						category: getCategory('metadado')
					}
				});
			}
		});
		// - Definir o titulo da obra
		testar('Titulo da obra presente e com valor', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'Titulo da obra presente e com valor',
					message: 'Título não obrigatório para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('titulo')
					}
				});
				return;
			}

			const tituloObra = $('head>title');
			if (tituloObra.length === 1 && tituloObra.text().trim() !== '') {
				results.push({
					code: 'Titulo da obra presente e com valor',
					message: 'Título da obra presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('titulo')
					}
				});
			} else {
				let message = 'Título da obra não encontrado ou vazio.';
				if (tituloObra.length !== 1) {
					message += ` Encontrado ${tituloObra.length} tags <title>.`;
				} else if (tituloObra.text().trim() === '') {
					message += ' Título vazio.';
				}
				results.push({
					code: 'Titulo da obra presente e com valor',
					message: message,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Título da obra ausente ou inválido.',
						category: getCategory('titulo')
					}
				});
			}
		});
		// - Incluir um metadado para a descrição da obra
		testar('Metadado com a descrição da obra presente e com valor', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'Metadado com a descrição da obra presente e com valor',
					message: 'Metadado não obrigatório para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
				return;
			}
			const metaDescription = $('head>meta[name=description]');
			if (metaDescription.length === 1 && metaDescription.attr('content') !== undefined) {
				results.push({
					code: 'Metadado com a descrição da obra presente e com valor',
					message: 'Meta description presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
			} else {
				let message = 'Meta description não encontrado ou sem valor.';
				if (metaDescription.length !== 1) {
					message += ` Encontrado ${metaDescription.length} meta[name=description].`;
				} else if (metaDescription.attr('content') === undefined) {
					message += ' Atributo content ausente.';
				}
				results.push({
					code: 'Metadado com a descrição da obra presente e com valor',
					message: message,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Meta description inválido.',
						category: getCategory('metadado')
					}
				});
			}
		});
		// - Incluir metadado autor
		testar('Metadado com nome do autor presente e com valor', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'Metadado com nome do autor presente e com valor',
					message: 'Metadado não obrigatório para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
				return;
			}
			const metaAuthor = $('head>meta[name=author]');
			if (metaAuthor.length === 1 && metaAuthor.attr('content') !== undefined) {
				results.push({
					code: 'Metadado com nome do autor presente e com valor',
					message: 'Meta author presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
			} else {
				let message = 'Meta author não encontrado ou sem valor.';
				if (metaAuthor.length !== 1) {
					message += ` Encontrado ${metaAuthor.length} meta[name=author].`;
				} else if (metaAuthor.attr('content') === undefined) {
					message += ' Atributo content ausente.';
				}
				results.push({
					code: 'Metadado com nome do autor presente e com valor',
					message: message,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Meta author inválido.',
						category: getCategory('metadado')
					}
				});
			}
		});
		// - Incluir metadados para desabilitar a indexação do conteúdo da obra por motores de busca.
		testar('Metadado que desabilita indexação do conteúdo da obra por motores de busca.', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'Metadado que desabilita indexação do conteúdo da obra por motores de busca.',
					message: 'Metadado não obrigatório para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
				return;
			}
			const metaRobots = $('head>meta[name=robots]');
			if (metaRobots.length === 1 && metaRobots.attr('content') !== undefined) {
				results.push({
					code: 'Metadado que desabilita indexação do conteúdo da obra por motores de busca.',
					message: 'Meta robots presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('metadado')
					}
				});
			} else {
				let message = 'Meta robots não encontrado ou sem valor.';
				if (metaRobots.length !== 1) {
					message += ` Encontrado ${metaRobots.length} meta[name=robots].`;
				} else if (metaRobots.attr('content') === undefined) {
					message += ' Atributo content ausente.';
				}
				results.push({
					code: 'Metadado que desabilita indexação do conteúdo da obra por motores de busca.',
					message: message,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Meta robots inválido.',
						category: getCategory('metadado')
					}
				});
			}
		});

		// 		5.8.3 Body
		// No corpo da página principal é obrigatório a inclusão da tag <body> adicionando as suas propriedades o idioma apresentado.
		testar('Tag Body incluida na página', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'Tag Body incluida na página',
					message: 'Tag body não obrigatória para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('estrutura')
					}
				});
				return;
			}
			const bodyTag = $('body');
			if (bodyTag.length === 1) {
				results.push({
					code: 'Tag Body incluida na página',
					message: 'Tag <body> presente.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('estrutura')
					}
				});
			} else {
				results.push({
					code: 'Tag Body incluida na página',
					message: `Esperado 1 tag <body>, encontrado ${bodyTag.length}.`,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Número incorreto de tags <body>.',
						category: getCategory('estrutura')
					}
				});
			}
		});

		// – tag BODY possui atributo lang 
		testar('tag BODY possui atributo lang', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'tag BODY possui atributo lang',
					message: 'Atributo lang não obrigatório para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('lang')
					}
				});
				return;
			}
			const bodyTag = $('body');
			if (bodyTag.attr('lang') !== undefined) {
				results.push({
					code: 'tag BODY possui atributo lang',
					message: 'Tag <body> possui atributo lang.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('lang')
					}
				});
			} else {
				results.push({
					code: 'tag BODY possui atributo lang',
					message: 'Tag <body> não possui atributo lang.',
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Atributo lang ausente na tag <body>.',
						category: getCategory('lang')
					}
				});
			}
		});

		// – atributo lang da tag BODY é igual a pt-BR (ou espanhol ou inglês???)
		testar('A tag BODY tem o atributo lang com um dos seguintes valores (pt-BR, es, en)', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				results.push({
					code: 'A tag BODY tem o atributo lang com um dos seguintes valores (pt-BR, es, en)',
					message: 'Atributo lang não obrigatório para index.html raiz.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('lang')
					}
				});
				return;
			}
			const bodyTag = $('body');
			const lang = bodyTag.attr('lang');
			const valoresPermitidos = ['pt-br', 'es', 'en'];
			if (lang && valoresPermitidos.includes(lang.toLowerCase())) {
				results.push({
					code: 'A tag BODY tem o atributo lang com um dos seguintes valores (pt-BR, es, en)',
					message: 'Tag <body> possui atributo lang válido.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						errorMessage: null,
						category: getCategory('lang')
					}
				});
			} else {
				let message = 'Tag <body> não possui atributo lang válido.';
				if (!lang) {
					message += ' Atributo lang ausente.';
				} else {
					message += ` Valor encontrado: ${lang}. Valores permitidos: pt-BR, es, en.`;
				}
				results.push({
					code: 'A tag BODY tem o atributo lang com um dos seguintes valores (pt-BR, es, en)',
					message: message,
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Atributo lang inválido na tag <body>.',
						category: getCategory('lang')
					}
				});
			}
		});

		// Após abrir a tag <body>, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os dados da obra e seus recursos de acessibilidade uQlizados, seguindo a especificação disposta em https://schema.org/Book.
		testar('Após abrir a tag <body> do index.html, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os dados da obra e seus recursos de acessibilidade uQlizados, seguindo a especificação disposta em https://schema.org/Book.', () => {
			// Verifica se é o index.html da raiz
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html';

			if (!isRootIndex || filename === 'index.html' && pathname.includes('content')) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}


			let valido = false

			// Seleciona o primeiro filho do body
			const primeiroFilho = $('body').children().first();

			// Verifica se ele é um div com os atributos corretos
			if (primeiroFilho.is('div[itemscope][itemtype="https://schema.org/Book"]')) {
				// Verifica se contém as meta tags necessárias
				const metaTagsCount = primeiroFilho.find('meta[itemprop="accessibilityFeature"]').length +
					primeiroFilho.find('meta[itemprop="accessibilityControl"]').length +
					primeiroFilho.find('meta[itemprop="name"]').length +
					primeiroFilho.find('meta[itemprop="description"]').length +
					primeiroFilho.find('meta[itemprop="isbn"]').length +
					primeiroFilho.find('meta[itemprop="copyrightYear"]').length +
					primeiroFilho.find('meta[itemprop="publisher"]').length;

				// Se todas as meta tags necessárias estão presentes
				if (metaTagsCount >= 8) { // Total de 8 meta tags esperadas
					results.push({
						code: 'Estrutura Book válida no index.html',
						message: "O primeiro filho do body possui a estrutura desejada.",
						type: 'notice',
						runnerExtras: {
							status: 'passed',
							info: 'Estrutura Book correta',
							category: getCategory('estrutura')
						}
					});
					valido = true
				} else {
					results.push({
						code: 'Estrutura Book incompleta no index.html',
						message: "O primeiro filho do body não contém todas as meta tags necessárias.",
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'Meta tags faltando na estrutura Book',
							category: getCategory('estrutura')
						}
					});
					valido = false
				}
			} else {
				results.push({
					code: 'Primeiro filho do body inválido no index.html',
					message: "O primeiro filho do body não é um div do tipo Book.",
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Primeiro filho não é div itemscope itemtype Book',
						category: getCategory('estrutura')
					}
				});
				valido = false
			}

			expect(valido).to.equal(true);
		});

		// Após abrir a tag <body>, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os recursos de acessibilidade uQlizados na construção desta página em específico, seguindo a especificação disposta em h]ps://schema.org/Book.
		testar('Após abrir a tag <body> das páginas que não são o index.html, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os recursos de acessibilidade utilizados na construção desta página em específico, seguindo a especificação disposta em https://schema.org/Book.', () => {
			// Verifica se é o index.html da raiz
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html';


			if (isRootIndex || filename === 'index.html' && pathname.includes('content')) {
				// Se for o index.html da raiz, o teste passa automaticamente
				return;
			}

			// Verifica se o primeiro filho da tag <body> tem a estrutura correta
			let valido = false
			const firstBodyChild = $('body').children().first();
			const isFirstChildValid = firstBodyChild.is('div[itemscope][itemtype="https://schema.org/Book"]')
				&& firstBodyChild.find('meta[itemprop="accessibilityFeature"]').length === 2
				&& firstBodyChild.find('meta[itemprop="accessibilityControl"]').length === 1;

			if (isFirstChildValid) {
				results.push({
					code: 'Estrutura Book válida na página de conteúdo',
					message: 'O primeiro filho da tag <body> tem a estrutura correta.',
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						info: 'Estrutura Book correta na página de conteúdo',
						category: getCategory('estrutura')
					}
				});
				valido = true
			} else {
				results.push({
					code: 'Estrutura Book inválida na página de conteúdo',
					message: 'O primeiro filho da tag <body> não tem a estrutura correta.',
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Estrutura Book incorreta na página de conteúdo',
						category: getCategory('estrutura')
					}
				});
				valido = false
			}

			expect(valido).to.equal(true);
		})


		// Finalizando a tag <body> deverá ser adicionado uma tag <nav> com a propriedade id com o valor setado para toc e sua role para doc-toc, seguindo para a construção do índice de navegação da obra.<nav role="doc-toc" id="toc">
		testar('Finalizando a tag <body> do index.html deverá ser adicionado uma tag <nav> com a propriedade id com o valor setado para toc e sua role para doc-toc, seguindo para a construção do índice de navegação da obra.<nav role="doc-toc" id="toc">', () => {
			// Verifica se é o index.html da raiz
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html';

			if (!isRootIndex || filename === 'index.html' && pathname.includes('content')) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}

			let status;
			let errorMessage = null;
			try {
				const bodyTag = $('body');
				const navTag = $(bodyTag).find('nav')
				if (navTag.attr('role') !== "doc-toc") {
					throw new Error("O nav de índice deve ter role='doc-toc'");
				}
				if (navTag.attr('id') !== "toc") {
					throw new Error("O nav de índice deve ter id='toc'");
				}
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'Finalizando a tag <body> do index.html deverá ser adicionado uma tag <nav> com a propriedade id com o valor setado para toc e sua role para doc-toc, seguindo para a construção do índice de navegação da obra.<nav role="doc-toc" id="toc">',
				message: status === 'passed' ? 'Finalizando a tag <body> do index.html deverá ser adicionado uma tag <nav> com a propriedade id com o valor setado para toc e sua role para doc-toc, seguindo para a construção do índice de navegação da obra.<nav role="doc-toc" id="toc">' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('estrutura')
				}
			})
		});

		// O índice de navegação (nav#toc) não deve conter &nbsp;
		testar('O índice de navegação (nav#toc) não deve conter &nbsp;', () => {

			// Verifica se é o index.html da raiz
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html';

			if (!isRootIndex || filename === 'index.html' && pathname.includes('content')) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}

			let status;
			let errorMessage = null;
			try {
				const navToc = $('#toc');
				if (navToc.length === 0) {
					throw new Error("Nav #toc não encontrado");
				}
				const navTocHtml = navToc.html();

				// Verifica se o HTML do nav contém &nbsp; em qualquer formato
				const hasNbsp = navTocHtml && (
					navTocHtml.includes('&nbsp;') ||
					navTocHtml.includes('&#160;') ||
					navTocHtml.includes('\u00A0')
				);

				if (hasNbsp) {
					throw new Error("O nav #toc contém &nbsp;");
				}
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'O índice de navegação (nav#toc) não deve conter &nbsp;',
				message: status === 'passed' ? 'O índice de navegação (nav#toc) não deve conter &nbsp;' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('estrutura')
				}
			})
		});

		// Verifica presença de &nbsp; nos títulos (h1-h6)
		testar('Os títulos (h1-h6) não devem conter &nbsp;', () => {
			const headings = $('h1, h2, h3, h4, h5, h6');
			const headingsWithNbsp = [];

			headings.each(function () {
				const heading = $(this);
				const headingHtml = heading.html();

				// Verifica se o HTML do título contém &nbsp; em qualquer formato
				if (headingHtml && (
					headingHtml.includes('&nbsp;') ||
					headingHtml.includes('&#160;') ||
					headingHtml.includes('\u00A0')
				)) {
					headingsWithNbsp.push({
						tag: this.tagName.toLowerCase(),
						content: heading.text(),
						html: heading.prop('outerHTML')
					});
				}
			});

			if (headingsWithNbsp.length > 0) {
				headingsWithNbsp.forEach(heading => {
					results.push({
						code: 'Título com &nbsp;',
						message: `${heading.tag} contém &nbsp;: "${heading.content}"`,
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: `Encontrado &nbsp; no elemento: ${heading.html}`,
							category: getCategory('titulo')
						}
					});
				});
			}

			expect(headingsWithNbsp.length).to.equal(0);
		});

		// 5.9 Criação dos arquivos de conteúdo
		// O arquivo deverá ser criado na pasta de conteúdo do projeto (content), conforme modelo exemplo no item 5.1, seguindo o padrão de nomenclatura disposto no item 5.2.2, de acordo com a tecnologia escolhida, o HTML5, conforme exemplificado no item 4.1.
		// Todas as páginas deverão seguir as especificações técnicas descritas de acordo com a tecnologia escolhida, conforme links disponibilizados no item 4.1.

		// 5.9.1 Doctype
		// Todo arquivo HTML deverá iniciar com a tag DOCTYPE de acordo com a tecnologia escolhida, o HTML5, conforme exemplificado no item 4.1.

		// 5.9.2 Head
		// Na página de conteúdo é obrigatório a inclusão da tag <head> com alguns metadados.
		// - Definir o charset de todos os arquivos para "UTF-8"
		// - Definir o vtulo da obra 
		// - Incluir metadados para desabilitar a indexação do conteúdo da obra por motores de busca.

		// 5.9.3 Body
		// No corpo da página é obrigatório a inclusão da tag <body> adicionando as suas propriedades o idioma apresentado. 


		// Todo o conteúdo da obra a ser apresentado nesse arquivo deverá estar envolto de uma tag <main>.
		testar('Todo o conteúdo da obra a ser apresentado nesse arquivo deverá estar envolto de uma tag <main>', () => {

			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}

			let valido = false
			const mainTag = $('main');
			const isMainPresent = mainTag.length > 0;

			if (!isMainPresent) {
				results.push({
					code: 'Tag <main> ausente',
					message: 'A tag <main> está ausente na página.',
					type: 'error',
					runnerExtras: {
						status: 'not passed',
						errorMessage: 'Tag main obrigatória não encontrada',
						category: getCategory('estrutura')
					}
				});
				valido = false
			} else {
				// 3. Verifica se todo o conteúdo, exceto o primeiro filho da <body>, está dentro da <main>
				const bodyChildren = $('body').children();
				const firstBodyChild = $('body').children().first();
				const otherBodyContents = bodyChildren.not(firstBodyChild).not('main').find('*');

				const allContentInsideMain = otherBodyContents.length === 0;

				if (allContentInsideMain) {
					results.push({
						code: 'Conteúdo dentro de <main>',
						message: 'Todo o conteúdo, exceto o primeiro filho da tag <body>, está dentro da tag <main>.',
						type: 'notice',
						runnerExtras: {
							status: 'passed',
							info: 'Conteúdo corretamente envolto em main',
							category: getCategory('estrutura')
						}
					});
					valido = true
				} else {
					results.push({
						code: 'Conteúdo fora de <main>',
						message: 'Há conteúdo fora da tag <main>, além do primeiro filho da <body>.',
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: 'Conteúdo não envolto em main',
							category: getCategory('estrutura')
						}
					});
					valido = false
				}
			}
			expect(valido).to.equal(true);
		})

		testar('O arquivo toc.ncx está estruturado corretamente', () => {
			let status;
			let errorMessage = null;
			try {
				function verificarTocNcx() {
					// Verifica se é o arquivo toc.ncx
					const pathname = window.location.pathname;
					if (!pathname.endsWith('toc.ncx')) {
						return true; // Ignora o teste se não for o toc.ncx
					}

					const parser = new DOMParser();
					const xmlDoc = parser.parseFromString(document.documentElement.outerHTML, "text/xml");

					// Verifica se houve erro no parsing
					if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
						throw new Error("XML inválido");
					}

					// Verifica elementos obrigatórios
					const ncx = xmlDoc.getElementsByTagName("ncx")[0];
					if (!ncx || ncx.getAttribute("version") !== "2005-1") {
						throw new Error("Elemento ncx ausente ou versão incorreta");
					}

					// Verifica head e metadados obrigatórios
					const head = xmlDoc.getElementsByTagName("head")[0];
					if (!head) {
						throw new Error("Elemento head ausente");
					}

					const metaUids = Array.from(head.getElementsByTagName("meta")).filter(
						meta => meta.getAttribute("name") === "dtb:uid"
					);
					if (metaUids.length === 0) {
						throw new Error("Meta dtb:uid ausente");
					}

					// Verifica docTitle
					const docTitle = xmlDoc.getElementsByTagName("docTitle")[0];
					if (!docTitle || !docTitle.getElementsByTagName("text")[0]) {
						throw new Error("docTitle ausente ou sem elemento text");
					}

					// Verifica navMap
					const navMap = xmlDoc.getElementsByTagName("navMap")[0];
					if (!navMap) {
						throw new Error("navMap ausente");
					}

					// Verifica se há pelo menos um navPoint
					const navPoints = navMap.getElementsByTagName("navPoint");
					if (navPoints.length === 0) {
						throw new Error("Nenhum navPoint encontrado");
					}

					// Verifica estrutura de cada navPoint
					for (const navPoint of navPoints) {
						if (!navPoint.getAttribute("id")) {
							throw new Error("navPoint sem atributo id");
						}
						if (!navPoint.getAttribute("playOrder")) {
							throw new Error("navPoint sem atributo playOrder");
						}

						const navLabel = navPoint.getElementsByTagName("navLabel")[0];
						const text = navLabel?.getElementsByTagName("text")[0];
						if (!navLabel || !text || !text.textContent.trim()) {
							throw new Error("navPoint sem navLabel ou text válido");
						}

						const content = navPoint.getElementsByTagName("content")[0];
						if (!content || !content.getAttribute("src")) {
							throw new Error("navPoint sem content ou src válido");
						}
					}

					return true;
				}

				expect(verificarTocNcx()).to.equal(true);
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'O arquivo toc.ncx está estruturado corretamente',
				message: status === 'passed' ? 'O arquivo toc.ncx está estruturado corretamente' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('estrutura')
				}
			})
		});


		testar('O arquivo content.opf está estruturado corretamente', () => {
			function verificarContentOpf() {
				// Verifica se é o arquivo content.opf
				const pathname = window.location.pathname;
				if (!pathname.endsWith('content.opf')) {
					return true; // Ignora o teste se não for o content.opf
				}

				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(document.documentElement.outerHTML, "text/xml");

				// Verifica se houve erro no parsing
				if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
					throw new Error("XML inválido");
				}

				// Verifica elemento package
				const _package = xmlDoc.getElementsByTagName("package")[0];
				if (!_package || !_package.getAttribute("version") || !_package.getAttribute("unique-identifier")) {
					throw new Error("Elemento package ausente ou atributos obrigatórios faltando");
				}

				// Verifica metadata
				const metadata = _package.getElementsByTagName("metadata")[0];
				if (!metadata) {
					throw new Error("Elemento metadata ausente");
				}

				// Verifica elementos obrigatórios do metadata
				const requiredMetadata = [
					"dc:title",
					"dc:creator",
					"dc:identifier",
					"dc:language",
					"dc:publisher",
					"dc:rights"
				];

				for (const metaName of requiredMetadata) {
					const elements = metadata.getElementsByTagName(metaName);
					if (elements.length === 0) {
						throw new Error(`Metadado obrigatório ${metaName} ausente`);
					}
				}

				// Verifica manifest
				const manifest = _package.getElementsByTagName("manifest")[0];
				if (!manifest) {
					throw new Error("Elemento manifest ausente");
				}

				// Verifica items do manifest
				const items = manifest.getElementsByTagName("item");
				if (items.length === 0) {
					throw new Error("Manifest não contém items");
				}

				// Verifica se cada item tem os atributos obrigatórios
				for (const item of items) {
					if (!item.getAttribute("id") ||
						!item.getAttribute("href") ||
						!item.getAttribute("media-type")) {
						throw new Error("Item do manifest com atributos obrigatórios faltando");
					}

					// Verifica se o arquivo referenciado existe
					const href = item.getAttribute("href");
					// Note: A verificação real da existência do arquivo precisaria ser feita
					// em um contexto onde temos acesso ao sistema de arquivos
				}

				// Verifica spine
				const spine = _package.getElementsByTagName("spine")[0];
				if (!spine) {
					throw new Error("Elemento spine ausente");
				}

				// Verifica itemrefs do spine
				const itemrefs = spine.getElementsByTagName("itemref");
				if (itemrefs.length === 0) {
					throw new Error("Spine não contém itemrefs");
				}

				// Verifica se cada itemref referencia um item válido do manifest
				const manifestIds = Array.from(items).map(item => item.getAttribute("id"));
				for (const itemref of itemrefs) {
					const idref = itemref.getAttribute("idref");
					if (!idref || !manifestIds.includes(idref)) {
						throw new Error("Itemref inválido ou referenciando item inexistente no manifest");
					}
				}

				return true;
			}

			expect(verificarContentOpf()).to.equal(true);
		});

		// Teste para extrair e listar todos os IDs do toc.ncx (apenas para registro)
		testar('Coletar IDs do arquivo toc.ncx para verificação posterior', () => {
			function coletarIdsTocNcx() {
				// Verifica se é o arquivo toc.ncx
				const pathname = window.location.pathname;
				if (!pathname.endsWith('toc.ncx')) {
					return { ids: [], totalIds: 0, isValidToc: false };
				}

				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(document.documentElement.outerHTML, "text/xml");

				// Verifica se houve erro no parsing
				if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
					return { ids: [], totalIds: 0, isValidToc: false, error: "XML inválido" };
				}

				// Coleta todos os navPoints e seus links
				const navPoints = xmlDoc.getElementsByTagName("navPoint");
				const idsMapeados = [];
				const linksArquivos = [];

				for (const navPoint of navPoints) {
					const content = navPoint.getElementsByTagName("content")[0];
					if (content) {
						const src = content.getAttribute("src");
						if (src) {
							// Separa o arquivo do ID (se houver âncora)
							let arquivo = src;
							let targetId = null;

							if (src.includes('#')) {
								const partes = src.split('#');
								arquivo = partes[0];
								targetId = partes[1];
							}

							const linkInfo = {
								src: src,
								arquivo: arquivo,
								targetId: targetId,
								navPointId: navPoint.getAttribute("id"),
								playOrder: navPoint.getAttribute("playOrder"),
								label: navPoint.getElementsByTagName("text")[0]?.textContent || "Sem label"
							};

							idsMapeados.push(linkInfo);
							linksArquivos.push(arquivo);
						}
					}
				}

				// Remove duplicatas de arquivos
				const arquivosUnicos = [...new Set(linksArquivos)];

				return {
					ids: idsMapeados,
					totalIds: idsMapeados.length,
					arquivosReferenciados: arquivosUnicos,
					totalArquivos: arquivosUnicos.length,
					isValidToc: true
				};
			}

			const dadosToc = coletarIdsTocNcx();

			// Registra os dados coletados
			if (dadosToc.isValidToc) {
				// Armazena os dados no window para uso posterior
				window.tocNcxData = dadosToc;

				results.push({
					code: 'IDs coletados do toc.ncx',
					message: `Coletados ${dadosToc.totalIds} links do toc.ncx referenciando ${dadosToc.totalArquivos} arquivos`,
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						tocData: dadosToc,
						category: getCategory('id')
					}
				});
			}

			// O teste sempre passa, pois estamos apenas coletando dados
			expect(true).to.equal(true);
		});

		testar('Links dentro de elementos nav têm atributos href válidos e com IDs específicos', () => {
			function verificarLinksNav() {
				let linksInvalidos = [];

				// Verifica todos os links dentro de elementos nav
				$('nav a').each(function () {
					const $link = $(this);
					const href = $link.attr('href');

					// Verifica se o href está undefined, vazio
					if (href === undefined || href.trim() === '') {
						linksInvalidos.push({
							elemento: $link.prop('outerHTML'),
							href: href,
							razao: 'href undefined ou vazio'
						});
						return; // continua para o próximo link
					}

					// Verifica se é apenas "#" ou termina com "#"
					if (href === '#' || href.endsWith('#')) {
						linksInvalidos.push({
							elemento: $link.prop('outerHTML'),
							href: href,
							razao: 'href termina com # sem ID específico'
						});
						return; // continua para o próximo link
					}

					// Se contém #, verifica se tem um ID após ele
					if (href.includes('#')) {
						const partes = href.split('#');
						if (partes[1].trim() === '') {
							linksInvalidos.push({
								elemento: $link.prop('outerHTML'),
								href: href,
								razao: 'href contém # mas não especifica um ID'
							});
						}
					}
				});

				return linksInvalidos;
			}

			const linksInvalidos = verificarLinksNav();

			if (linksInvalidos.length > 0) {
				linksInvalidos.forEach(link => {
					results.push({
						code: 'Link inválido em nav',
						message: `Link com href inválido encontrado: ${link.elemento}. Razão: ${link.razao}`,
						type: 'error',

						runnerExtras: {
							status: 'not passed',
							errorMessage: `href inválido: ${link.href}. Razão: ${link.razao}`,
							category: getCategory('link')
						}
					});
				});
			}

			expect(linksInvalidos.length).to.equal(0);
		});

		testar('Registrar todos os atributos lang encontrados nas páginas', () => {
			function registrarLangs() {
				let langsEncontrados = {
					html: [],
					body: [],
					elementos: [],
					total: 0  // Added total counter
				};

				// Registra lang do HTML
				const htmlLang = $('html').attr('lang');
				if (htmlLang) {
					langsEncontrados.html.push({
						valor: htmlLang,
						arquivo: window.location.pathname
					});
					langsEncontrados.total++;  // Increment counter
				}

				// Registra lang do BODY
				const bodyLang = $('body').attr('lang');
				if (bodyLang) {
					langsEncontrados.body.push({
						valor: bodyLang,
						arquivo: window.location.pathname
					});
					langsEncontrados.total++;  // Increment counter
				}

				// Registra lang de outros elementos
				$('[lang]').each(function () {
					const $elemento = $(this);
					if (!$elemento.is('html, body')) {
						langsEncontrados.elementos.push({
							elemento: this.tagName.toLowerCase(),
							valor: $elemento.attr('lang'),
							arquivo: window.location.pathname,
							html: $elemento.prop('outerHTML')
						});
						langsEncontrados.total++;  // Increment counter
					}
				});

				return langsEncontrados;
			}

			const langs = registrarLangs();

			// Registra os resultados encontrados em um único objeto
			results.push({
				code: 'Atributos lang encontrados',
				message: `Total de atributos lang encontrados`,
				type: 'notice',
				runnerExtras: {
					status: 'passed',
					total: langs.total,
					html: langs.html,
					body: langs.body,
					elementos: langs.elementos,
					category: getCategory('lang')
				}
			});

			// O teste sempre passa, pois estamos apenas registrando
			expect(true).to.equal(true);
		});

		testar('A página tem um título válido', () => {
			let status;
			let errorMessage = null;
			try {
				const title = $('head>title');

				// Verifica se o título existe
				expect(title.length).to.equal(1, 'A página deve ter exatamente um elemento title');

				// Verifica se o título tem conteúdo
				const titleText = title.text().trim();
				expect(titleText).to.have.length.greaterThan(0, 'O título não pode estar vazio');

				// Verifica se o título tem um comprimento mínimo
				expect(titleText.length).to.be.at.least(3, 'O título deve ter pelo menos 3 caracteres');

				// Verifica se o título não contém apenas espaços ou caracteres especiais
				expect(titleText.replace(/[\s\W]/g, '')).to.have.length.greaterThan(0, 'O título não pode conter apenas espaços ou caracteres especiais');
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}
			results.push({
				code: 'A página tem um título válido',
				message: status === 'passed' ? 'A página tem um título válido' : errorMessage,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage,
					category: getCategory('titulo')
				}
			})
		});

		// Teste para verificar se os IDs internos e externos das páginas estão corretos
		testar('IDs internos e externos das páginas estão corretos', () => {
			function verificarIdsInternosExternos() {
				let problemas = [];
				let idsInternosMapeados = new Set();
				let linksExternosInvalidos = [];
				let linksInternosInvalidos = [];

				// 1. Mapear todos os IDs presentes na página
				$('[id]').each(function () {
					const id = $(this).attr('id');
					if (id && id.trim() !== '') {
						idsInternosMapeados.add(id);
					}
				});

				// 2. Verificar todos os links âncora internos (que começam com #)
				$('a[href^="#"]').each(function () {
					const $link = $(this);
					const href = $link.attr('href');

					if (!href || href === '#') {
						linksInternosInvalidos.push({
							elemento: $link.prop('outerHTML'),
							href: href,
							problema: 'Link âncora vazio ou apenas "#"'
						});
						return;
					}

					// Remove o # para obter o ID
					const targetId = href.substring(1);

					// Verifica se o ID de destino existe na página
					if (!idsInternosMapeados.has(targetId)) {
						linksInternosInvalidos.push({
							elemento: $link.prop('outerHTML'),
							href: href,
							targetId: targetId,
							problema: 'ID de destino não existe na página'
						});
					}
				});

				// 3. Verificar links externos (que podem ser para outras páginas do projeto)
				$('a[href]').each(function () {
					const $link = $(this);
					const href = $link.attr('href');

					if (!href) return;

					// Pula links âncora internos (já verificados acima)
					if (href.startsWith('#')) return;

					// Pula links externos verdadeiros (http/https)
					if (href.startsWith('http://') || href.startsWith('https://')) {
						linksExternosInvalidos.push({
							elemento: $link.prop('outerHTML'),
							href: href,
							problema: 'Link externo detectado (pode não ser permitido)'
						});
						return;
					}

					// Verifica links para outras páginas com âncoras
					if (href.includes('#')) {
						const partes = href.split('#');
						const arquivo = partes[0];
						const anchorId = partes[1];

						if (!arquivo || arquivo.trim() === '') {
							linksInternosInvalidos.push({
								elemento: $link.prop('outerHTML'),
								href: href,
								problema: 'Nome do arquivo não especificado antes da âncora'
							});
						}

						if (!anchorId || anchorId.trim() === '') {
							linksInternosInvalidos.push({
								elemento: $link.prop('outerHTML'),
								href: href,
								problema: 'ID da âncora não especificado após o #'
							});
						}
					}
				});

				// 4. Verificar se IDs seguem padrões válidos
				idsInternosMapeados.forEach(id => {
					// Verifica se o ID não contém caracteres inválidos
					if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id)) {
						problemas.push({
							id: id,
							problema: 'ID contém caracteres inválidos ou não começa com letra'
						});
					}

					// Verifica se o ID não é muito curto
					if (id.length < 2) {
						problemas.push({
							id: id,
							problema: 'ID muito curto (menos de 2 caracteres)'
						});
					}
				});

				return {
					idsTotal: idsInternosMapeados.size,
					idsProblemas: problemas,
					linksInternosInvalidos: linksInternosInvalidos,
					linksExternosInvalidos: linksExternosInvalidos,
					temProblemas: problemas.length > 0 || linksInternosInvalidos.length > 0 || linksExternosInvalidos.length > 0
				};
			}

			const resultado = verificarIdsInternosExternos();

			// Se houver problemas, adiciona cada um como um erro separado
			if (resultado.temProblemas) {
				// Problemas com IDs
				resultado.idsProblemas.forEach(problema => {
					results.push({
						code: 'Problema com ID',
						message: `ID "${problema.id}": ${problema.problema}`,
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: problema.problema,
							category: getCategory('id')
						}
					});
				});

				// Problemas com links internos
				resultado.linksInternosInvalidos.forEach(link => {
					results.push({
						code: 'Link interno inválido',
						message: `${link.problema}: ${link.href}`,
						type: 'error',
						runnerExtras: {
							status: 'not passed',
							errorMessage: link.problema,
							elemento: link.elemento,
							category: getCategory('link')
						}
					});
				});

				// Problemas com links externos
				resultado.linksExternosInvalidos.forEach(link => {
					results.push({
						code: 'Link externo detectado',
						message: `${link.problema}: ${link.href}`,
						type: 'warning',
						runnerExtras: {
							status: 'not passed',
							errorMessage: link.problema,
							elemento: link.elemento,
							category: getCategory('link')
						}
					});
				});
			} else {
				// Adiciona informações estatísticas
				results.push({
					code: 'Estatísticas de IDs e Links',
					message: `Total de IDs encontrados: ${resultado.idsTotal}. Links internos inválidos: ${resultado.linksInternosInvalidos.length}. Links externos: ${resultado.linksExternosInvalidos.length}`,
					type: 'notice',
					runnerExtras: {
						status: 'passed',
						idsTotal: resultado.idsTotal,
						linksInternosInvalidos: resultado.linksInternosInvalidos.length,
						linksExternos: resultado.linksExternosInvalidos.length,
						category: getCategory('link')
					}
				});

				expect(resultado.temProblemas).to.equal(false, 'Foram encontrados problemas com IDs ou links');
			}


		});





		return results
	}

	// temos que enviar um array de issue, se não quebra
	const results = runCode();

	return results;

};