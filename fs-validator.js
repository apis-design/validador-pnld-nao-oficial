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

testar('Verifica se o arquivo toc.ncx existe', () => {
    expect(path.join(basePath, 'toc.ncx')).to.be.a.file(`Não possui o arquivo ${path.join(basePath, 'toc.npx')}. 5.4 Pasta de recursos`);
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
        const fileName = parts.pop();
        const parentDirs = parts;

        if (fileName === 'cover.jpeg' && parentDirs.length === 0) {
            return;
        }

        const validDirectories = {
            '.js': 'scripts',
            '.css': 'styles',
            '.scss': 'styles',
            '.sass': 'styles',
            '.less': 'styles',
            '.styl': 'styles',
            '.ttf': 'fonts',
            '.otf': 'fonts',
            '.woff': 'fonts',
            '.woff2': 'fonts',
            '.eot': 'fonts',
            '.png': 'images',
            '.jpg': 'images',
            '.jpeg': 'images',
            '.gif': 'images',
            '.bmp': 'images',
            '.tiff': 'images',
            '.webp': 'images',
            '.svg': 'images',
            '.mp4': 'videos',
            '.avi': 'videos',
            '.mov': 'videos',
            '.wmv': 'videos',
            '.mkv': 'videos',
            '.flv': 'videos',
            '.webm': 'videos',
            '.mpeg': 'videos',
            '.mpg': 'videos',
            '.mp3': 'audios',
            '.wav': 'audios',
            '.aac': 'audios',
            '.flac': 'audios',
            '.ogg': 'audios',
            '.wma': 'audios'
        };


        const expectedDir = `resources/${validDirectories[extName]}`;
        if (validDirectories[extName] && !parentDirs.includes(validDirectories[extName])) {
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



checkNamingConventions(basePath);

const noPassedList = results.filter((i) => i.runnerExtras.status == 'not passed')

fs.writeFile('erros.json', JSON.stringify(noPassedList), {
    encoding: 'utf-8'
}, (error) => {})