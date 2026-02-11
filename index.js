import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pa11y from 'pa11y'
import puppeteer from 'puppeteer'
import handleFsError from './helpers/fs-validator.js'
import { validateTocNcxIds } from './helpers/toc-ncx-validator.js'
import { sendProgress } from './server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let browser = null; // Inicializado como null para ser criado sob demanda

// criar verificação se todos os links dos sumarios estão indo para o href certo

const pa11yOptions = (filename) => {
	try {
		// Translation mapping for common HTMLCS errors
		const errorTranslations = {
			// Accessibility errors
			'WCAG2AA.Principle1.Guideline1_1.1_1_1': 'Imagens devem ter texto alternativo (alt)',
			'WCAG2AA.Principle1.Guideline1_3.1_3_1': 'Tabelas devem ter cabeçalhos apropriados',
			'WCAG2AA.Principle1.Guideline1_3.1_3_1_A.G141': 'Cabeçalhos devem ser organizados hierarquicamente',
			'WCAG2AA.Principle1.Guideline1_4.1_4_3': 'Contraste de cores insuficiente',
			'WCAG2AA.Principle2.Guideline2_4.2_4_2': 'Página deve ter um título único e descritivo',
			'WCAG2AA.Principle2.Guideline2_4.2_4_2.H25.2': 'Título da página deve ser descritivo',
			'WCAG2AA.Principle2.Guideline2_4.2_4_4': 'Links devem ter texto descritivo',
			'WCAG2AA.Principle2.Guideline2_4.2_4_4.H77,H78,H79,H80,H81': 'Links devem ter texto descritivo',
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
			'WCAG2AA.Principle2.Guideline2_4.2_4_5': 'Múltiplas formas de navegação devem estar disponíveis',

			// Additional common WCAG codes
			'WCAG2AA.Principle1.Guideline1_3.1_3_2.G57': 'Estrutura de cabeçalhos deve ser organizada',
			'WCAG2AA.Principle1.Guideline1_3.1_3_3.G96': 'Instruções não devem depender apenas da forma',
			'WCAG2AA.Principle1.Guideline1_3.1_3_4.': 'Informações não devem ser transmitidas apenas por cor',
			'WCAG2AA.Principle1.Guideline1_4.1_4_1.G14,G182': 'Contraste de cores deve ser adequado',
			'WCAG2AA.Principle1.Guideline1_4.1_4_4.G142': 'Redimensionamento de texto deve ser possível',
			'WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,C33,C38,SCR34,G206': 'Conteúdo não deve desaparecer com zoom',
			'WCAG2AA.Principle1.Guideline1_4.1_4_11.G195,G207,G18,G145,G174,F78': 'Contraste visual deve ser adequado',
			'WCAG2AA.Principle1.Guideline1_4.1_4_12.C36,C35': 'Espaçamento entre linhas deve ser adequado',
			'WCAG2AA.Principle1.Guideline1_4.1_4_13.F95': 'Conteúdo não deve restringir orientação',
			'WCAG2AA.Principle2.Guideline2_1.2_1_4.': 'Funcionalidades devem estar disponíveis sem mouse',
			'WCAG2AA.Principle2.Guideline2_2.2_2_2.SCR33,SCR22,G187,G152,G186,G191': 'Conteúdo em movimento deve poder ser pausado',
			'WCAG2AA.Principle2.Guideline2_3.2_3_1.G19,G176': 'Conteúdo não deve piscar mais de 3 vezes por segundo',
			'WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124,H69': 'Pular blocos de conteúdo deve ser possível',
			'WCAG2AA.Principle2.Guideline2_4.2_4_5.G125,G64,G63,G161,G126,G185': 'Múltiplas maneiras de localizar página',
			'WCAG2AA.Principle2.Guideline2_4.2_4_6.G130,G131': 'Cabeçalhos e labels devem ser descritivos',
			'WCAG2AA.Principle2.Guideline2_5.2_5_1.': 'Gestos complexos devem ter alternativas',
			'WCAG2AA.Principle2.Guideline2_5.2_5_2.': 'Ativação por movimento deve poder ser desabilitada',
			'WCAG2AA.Principle2.Guideline2_5.2_5_3.F96': 'Ações devem ter alternativas textuais',
			'WCAG2AA.Principle2.Guideline2_5.2_5_4.': 'Funcionalidades ativadas por movimento',
			'WCAG2AA.Principle3.Guideline3_1.3_1_2.H58': 'Idioma do texto deve ser identificado',
			'WCAG2AA.Principle3.Guideline3_2.3_2_1.G107': 'Mudanças de contexto devem ser controladas pelo usuário',
			'WCAG2AA.Principle3.Guideline3_2.3_2_3.G61': 'Navegação consistente em páginas web',
			'WCAG2AA.Principle3.Guideline3_2.3_2_4.G197': 'Componentes com mesma funcionalidade devem ser consistentes',
			'WCAG2AA.Principle3.Guideline3_3.3_3_1.G83,G84,G85': 'Erros devem ser identificados e descritos',
			'WCAG2AA.Principle3.Guideline3_3.3_3_3.G177': 'Labels ou instruções devem ser fornecidas',
			'WCAG2AA.Principle3.Guideline3_3.3_3_4.G98,G99,G155,G164,G168': 'Sugestões para correção de erros devem ser fornecidas',
			'WCAG2AA.Principle4.Guideline4_1.4_1_3': 'Mensagens de status devem ser programaticamente determinadas',

			// Common HTMLCS messages (not code-based)
			'Heading markup should be used if this content is intended as a heading.': 'Marcação de cabeçalho deve ser usada se este conteúdo for destinado como cabeçalho.',
			'This element does not support ARIA roles, states and properties.': 'Este elemento não suporta roles, estados e propriedades ARIA.',
			'Bad value for attribute': 'Valor inválido para atributo',
			'Element is missing required attribute': 'Elemento está faltando atributo obrigatório',
			'Element is missing one or more of the following attributes': 'Elemento está faltando um ou mais dos seguintes atributos',
			'Duplicate id attribute value': 'Valor de atributo id duplicado',
			'Element has a duplicate id': 'Elemento tem um id duplicado',
			'Element has an id attribute set to a value that is not unique in the same document': 'Elemento tem um atributo id definido com um valor que não é único no mesmo documento',
			'Element has an alt attribute that is empty or contains only whitespace': 'Elemento tem um atributo alt que está vazio ou contém apenas espaços em branco',
			'Element has an alt attribute that is redundant': 'Elemento tem um atributo alt que é redundante',
			'Image does not have an alt attribute': 'Imagem não tem atributo alt',
			'Image has an alt attribute with a value that contains ASCII art': 'Imagem tem um atributo alt com um valor que contém arte ASCII',
			'Image has an alt attribute with a value that is too long': 'Imagem tem um atributo alt com um valor muito longo',
			'Image has an alt attribute with a value that appears to be a filename': 'Imagem tem um atributo alt com um valor que parece ser um nome de arquivo',
			'Image has an alt attribute with a value that appears to be a URL': 'Imagem tem um atributo alt com um valor que parece ser uma URL',
			'Image has an alt attribute with a value that contains only non-alphanumeric characters': 'Imagem tem um atributo alt com um valor que contém apenas caracteres não alfanuméricos',
			'Image has an alt attribute with a value that is the same as the filename': 'Imagem tem um atributo alt com um valor que é o mesmo que o nome do arquivo',
			'Image has an alt attribute with a value that starts with "image of" or "photo of"': 'Imagem tem um atributo alt com um valor que começa com "imagem de" ou "foto de"',
			'Image has an alt attribute with a value that is placeholder text': 'Imagem tem um atributo alt com um valor que é texto placeholder',
			'Image has an alt attribute with a value that is the same as the surrounding text': 'Imagem tem um atributo alt com um valor que é o mesmo que o texto ao redor',
			'Image has an alt attribute with a value that is not appropriate for the image': 'Imagem tem um atributo alt com um valor que não é apropriado para a imagem',
			'Image has an alt attribute with a value that is too short': 'Imagem tem um atributo alt com um valor muito curto',
			'Image has an alt attribute with a value that contains only whitespace': 'Imagem tem um atributo alt com um valor que contém apenas espaços em branco',
			'Image has an alt attribute with a value that is empty': 'Imagem tem um atributo alt com um valor que está vazio',
			'Image has an alt attribute with a value that is not descriptive': 'Imagem tem um atributo alt com um valor que não é descritivo',
			'Image has an alt attribute with a value that is not meaningful': 'Imagem tem um atributo alt com um valor que não é significativo',
			'Image has an alt attribute with a value that is not relevant': 'Imagem tem um atributo alt com um valor que não é relevante',
			'Image has an alt attribute with a value that is not useful': 'Imagem tem um atributo alt com um valor que não é útil',
			'Image has an alt attribute with a value that is not appropriate': 'Imagem tem um atributo alt com um valor que não é apropriado',
			'Image has an alt attribute with a value that is not suitable': 'Imagem tem um atributo alt com um valor que não é adequado',
			'Image has an alt attribute with a value that is not correct': 'Imagem tem um atributo alt com um valor que não é correto',
			'Image has an alt attribute with a value that is not accurate': 'Imagem tem um atributo alt com um valor que não é preciso',
			'Image has an alt attribute with a value that is not exact': 'Imagem tem um atributo alt com um valor que não é exato',
			'Image has an alt attribute with a value that is not specific': 'Imagem tem um atributo alt com um valor que não é específico',
			'Image has an alt attribute with a value that is not detailed': 'Imagem tem um atributo alt com um valor que não é detalhado',
			'Image has an alt attribute with a value that is not comprehensive': 'Imagem tem um atributo alt com um valor que não é abrangente',
			'Image has an alt attribute with a value that is not complete': 'Imagem tem um atributo alt com um valor que não é completo',
			'Image has an alt attribute with a value that is not full': 'Imagem tem um atributo alt com um valor que não é completo',
			'Image has an alt attribute with a value that is not thorough': 'Imagem tem um atributo alt com um valor que não é minucioso',
			'Image has an alt attribute with a value that is not exhaustive': 'Imagem tem um atributo alt com um valor que não é exaustivo'
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
				path.resolve(__dirname, 'helpers/custom-runners/index.cjs')
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


// Função para limpar cache de resultados anteriores
const clearPreviousResults = () => {
    try {
        const resultsJsonPath = 'public/results.json';
        const resultsJsPath = 'public/results.js';
        
        // Remove arquivos de resultados anteriores se existirem
        if (fs.existsSync(resultsJsonPath)) {
            fs.unlinkSync(resultsJsonPath);
        }
        if (fs.existsSync(resultsJsPath)) {
            fs.unlinkSync(resultsJsPath);
        }
        
        sendProgress({ 
            type: 'info', 
            message: 'Cache de resultados anteriores limpo com sucesso.' 
        });
    } catch (error) {
        console.log('Erro ao limpar cache:', error);
        sendProgress({ 
            type: 'warning', 
            message: 'Aviso: Não foi possível limpar completamente o cache anterior.' 
        });
    }
};

// Função para garantir browser limpo
const ensureCleanBrowser = async () => {
    try {
        if (browser && browser.isConnected()) {
            await browser.close();
            sendProgress({ 
                type: 'info', 
                message: 'Instância anterior do browser fechada.' 
            });
        }
        
        // Recria uma nova instância do browser
        const newBrowser = await puppeteer.launch();
        sendProgress({ 
            type: 'info', 
            message: 'Nova instância do browser criada.' 
        });
        
        return newBrowser;
    } catch (error) {
        console.log('Erro ao gerenciar browser:', error);
        sendProgress({ 
            type: 'warning', 
            message: 'Aviso: Problema ao gerenciar instâncias do browser.' 
        });
        
        // Fallback: tenta criar um novo browser mesmo assim
        return await puppeteer.launch();
    }
};

// Função para traduzir mensagens dos resultados
const translateResults = (results) => {
    const translations = {
        // WCAG codes
        'WCAG2AA.Principle1.Guideline1_1.1_1_1': 'Imagens devem ter texto alternativo (alt)',
        'WCAG2AA.Principle1.Guideline1_3.1_3_1': 'Tabelas devem ter cabeçalhos apropriados',
        'WCAG2AA.Principle1.Guideline1_3.1_3_1_A.G141': 'Cabeçalhos devem ser organizados hierarquicamente',
        'WCAG2AA.Principle1.Guideline1_4.1_4_3': 'Contraste de cores insuficiente',
        'WCAG2AA.Principle2.Guideline2_4.2_4_2': 'Página deve ter um título único e descritivo',
        'WCAG2AA.Principle2.Guideline2_4.2_4_2.H25.2': 'Título da página deve ser descritivo',
        'WCAG2AA.Principle2.Guideline2_4.2_4_4': 'Links devem ter texto descritivo',
        'WCAG2AA.Principle2.Guideline2_4.2_4_4.H77,H78,H79,H80,H81': 'Links devem ter texto descritivo',
        'WCAG2AA.Principle2.Guideline2_4.2_4_6': 'Cabeçalhos devem ser descritivos',
        'WCAG2AA.Principle3.Guideline3_2.3_2_2': 'Formulários devem ter labels apropriados',
        'WCAG2AA.Principle3.Guideline3_3.3_3_2': 'Formulários devem ter mensagens de erro claras',
        'WCAG2AA.Principle4.Guideline4_1.4_1_1': 'Elementos HTML inválidos ou mal formados',
        'WCAG2AA.Principle4.Guideline4_1.4_1_2': 'Elementos interativos devem ter roles ARIA apropriados',
        'WCAG2AA.Principle3.Guideline3_1.3_1_1': 'Documento deve ter atributo lang definido',
        'WCAG2AA.Principle3.Guideline3_1.3_1_2': 'Mudanças de idioma devem ser marcadas',
        'WCAG2AA.Principle2.Guideline2_4.2_4_1': 'Página deve ter uma estrutura de navegação clara',
        'WCAG2AA.Principle2.Guideline2_4.2_4_5': 'Múltiplas formas de navegação devem estar disponíveis',
        
        // Common HTMLCS messages
        'Check that the title element describes the document.': 'Verifique se o elemento title descreve o documento.',
        'The heading structure is not logically nested. This h2 element appears to be the primary document heading, so should be an h1 element.': 'A estrutura de cabeçalhos não está logicamente aninhada. Este elemento h2 parece ser o cabeçalho principal do documento, então deve ser um elemento h1.',
        'The heading structure is not logically nested. This h2 element should be an h1 to be properly nested.': 'A estrutura de cabeçalhos não está logicamente aninhada. Este elemento h2 deve ser um h1 para estar corretamente aninhado.',
        'Check that the link text combined with programmatically determined link context identifies the purpose of the link.': 'Verifique se o texto do link combinado com o contexto do link determinado programaticamente identifica o propósito do link.',
        'Ensure that the img element\'s alt text serves the same purpose and presents the same information as the image.': 'Certifique-se de que o texto alt do elemento img serve ao mesmo propósito e apresenta as mesmas informações que a imagem.',
        'If this image cannot be fully described in a short text alternative, ensure a long text alternative is also available, such as in the body text or through a link.': 'Se esta imagem não puder ser totalmente descrita em uma alternativa de texto curta, certifique-se de que uma alternativa de texto longa também esteja disponível, como no texto do corpo ou através de um link.',
        'Check that the content is ordered in a meaningful sequence when linearised, such as when style sheets are disabled.': 'Verifique se o conteúdo está ordenado em uma sequência significativa quando linearizado, como quando as folhas de estilo estão desabilitadas.',
        'Where instructions are provided for understanding the content, do not rely on sensory characteristics alone (such as shape, size or location) to describe objects.': 'Onde instruções são fornecidas para entender o conteúdo, não confie apenas em características sensoriais (como forma, tamanho ou localização) para descrever objetos.',
        'Check that content does not restrict its view and operation to a single display orientation, such as portrait or landscape, unless a specific display orientation is essential.': 'Verifique se o conteúdo não restringe sua visualização e operação a uma única orientação de exibição, como retrato ou paisagem, a menos que uma orientação de exibição específica seja essencial.',
        'Check that any information conveyed using colour alone is also available in text, or through other visual cues.': 'Verifique se qualquer informação transmitida usando apenas cor também está disponível em texto ou através de outras pistas visuais.',
        'Check that text can be resized without assistive technology up to 200 percent without loss of content or functionality.': 'Verifique se o texto pode ser redimensionado sem tecnologia assistiva até 200 por cento sem perda de conteúdo ou funcionalidade.',
        'If the technologies being used can achieve the visual presentation, check that text is used to convey information rather than images of text, except when the image of text is essential to the information being conveyed, or can be visually customised to the user\'s requirements.': 'Se as tecnologias sendo usadas podem alcançar a apresentação visual, verifique se o texto é usado para transmitir informações em vez de imagens de texto, exceto quando a imagem de texto é essencial para as informações sendo transmitidas, ou pode ser visualmente personalizada de acordo com os requisitos do usuário.',
        'Check that content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions for: Vertical scrolling content at a width equivalent to 320 CSS pixels; Horizontal scrolling content at a height equivalent to 256 CSS pixels; Except for parts of the content which require two-dimensional layout for usage or meaning.': 'Verifique se o conteúdo pode ser apresentado sem perda de informação ou funcionalidade, e sem exigir rolagem em duas dimensões para: Conteúdo de rolagem vertical em uma largura equivalente a 320 pixels CSS; Conteúdo de rolagem horizontal em uma altura equivalente a 256 pixels CSS; Exceto para partes do conteúdo que requerem layout bidimensional para uso ou significado.',
        'Check that the visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s): User Interface Components: Visual information required to identify user interface components and states, except for inactive components or where the appearance of the component is determined by the user agent and not modified by the author; Graphical Objects: Parts of graphics required to understand the content, except when a particular presentation of graphics is essential to the information being conveyed.': 'Verifique se a apresentação visual dos seguintes têm uma proporção de contraste de pelo menos 3:1 contra cor(es) adjacente(s): Componentes da Interface do Usuário: Informações visuais necessárias para identificar componentes da interface do usuário e estados, exceto para componentes inativos ou onde a aparência do componente é determinada pelo agente do usuário e não modificada pelo autor; Objetos Gráficos: Partes de gráficos necessárias para entender o conteúdo, exceto quando uma apresentação particular de gráficos é essencial para as informações sendo transmitidas.',
        'Check that no loss of content or functionality occurs by setting all of the following and by changing no other style property: Line height (line spacing) to at least 1.5 times the font size; Spacing following paragraphs to at least 2 times the font size; Letter spacing (tracking) to at least 0.12 times the font size; Word spacing to at least 0.16 times the font size.': 'Verifique se não ocorre perda de conteúdo ou funcionalidade definindo todos os seguintes e não alterando nenhuma outra propriedade de estilo: Altura da linha (espaçamento entre linhas) para pelo menos 1,5 vezes o tamanho da fonte; Espaçamento após parágrafos para pelo menos 2 vezes o tamanho da fonte; Espaçamento entre letras (rastreamento) para pelo menos 0,12 vezes o tamanho da fonte; Espaçamento entre palavras para pelo menos 0,16 vezes o tamanho da fonte.',
        'Check that where receiving and then removing pointer hover or keyboard focus triggers additional content to become visible and then hidden, the following are true: Dismissable: A mechanism is available to dismiss the additional content without moving pointer hover or keyboard focus, unless the additional content communicates an input error or does not obscure or replace other content; Hoverable: If pointer hover can trigger the additional content, then the pointer can be moved over the additional content without the additional content disappearing; Persistent: The additional content remains visible until the hover or focus trigger is removed, the user dismisses it, or its information is no longer valid.': 'Verifique se onde receber e depois remover o foco do ponteiro ou do teclado aciona conteúdo adicional para se tornar visível e depois oculto, o seguinte é verdadeiro: Dispensável: Um mecanismo está disponível para dispensar o conteúdo adicional sem mover o foco do ponteiro ou do teclado, a menos que o conteúdo adicional comunique um erro de entrada ou não oculte ou substitua outro conteúdo; Passível de foco: Se o foco do ponteiro puder acionar o conteúdo adicional, então o ponteiro pode ser movido sobre o conteúdo adicional sem que o conteúdo adicional desapareça; Persistente: O conteúdo adicional permanece visível até que o gatilho de foco ou foco seja removido, o usuário o dispense, ou suas informações não sejam mais válidas.',
        'Check that if a keyboard shortcut is implemented in content using only letter (including upper- and lower-case letters), punctuation, number, or symbol characters, then at least one of the following is true: Turn off: A mechanism is available to turn the shortcut off; Remap: A mechanism is available to remap the shortcut to use one or more non-printable keyboard characters (e.g. Ctrl, Alt, etc); Active only on focus: The keyboard shortcut for a user interface component is only active when that component has focus.': 'Verifique se se um atalho de teclado é implementado no conteúdo usando apenas letra (incluindo letras maiúsculas e minúsculas), pontuação, número ou caracteres de símbolo, então pelo menos um dos seguintes é verdadeiro: Desligar: Um mecanismo está disponível para desligar o atalho; Remapear: Um mecanismo está disponível para remapear o atalho para usar um ou mais caracteres de teclado não imprimíveis (por exemplo, Ctrl, Alt, etc); Ativo apenas no foco: O atalho de teclado para um componente da interface do usuário está ativo apenas quando esse componente tem foco.',
        'If any part of the content moves, scrolls or blinks for more than 5 seconds, or auto-updates, check that there is a mechanism available to pause, stop, or hide the content.': 'Se qualquer parte do conteúdo se mover, rolar ou piscar por mais de 5 segundos, ou atualizar automaticamente, verifique se há um mecanismo disponível para pausar, parar ou ocultar o conteúdo.',
        'Check that no component of the content flashes more than three times in any 1-second period, or that the size of any flashing area is sufficiently small.': 'Verifique se nenhum componente do conteúdo pisca mais de três vezes em qualquer período de 1 segundo, ou que o tamanho de qualquer área piscante seja suficientemente pequeno.',
        'Ensure that any common navigation elements can be bypassed; for instance, by use of skip links, header elements, or ARIA landmark roles.': 'Certifique-se de que qualquer elemento de navegação comum possa ser contornado; por exemplo, pelo uso de links de salto, elementos de cabeçalho ou roles de referência ARIA.',
        'If this Web page is not part of a linear process, check that there is more than one way of locating this Web page within a set of Web pages.': 'Se esta página web não faz parte de um processo linear, verifique se há mais de uma maneira de localizar esta página web dentro de um conjunto de páginas web.',
        'Check that headings and labels describe topic or purpose.': 'Verifique se cabeçalhos e labels descrevem tópico ou propósito.',
        'Check that there is at least one mode of operation where the keyboard focus indicator can be visually located on user interface controls.': 'Verifique se há pelo menos um modo de operação onde o indicador de foco do teclado pode ser localizado visualmente nos controles da interface do usuário.',
        'Check that all functionality that uses multipoint or path-based gestures for operation can be operated with a single pointer without a path-based gesture, unless a multipoint or path-based gesture is essential.': 'Verifique se toda funcionalidade que usa gestos multiponto ou baseados em caminho para operação pode ser operada com um único ponteiro sem gesto baseado em caminho, a menos que um gesto multiponto ou baseado em caminho seja essencial.',
        'Check that for functionality that can be operated using a single pointer, at least one of the following is true: No Down-Event: The down-event of the pointer is not used to execute any part of the function; Abort or Undo: Completion of the function is on the up-event, and a mechanism is available to abort the function before completion or to undo the function after completion; Up Reversal: The up-event reverses any outcome of the preceding down-event; Essential: Completing the function on the down-event is essential.': 'Verifique se para funcionalidade que pode ser operada usando um único ponteiro, pelo menos um dos seguintes é verdadeiro: Sem evento Down: O evento down do ponteiro não é usado para executar qualquer parte da função; Anular ou Desfazer: A conclusão da função está no evento up, e um mecanismo está disponível para anular a função antes da conclusão ou para desfazer a função após a conclusão; Reversão Up: O evento up reverte qualquer resultado do evento down precedente; Essencial: Concluir a função no evento down é essencial.',
        'Check that for user interface components with labels that include text or images of text, the name contains the text that is presented visually.': 'Verifique se para componentes da interface do usuário com labels que incluem texto ou imagens de texto, o nome contém o texto que é apresentado visualmente.',
        'Check that functionality that can be operated by device motion or user motion can also be operated by user interface components and responding to the motion can be disabled to prevent accidental actuation, except when: Supported Interface: The motion is used to operate functionality through an accessibility supported interface; Essential: The motion is essential for the function and doing so would invalidate the activity.': 'Verifique se a funcionalidade que pode ser operada por movimento do dispositivo ou movimento do usuário também pode ser operada por componentes da interface do usuário e responder ao movimento pode ser desabilitado para prevenir atuação acidental, exceto quando: Interface Suportada: O movimento é usado para operar funcionalidade através de uma interface suportada por acessibilidade; Essencial: O movimento é essencial para a função e fazê-lo invalidaria a atividade.',
        'Ensure that any change in language is marked using the lang and/or xml:lang attribute on an element, as appropriate.': 'Certifique-se de que qualquer mudança de idioma seja marcada usando o atributo lang e/ou xml:lang em um elemento, conforme apropriado.',
        'Check that navigational mechanisms that are repeated on multiple Web pages occur in the same relative order each time they are repeated, unless a change is initiated by the user.': 'Verifique se os mecanismos de navegação que são repetidos em múltiplas páginas web ocorrem na mesma ordem relativa cada vez que são repetidos, a menos que uma mudança seja iniciada pelo usuário.',
        'Check that components that have the same functionality within this Web page are identified consistently in the set of Web pages to which it belongs.': 'Verifique se os componentes que têm a mesma funcionalidade dentro desta página web são identificados consistentemente no conjunto de páginas web ao qual ela pertence.',
        'Check that status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus.': 'Verifique se as mensagens de status podem ser determinadas programaticamente através de role ou propriedades de modo que possam ser apresentadas ao usuário por tecnologias assistivas sem receber foco.',
        'Img element is marked so that it is ignored by Assistive Technology.': 'Elemento img está marcado para que seja ignorado pela Tecnologia Assistiva.',
        'If this embedded object contains pre-recorded audio only, and is not provided as an alternative for text content, check that an alternative text version is available.': 'Se este objeto incorporado contém apenas áudio pré-gravado, e não é fornecido como alternativa para conteúdo de texto, verifique se uma versão alternativa de texto está disponível.',
        'If this element contains audio that plays automatically for longer than 3 seconds, check that there is the ability to pause, stop or mute the audio.': 'Se este elemento contém áudio que é reproduzido automaticamente por mais de 3 segundos, verifique se há a capacidade de pausar, parar ou silenciar o áudio.',
        'Heading markup should be used if this content is intended as a heading.': 'Marcação de cabeçalho deve ser usada se este conteúdo for destinado como cabeçalho.',
        'Check that content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions for: Vertical scrolling content at a width equivalent to 320 CSS pixels; Horizontal scrolling content at a height equivalent to 256 CSS pixels; Except for parts of the content which require two-dimensional layout for usage or meaning.': 'Verifique se o conteúdo pode ser apresentado sem perda de informação ou funcionalidade, e sem exigir rolagem em duas dimensões para: Conteúdo de rolagem vertical em uma largura equivalente a 320 pixels CSS; Conteúdo de rolagem horizontal em uma altura equivalente a 256 pixels CSS; Exceto para partes do conteúdo que requerem layout bidimensional para uso ou significado.',
        'Check that the visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s): User Interface Components: Visual information required to identify user interface components and states, except for inactive components or where the appearance of the component is determined by the user agent and not modified by the author; Graphical Objects: Parts of graphics required to understand the content, except when a particular presentation of graphics is essential to the information being conveyed.': 'Verifique se a apresentação visual dos seguintes têm uma proporção de contraste de pelo menos 3:1 contra cor(es) adjacente(s): Componentes da Interface do Usuário: Informações visuais necessárias para identificar componentes da interface do usuário e estados, exceto para componentes inativos ou onde a aparência do componente é determinada pelo agente do usuário e não modificada pelo autor; Objetos Gráficos: Partes de gráficos necessárias para entender o conteúdo, exceto quando uma apresentação particular de gráficos é essencial para as informações sendo transmitidas.',
        'Check that no loss of content or functionality occurs by setting all of the following and by changing no other style property: Line height (line spacing) to at least 1.5 times the font size; Spacing following paragraphs to at least 2 times the font size; Letter spacing (tracking) to at least 0.12 times the font size; Word spacing to at least 0.16 times the font size.': 'Verifique se não ocorre perda de conteúdo ou funcionalidade definindo todos os seguintes e não alterando nenhuma outra propriedade de estilo: Altura da linha (espaçamento entre linhas) para pelo menos 1,5 vezes o tamanho da fonte; Espaçamento após parágrafos para pelo menos 2 vezes o tamanho da fonte; Espaçamento entre letras (rastreamento) para pelo menos 0,12 vezes o tamanho da fonte; Espaçamento entre palavras para pelo menos 0,16 vezes o tamanho da fonte.',
        'Check that where receiving and then removing pointer hover or keyboard focus triggers additional content to become visible and then hidden, the following are true: Dismissable: A mechanism is available to dismiss the additional content without moving pointer hover or keyboard focus, unless the additional content communicates an input error or does not obscure or replace other content; Hoverable: If pointer hover can trigger the additional content, then the pointer can be moved over the additional content without the additional content disappearing; Persistent: The additional content remains visible until the hover or focus trigger is removed, the user dismisses it, or its information is no longer valid.': 'Verifique se onde receber e depois remover o foco do ponteiro ou do teclado aciona conteúdo adicional para se tornar visível e depois oculto, o seguinte é verdadeiro: Dispensável: Um mecanismo está disponível para dispensar o conteúdo adicional sem mover o foco do ponteiro ou do teclado, a menos que o conteúdo adicional comunique um erro de entrada ou não oculte ou substitua outro conteúdo; Passível de foco: Se o foco do ponteiro puder acionar o conteúdo adicional, então o ponteiro pode ser movido sobre o conteúdo adicional sem que o conteúdo adicional desapareça; Persistente: O conteúdo adicional permanece visível até que o gatilho de foco ou foco seja removido, o usuário o dispense, ou suas informações não sejam mais válidas.',
        'Check that if a keyboard shortcut is implemented in content using only letter (including upper- and lower-case letters), punctuation, number, or symbol characters, then at least one of the following is true: Turn off: A mechanism is available to turn the shortcut off; Remap: A mechanism is available to remap the shortcut to use one or more non-printable keyboard characters (e.g. Ctrl, Alt, etc); Active only on focus: The keyboard shortcut for a user interface component is only active when that component has focus.': 'Verifique se se um atalho de teclado é implementado no conteúdo usando apenas letra (incluindo letras maiúsculas e minúsculas), pontuação, número ou caracteres de símbolo, então pelo menos um dos seguintes é verdadeiro: Desligar: Um mecanismo está disponível para desligar o atalho; Remapear: Um mecanismo está disponível para remapear o atalho para usar um ou mais caracteres de teclado não imprimíveis (por exemplo, Ctrl, Alt, etc); Ativo apenas no foco: O atalho de teclado para um componente da interface do usuário está ativo apenas quando esse componente tem foco.',
        'Check that for functionality that can be operated using a single pointer, at least one of the following is true: No Down-Event: The down-event of the pointer is not used to execute any part of the function; Abort or Undo: Completion of the function is on the up-event, and a mechanism is available to abort the function before completion or to undo the function after completion; Up Reversal: The up-event reverses any outcome of the preceding down-event; Essential: Completing the function on the down-event is essential.': 'Verifique se para funcionalidade que pode ser operada usando um único ponteiro, pelo menos um dos seguintes é verdadeiro: Sem evento Down: O evento down do ponteiro não é usado para executar qualquer parte da função; Anular ou Desfazer: A conclusão da função está no evento up, e um mecanismo está disponível para anular a função antes da conclusão ou para desfazer a função após a conclusão; Reversão Up: O evento up reverte qualquer resultado do evento down precedente; Essencial: Concluir a função no evento down é essencial.',
        'Check that functionality that can be operated by device motion or user motion can also be operated by user interface components and responding to the motion can be disabled to prevent accidental actuation, except when: Supported Interface: The motion is used to operate functionality through an accessibility supported interface; Essential: The motion is essential for the function and doing so would invalidate the activity.': 'Verifique se a funcionalidade que pode ser operada por movimento do dispositivo ou movimento do usuário também pode ser operada por componentes da interface do usuário e responder ao movimento pode ser desabilitado para prevenir atuação acidental, exceto quando: Interface Suportada: O movimento é usado para operar funcionalidade através de uma interface suportada por acessibilidade; Essencial: O movimento é essencial para a função e fazê-lo invalidaria a atividade.'
    };

    const translateMessage = (message) => {
        return translations[message] || message;
    };

    return results.map(result => {
        if (result && result.issues) {
            return {
                ...result,
                issues: result.issues.map(issue => ({
                    ...issue,
                    message: translateMessage(issue.message)
                }))
            };
        }
        return result;
    });
};

export const runApp = async (newFolderPath) => {
    try {
        // Limpar resultados anteriores no início
        clearPreviousResults();

        // Garantir browser limpo para cada teste
        browser = await ensureCleanBrowser();

        const allFiles = getAllFiles(newFolderPath);
        const htmlFiles = allFiles.filter(file => file.endsWith('.htm') || file.endsWith('.html'));
        
        sendProgress({ 
            type: 'info', 
            message: `Iniciando validação de ${htmlFiles.length} arquivos HTML...` 
        });

        const urlList = htmlFiles.map((file) => pa11y(file, pa11yOptions(path.basename(file).split('.')[0])));

        let results = await Promise.all(urlList);
        sendProgress({ 
            type: 'info', 
            message: 'Validação HTML concluída. Verificando estrutura de arquivos...' 
        });

        const errosFsResult = handleFsError(newFolderPath);
        sendProgress({ 
            type: 'info', 
            message: 'Validação de estrutura de arquivos concluída. Verificando IDs do toc.ncx...' 
        });

        // Validação específica dos IDs do toc.ncx
        const tocNcxValidationResult = validateTocNcxIds(newFolderPath);
        sendProgress({ 
            type: 'info', 
            message: 'Validação de IDs do toc.ncx concluída. Gerando relatório...' 
        });

        const allResults = [errosFsResult, tocNcxValidationResult, ...results];
		
		// Traduzir mensagens dos resultados W3C
		const translatedResults = translateResults(allResults);
		
        fs.writeFile(`public/results.json`, JSON.stringify(translatedResults, null, 2), err => {
            if (err) {
                console.error(err);
            }
        });
        
        fs.writeFile(`public/results.js`, 'var testResults = ' + JSON.stringify(translatedResults, null, 2), err => {
            if (err) {
                console.error(err);
            }
        });

        sendProgress({ 
            type: 'success', 
            message: 'Validação concluída! Resultados salvos com sucesso.' 
        });

        return results;
    } catch (error) {
        console.log(error);
        sendProgress({ 
            type: 'error', 
            message: `Erro durante a validação: ${error.message}` 
        });
        throw error;
    }
};

// Se executado diretamente, use o caminho padrão
if (import.meta.url === `file://${process.argv[1]}`) {
    const defaultFolderPath = `/Users/design21/Downloads/98be55cdf5b37a9c03ebb179b589f6f9`;
    runApp(defaultFolderPath);
}