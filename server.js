import express from 'express';
import multer from 'multer';
import extract from 'extract-zip';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { runApp } from './index.js';

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

const port = process.env.PORT || 3009;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
