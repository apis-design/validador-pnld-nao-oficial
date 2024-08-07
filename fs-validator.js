import chaiFs from 'chai-fs';
import {
    expect,
    should,
    assert
} from 'chai';

import {
    use
} from 'chai';

import path from "path"

import fs from "fs"
import mime from "mime-types"

use(chaiFs);

const basePath = 'teste'
let results = []

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


// 5.2 Nomenclatura
function checkNamingConventions(basePath) {
    function checkName(name, fullPath) {
        const invalidNameRegex = /[^a-zA-Z0-9._-]|^[0-9]/;

        if (invalidNameRegex.test(name)) {
            throw new Error(`Nome inválido encontrado: ${name} em ${fullPath}. Veja: 5.2 Nomenclatura`);
        }
    }

    function checkFileLocation(itemPath) {
        const extName = path.extname(itemPath).toLowerCase();
        const relPath = path.relative(basePath, itemPath);
        const parts = relPath.split(path.sep);
        const fileName = parts.pop(); // Remove the file name from the parts
        const parentDirs = parts; // Get all parent directories

        // Exceção para cover.jpeg na raiz
        if (fileName === 'cover.jpeg' && parentDirs.length === 0) {
            return;
        }

        // Exceção para index.html na raiz
        if (fileName === 'index.html' && parentDirs.length === 0) {
            return;
        }

        // Definindo diretórios baseados em tipos MIME
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
                    if (extName === '.css' || extName === '.scss' || extName === '.sass' || extName === '.less' || extName === '.styl') {
                        expectedDir = 'resources/styles';
                    } else if (extName === '.js') {
                        expectedDir = 'resources/scripts';
                    } else if (extName === '.html') {
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

        // Verificando se o arquivo está diretamente no diretório correto
        if (expectedDir && !parentDirs.includes(expectedDir.split('/').pop())) {
            throw new Error(`${itemPath} deve estar diretamente dentro de ${expectedDir}: encontrado em '${path.join('resources', ...parentDirs)}'`);
        }
    }

    function traverseDirectory(directoryPath) {
        const items = fs.readdirSync(directoryPath);

        items.forEach(item => {
            const itemPath = path.join(directoryPath, item);
            const stats = fs.lstatSync(itemPath);

            testar(`Verifica nomenclatura de ${item}`, () => checkName(item, itemPath));

            if (stats.isDirectory()) {
                traverseDirectory(itemPath);
            } else {
                testar(`Verifica localização de ${item}`, () => checkFileLocation(itemPath));
            }
        });
    }

    testar('Verifica se o diretório base existe', () => {
        expect(basePath).to.be.a.directory(`Não possui o diretório ${basePath}`);
    });

    traverseDirectory(basePath);
}

// 5.4 Pasta de recursos
const allowedDirectoriesInRoot = ['resources', 'content'];
testar('Verifica se as pastas na raiz são permitidas', () => {
    const rootItems = fs.readdirSync(basePath);
    rootItems.forEach(item => {
        const itemPath = path.join(basePath, item);
        if (fs.lstatSync(itemPath).isDirectory() && !allowedDirectoriesInRoot.includes(item)) {
            throw new Error(`Diretório não permitido encontrado na raiz: ${item}. Permitidos: ${allowedDirectoriesInRoot.join(', ')}. 5.4 Pasta de recursos`);
        }
    });
});

// 5.5 Criação do arquivo de Capa
testar('Verifica se o arquivo cover.jpeg existe', () => {
    expect(path.join(basePath, 'cover.jpeg')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'cover.jpeg')}. 5.5 Criação do arquivo de capa`);
});

// 5.6 Criação do arquivo de navegação
testar('Verifica se o arquivo toc.ncx existe', () => {
    expect(path.join(basePath, 'toc.ncx')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'toc.npx')}. 5.6 Criação do arquivo de navegação`);
});

// 5.7 Criação do arquivo de conteúdo
testar('Verifica se o arquivo content.opf existe', () => {
    expect(path.join(basePath, 'content.opf')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'content.opf')}. 5.7 Criação do arquivo de conteúdo`);
});

// 5.8 Criação da página principal
testar('Verifica se o arquivo index.html existe', () => {
    expect(path.join(basePath, 'index.html')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'index.html')}. 5.8 Criação da página principal`);
});

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
});



checkNamingConventions(basePath);

const noPassedList = results.filter((i) => i.runnerExtras.status == 'not passed')

fs.writeFile('erros.json', JSON.stringify(noPassedList), {
    encoding: 'utf-8'
}, (error) => {})