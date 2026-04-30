import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function getRelativePath(basePath, fullPath) {
    return path.relative(basePath, fullPath).replace(/\\/g, '/');
}

export function validateResourceUsage(basePath) {
    const results = {
        "documentTitle": basePath,
        "pageUrl": basePath,
        "issues": []
    };

    const resourcesPath = path.join(basePath, 'resources');
    const contentPath = path.join(basePath, 'content');

    if (!fs.existsSync(resourcesPath)) {
        results.issues.push({
            code: 'Pasta resources não encontrada',
            message: 'Pasta resources não encontrada',
            type: 'error',
            runnerExtras: {
                status: 'failed',
                errorMessage: 'A pasta resources deve existir na raiz do EPUB',
                category: 'Validação de uso de recursos'
            }
        });
        return results;
    }

    if (!fs.existsSync(contentPath)) {
        results.issues.push({
            code: 'Pasta content não encontrada',
            message: 'Pasta content não encontrada',
            type: 'error',
            runnerExtras: {
                status: 'failed',
                errorMessage: 'A pasta content deve existir na raiz do EPUB',
                category: 'Validação de uso de recursos'
            }
        });
        return results;
    }

    // Get all files in resources
    const resourceFiles = getAllFiles(resourcesPath);
    const resourceRelativePaths = resourceFiles.map(file => getRelativePath(resourcesPath, file));

    // Get all HTML files in content
    const contentFiles = getAllFiles(contentPath).filter(file => file.endsWith('.html') || file.endsWith('.htm'));

    const referencedResources = new Set();

    // Parse each HTML file
    contentFiles.forEach(htmlFile => {
        try {
            const htmlContent = fs.readFileSync(htmlFile, 'utf8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // Find all elements with src or href
            const elements = document.querySelectorAll('[src], [href]');
            elements.forEach(element => {
                const src = element.getAttribute('src');
                const href = element.getAttribute('href');
                const attr = src || href;
                if (attr) {
                    // Check if it references resources
                    if (attr.startsWith('../resources/') || attr.startsWith('resources/')) {
                        let relativeAttr = attr.replace('../resources/', '').replace('resources/', '');
                        // Normalize
                        referencedResources.add(relativeAttr);
                    }
                }
            });

            // Also check for CSS @import or url() in style tags
            const styleTags = document.querySelectorAll('style');
            styleTags.forEach(style => {
                const css = style.textContent;
                const urlMatches = css.match(/url\(['"]?([^'"]+)['"]?\)/g);
                if (urlMatches) {
                    urlMatches.forEach(match => {
                        const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)[1];
                        if (url.startsWith('../resources/') || url.startsWith('resources/')) {
                            let relativeUrl = url.replace('../resources/', '').replace('resources/', '');
                            referencedResources.add(relativeUrl);
                        }
                    });
                }
            });

            // Check linked CSS files
            const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
            linkTags.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.startsWith('../resources/') || href.startsWith('resources/'))) {
                    let relativeHref = href.replace('../resources/', '').replace('resources/', '');
                    referencedResources.add(relativeHref);
                    // Also parse the CSS file for url()
                    const cssPath = path.resolve(path.dirname(htmlFile), href);
                    if (fs.existsSync(cssPath)) {
                        try {
                            const cssContent = fs.readFileSync(cssPath, 'utf8');
                            const urlMatches = cssContent.match(/url\(['"]?([^'"]+)['"]?\)/g);
                            if (urlMatches) {
                                urlMatches.forEach(match => {
                                    const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)[1];
                                    if (!url.startsWith('http') && !url.startsWith('data:')) {
                                        let resolvedUrl = path.resolve(path.dirname(cssPath), url);
                                        let relativeUrl = path.relative(resourcesPath, resolvedUrl).replace(/\\/g, '/');
                                        referencedResources.add(relativeUrl);
                                    }
                                });
                            }
                        } catch (e) {
                            // Ignore CSS parse errors
                        }
                    }
                }
            });

        } catch (e) {
            // Ignore parse errors
        }
    });

    // Find unused resources
    const unusedResources = resourceRelativePaths.filter(res => !referencedResources.has(res));

    if (unusedResources.length > 0) {
        results.issues.push({
            code: `Recursos não utilizados encontrados: ${unusedResources.length}`,
            message: `Os seguintes recursos não estão sendo utilizados nos arquivos HTML: ${unusedResources.join(', ')}`,
            type: 'warning',
            runnerExtras: {
                status: 'failed',
                errorMessage: `Recursos não utilizados: ${unusedResources.join(', ')}`,
                category: 'Validação de uso de recursos'
            }
        });
    } else {
        results.issues.push({
            code: 'Todos os recursos estão sendo utilizados',
            message: 'Todos os recursos na pasta resources estão sendo referenciados nos arquivos HTML',
            type: 'notice',
            runnerExtras: {
                status: 'passed',
                errorMessage: null,
                category: 'Validação de uso de recursos'
            }
        });
    }

    return results;
}