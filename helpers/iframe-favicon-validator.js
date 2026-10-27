import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

function getHtmlFiles(dirPath) {
    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) return getHtmlFiles(fullPath);
        return /\.(html?|xhtml)$/i.test(entry.name) ? [fullPath] : [];
    });
}

export function validateIframeSvgFavicon(basePath) {
    const results = {
        documentTitle: basePath,
        pageUrl: basePath,
        issues: []
    };

    const resourcesPath = path.join(basePath, 'resources');
    if (!fs.existsSync(resourcesPath)) return results;

    getHtmlFiles(resourcesPath).forEach(htmlFile => {
        const document = new JSDOM(fs.readFileSync(htmlFile, 'utf8')).window.document;
        const faviconLinks = [...document.querySelectorAll('link[href]')].filter(link =>
            link.getAttribute('rel').toLowerCase().split(/\s+/).includes('icon') &&
            link.getAttribute('type') === 'image/svg+xml' &&
            link.getAttribute('href') === 'favicon.svg'
        );
        if (faviconLinks.length === 0) return;

        const relativePath = path.relative(basePath, htmlFile).replace(/\\/g, '/');
        results.issues.push({
            code: 'Favicon SVG não removido',
            message: `O HTML ${relativePath} ainda contém <link rel="icon" type="image/svg+xml" href="favicon.svg" />`,
            type: 'error',
            runnerExtras: {
                status: 'failed',
                errorMessage: `O link do favicon.svg deve ser removido do HTML: ${relativePath}`,
                category: 'Validação de favicon dos iframes'
            }
        });
    });

    return results;
}
