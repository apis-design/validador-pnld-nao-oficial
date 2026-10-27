import fs from 'fs';
import path from 'path';

function getEntries(dirPath) {
    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dirPath, entry.name);
        const children = entry.isDirectory() ? getEntries(fullPath) : [];
        return [{ fullPath, isDirectory: entry.isDirectory() }, ...children];
    });
}

export function validateSpacesInNames(basePath) {
    const results = {
        documentTitle: basePath,
        pageUrl: basePath,
        issues: []
    };

    const resourcesPath = path.join(basePath, 'resources');
    if (!fs.existsSync(resourcesPath)) return results;

    getEntries(resourcesPath)
        .filter(entry => path.basename(entry.fullPath).includes(' '))
        .forEach(entry => {
            const relativePath = path.relative(basePath, entry.fullPath).replace(/\\/g, '/');
            const kind = entry.isDirectory ? 'a pasta' : 'o arquivo';
            results.issues.push({
                code: 'Espaço no nome',
                message: `${kind[0].toUpperCase()}${kind.slice(1)} ${relativePath} possui espaço no nome`,
                type: 'error',
                runnerExtras: {
                    status: 'failed',
                    errorMessage: `O nome d${kind} não deve conter espaço: ${relativePath}`,
                    category: 'Validação de espaços em nomes'
                }
            });
        });

    return results;
}
