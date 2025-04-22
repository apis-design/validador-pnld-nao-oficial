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
			let status;
			let errorMessage = null;

			try {
				testFunction()
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}

			results.push({
				code: testDescription,
				message: testDescription,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage
				}
			});
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
			const images = $('img');
			images.each(function () {
				expect($(this).attr('alt')).to.not.be.undefined
			});
		});


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
			const htmlTag = $('html');
			expect(htmlTag.attr('lang')).to.not.be.undefined
		});

		// – atributo lang da tag HTML é igual a pt-BR (ou espanhol ou inglês???)
		testar('A tag HTML tem o atributo lang com um dos seguintes valores (pt-BR, es, en)', () => {
			const htmlTag = $('html');
			const valoresPermitidos = ['pt-br', 'es', 'en']
			expect(valoresPermitidos.includes(htmlTag.attr('lang').toLowerCase())).to.equal(true);
		});

		// – tag meta viewport existe e está configurada de forma acessível
		testar('A tag meta viewport existe e está configurada de forma acessível', () => {
			const metaViewport = $('head>meta[name=viewport]');
			expect(metaViewport.length).to.equal(1);
			expect(metaViewport.attr('content')).to.equal("width=device-width, initial-scale=1.0");
		})

		// – Todos os assets são locais

		// – Não tem nenhum link <a href> apontando para fora do livro
		testar('Nenhum link <a href> aponta para fora do livro', () => {
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
						console.log('O ID de ida "#' + id + '" não corresponde a um termo no glossário.');
						resultado = false;
					}
				});

				return resultado;
			}

			function verificarLinksDeIdaEVoltaGlossario() {
				var idsInternosOk = verificarIdsInternos();
				var resultado = true;

				if (!idsInternosOk) {
					console.log('Há problemas com alguns IDs internos.');
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
						console.log('O link de ida "' + linkIda + '" não leva a um termo existente.');
						resultado = false;
						return; // Encerra a iteração atual
					}

					// Verifica se o link de volta dentro do termo é correto
					var linkVolta = termo.next('dd').find('a');
					var linkVoltaId = linkVolta.attr('href');

					if (linkVoltaId === linkIdaId) {
						console.log('O link de volta dentro do termo "' + termoId + '" está correto.');
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
						console.log('Erro: O elemento <dl> está vazio ou não contém <dt> e <dd>.');
						valido = false;
						return;
					}

					if (termos.length !== definicoes.length) {
						console.log('Erro: O número de <dt> não corresponde ao número de <dd>.');
						valido = false;
					}

					termos.each(function (index) {
						let $dt = $(this);
						let $dd = definicoes.eq(index);

						if (!$dd.length || $dd.prev().get(0) !== $dt.get(0)) {
							console.log('Erro: O elemento <dt> não tem uma <dd> correspondente imediatamente após.');
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
							errorMessage: 'ID duplicado: ' + duplicates
						}
					});
				})
			} else {
				expect(result.length).to.equal(0);
			}

		});

		// – lista de um item
		testar('Não tem listas com somente um item', () => {
			expect($('ul, ol').filter(i => $(i).children().length == 1).length).to.equal(0);
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
							errorMessage: 'Saltos hierárquicos encontrados.'
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
			if (hasDoctype) {
				var doctypeString = '<!DOCTYPE ' + document.doctype.name + '>';
				expect(doctypeString).to.equal('<!DOCTYPE html>');
			} else {
				expect(hasDoctype).to.equal('<!DOCTYPE html>');
			}
		});
		// 		5.8.2 Head
		// Na página inicial é obrigatório a inclusão da tag <head> com alguns metadados.
		testar('Tag Head incluída na página', () => {
			const tagHead = $('head');
			expect(tagHead.length).to.equal(1);
		});
		// - Definir o charset de todos os arquivos para "UTF-8"
		testar('Tag meta charset presente e com valor UTF-8', () => {
			const metaCharset = $('head>meta[charset]');
			expect(metaCharset.length).to.equal(1);
			expect(metaCharset.attr('charset')).to.equal("UTF-8");
		});
		// - Definir o titulo da obra
		testar('Titulo da obra presente e com valor', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}

			const tituloObra = $('head>title');
			expect(tituloObra.length).to.equal(1);
			expect(tituloObra.text()).to.not.be.undefined;
		});
		// - Incluir um metadado para a descrição da obra
		testar('Metadado com a descrição da obra presente e com valor', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}
			const metaDescription = $('head>meta[name=description]');
			expect(metaDescription.length).to.equal(1);
			expect(metaDescription.attr('content')).to.not.be.undefined;
		});
		// - Incluir metadado autor
		testar('Metadado com nome do autor presente e com valor', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}
			const metaAuthor = $('head>meta[name=author]');
			expect(metaAuthor.length).to.equal(1);
			expect(metaAuthor.attr('content')).to.not.be.undefined;
		});
		// - Incluir metadados para desabilitar a indexação do conteúdo da obra por motores de busca.
		testar('Metadado que desabilita indexação do conteúdo da obra por motores de busca.', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}
			const metaRobots = $('head>meta[name=robots]');
			expect(metaRobots.length).to.equal(1);
			expect(metaRobots.attr('content')).to.not.be.undefined;
		});

		// 		5.8.3 Body
		// No corpo da página principal é obrigatório a inclusão da tag <body> adicionando as suas propriedades o idioma apresentado.
		testar('Tag Body incluida na página', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}
			const bodyTag = $('body');
			expect(bodyTag.length).to.equal(1);
		});

		// – tag BODY possui atributo lang 
		testar('tag BODY possui atributo lang', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}
			const bodyTag = $('body');
			expect(bodyTag.attr('lang')).to.not.be.undefined
		});

		// – atributo lang da tag BODY é igual a pt-BR (ou espanhol ou inglês???)
		testar('A tag BODY tem o atributo lang com um dos seguintes valores (pt-BR, es, en)', () => {
			const pathname = window.location.pathname;
			const filename = pathname.split('/').pop(); // Pega apenas o nome do arquivo
			const isRootIndex = filename === 'index.html' && pathname.includes('content');

			if (isRootIndex) {
				// Se não for o index.html da raiz, o teste passa automaticamente
				return;
			}
			const bodyTag = $('body');
			const valoresPermitidos = ['pt-br', 'es', 'en']
			if (!$(bodyTag).attr('lang')) {
				throw new Error('Não possui atributo lang')
			} else {
				expect(valoresPermitidos.includes(bodyTag.attr('lang').toLowerCase())).to.equal(true);
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
					console.log("O primeiro filho do body possui a estrutura desejada.");
					valido = true
				} else {
					console.log("O primeiro filho do body não contém todas as meta tags necessárias.");
					valido = false
				}
			} else {
				console.log("O primeiro filho do body não é um div do tipo Book.");
				valido = false
			}

			expect(valido).to.equal(true);
		});

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

			const bodyTag = $('body');
			const navTag = $(bodyTag).find('nav')
			expect(navTag.attr('role')).to.equal("doc-toc");
			expect(navTag.attr('id')).to.equal("toc");
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

			const navToc = $('#toc');
			const navTocHtml = navToc.html();

			// Verifica se o HTML do nav contém &nbsp; em qualquer formato
			const hasNbsp = navTocHtml && (
				navTocHtml.includes('&nbsp;') ||
				navTocHtml.includes('&#160;') ||
				navTocHtml.includes('\u00A0')
			);

			expect(hasNbsp).to.equal(false);
		});

		// Verifica presença de &nbsp; nos títulos (h1-h6)
		testar('Os títulos (h1-h6) não devem conter &nbsp;', () => {
			const headings = $('h1, h2, h3, h4, h5, h6');
			const headingsWithNbsp = [];

			headings.each(function() {
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
							errorMessage: `Encontrado &nbsp; no elemento: ${heading.html}`
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
				console.log('O primeiro filho da tag <body> tem a estrutura correta.');
				valido = true
			} else {
				console.log('O primeiro filho da tag <body> não tem a estrutura correta.');
				valido = false
			}

			expect(valido).to.equal(true);
		})

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
				console.log('A tag <main> está ausente na página.');
				valido = false
			} else {
				// 3. Verifica se todo o conteúdo, exceto o primeiro filho da <body>, está dentro da <main>
				const bodyChildren = $('body').children();
				const firstBodyChild = $('body').children().first();
				const otherBodyContents = bodyChildren.not(firstBodyChild).not('main').find('*');

				const allContentInsideMain = otherBodyContents.length === 0;

				if (allContentInsideMain) {
					console.log('Todo o conteúdo, exceto o primeiro filho da tag <body>, está dentro da tag <main>.');
					valido = true
				} else {
					console.log('Há conteúdo fora da tag <main>, além do primeiro filho da <body>.');
					valido = false
				}
			}
			expect(valido).to.equal(true);
		})

		testar('O arquivo toc.ncx está estruturado corretamente', () => {
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
							errorMessage: `href inválido: ${link.href}. Razão: ${link.razao}`
						}
					});
				});
			}

			expect(linksInvalidos.length).to.equal(0);
		});

		return results
	}

	// temos que enviar um array de issue, se não quebra
	const results = runCode();

	return results;

};