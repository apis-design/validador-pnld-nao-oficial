import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';

/**
 * Função utilitária testar equivalente ao utils/index.js mas standalone
 */
function testar(testDescription, testFunction, results) {
    let status;
    let errorMessage = null;

    try {
        testFunction();
        status = 'passed';
    } catch (e) {
        status = 'not passed';
        errorMessage = e.message;
    }

    return results.issues.push({
        code: testDescription,
        message: testDescription,
        type: 'notice',
        runnerExtras: {
            status: status,
            errorMessage: errorMessage,
            category: 'Validação content.opf'
        }
    });
}

/**
 * Valida se os arquivos referenciados no content.opf existem no diretório
 * @param {string} basePath - Caminho base do projeto
 * @returns {Object} Resultado da validação
 */
export function validateContentOpfFiles(basePath) {
    let results = {
        "documentTitle": "Validação de arquivos do content.opf",
        "pageUrl": basePath,
        "issues": []
    };

    try {
        // 1. Verificar se o content.opf existe
        const contentOpfPath = path.join(basePath, 'content.opf');
        if (!fs.existsSync(contentOpfPath)) {
            testar('Arquivo content.opf não encontrado', () => {
                throw new Error('Arquivo content.opf não encontrado no diretório raiz');
            }, results);
            return results;
        }

        // 2. Ler e parsear o content.opf
        const contentOpfContent = fs.readFileSync(contentOpfPath, 'utf-8');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contentOpfContent, "text/xml");

        // Verificar se houve erro no parsing
        const parseErrors = xmlDoc.getElementsByTagName("parsererror");
        if (parseErrors.length > 0) {
            testar('Erro ao parsear content.opf', () => {
                throw new Error('XML inválido no arquivo content.opf');
            }, results);
            return results;
        }

        // 3. Extrair todos os itens do manifest
        const manifest = xmlDoc.getElementsByTagName("manifest")[0];
        if (!manifest) {
            testar('Manifest não encontrado no content.opf', () => {
                throw new Error('Elemento <manifest> não encontrado no content.opf');
            }, results);
            return results;
        }

        const items = manifest.getElementsByTagName("item");
        const arquivosDoManifest = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const href = item.getAttribute("href");
            const id = item.getAttribute("id");
            const mediaType = item.getAttribute("media-type");

            if (href) {
                arquivosDoManifest.push({
                    href: href,
                    id: id,
                    mediaType: mediaType
                });
            }
        }

        // Verificação básica se existem itens no manifest
        if (arquivosDoManifest.length === 0) {
            testar('Nenhum item encontrado no manifest do content.opf', () => {
                throw new Error('Nenhum item válido encontrado no manifest do content.opf');
            }, results);
            return results;
        }

        // 4. Verificar cada arquivo referenciado
        let totalErros = 0;
        let totalArquivosVerificados = 0;
        let arquivosNaoEncontrados = []; // Array para armazenar arquivos que não existem

        arquivosDoManifest.forEach(item => {
            const href = item.href;

            // Determinar caminho completo do arquivo
            let caminhoArquivo = path.join(basePath, href);

            // Verifica existência do arquivo
            if (!fs.existsSync(caminhoArquivo)) {
                arquivosNaoEncontrados.push({
                    href: href,
                    id: item.id,
                    mediaType: item.mediaType
                });
                totalErros++;
            } else {
                totalArquivosVerificados++;
            }
        });

        // 5. Resumo final - apenas arquivos não encontrados
        if (arquivosNaoEncontrados.length > 0) {
            testar('Arquivos não encontrados no content.opf', () => {
                const resumoArquivos = arquivosNaoEncontrados.map(item =>
                    `Arquivo '${item.href}' (ID: ${item.id})`
                ).join(', ');

                results.issues.push({
                    code: 'Arquivos não encontrados',
                    message: `Arquivos referenciados no content.opf que não existem: ${resumoArquivos}`,
                    type: 'error',
                    runnerExtras: {
                        status: 'not passed',
                        arquivosNaoEncontrados: arquivosNaoEncontrados,
                        totalArquivosNaoEncontrados: arquivosNaoEncontrados.length
                    }
                });

                throw new Error(`${arquivosNaoEncontrados.length} arquivos referenciados no content.opf não foram encontrados`);
            }, results);
        } else {
            testar('Validação concluída com sucesso', () => {
                results.issues.push({
                    code: 'Sucesso',
                    message: 'Todos os arquivos referenciados no content.opf foram encontrados',
                    type: 'notice',
                    runnerExtras: {
                        status: 'passed',
                        totalItens: arquivosDoManifest.length
                    }
                });
            }, results);
        }

    } catch (error) {
        testar('Erro geral na validação do content.opf', () => {
            throw new Error(`Erro durante a validação: ${error.message}`);
        }, results);
    }

    // Se não há erros, adicionar um sucesso geral
    const hasErrors = results.issues.some(issue => issue.runnerExtras?.status === 'not passed');
    if (!hasErrors) {
        results.issues.push({
            code: 'Content.opf válido',
            message: 'O arquivo content.opf passou em todas as validações',
            type: 'notice',
            runnerExtras: {
                status: 'passed',
                errorMessage: null,
                category: 'Validação content.opf'
            }
        });
    }

    return results;
}

/**
 * Função utilitária para executar a validação standalone
 * @param {string} basePath - Caminho base do projeto
 */
export function runContentOpfValidation(basePath) {
    console.log(`Iniciando validação de arquivos do content.opf para: ${basePath}`);

    const resultado = validateContentOpfFiles(basePath);

    // Procura especificamente pelo resumo de arquivos não encontrados
    const resumoArquivosNaoEncontrados = resultado.issues.find(issue =>
        issue.runnerExtras?.arquivosNaoEncontrados && issue.runnerExtras.arquivosNaoEncontrados.length > 0
    );

    if (resumoArquivosNaoEncontrados) {
        console.log('\n❌ Arquivos não encontrados:');
        resumoArquivosNaoEncontrados.runnerExtras.arquivosNaoEncontrados.forEach((item, index) => {
            console.log(`${index + 1}. Arquivo '${item.href}' (ID: ${item.id})`);
        });
        console.log(`\nTotal: ${resumoArquivosNaoEncontrados.runnerExtras.totalArquivosNaoEncontrados} arquivos não encontrados`);
    } else {
        console.log('\n✅ Todos os arquivos do content.opf foram encontrados com sucesso!');
    }

    return resultado;
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const basePath = process.argv[2] || '/caminho/para/seu/projeto';
    runContentOpfValidation(basePath);
}