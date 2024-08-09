'use strict';

const path = require('path');
const scriptsPath = path.resolve('custom-runners/scripts');

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
			expect(result.length).to.equal(0);
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

			const result = checkHeadingHierarchy();

			expect(result.length).to.equal(0);
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
			const tituloObra = $('head>title');
			expect(tituloObra.length).to.equal(1);
			expect(tituloObra.text()).to.not.be.undefined;
		});
		// - Incluir um metadado para a descrição da obra
		testar('Metadado com a descrição da obra presente e com valor', () => {
			const metaDescription = $('head>meta[name=description]');
			expect(metaDescription.length).to.equal(1);
			expect(metaDescription.attr('content')).to.not.be.undefined;
		});
		// - Incluir metadado autor
		testar('Metadado com nome do autor presente e com valor', () => {
			const metaAuthor = $('head>meta[name=author]');
			expect(metaAuthor.length).to.equal(1);
			expect(metaAuthor.attr('content')).to.not.be.undefined;
		});
		// - Incluir metadados para desabilitar a indexação do conteúdo da obra por motores de busca.
		testar('Metadado que desabilita indexação do conteúdo da obra por motores de busca.', () => {
			const metaRobots = $('head>meta[name=robots]');
			expect(metaRobots.length).to.equal(1);
			expect(metaRobots.attr('content')).to.not.be.undefined;
		});

		// 		5.8.3 Body
		// No corpo da página principal é obrigatório a inclusão da tag <body> adicionando as suas propriedades o idioma apresentado.
		testar('Tag Body incluida na página', () => {
			const bodyTag = $('body');
			expect(bodyTag.length).to.equal(1);
		});

		// – tag BODY possui atributo lang 
		testar('tag BODY possui atributo lang', () => {
			const bodyTag = $('body');
			expect(bodyTag.attr('lang')).to.not.be.undefined
		});

		// – atributo lang da tag BODY é igual a pt-BR (ou espanhol ou inglês???)
		testar('A tag BODY tem o atributo lang com um dos seguintes valores (pt-BR, es, en)', () => {
			const bodyTag = $('body');
			const valoresPermitidos = ['pt-br', 'es', 'en']
			if (!$(bodyTag).attr('lang')) {
				throw new Error('Não possui atributo lang')
			} else {
				expect(valoresPermitidos.includes(bodyTag.attr('lang').toLowerCase())).to.equal(true);
			}
		});

		// Após abrir a tag <body>, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os dados da obra e seus recursos de acessibilidade uQlizados, seguindo a especificação disposta em https://schema.org/Book.
		testar('Após abrir a tag <body>, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os dados da obra e seus recursos de acessibilidade uQlizados, seguindo a especificação disposta em https://schema.org/Book.', () => {
			const bodyTag = $('body');

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
		testar('Finalizando a tag <body> deverá ser adicionado uma tag <nav> com a propriedade id com o valor setado para toc e sua role para doc-toc, seguindo para a construção do índice de navegação da obra.<nav role="doc-toc" id="toc">', () => {
			const bodyTag = $('body');
			const navTag = $(bodyTag).find('nav')
			expect(navTag.attr('role')).to.equal("doc-toc");
			expect(navTag.attr('id')).to.equal("toc");
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
		testar('Após abrir a tag <body>, como primeiro filho, deverá conter uma tag <div> implementando o esquema Book, registrando internamente todos os recursos de acessibilidade uQlizados na construção desta página em específico, seguindo a especificação disposta em https://schema.org/Book.', () => {
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


		return results
	}

	// temos que enviar um array de issue, se não quebra
	const results = runCode();

	return results;

};