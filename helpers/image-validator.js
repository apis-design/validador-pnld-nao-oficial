import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Utility function to process tasks with concurrency limit
async function processWithConcurrencyLimit(tasks, concurrencyLimit) {
    const results = [];
    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
        const batch = tasks.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch.map(task => task()));
        results.push(...batchResults);
    }
    return results;
}

/**
 * Função utilitária testar
 */
function testar(testDescription, testFunction, results) {
    let status;
    let errorMessage = null;

    try {
        testFunction();
        status = 'passed';
    } catch (e) {
        status = 'not passed';
        errorMessage = e.message;
    }

    return results.issues.push({
        code: testDescription,
        message: testDescription,
        type: 'notice',
        runnerExtras: {
            status: status,
            errorMessage: errorMessage,
            category: 'Validação de imagens'
        }
    });
}

/**
 * Valida o DPI das imagens no diretório resources/images
 * @param {string} basePath - Caminho base do projeto
 * @returns {Object} Resultado da validação
 */
export async function validateImageDPI(basePath) {
    let results = {
        "documentTitle": "Validação de DPI das imagens",
        "pageUrl": basePath,
        "issues": []
    };

    const imagesDir = path.join(basePath, 'resources', 'images');

    if (!fs.existsSync(imagesDir)) {
        testar('Diretório de imagens não encontrado', () => {
            throw new Error('Diretório resources/images não existe');
        }, results);
        return results;
    }

    const imageFiles = fs.readdirSync(imagesDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext);
    });

    if (imageFiles.length === 0) {
        testar('Nenhuma imagem encontrada', () => {
            throw new Error('Nenhuma imagem encontrada no diretório resources/images');
        }, results);
        return results;
    }

    for (const imageFile of imageFiles) {
        const imagePath = path.join(imagesDir, imageFile);

        try {
            const metadata = await sharp(imagePath).metadata();
            const density = metadata.density || 72; // Default DPI se não especificado

            testar(`DPI da imagem ${imageFile} deve ser pelo menos 300`, () => {
                if (density < 300) {
                    throw new Error(`Imagem ${imageFile} tem DPI de ${density}, mínimo requerido é 300`);
                }
            }, results);
        } catch (error) {
            testar(`Erro ao processar imagem ${imageFile}`, () => {
                throw new Error(`Erro ao ler metadados da imagem ${imageFile}: ${error.message}`);
            }, results);
        }
    }

    return results;
}

/**
 * Ajusta o DPI das imagens para 300 se necessário
 * @param {string} basePath - Caminho base do projeto
 * @param {string} outputDir - Diretório de saída para imagens ajustadas
 * @returns {Object} Resultado do processamento
 */
export async function adjustImageDPI(basePath, outputDir) {
    const results = {
        processed: [],
        errors: []
    };

    const imagesDir = path.join(basePath, 'resources', 'images');

    if (!fs.existsSync(imagesDir)) {
        results.errors.push('Diretório resources/images não existe');
        return results;
    }

    const imageFiles = fs.readdirSync(imagesDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext);
    });

    const tasks = [];

    for (const imageFile of imageFiles) {
        const inputPath = path.join(imagesDir, imageFile);
        const outputPath = path.join(outputDir, imageFile);

        const task = async () => {
            try {
                const metadata = await sharp(inputPath).metadata();
                const currentDensity = metadata.density || 72;
                const ext = path.extname(imageFile).toLowerCase();

                if (currentDensity < 300) {
                    // Ajustar DPI para 300, preservando o formato original
                    let sharpInstance = sharp(inputPath).withMetadata({ density: 300 });
                    
                    // Preservar formato original para manter transparência em PNGs
                    if (ext === '.png') {
                        sharpInstance = sharpInstance.png();
                    } else if (ext === '.webp') {
                        sharpInstance = sharpInstance.webp({ quality: 95 });
                    } else if (ext === '.gif') {
                        sharpInstance = sharpInstance.gif();
                    } else if (ext === '.tiff') {
                        sharpInstance = sharpInstance.tiff();
                    } else {
                        sharpInstance = sharpInstance.jpeg({ quality: 95 });
                    }
                    
                    await sharpInstance.toFile(outputPath);

                    return {
                        file: imageFile,
                        originalDPI: currentDensity,
                        newDPI: 300
                    };
                } else {
                    // Copiar sem alteração, preservando formato original
                    let sharpInstance = sharp(inputPath);
                    
                    if (ext === '.png') {
                        sharpInstance = sharpInstance.png();
                    } else if (ext === '.webp') {
                        sharpInstance = sharpInstance.webp({ quality: 95 });
                    } else if (ext === '.gif') {
                        sharpInstance = sharpInstance.gif();
                    } else if (ext === '.tiff') {
                        sharpInstance = sharpInstance.tiff();
                    } else {
                        sharpInstance = sharpInstance.jpeg({ quality: 95 });
                    }
                    
                    await sharpInstance.toFile(outputPath);

                    return {
                        file: imageFile,
                        originalDPI: currentDensity,
                        newDPI: currentDensity
                    };
                }
            } catch (error) {
                return {
                    file: imageFile,
                    error: error.message,
                    isError: true
                };
            }
        };

        tasks.push(task);
    }

    // Processar com limite de concorrência
    const taskResults = await processWithConcurrencyLimit(tasks, 3);

    // Separar resultados e erros
    taskResults.forEach(result => {
        if (result.isError) {
            results.errors.push(`Erro ao processar ${result.file}: ${result.error}`);
        } else {
            results.processed.push(result);
        }
    });

    return results;
}