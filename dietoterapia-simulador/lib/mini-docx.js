// Gerador independente e puro de documentos Microsoft Word (.docx)
// Utiliza OpenXML e empacotamento ZIP (Store Method) 100% compatível com todas as versões do MS Word e Google Docs.

class MiniDocx {
  constructor() {
    this.files = {};
    this.bodyElements = [];
  }

  // Tabela CRC32 pré-calculada
  static makeCRCTable() {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }
    return crcTable;
  }

  static crc32(bytes) {
    if (!MiniDocx.crcTable) {
      MiniDocx.crcTable = MiniDocx.makeCRCTable();
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ MiniDocx.crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // Converte string UTF-8 para Uint8Array
  static stringToBytes(str) {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(str);
    }
    const utf8 = unescape(encodeURIComponent(str));
    const arr = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
      arr[i] = utf8.charCodeAt(i);
    }
    return arr;
  }

  // Escapa caracteres especiais XML
  static xmlEscape(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Adiciona parágrafo simples ou estilizado
  addParagraph(text, options = {}) {
    const bold = options.bold ? "<w:b/>" : "";
    const italic = options.italic ? "<w:i/>" : "";
    const color = options.color ? `<w:color w:val="${options.color}"/>` : "";
    const size = options.size ? `<w:sz w:val="${options.size * 2}"/>` : "";
    const align = options.align ? `<w:jc w:val="${options.align}"/>` : "";
    const spaceBefore = options.spaceBefore !== undefined ? options.spaceBefore : 120;
    const spaceAfter = options.spaceAfter !== undefined ? options.spaceAfter : 120;
    const lineSpacing = options.lineSpacing ? `<w:spacing w:line="${options.lineSpacing}" w:lineRule="auto"/>` : "";

    const pPr = `<w:pPr>${align}<w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}" ${options.lineSpacing ? `w:line="${options.lineSpacing}" w:lineRule="auto"` : ""}/></w:pPr>`;
    const rPr = `<w:rPr>${bold}${italic}${color}${size}<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>`;

    const escaped = MiniDocx.xmlEscape(text);
    const xml = `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
    this.bodyElements.push(xml);
  }

  // Adiciona Título de Seção com cor temática (Verde Hospitalar/Esmeralda)
  addHeading(text, level = 1) {
    let size = 32; // 16pt
    let color = "166534"; // Emerald 800
    let spaceBefore = 280;
    let spaceAfter = 140;

    if (level === 2) {
      size = 26; // 13pt
      color = "15803d"; // Green 700
      spaceBefore = 220;
      spaceAfter = 100;
    } else if (level === 3) {
      size = 24; // 12pt
      color = "334155"; // Slate 700
      spaceBefore = 180;
      spaceAfter = 80;
    }

    const xml = `
      <w:p>
        <w:pPr>
          <w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}"/>
          <w:pBdr>
            <w:bottom w:val="${level === 1 ? 'single' : 'none'}" w:sz="${level === 1 ? '12' : '0'}" w:space="4" w:color="166534"/>
          </w:pBdr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:color w:val="${color}"/>
            <w:sz w:val="${size}"/>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          </w:rPr>
          <w:t xml:space="preserve">${MiniDocx.xmlEscape(text)}</w:t>
        </w:r>
      </w:p>`;
    this.bodyElements.push(xml);
  }

  // Adiciona Caixa de Destaque / Alerta
  addCallout(title, text, borderColor = "16a34a", bgColor = "f0fdf4") {
    const xml = `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="5000" w:type="pct"/>
          <w:tblBorders>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="${borderColor}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
          </w:tblBorders>
          <w:tblCellMar>
            <w:top w:w="160" w:type="dxa"/>
            <w:left w:w="240" w:type="dxa"/>
            <w:bottom w:w="160" w:type="dxa"/>
            <w:right w:w="240" w:type="dxa"/>
          </w:tblCellMar>
        </w:tblPr>
        <w:tr>
          <w:tc>
            <w:tcPr>
              <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
            </w:tcPr>
            ${title ? `<w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${borderColor}"/><w:sz w:val="22"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr><w:t>${MiniDocx.xmlEscape(title)}</w:t></w:r></w:p>` : ''}
            <w:p><w:pPr><w:spacing w:before="40" w:after="60"/></w:pPr><w:r><w:rPr><w:sz w:val="21"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr><w:t>${MiniDocx.xmlEscape(text)}</w:t></w:r></w:p>
          </w:tc>
        </w:tr>
      </w:tbl>
      <w:p><w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr></w:p>`;
    this.bodyElements.push(xml);
  }

  // Adiciona Tabela formatada
  addTable(headers, rows, widths = []) {
    let tblHeader = "";
    if (headers && headers.length > 0) {
      tblHeader = `<w:tr><w:trPr><w:tblHeader/></w:trPr>`;
      headers.forEach((h, idx) => {
        const w = widths[idx] ? `w:w="${widths[idx]}" w:type="dxa"` : `w:w="2500" w:type="dxa"`;
        tblHeader += `
          <w:tc>
            <w:tcPr>
              <w:tcW ${w}/>
              <w:shd w:val="clear" w:color="auto" w:fill="166534"/>
              <w:tcMar>
                <w:top w:w="120" w:type="dxa"/>
                <w:left w:w="160" w:type="dxa"/>
                <w:bottom w:w="120" w:type="dxa"/>
                <w:right w:w="160" w:type="dxa"/>
              </w:tcMar>
            </w:tcPr>
            <w:p>
              <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
              <w:r>
                <w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
                <w:t xml:space="preserve">${MiniDocx.xmlEscape(h)}</w:t>
              </w:r>
            </w:p>
          </w:tc>`;
      });
      tblHeader += `</w:tr>`;
    }

    let tblRows = "";
    rows.forEach((r, rowIdx) => {
      const isEven = rowIdx % 2 === 1;
      const rowBg = isEven ? "F8FAFC" : "FFFFFF";
      tblRows += `<w:tr>`;
      r.forEach((cell, idx) => {
        const w = widths[idx] ? `w:w="${widths[idx]}" w:type="dxa"` : `w:w="2500" w:type="dxa"`;
        tblRows += `
          <w:tc>
            <w:tcPr>
              <w:tcW ${w}/>
              <w:shd w:val="clear" w:color="auto" w:fill="${rowBg}"/>
              <w:tcMar>
                <w:top w:w="100" w:type="dxa"/>
                <w:left w:w="160" w:type="dxa"/>
                <w:bottom w:w="100" w:type="dxa"/>
                <w:right w:w="160" w:type="dxa"/>
              </w:tcMar>
            </w:tcPr>
            <w:p>
              <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
              <w:r>
                <w:rPr><w:sz w:val="20"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
                <w:t xml:space="preserve">${MiniDocx.xmlEscape(cell)}</w:t>
              </w:r>
            </w:p>
          </w:tc>`;
      });
      tblRows += `</w:tr>`;
    });

    const xml = `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="5000" w:type="pct"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          </w:tblBorders>
        </w:tblPr>
        ${tblHeader}
        ${tblRows}
      </w:tbl>
      <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>`;
    this.bodyElements.push(xml);
  }

  // Gera os arquivos OpenXML internos
  buildXmlFiles() {
    // 1. [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    // 2. _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    // 3. word/document.xml
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${this.bodyElements.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    return {
      "[Content_Types].xml": contentTypes,
      "_rels/.rels": rels,
      "word/document.xml": documentXml
    };
  }

  // Cria pacote binário ZIP (Método Store 0)
  generateBlob() {
    const xmlMap = this.buildXmlFiles();
    const zipFiles = [];

    for (const [path, content] of Object.entries(xmlMap)) {
      const data = MiniDocx.stringToBytes(content);
      const crc = MiniDocx.crc32(data);
      const nameBytes = MiniDocx.stringToBytes(path);

      zipFiles.push({
        path,
        nameBytes,
        data,
        crc,
        size: data.length
      });
    }

    // Calcula tamanhos
    let totalSize = 0;
    zipFiles.forEach(f => {
      // Local Header: 30 + nameLen + dataLen
      totalSize += 30 + f.nameBytes.length + f.size;
    });

    let centralDirSize = 0;
    zipFiles.forEach(f => {
      // Central Dir: 46 + nameLen
      centralDirSize += 46 + f.nameBytes.length;
    });

    // End of Central Dir: 22 bytes
    const buffer = new Uint8Array(totalSize + centralDirSize + 22);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    const centralOffsets = [];

    // Escreve Local Headers + Data
    zipFiles.forEach(f => {
      centralOffsets.push(offset);

      // Local file header signature 0x04034b50
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 10, true); // Version needed (1.0)
      view.setUint16(offset + 6, 0x0800, true); // UTF-8 flag
      view.setUint16(offset + 8, 0, true); // Compression: Store (0)
      view.setUint16(offset + 10, 0x5460, true); // Time
      view.setUint16(offset + 12, 0x5460, true); // Date
      view.setUint32(offset + 14, f.crc, true); // CRC32
      view.setUint32(offset + 18, f.size, true); // Comp size
      view.setUint32(offset + 22, f.size, true); // Uncomp size
      view.setUint16(offset + 26, f.nameBytes.length, true); // File name len
      view.setUint16(offset + 28, 0, true); // Extra len

      offset += 30;
      buffer.set(f.nameBytes, offset);
      offset += f.nameBytes.length;

      buffer.set(f.data, offset);
      offset += f.size;
    });

    // Escreve Central Directory
    const centralDirStart = offset;
    zipFiles.forEach((f, idx) => {
      // Central header signature 0x02014b50
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true); // Made by (2.0)
      view.setUint16(offset + 6, 10, true); // Needed
      view.setUint16(offset + 8, 0x0800, true); // UTF-8
      view.setUint16(offset + 10, 0, true); // Store
      view.setUint16(offset + 12, 0x5460, true); // Time
      view.setUint16(offset + 14, 0x5460, true); // Date
      view.setUint32(offset + 16, f.crc, true);
      view.setUint32(offset + 20, f.size, true);
      view.setUint32(offset + 24, f.size, true);
      view.setUint16(offset + 28, f.nameBytes.length, true);
      view.setUint16(offset + 30, 0, true); // Extra len
      view.setUint16(offset + 32, 0, true); // Comment len
      view.setUint16(offset + 34, 0, true); // Disk start
      view.setUint16(offset + 36, 0, true); // Internal attr
      view.setUint32(offset + 38, 0, true); // External attr
      view.setUint32(offset + 42, centralOffsets[idx], true); // Local header offset

      offset += 46;
      buffer.set(f.nameBytes, offset);
      offset += f.nameBytes.length;
    });

    // Escreve End of Central Directory (EOCD)
    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 4, 0, true); // Disk number
    view.setUint16(offset + 6, 0, true); // Central dir disk
    view.setUint16(offset + 8, zipFiles.length, true); // Disk entries
    view.setUint16(offset + 10, zipFiles.length, true); // Total entries
    view.setUint32(offset + 12, centralDirSize, true); // Central dir size
    view.setUint32(offset + 16, centralDirStart, true); // Central dir offset
    view.setUint16(offset + 20, 0, true); // Comment len

    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }

  // Dispara o download automático no navegador
  download(filename = "Relatorio_Dietoterapia.docx") {
    const blob = this.generateBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
