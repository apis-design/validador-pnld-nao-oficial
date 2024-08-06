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

testar('Verifica se o diretório base existe', () => {
    expect(basePath).to.be.a.directory(`Não possui o diretório ${basePath}`);
});

// 5.1 Estrutura
testar('Verifica se o diretório resources existe', () => {
    expect(path.join(basePath, 'resources')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources')}.  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório content existe', () => {
    expect(path.join(basePath, 'content')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'content')}  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório resources/images existe', () => {
    expect(path.join(basePath, 'resources/images')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources/images')}.  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório resources/scripts existe', () => {
    expect(path.join(basePath, 'resources/scripts')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources/scripts')}.  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório resources/styles existe', () => {
    expect(path.join(basePath, 'resources/styles')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources/styles')}.  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório resources/videos existe', () => {
    expect(path.join(basePath, 'resources/videos')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources/videos')}.  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório resources/audios existe', () => {
    expect(path.join(basePath, 'resources/audios')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources/audios')}.  Veja: 5.1 Estrutura`);
});

testar('Verifica se o diretório resources/extras existe', () => {
    expect(path.join(basePath, 'resources/extras')).to.be.a.directory(`Não possui o diretório ${path.join(basePath, 'resources/extras')}.  Veja: 5.1 Estrutura`);
});

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

// 5.2 Nomenclatura
// 5.2.1 Nomenclatura de pastas / arquivo

function checkNamingConventions(basePath) {
    function checkName(name, fullPath) {
        const invalidNameRegex = /[^a-z0-9_]|^[0-9]/;

        if (invalidNameRegex.test(name)) {
            // Lança o erro para ser capturado por `testar`
            throw new Error(`Nome inválido encontrado: ${name} em ${fullPath}. Veja: 5.2 Nomenclatura`);
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
            }
        });
    }

    testar('Verifica se o diretório base existe', () => {
        expect(basePath).to.be.a.directory(`Não possui o diretório ${basePath}`);
    });

    traverseDirectory(basePath);
}



checkNamingConventions(basePath);


console.log(results)