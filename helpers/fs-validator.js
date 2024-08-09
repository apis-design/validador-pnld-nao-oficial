import chaiFs from 'chai-fs';
import {
    expect
} from 'chai';

import {
    use
} from 'chai';
import path from "path"

import fs from "fs"
import mime from "mime-types"
import {
    testar
} from '../utils/index.js';


use(chaiFs);

export default function handleFsError(basePath) {
    let results = {
        "documentTitle": basePath,
        "pageUrl": basePath,
        "issues": []
    }
    // 5.1 Estrutura
    const allowedDirectoriesInRoot = ['resources', 'content'];
    testar('Verifica se as pastas na raiz são permitidas', () => {
        const rootItems = fs.readdirSync(basePath);
        rootItems.forEach(item => {
            const itemPath = path.join(basePath, item);
            if (fs.lstatSync(itemPath).isDirectory() && !allowedDirectoriesInRoot.includes(item)) {
                throw new Error(`Diretório não permitido encontrado na raiz: ${item}. Permitidos: ${allowedDirectoriesInRoot.join(', ')}. 5.1 Estrutura`);
            }
        });
    }, results);

    const allowedFilesInRoot = ['index.html', 'cover.jpeg', 'toc.ncx', 'content.opf'];
    testar('Verifica se os arquivos na raiz são permitidos', () => {
        const rootItems = fs.readdirSync(basePath);
        rootItems.forEach(item => {
            const itemPath = path.join(basePath, item);
            if (fs.lstatSync(itemPath).isFile() && !allowedFilesInRoot.includes(item)) {
                throw new Error(`Arquivo não permitido encontrado na raiz: ${item}. Permitidos: ${allowedFilesInRoot.join(', ')}. 5.1 Estrutura`);
            }
        });
    }, results);


    function handleFolderAndFileError(basePath) {
        // 5.2 Nomenclatura
        function checkName(name, fullPath) {
            const invalidNameRegex = /[^a-zA-Z0-9._-]|^[0-9]/;

            if (invalidNameRegex.test(name)) {
                throw new Error(`Nome inválido encontrado: ${name} em ${fullPath}. 5.2 Nomenclatura: Todas as pastas adicionadas ao projeto deverão ser nomeadas utilizando caracteres minúsculos, sem caracteres especiais e/ou acentos e separados por linha baixa "_" (underline), não sendo permitido iniciar o nome com números.`);
            }
        }

        // 5.3 Pasta de conteúdo || 5.4 Pasta de recursos
        function checkFileLocation(itemPath) {
            const extName = path.extname(itemPath).toLowerCase();
            const relPath = path.relative(basePath, itemPath);
            const parts = relPath.split(path.sep);
            const fileName = parts.pop();
            const parentDirs = parts;

            // Exceção para cover.jpeg na raiz
            if (fileName === 'cover.jpeg' && parentDirs.length === 0) {
                return;
            }

            // Exceção para index.html na raiz
            if (fileName === 'index.html' && parentDirs.length === 0) {
                return;
            }

            const mimeType = mime.lookup(extName);
            let expectedDir;

            if (mimeType) {
                switch (mimeType.split('/')[0]) {
                    case 'image':
                        expectedDir = 'resources/images';
                        break;
                    case 'video':
                        expectedDir = 'resources/videos';
                        break;
                    case 'audio':
                        expectedDir = 'resources/audios';
                        break;
                    case 'font':
                        expectedDir = 'resources/fonts';
                        break;
                    case 'text':
                    case 'application':
                        if (['.css', '.scss', '.sass', '.less', '.styl'].includes(extName)) {
                            expectedDir = 'resources/styles';
                        } else if (extName === '.js') {
                            expectedDir = 'resources/scripts';
                        } else if (['.html', '.htm', '.xhtml', '.phtml'].includes(extName)) {
                            expectedDir = 'resources/content';
                        }
                        break;
                    default:
                        expectedDir = null;
                        break;
                }
            } else {
                expectedDir = null;
            }

            if (['.html', '.htm', '.xhtml', '.phtml'].includes(extName)) {
                // 5.3 Pasta de conteúdo
                if (expectedDir && !parentDirs.includes(expectedDir.split('/').pop())) {
                    throw new Error(`${itemPath} deve estar diretamente dentro de ${expectedDir}: encontrado em '${path.join('resources', ...parentDirs)}'. 5.3 Pasta de conteúdo. Na pasta de conteúdo deverá ter apenas as páginas em HTML que representam o conteúdo da obra.`);
                }
            } else {
                // 5.4 Pasta de recursos
                if (expectedDir && !parentDirs.includes(expectedDir.split('/').pop())) {
                    throw new Error(`${itemPath} deve estar diretamente dentro de ${expectedDir}: encontrado em '${path.join('resources', ...parentDirs)}'. 5.4 Pasta de recursos. A estrutura principal de recursos deverá ser mantida de acordo com a necessidade do projeto, sendo que todos os recursos devem ser alocados dentro de suas respectivas pastas.`);
                }
            }
        }

        function traverseDirectory(directoryPath) {
            const items = fs.readdirSync(directoryPath);

            items.forEach(item => {
                const itemPath = path.join(directoryPath, item);
                const stats = fs.lstatSync(itemPath);

                testar(`Verifica nomenclatura de ${item}`, () => checkName(item, itemPath), results);

                if (stats.isDirectory()) {
                    traverseDirectory(itemPath);
                } else {
                    testar(`Verifica localização de ${item}`, () => checkFileLocation(itemPath), results);
                }
            });
        }

        testar('Verifica se o diretório base existe', () => {
            expect(basePath).to.be.a.directory(`Não possui o diretório ${basePath}`)
        }, results);

        traverseDirectory(basePath);
    }

    // 5.5 Criação do arquivo de Capa
    testar('Verifica se o arquivo cover.jpeg existe', () => {
        expect(path.join(basePath, 'cover.jpeg')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'cover.jpeg')}. 5.5 Criação do arquivo de capa`)
    }, results);

    // 5.6 Criação do arquivo de navegação
    testar('Verifica se o arquivo toc.ncx existe', () => {
        expect(path.join(basePath, 'toc.ncx')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'toc.npx')}. 5.6 Criação do arquivo de navegação`)
    }, results);

    // 5.7 Criação do arquivo de conteúdo
    testar('Verifica se o arquivo content.opf existe', () => {
        expect(path.join(basePath, 'content.opf')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'content.opf')}. 5.7 Criação do arquivo de conteúdo`)
    }, results);

    // 5.8 Criação da página principal
    testar('Verifica se o arquivo index.html existe', () => {
        expect(path.join(basePath, 'index.html')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'index.html')}. 5.8 Criação da página principal`)
    }, results);

    const allowedDirectoriesInResources = ['images', 'scripts', 'styles', 'videos', 'audios', 'fonts', 'extras']
    testar('Verifica se as pastas no resources são permitidas', () => {
        const resourcesPath = path.join(basePath, 'resources');
        const rootItems = fs.readdirSync(resourcesPath);
        rootItems.forEach(item => {
            const itemPath = path.join(resourcesPath, item);
            if (fs.lstatSync(itemPath).isDirectory() && !allowedDirectoriesInResources.includes(item)) {
                throw new Error(`Diretório não permitido encontrado em resources: ${item}. Permitidos: ${allowedDirectoriesInResources.join(', ')}. 5.4 Pasta de recursos`);
            }
        });
    }, results);



    handleFolderAndFileError(basePath);

    return results
}