import fs from 'fs';
import path from 'path';

function getFiles(dirPath) {
    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dirPath, entry.name);
        return entry.isDirectory() ? getFiles(fullPath) : [fullPath];
    });
}

export function validateAssetNamesStartingWithNumber(basePath) {
    const results = {
        documentTitle: basePath,
        pageUrl: basePath,
        issues: []
    };

    const resourcesPath = path.join(basePath, 'resources');
    if (!fs.existsSync(resourcesPath)) return results;

    getFiles(resourcesPath)
        .filter(file => !/\.(html?|xhtml)$/i.test(file))
        .filter(file => /^\d/.test(path.basename(file)))
        .forEach(file => {
            const relativePath = path.relative(basePath, file).replace(/\\/g, '/');
            results.issues.push({
                code: 'Asset começa com número',
                message: `O arquivo ${relativePath} começa com número`,
                type: 'error',
                runnerExtras: {
                    status: 'failed',
                    errorMessage: `O nome do arquivo não deve começar com número: ${relativePath}`,
                    category: 'Validação de nomes de assets'
                }
            });
        });

    return results;
}
