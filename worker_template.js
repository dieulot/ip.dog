addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req) {
  const path = new URL(req.url).pathname.substr(1)
  const ip = req.headers.get('cf-connecting-ip')

  let status = 200
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  }
  let content = ''

  if (path === '') {
    content = transform(indexHtml, ip, getLang(req.headers.get('accept-language')))
  }
  else if (path == 'translate') {
    content = translateHtml
  }
  else if (path == 'favicon.ico') {
    headers['Content-Type'] = 'image/png'
    content = (await fetch('https://image.noelshack.com/fichiers/2020/08/6/1582407456-favicon.png')).body
  }
  else {
    status = 404
    content = `404 page not found<br><a href="/">home page</a>`
  }

  return new Response(content, {
    status,
    headers,
  })
}

function transform(html, ip, lang) {
  const translationLines = translations[lang].split('\n')
  html = html
    .replace('{{LANG}}', lang)
    .replace(/\{\{LINE([0-9]+)\}\}/g, (all, p1) => {
      return translationLines[p1 - 1]
    })
    .replace(/\{\{IP\}\}/g, ip)
    .replace(' copyElement.value.length', ip.length)

  return html
}

function getLang(header) {
  if (!header) {
    return 'en'
  }

  header = header.toLowerCase()
  const langs = header.split(/(?:,|;)/)
  for (lang of langs) {
    if (lang in translations) {
      return lang
    }
    const [base] = lang.split('-')
    if (base in translations) {
      return base
    }
  }

  return 'en'
}

const indexHtml = __INDEX_HTML__

const translations = {}

__TRANSLATIONS__

const translateHtml = __TRANSLATE_HTML__
