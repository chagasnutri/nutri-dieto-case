/**
 * Gerador de Hash SHA-256 do Código-Fonte para Registro de Software no INPI
 * 
 * Este script compacta todos os arquivos do projeto em 'codigo-fonte.zip'
 * ignorando dependências e pastas temporárias/compilação, e calcula o
 * hash criptográfico SHA-256 exigido pelo INPI (Instrução Normativa nº 019/2017).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Validação da biblioteca archiver com instrução amigável caso não esteja instalada
let archiver;
try {
  archiver = require('archiver');
} catch (err) {
  console.error('\n❌ [ERRO] A biblioteca "archiver" não está instalada no projeto.');
  console.error('👉 Para instalar, execute o comando abaixo no terminal:');
  console.error('   npm install archiver --save-dev\n');
  process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname);
const OUTPUT_ZIP = path.join(ROOT_DIR, 'codigo-fonte.zip');

// Pastas e arquivos a serem estritamente ignorados
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.vercel'
]);

const IGNORED_FILES = new Set([
  'codigo-fonte.zip'
]);

// Remove arquivo zip anterior se já existir, garantindo integridade
if (fs.existsSync(OUTPUT_ZIP)) {
  try {
    fs.unlinkSync(OUTPUT_ZIP);
  } catch (err) {
    console.warn('⚠️ Aviso: Não foi possível remover o codigo-fonte.zip anterior:', err.message);
  }
}

console.log('====================================================');
console.log('🚀 Iniciando compactação do código-fonte para o INPI');
console.log('====================================================');
console.log(`📁 Diretório raiz: ${ROOT_DIR}`);
console.log(`🚫 Pastas ignoradas: ${Array.from(IGNORED_DIRS).join(', ')}`);
console.log(`🚫 Arquivos ignorados: ${Array.from(IGNORED_FILES).join(', ')}`);
console.log('⏳ Coletando arquivos e compactando...');

const output = fs.createWriteStream(OUTPUT_ZIP);
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão
});

let totalFiles = 0;

// Varredura recursiva de diretórios
function addDirectoryFiles(currentDir, relativePath = '') {
  const items = fs.readdirSync(currentDir, { withFileTypes: true });

  // Ordenação para garantir consistência e determinismo
  items.sort((a, b) => a.name.localeCompare(b.name));

  for (const item of items) {
    const itemRelativePath = relativePath 
      ? path.join(relativePath, item.name).replace(/\\/g, '/') 
      : item.name;
    const itemFullPath = path.join(currentDir, item.name);

    if (item.isDirectory()) {
      if (IGNORED_DIRS.has(item.name)) {
        continue;
      }
      addDirectoryFiles(itemFullPath, itemRelativePath);
    } else if (item.isFile()) {
      if (IGNORED_FILES.has(item.name)) {
        continue;
      }
      archive.file(itemFullPath, { name: itemRelativePath });
      totalFiles++;
    }
  }
}

output.on('close', () => {
  const zipSizeBytes = archive.pointer();
  const zipSizeMB = (zipSizeBytes / (1024 * 1024)).toFixed(2);

  console.log('\n📦 Compactação concluída com sucesso!');
  console.log(`📄 Total de arquivos incluídos: ${totalFiles}`);
  console.log(`💾 Tamanho final do ZIP: ${zipSizeMB} MB (${zipSizeBytes.toLocaleString('pt-BR')} bytes)`);
  console.log(`📂 Caminho: ${OUTPUT_ZIP}`);

  console.log('\n⏳ Calculando Hash SHA-256...');

  try {
    const fileBuffer = fs.readFileSync(OUTPUT_ZIP);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    console.log('\n====================================================');
    console.log(`Hash SHA-256 para o INPI: ${hash}`);
    console.log('====================================================');
    console.log('\nℹ️  INFORMAÇÃO PARA O PEDIDO NO INPI:');
    console.log('• Campo "Resumo Digital Hash": Copie exatamente a sequência de 64 caracteres acima.');
    console.log('• Algoritmo de Hash: SHA-256');
    console.log(`• Arquivo compactado: codigo-fonte.zip`);
    console.log('• Guarde o arquivo "codigo-fonte.zip" em local seguro (ele é a prova material do seu código).\n');
  } catch (hashErr) {
    console.error('❌ Erro ao calcular o hash do arquivo zip:', hashErr.message);
    process.exit(1);
  }
});

archive.on('error', (err) => {
  console.error('❌ Erro durante a compactação:', err.message);
  process.exit(1);
});

output.on('error', (err) => {
  console.error('❌ Erro no fluxo de saída do arquivo zip:', err.message);
  process.exit(1);
});

archive.pipe(output);

try {
  addDirectoryFiles(ROOT_DIR);
  archive.finalize();
} catch (scanErr) {
  console.error('❌ Erro ao varrer os arquivos do projeto:', scanErr.message);
  process.exit(1);
}
