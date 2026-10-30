import fs from 'fs';
import path from 'path';

function getEntries(dirPath) {
    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dirPath, entry.name);
        const children = entry.isDirectory() ? getEntries(fullPath) : [];
        return [{ fullPath, isDirectory: entry.isDirectory() }, ...children];
    });
}

export function validateSpecialCharactersInNames(basePath) {
    const results = {
        documentTitle: basePath,
        pageUrl: basePath,
        issues: []
    };

    const resourcesPath = path.join(basePath, 'resources');
    if (!fs.existsSync(resourcesPath)) return results;

    getEntries(resourcesPath).forEach(entry => {
        const fullName = path.basename(entry.fullPath);
        const extension = entry.isDirectory ? '' : path.extname(fullName);
        const name = fullName.slice(0, fullName.length - extension.length);
        const invalidCharacters = [...new Set(name.match(/[^A-Za-z0-9_]/g))];
        if (invalidCharacters.length === 0) return;

        const relativePath = path.relative(basePath, entry.fullPath).replace(/\\/g, '/');
        const kind = entry.isDirectory ? 'a pasta' : 'o arquivo';
        const characters = invalidCharacters.map(character => `"${character}"`).join(', ');
        results.issues.push({
            code: 'Caractere especial no nome',
            message: `${kind[0].toUpperCase()}${kind.slice(1)} ${relativePath} possui caracteres especiais no nome: ${characters}`,
            type: 'error',
            runnerExtras: {
                status: 'failed',
                errorMessage: `O nome d${kind} deve conter apenas letras sem acento, números e sublinhado (_). Caracteres encontrados: ${characters} em ${relativePath}`,
                category: 'Validação de caracteres especiais em nomes'
            }
        });
    });

    return results;
}
