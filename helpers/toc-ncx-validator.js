import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';

/**
 * Função utilitária testar equivalente ao utils/index.js mas standalone
 */
function testar(testDescription, testFunction, results) {
    let status;
    let errorMessage = null;

    try {
        testFunction()
        status = 'passed';
    } catch (e) {
        status = 'not passed';
        errorMessage = e.message
    }

    return results.issues.push({
        code: testDescription,
        message: testDescription,
        type: 'notice',
        runnerExtras: {
            status: status,
            errorMessage: errorMessage,
            category: 'Validação toc.ncx'
        }
    });
}

/**
 * Valida se os IDs referenciados no toc.ncx existem nos arquivos HTML correspondentes
 * @param {string} basePath - Caminho base do projeto
 * @returns {Object} Resultado da validação
 */
export function validateTocNcxIds(basePath) {
    let results = {
        "documentTitle": "Validação de IDs do toc.ncx",
        "pageUrl": basePath,
        "issues": []
    };

    try {
        // 1. Verificar se o toc.ncx existe
        const tocNcxPath = path.join(basePath, 'toc.ncx');
        if (!fs.existsSync(tocNcxPath)) {
            testar('Arquivo toc.ncx não encontrado', () => {
                throw new Error('Arquivo toc.ncx não encontrado no diretório raiz');
            }, results);
            return results;
        }

        // 2. Ler e parsear o toc.ncx
        const tocNcxContent = fs.readFileSync(tocNcxPath, 'utf-8');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(tocNcxContent, "text/xml");

        // Verificar se houve erro no parsing
        const parseErrors = xmlDoc.getElementsByTagName("parsererror");
        if (parseErrors.length > 0) {
            testar('Erro ao parsear toc.ncx', () => {
                throw new Error('XML inválido no arquivo toc.ncx');
            }, results);
            return results;
        }

        // 3. Extrair todos os navPoints e seus links
        const navPoints = xmlDoc.getElementsByTagName("navPoint");
        const linksDoToc = [];

        for (let i = 0; i < navPoints.length; i++) {
            const navPoint = navPoints[i];
            const contentElement = navPoint.getElementsByTagName("content")[0];
            
            if (contentElement) {
                const src = contentElement.getAttribute("src");
                if (src) {
                    let arquivo = src;
                    let targetId = null;
                    
                    // Separa arquivo e âncora
                    if (src.includes('#')) {
                        const partes = src.split('#');
                        arquivo = partes[0];
                        targetId = partes[1];
                    }

                    const labelElement = navPoint.getElementsByTagName("text")[0];
                    const label = labelElement ? labelElement.textContent : "Sem label";

                    linksDoToc.push({
                        src: src,
                        arquivo: arquivo,
                        targetId: targetId,
                        navPointId: navPoint.getAttribute("id"),
                        playOrder: navPoint.getAttribute("playOrder"),
                        label: label
                    });
                }
            }
        }

        // Verificação básica se existem links (sem adicionar ao output)
        if (linksDoToc.length === 0) {
            testar('Nenhum link encontrado no toc.ncx', () => {
                throw new Error('Nenhum link válido encontrado no toc.ncx');
            }, results);
            return results;
        }

        // 4. Agrupar links por arquivo
        const linksPorArquivo = {};
        linksDoToc.forEach(link => {
            if (!linksPorArquivo[link.arquivo]) {
                linksPorArquivo[link.arquivo] = [];
            }
            linksPorArquivo[link.arquivo].push(link);
        });

        // 5. Verificar cada arquivo HTML referenciado
        let totalErros = 0;
        let totalArquivosVerificados = 0;
        let idsNaoEncontrados = []; // Array para armazenar IDs que não existem

        Object.keys(linksPorArquivo).forEach(nomeArquivo => {
            const linksDoArquivo = linksPorArquivo[nomeArquivo];
            
            // Determinar caminho completo do arquivo
            let caminhoArquivo = path.join(basePath, nomeArquivo);
            
            // Se não existir na raiz, procurar na pasta content
            if (!fs.existsSync(caminhoArquivo)) {
                caminhoArquivo = path.join(basePath, 'content', nomeArquivo);
            }

            // Verifica existência do arquivo sem adicionar teste individual ao output
            if (!fs.existsSync(caminhoArquivo)) {
                testar(`Arquivo não encontrado: ${nomeArquivo}`, () => {
                    throw new Error(`Arquivo ${nomeArquivo} referenciado no toc.ncx não foi encontrado`);
                }, results);
                totalErros++;
                return; // Pula para o próximo arquivo
            }

            totalArquivosVerificados++;

            // 6. Ler e analisar o arquivo HTML
            try {
                const htmlContent = fs.readFileSync(caminhoArquivo, 'utf-8');
                const dom = new JSDOM(htmlContent);
                const document = dom.window.document;

                // Coletar todos os IDs disponíveis no HTML
                const idsDisponiveis = new Set();
                const elementosComId = document.querySelectorAll('[id]');
                elementosComId.forEach(elemento => {
                    const id = elemento.getAttribute('id');
                    if (id && id.trim() !== '') {
                        idsDisponiveis.add(id);
                    }
                });

                // 7. Verificar cada link que aponta para este arquivo
                linksDoArquivo.forEach(link => {
                    if (link.targetId) {
                        // Link tem âncora - verificar se o ID existe
                        if (!idsDisponiveis.has(link.targetId)) {
                            // Adiciona ao array de IDs não encontrados
                            idsNaoEncontrados.push({
                                id: link.targetId,
                                arquivo: nomeArquivo,
                                label: link.label,
                                navPointId: link.navPointId,
                                playOrder: link.playOrder
                            });
                            totalErros++;
                        }
                        
                        // Removido teste individual para reduzir output - apenas coleta erros para o resumo
                    }
                });

                // Estatísticas removidas para simplificar o output

            } catch (error) {
                totalErros++;
                testar(`Erro ao processar ${nomeArquivo}`, () => {
                    throw new Error(`Erro ao ler/processar arquivo ${nomeArquivo}: ${error.message}`);
                }, results);
            }
        });

        // 8. Resumo final - apenas IDs não encontrados
        if (idsNaoEncontrados.length > 0) {
            testar('IDs não encontrados no toc.ncx', () => {
                const resumoIds = idsNaoEncontrados.map(item => 
                    `ID '${item.id}' no arquivo '${item.arquivo}' (${item.label})`
                ).join(', ');
                
                results.issues.push({
                    code: 'IDs não encontrados',
                    message: `IDs referenciados no toc.ncx que não existem nos arquivos: ${resumoIds}`,
                    type: 'error',
                    runnerExtras: {
                        status: 'not passed',
                        idsNaoEncontrados: idsNaoEncontrados,
                        totalIdsNaoEncontrados: idsNaoEncontrados.length
                    }
                });

                throw new Error(`${idsNaoEncontrados.length} IDs referenciados no toc.ncx não foram encontrados`);
            }, results);
        } else {
            testar('Validação concluída com sucesso', () => {
                results.issues.push({
                    code: 'Sucesso',
                    message: 'Todos os IDs referenciados no toc.ncx foram encontrados nos arquivos correspondentes',
                    type: 'notice',
                    runnerExtras: {
                        status: 'passed',
                        totalLinks: linksDoToc.length,
                        totalArquivos: Object.keys(linksPorArquivo).length
                    }
                });
            }, results);
        }

    } catch (error) {
        testar('Erro geral na validação do toc.ncx', () => {
            throw new Error(`Erro durante a validação: ${error.message}`);
        }, results);
    }

    return results;
}

/**
 * Função utilitária para executar a validação standalone
 * @param {string} basePath - Caminho base do projeto
 */
export function runTocNcxValidation(basePath) {
    console.log(`Iniciando validação de IDs do toc.ncx para: ${basePath}`);
    
    const resultado = validateTocNcxIds(basePath);
    
    // Procura especificamente pelo resumo de IDs não encontrados
    const resumoIdsNaoEncontrados = resultado.issues.find(issue => 
        issue.runnerExtras?.idsNaoEncontrados && issue.runnerExtras.idsNaoEncontrados.length > 0
    );
    
    if (resumoIdsNaoEncontrados) {
        console.log('\n❌ IDs não encontrados:');
        resumoIdsNaoEncontrados.runnerExtras.idsNaoEncontrados.forEach((item, index) => {
            console.log(`${index + 1}. ID '${item.id}' no arquivo '${item.arquivo}' - ${item.label}`);
        });
        console.log(`\nTotal: ${resumoIdsNaoEncontrados.runnerExtras.totalIdsNaoEncontrados} IDs não encontrados`);
    } else {
        console.log('\n✅ Todos os IDs do toc.ncx foram encontrados com sucesso!');
    }
    
    return resultado;
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const basePath = process.argv[2] || '/caminho/para/seu/projeto';
    runTocNcxValidation(basePath);
}