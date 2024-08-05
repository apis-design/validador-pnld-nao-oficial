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

const errors = [];

const folderPath = 'teste'

function checkDirectoryAndSubDirs(basePath, subDirs, files) {

    try {
        expect(basePath).to.be.a.directory(`Não possui o diretório ${basePath}`);
    } catch (error) {
        errors.push(error.message);
    }

    subDirs.forEach(subDir => {
        const fullPath = path.join(basePath, subDir);
        try {
            expect(fullPath).to.be.a.directory(`Não possui o diretório ${fullPath}`);
        } catch (error) {
            errors.push(error.message);
        }
    });

    files.forEach(file => {
        const fullPath = path.join(basePath, file);
        try {
            expect(fullPath).to.be.a.file(`Não possui o arquivo ${fullPath}`);
        } catch (error) {
            errors.push(error.message);
        }
    });

    if (errors.length > 0) {
        `Foram encontrados os seguintes erros:\n${errors.join('\n')}`
    }
}

const filesToCheck = ['index.html', 'toc.npx', 'content.opf', 'cover.jpg'];
const dirsToCheck = ['resources', 'content', 'resources/images', 'resources/scripts', 'resources/styles', 'resources/videos', 'resources/audios', 'resources/extras'];

checkDirectoryAndSubDirs(folderPath, [], filesToCheck);
checkDirectoryAndSubDirs(folderPath, dirsToCheck, [])

// 5.2 Nomenclatura
// 5.2.1 Nomenclatura de pastas
// Todas as pastas adicionadas ao projeto deverão ser nomeadas utilizando caracteres
// minúsculos, sem caracteres especiais e/ou acentos e separados por linha baixa "_" (underline),
// não sendo permitido iniciar o nome com números.
const invalidNameRegex = /[^a-z0-9_]|^[0-9]/;

function checkNamingConventions(basePath) {
    function checkName(name, fullPath) {
        if (invalidNameRegex.test(name)) {
            errors.push(`Nome inválido encontrado: ${name} em ${fullPath}`);
        }
    }

    function traverseDirectory(directoryPath) {
        const items = fs.readdirSync(directoryPath);

        items.forEach(item => {
            const itemPath = path.join(directoryPath, item);
            const stats = fs.lstatSync(itemPath);

            checkName(item, itemPath);

            if (stats.isDirectory()) {
                traverseDirectory(itemPath);
            }
        });
    }

    try {
        expect(basePath).to.be.a.directory(`Não possui o diretório ${basePath}`);
        traverseDirectory(basePath);
    } catch (error) {
        errors.push(error.message);
    }

    if (errors.length > 0) {
        console.error(`Foram encontrados os seguintes erros:\n${errors.join('\n')}`);
        `Foram encontrados os seguintes erros:\n${errors.join('\n')}`;
    } else {
        console.log('Todos os nomes estão em conformidade.');
    }
}

checkNamingConventions(folderPath);


console.log(errors)