import fs from 'fs';
import path from 'path';

function getFolders(dirPath) {
    return fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .flatMap(entry => {
            const fullPath = path.join(dirPath, entry.name);
            return [fullPath, ...getFolders(fullPath)];
        });
}

export function validateFolderHyphens(basePath) {
    const results = {
        documentTitle: basePath,
        pageUrl: basePath,
        issues: []
    };

    const resourcesPath = path.join(basePath, 'resources');
    if (!fs.existsSync(resourcesPath)) return results;

    getFolders(resourcesPath)
        .filter(folder => path.basename(folder).includes('-'))
        .forEach(folder => {
            const relativePath = path.relative(basePath, folder).replace(/\\/g, '/');
            results.issues.push({
                code: 'Hífen no nome da pasta',
                message: `A pasta ${relativePath} possui hífen (-) no nome`,
                type: 'error',
                runnerExtras: {
                    status: 'failed',
                    errorMessage: `O nome da pasta não deve conter hífen (-): ${relativePath}`,
                    category: 'Validação de nomes de pastas'
                }
            });
        });

    return results;
}
