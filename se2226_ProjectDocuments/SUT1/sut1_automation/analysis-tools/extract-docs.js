const fs = require('fs')
const path = require('path')
const { PDFParse } = require('pdf-parse')
const mammoth = require('mammoth')

const docs = [
  'C:\\Users\\Victus\\Downloads\\SE 2226 Test PlanTemplate (1).pdf',
  'C:\\Users\\Victus\\Downloads\\compatibilityAnalysis_SUT1.pdf',
  'C:\\Users\\Victus\\Downloads\\Usability Check.docx',
  'C:\\Users\\Victus\\Downloads\\projectPlan_lastVers.pdf',
]

async function extract(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.pdf') {
    const parser = new PDFParse({ data: fs.readFileSync(file) })
    const data = await parser.getText()
    await parser.destroy()
    return data.text
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: file })
    return result.value
  }
  return ''
}

async function main() {
  for (const file of docs) {
    const text = await extract(file)
    const out = path.join(__dirname, path.basename(file).replace(/\.[^.]+$/, '.txt'))
    fs.writeFileSync(out, text, 'utf8')
    console.log(`${path.basename(file)} -> ${out} (${text.length} chars)`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
