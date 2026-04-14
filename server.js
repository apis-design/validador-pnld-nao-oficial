import express from 'express';
import multer from 'multer';
import extract from 'extract-zip';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';
import { runApp } from './index.js';
import { adjustImageDPI } from './helpers/image-validator.js';

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

// Desabilita cache para arquivos estáticos
app.use(express.static('public', {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
}));

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

// Função para limpar cache de resultados anteriores
function clearPreviousResults() {
    try {
        const resultsJsonPath = path.join(__dirname, 'public', 'results.json');
        const resultsJsPath = path.join(__dirname, 'public', 'results.js');
        const extractedPath = path.join(__dirname, 'extracted');
        
        // Remove arquivos de resultados anteriores se existirem
        if (fs.existsSync(resultsJsonPath)) {
            fs.unlinkSync(resultsJsonPath);
            sendProgress({ type: 'info', message: 'Arquivo results.json anterior removido.' });
        }
        if (fs.existsSync(resultsJsPath)) {
            fs.unlinkSync(resultsJsPath);
            sendProgress({ type: 'info', message: 'Arquivo results.js anterior removido.' });
        }
        
        // Limpar pastas extraídas antigas
        if (fs.existsSync(extractedPath)) {
            const extractedItems = fs.readdirSync(extractedPath);
            extractedItems.forEach(item => {
                const itemPath = path.join(extractedPath, item);
                if (fs.statSync(itemPath).isDirectory()) {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                    sendProgress({ type: 'info', message: `Pasta extraída anterior removida: ${item}` });
                }
            });
        }
        
        // Limpar arquivos de upload antigos (mantém apenas os últimos 5 para não encher o disco)
        const uploadsPath = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsPath)) {
            const uploadItems = fs.readdirSync(uploadsPath);
            const uploadFiles = uploadItems.filter(item => {
                const itemPath = path.join(uploadsPath, item);
                return fs.statSync(itemPath).isFile();
            });
            
            if (uploadFiles.length > 5) {
                // Ordena por data de modificação (mais antigos primeiro)
                const sortedFiles = uploadFiles
                    .map(file => ({
                        name: file,
                        path: path.join(uploadsPath, file),
                        mtime: fs.statSync(path.join(uploadsPath, file)).mtime
                    }))
                    .sort((a, b) => a.mtime - b.mtime);
                
                // Remove os mais antigos, mantendo apenas os últimos 5
                const filesToRemove = sortedFiles.slice(0, sortedFiles.length - 5);
                filesToRemove.forEach(file => {
                    fs.unlinkSync(file.path);
                    sendProgress({ type: 'info', message: `Arquivo de upload antigo removido: ${file.name}` });
                });
            }
        }
        
        sendProgress({ 
            type: 'info', 
            message: 'Cache e arquivos temporários anteriores limpos com sucesso.' 
        });
    } catch (error) {
        console.log('Erro ao limpar cache:', error);
        sendProgress({ 
            type: 'warning', 
            message: 'Aviso: Não foi possível limpar completamente o cache anterior.' 
        });
    }
}

app.post('/upload', upload.single('zipFile'), async (req, res) => {
    try {
        // Limpar cache de resultados anteriores no início do processo
        clearPreviousResults();

        const zipPath = req.file.path;
        const extractPath = path.join(__dirname, 'extracted', Date.now().toString());
        
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

        // Remove .DS_Store files
        sendProgress({ type: 'info', message: 'Removendo arquivos .DS_Store...' });
        await removeDSStoreFiles(extractPath);

        // Remove the extracted folder
        sendProgress({ type: 'info', message: 'Removendo pasta extraída...' });
        fs.rmSync(extractPath, { recursive: true, force: true });

        sendProgress({ type: 'success', message: 'Processamento concluído com sucesso!' });
        res.json({ 
            success: true,
            redirectUrl: '/results.html',
            message: 'Processamento concluído com sucesso!'
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

app.post('/upload-url', async (req, res) => {
    try {
        // Limpar cache de resultados anteriores no início do processo
        clearPreviousResults();

        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL não fornecida' });
        }

        sendProgress({ type: 'info', message: 'Baixando arquivo da URL...' });

        // Download the ZIP file with progress
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao baixar arquivo: ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        let buffer;

        if (contentLength) {
            let downloaded = 0;
            const chunks = [];
            const stream = response.body;

            for await (const chunk of stream) {
                chunks.push(chunk);
                downloaded += chunk.length;
                const percent = Math.round((downloaded / parseInt(contentLength)) * 100);
                sendProgress({ type: 'download-progress', progress: percent });
            }
            buffer = Buffer.concat(chunks);
        } else {
            buffer = await response.buffer();
        }
        const zipPath = path.join(uploadsDir, `download-${Date.now()}.zip`);
        fs.writeFileSync(zipPath, buffer);

        const extractPath = path.join(__dirname, 'extracted', Date.now().toString());
        
        sendProgress({ type: 'info', message: 'Extraindo arquivo ZIP...' });
        
        // Criar diretório de extração se não existir
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

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

        // Remove .DS_Store files
        sendProgress({ type: 'info', message: 'Removendo arquivos .DS_Store...' });
        await removeDSStoreFiles(extractPath);

        // Remove the extracted folder
        sendProgress({ type: 'info', message: 'Removendo pasta extraída...' });
        fs.rmSync(extractPath, { recursive: true, force: true });

        sendProgress({ type: 'success', message: 'Processamento concluído com sucesso!' });
        res.json({ 
            success: true,
            redirectUrl: '/results.html',
            message: 'Processamento concluído com sucesso!'
        });
    } catch (error) {
        console.error('URL upload error:', error);
        sendProgress({ type: 'error', message: `Erro: ${error.message}` });
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/convert-dpi-zip', upload.single('zipFile'), async (req, res) => {
    try {
        const targetDpi = parseInt(req.body.targetDpi) || 300;
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhum arquivo ZIP foi enviado' });
        }

        sendProgress({ type: 'info', message: 'Recebido arquivo ZIP para conversão de DPI' });

        // Guardar o nome original do arquivo
        const originalFileName = req.file.originalname;

        // Criar diretório temporário para processamento
        const tempDir = path.join(__dirname, 'temp', `dpi-conversion-${Date.now()}`);
        const extractDir = path.join(tempDir, 'extracted');
        fs.mkdirSync(extractDir, { recursive: true });

        const zipPath = req.file.path;

        sendProgress({ type: 'info', message: 'Extraindo arquivo ZIP...' });
        // Extrair o arquivo ZIP
        await extract(zipPath, { dir: extractDir });

        // Remover arquivo ZIP temporário
        fs.unlinkSync(zipPath);

        // Encontrar todas as imagens no diretório extraído
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
        const allFiles = [];
        const imageFiles = [];

        function findFiles(dir, baseDir = '') {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const relativePath = path.join(baseDir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    findFiles(itemPath, relativePath);
                } else {
                    allFiles.push({
                        fullPath: itemPath,
                        relativePath: relativePath,
                        isImage: imageExtensions.includes(path.extname(item).toLowerCase())
                    });
                    if (imageExtensions.includes(path.extname(item).toLowerCase())) {
                        imageFiles.push(itemPath);
                    }
                }
            }
        }

        findFiles(extractDir);

        if (imageFiles.length === 0) {
            return res.status(400).json({ success: false, error: 'Nenhuma imagem encontrada no arquivo ZIP' });
        }

        sendProgress({ type: 'info', message: `Encontradas ${imageFiles.length} imagens para processamento de ${allFiles.length} arquivos totais` });

        const results = {
            processed: [],
            errors: [],
            targetDpi: targetDpi,
            totalImages: imageFiles.length,
            totalFiles: allFiles.length
        };

        // Processar cada imagem no local original
        for (const imagePath of imageFiles) {
            try {
                const relativePath = path.relative(extractDir, imagePath);
                sendProgress({ type: 'info', message: `Processando: ${relativePath}` });
                
                // Criar arquivo temporário para processamento
                const tempImagePath = imagePath + '.temp';
                
                // Usar Sharp para processar a imagem
                const sharp = (await import('sharp')).default;
                
                // Ler metadados da imagem
                const metadata = await sharp(imagePath).metadata();
                const currentDpi = metadata.density || 72;
                
                if (currentDpi === targetDpi) {
                    // Se já está no DPI correto, manter como está
                    results.processed.push({
                        filename: relativePath,
                        originalDpi: currentDpi,
                        newDpi: targetDpi,
                        status: 'unchanged'
                    });
                } else {
                    // Ajustar DPI e sobrescrever o arquivo original
                    // Determinar o formato baseado na extensão para preservar transparência
                    const ext = path.extname(imagePath).toLowerCase();
                    let sharpInstance = sharp(imagePath).withMetadata({ density: targetDpi });
                    
                    if (ext === '.png') {
                        // PNG: preservar transparência
                        sharpInstance = sharpInstance.png();
                    } else if (ext === '.webp') {
                        // WebP: preservar transparência
                        sharpInstance = sharpInstance.webp({ quality: 95 });
                    } else if (ext === '.gif') {
                        // GIF: preservar como está (sharp tem suporte limitado)
                        sharpInstance = sharpInstance.gif();
                    } else if (ext === '.tiff') {
                        sharpInstance = sharpInstance.tiff();
                    } else {
                        // JPG, JPEG, BMP: converter para JPEG com boa qualidade
                        sharpInstance = sharpInstance.jpeg({ quality: 95 });
                    }
                    
                    await sharpInstance.toFile(tempImagePath);
                    
                    // Substituir arquivo original
                    fs.unlinkSync(imagePath);
                    fs.renameSync(tempImagePath, imagePath);
                    
                    results.processed.push({
                        filename: relativePath,
                        originalDpi: currentDpi,
                        newDpi: targetDpi,
                        status: 'converted'
                    });
                }
                
            } catch (error) {
                console.error(`Erro ao processar ${imagePath}:`, error);
                const relativePath = path.relative(extractDir, imagePath);
                results.errors.push({
                    filename: relativePath,
                    error: error.message
                });
            }
        }

        // Criar novo ZIP com a mesma estrutura, mas com imagens ajustadas
        const outputZipPath = path.join(tempDir, originalFileName);
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Melhor compressão
        });

        await new Promise((resolve, reject) => {
            output.on('close', () => {
                sendProgress({ type: 'success', message: 'ZIP com imagens ajustadas criado com sucesso!' });
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Adicionar todos os arquivos mantendo a estrutura original
            allFiles.forEach(file => {
                if (fs.existsSync(file.fullPath)) {
                    archive.file(file.fullPath, { name: file.relativePath });
                }
            });

            archive.finalize();
        });

        // Salvar informações para download
        const downloadInfo = {
            zipPath: outputZipPath,
            originalFileName: originalFileName,
            results: results
        };
        const infoPath = path.join(tempDir, 'download-info.json');
        fs.writeFileSync(infoPath, JSON.stringify(downloadInfo, null, 2));

        sendProgress({ type: 'success', message: `Conversão concluída! ${results.processed.length} imagens processadas.` });

        res.json({ 
            success: true,
            results: results,
            tempDirId: path.basename(tempDir),
            message: `Conversão concluída! ${results.processed.length} imagens processadas, ${results.errors.length} erros.`
        });

    } catch (error) {
        console.error('Erro na conversão de DPI:', error);
        sendProgress({ type: 'error', message: `Erro: ${error.message}` });
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/download-dpi-results/:tempDirId', async (req, res) => {
    try {
        const tempDirId = req.params.tempDirId;
        const tempDir = path.join(__dirname, 'temp', tempDirId);
        const infoPath = path.join(tempDir, 'download-info.json');
        
        if (!fs.existsSync(tempDir) || !fs.existsSync(infoPath)) {
            return res.status(404).json({ error: 'Resultados não encontrados ou expirados' });
        }

        // Ler informações de download
        const downloadInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        const zipPath = downloadInfo.zipPath;
        const originalFileName = downloadInfo.originalFileName;
        
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'Arquivo ZIP não encontrado' });
        }

        sendProgress({ type: 'success', message: 'Iniciando download do ZIP com imagens ajustadas!' });

        // Enviar o arquivo ZIP com o nome original
        res.download(zipPath, originalFileName, (err) => {
            if (err) {
                console.error('Erro ao enviar arquivo:', err);
            }
            // Limpar arquivos temporários após download
            setTimeout(() => {
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error('Erro ao limpar arquivos temporários:', cleanupError);
                }
            }, 5000); // Aguardar 5 segundos para garantir que o download foi iniciado
        });

    } catch (error) {
        console.error('Erro ao fazer download do ZIP:', error);
        sendProgress({ type: 'error', message: `Erro: ${error.message}` });
        res.status(500).json({ error: error.message });
    }
});

app.get('/download-adjusted-images', async (req, res) => {
    try {
        // Verificar se há uma pasta extraída válida
        const extractedPath = path.join(__dirname, 'extracted');
        if (!fs.existsSync(extractedPath)) {
            return res.status(404).json({ error: 'Nenhuma pasta de projeto encontrada. Faça upload de um arquivo ZIP primeiro.' });
        }

        const folders = fs.readdirSync(extractedPath).filter(item => {
            const itemPath = path.join(extractedPath, item);
            return fs.statSync(itemPath).isDirectory();
        });

        if (folders.length === 0) {
            return res.status(404).json({ error: 'Nenhuma pasta de projeto encontrada. Faça upload de um arquivo ZIP primeiro.' });
        }

        // Usar a pasta mais recente
        const projectPath = path.join(extractedPath, folders[folders.length - 1]);

        sendProgress({ type: 'info', message: 'Iniciando ajuste de DPI das imagens...' });

        // Criar diretório temporário para imagens ajustadas
        const tempDir = path.join(__dirname, 'temp', Date.now().toString());
        const adjustedImagesDir = path.join(tempDir, 'resources', 'images');
        fs.mkdirSync(adjustedImagesDir, { recursive: true });

        // Ajustar DPI das imagens
        const adjustmentResult = await adjustImageDPI(projectPath, adjustedImagesDir);

        if (adjustmentResult.errors.length > 0) {
            sendProgress({ type: 'warning', message: `Erros no ajuste: ${adjustmentResult.errors.join(', ')}` });
        }

        sendProgress({ type: 'info', message: `Imagens processadas: ${adjustmentResult.processed.length}` });

        // Criar arquivo ZIP
        const zipFileName = `imagens-dpi-ajustado-${Date.now()}.zip`;
        const zipPath = path.join(__dirname, 'temp', zipFileName);

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Melhor compressão
        });

        output.on('close', () => {
            sendProgress({ type: 'success', message: 'ZIP com imagens ajustadas criado com sucesso!' });

            // Enviar o arquivo ZIP
            res.download(zipPath, zipFileName, (err) => {
                if (err) {
                    console.error('Erro ao enviar arquivo:', err);
                }
                // Limpar arquivos temporários após download
                setTimeout(() => {
                    try {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                    } catch (cleanupError) {
                        console.error('Erro ao limpar arquivos temporários:', cleanupError);
                    }
                }, 5000); // Aguardar 5 segundos para garantir que o download foi iniciado
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // Adicionar imagens ajustadas ao ZIP
        archive.directory(adjustedImagesDir, 'resources/images');

        // Adicionar relatório de processamento
        const reportContent = JSON.stringify(adjustmentResult, null, 2);
        archive.append(reportContent, { name: 'relatorio-ajuste-dpi.json' });

        await archive.finalize();

    } catch (error) {
        console.error('Erro ao gerar ZIP com imagens ajustadas:', error);
        sendProgress({ type: 'error', message: `Erro: ${error.message}` });
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 3009;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
