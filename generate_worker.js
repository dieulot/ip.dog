const fs = require('fs')

if (!fs.existsSync('build')) {
  fs.mkdirSync('build')
}

let workerString = fs.readFileSync('worker_template.js').toString()

/* Read and minify home page */

let indexHtml = fs.readFileSync('index.html').toString()
indexHtml = indexHtml
  .replace(/\n/g, '')
  .replace(/  /g, '')
  .replace(/: /g, ':')
  .replace(/;\}/g, '}')

workerString = workerString.replace('__INDEX_HTML__', `\`${indexHtml}\``)


/* Add translations */

const translationFiles = fs.readdirSync('translations')
let translations = ''
translationFiles.forEach((file) => {
  ;[lang] = file.split('.')
  const langContent = fs.readFileSync(`translations/${file}`)
  translations += `translations['${lang}'] = \`${langContent}\`\n`
})

workerString = workerString.replace('__TRANSLATIONS__', translations)

/* /translate */

let translateHtml = fs.readFileSync('translate.html').toString()
translateHtml = translateHtml
  .replace('{{TEXT}}', fs.readFileSync(`translations/en.txt`).toString().trim().replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')

workerString = workerString.replace('__TRANSLATE_HTML__', `\`${translateHtml}\``)

/* Writing the worker */

fs.writeFileSync('build/worker.js', workerString)
