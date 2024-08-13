import htmlValidator from 'html-validator';
import fs from 'fs/promises';

async function validateHtmlFile(filePath) {
    try {
        const html = await fs.readFile(filePath, 'utf8');
        
        const options = {
            data: html, // HTML a ser validado
            format: 'json' // Formato do resultado
        };

        const result = await htmlValidator(options);
        return result;
    } catch (error) {
        console.error('Erro ao validar HTML:', error);
    }
}

// Exemplo de uso
(async () => {
    const filePath = 'results.html'; // Substitua pelo caminho real do arquivo
    const validationResult = await validateHtmlFile(filePath);

    if (validationResult.messages && validationResult.messages.length > 0) {
        console.log('Erros e avisos encontrados na validação HTML:');
        validationResult.messages.forEach((msg, index) => {
            console.log(`${index + 1}. [${msg.type}] ${msg.message} (Linha: ${msg.lastLine})`);
        });
    } else {
        console.log('Nenhum erro encontrado no HTML.');
    }
})();