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

// 5.4 Pasta de recursos
testar('Verifica se o arquivo index.html existe', () => {
    expect(path.join(basePath, 'index.html')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'index.html')}. 5.4 Pasta de recursos`);
});

testar('Verifica se o arquivo toc.npx existe', () => {
    expect(path.join(basePath, 'toc.npx')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'toc.npx')}. 5.4 Pasta de recursos`);
});

testar('Verifica se o arquivo content.opf existe', () => {
    expect(path.join(basePath, 'content.opf')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'content.opf')}. 5.4 Pasta de recursos`);
});

testar('Verifica se o arquivo cover.jpeg existe', () => {
    expect(path.join(basePath, 'cover.jpeg')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'cover.jpeg')}. 5.4 Pasta de recursos`);
});

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

const allowedDirectoriesInResources = ['images', 'scripts', 'styles', 'videos', 'audios', 'extras']
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

// 5.2 Nomenclatura
function checkNamingConventions(basePath) {
    function checkName(name, fullPath) {
        const invalidNameRegex = /[^a-zA-Z0-9._-]|^[0-9]/;

        if (invalidNameRegex.test(name)) {
            throw new Error(`Nome inválido encontrado: ${name} em ${fullPath}. Veja: 5.2 Nomenclatura`);
        }
    }

    function checkFileLocation(itemPath) {
        const relPath = path.relative(basePath, itemPath);
        const extName = path.extname(itemPath);
        const dirName = path.dirname(relPath);

        const exceptions = ['resources/extras'];
        if (exceptions.some(exc => dirName.startsWith(exc))) {
            return;
        }

        switch (extName) {
            case '.js':
                expect(dirName).to.be.oneOf(['resources/scripts'], `${itemPath} deve estar dentro de resources/scripts`);
                break;
            case '.css':
            case '.scss':
            case '.sass':
            case '.less':
            case '.styl':
                expect(dirName).to.be.oneOf(['resources/styles'], `${itemPath} deve estar dentro de resources/styles`);
                break;
            case '.ttf':
            case '.otf':
            case '.woff':
            case '.woff2':
            case '.eot':
                expect(dirName).to.be.oneOf(['resources/fontes'], `${itemPath} deve estar dentro de resources/fontes`);
                break;
            case '.png':
            case '.jpg':
            case '.jpeg':
            case '.gif':
            case '.bmp':
            case '.tiff':
            case '.webp':
            case '.svg':
                expect(dirName).to.be.oneOf(['resources/images'], `${itemPath} deve estar dentro de resources/images`);
                break;
            case '.mp4':
            case '.avi':
            case '.mov':
            case '.wmv':
            case '.mkv':
            case '.flv':
            case '.webm':
            case '.mpeg':
            case '.mpg':
                expect(dirName).to.be.oneOf(['resources/videos'], `${itemPath} deve estar dentro de resources/videos`);
                break;
            case '.mp3':
            case '.wav':
            case '.aac':
            case '.flac':
            case '.ogg':
            case '.wma':
                expect(dirName).to.be.oneOf(['resources/audios'], `${itemPath} deve estar dentro de resources/audios`);
                break;
            default:
                break;
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



checkNamingConventions(basePath);

const noPassedList = results.filter((i) => i.runnerExtras.status == 'not passed')

fs.writeFile('erros.json', JSON.stringify(noPassedList), {
    encoding: 'utf-8'
}, (error) => {})