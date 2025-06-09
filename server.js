import express from 'express';
import multer from 'multer';
import extract from 'extract-zip';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { runApp } from './index.js';
import sharp from 'sharp';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Increase payload size limit for Express
app.use(express.json({ limit: '5gb' }));
app.use(express.urlencoded({ limit: '5gb', extended: true }));

const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB limit
    }
});

app.use(express.static('public'));

// Store connected clients
const clients = new Map();

// Add SSE endpoint
app.get('/progress', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Store the client's response object
    const clientId = Date.now();
    clients.set(clientId, res);
    
    // Remove client when connection closes
    req.on('close', () => {
        clients.delete(clientId);
    });
});

// Function to send progress to all connected clients
export function sendProgress(message) {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
}

// Function to adjust DPI of images
async function adjustImageDPI(extractPath, dpiValue) {
    const imagesPath = path.join(extractPath, 'resources', 'images');
    
    // Check if images directory exists
    if (!fs.existsSync(imagesPath)) {
        sendProgress({ type: 'info', message: 'No images directory found' });
        return;
    }

    // Function to recursively process all images in a directory and its subdirectories
    async function processDirectory(directoryPath) {
        const items = fs.readdirSync(directoryPath);
        let processedCount = 0;

        for (const item of items) {
            const itemPath = path.join(directoryPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Recursively process subdirectories
                processedCount += await processDirectory(itemPath);
            } else {
                // Process image files
                const ext = path.extname(item).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.tiff', '.tif'].includes(ext)) {
                    try {
                        await sharp(itemPath)
                            .withMetadata({
                                density: dpiValue || 300 // Use provided DPI value or default to 300
                            })
                            .toFile(itemPath + '.temp');
                        
                        // Replace original file with processed one
                        fs.unlinkSync(itemPath);
                        fs.renameSync(itemPath + '.temp', itemPath);
                        
                        sendProgress({ type: 'info', message: `Processed ${itemPath}` });
                        processedCount++;
                    } catch (error) {
                        sendProgress({ type: 'error', message: `Error processing ${itemPath}: ${error.message}` });
                    }
                }
            }
        }
        return processedCount;
    }

    sendProgress({ type: 'info', message: 'Starting image processing...' });
    const totalProcessed = await processDirectory(imagesPath);
    sendProgress({ type: 'success', message: `Image DPI adjustment completed. Processed ${totalProcessed} images.` });
}

// Add this new function after the adjustImageDPI function
async function removeDSStoreFiles(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            // Recursively process subdirectories
            await removeDSStoreFiles(itemPath);
        } else if (item === '.DS_Store') {
            // Remove .DS_Store file
            fs.unlinkSync(itemPath);
            sendProgress({ type: 'info', message: `Removido arquivo .DS_Store: ${itemPath}` });
        }
    }
}

// Function to create a zip file from a directory
async function createZipFile(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

app.post('/upload', upload.single('zipFile'), async (req, res) => {
    try {
        const zipPath = req.file.path;
        const extractPath = path.join(__dirname, 'extracted', Date.now().toString());
        const dpiValue = parseInt(req.body.dpi);
        
        sendProgress({ type: 'info', message: 'Recebendo arquivo...' });
        
        // Criar diretório de extração se não existir
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

        sendProgress({ type: 'info', message: 'Extraindo arquivo ZIP...' });
        // Extrair o arquivo ZIP
        await extract(zipPath, { dir: extractPath });
        
        // Listar arquivos extraídos
        const extractedFiles = fs.readdirSync(extractPath);
        sendProgress({ type: 'info', message: `Arquivos extraídos: ${extractedFiles.length} arquivos encontrados` });

        // Remover o arquivo ZIP original
        fs.unlinkSync(zipPath);

        sendProgress({ type: 'info', message: 'Iniciando validação...' });
        // Atualizar o folderPath e executar a validação
        await runApp(extractPath);

        let zipOutputPath = null;

        // Only adjust DPI and create ZIP if a value was provided
        if (dpiValue) {
            sendProgress({ type: 'info', message: 'Ajustando DPI das imagens...' });
            await adjustImageDPI(extractPath, dpiValue);

            // Remove .DS_Store files before creating the ZIP
            sendProgress({ type: 'info', message: 'Removendo arquivos .DS_Store...' });
            await removeDSStoreFiles(extractPath);

            // Create zip file after processing
            zipOutputPath = path.join(__dirname, 'uploads', `${path.basename(extractPath)}.zip`);
            sendProgress({ type: 'info', message: 'Criando arquivo ZIP...' });
            await createZipFile(extractPath, zipOutputPath);
        }

        // Remove the extracted folder after creating the ZIP (if it was created)
        sendProgress({ type: 'info', message: 'Removendo pasta extraída...' });
        fs.rmSync(extractPath, { recursive: true, force: true });

        sendProgress({ type: 'success', message: 'Processamento concluído com sucesso!' });
        res.json({ 
            success: true,
            redirectUrl: '/results.html',
            message: 'Processamento concluído com sucesso!',
            zipFileName: zipOutputPath ? path.basename(zipOutputPath) : null
        });
    } catch (error) {
        console.error('Extraction error:', error);
        sendProgress({ type: 'error', message: `Erro: ${error.message}` });
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Add new endpoint for downloading the zip file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        // Get the extracted folder name from the zip filename (remove .zip extension)
        const extractedFolderName = filename.replace('.zip', '');
        const extractedFolderPath = path.join(__dirname, 'extracted', extractedFolderName);
        
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).send('Error downloading file');
            }
            // Delete both the zip file and the extracted folder
            fs.unlinkSync(filePath);
            
            // Delete the extracted folder recursively
            if (fs.existsSync(extractedFolderPath)) {
                fs.rmSync(extractedFolderPath, { recursive: true, force: true });
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
