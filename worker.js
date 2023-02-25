import indexTemplate from './index.html'

import translationDe from './translations/de.txt'
import translationEn from './translations/en.txt'
import translationFr from './translations/fr.txt'
import translationHi from './translations/hi.txt'

export default {
  fetch: handleRequest,
}

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
  for (let lang of langs) {
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

const indexHtml = indexTemplate
  .replace(/\n/g, '')
  .replace(/  /g, '')
  .replace(/: /g, ':')
  .replace(/;\}/g, '}')

const translations = {}

translations['de'] = translationDe
translations['en'] = translationEn
translations['fr'] = translationFr
translations['hi'] = translationHi


const translateHtml = `<!doctype html>
<html lang="en">
<title>Translate ip.dog</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root {
  --color: black;
  --background: white;
  --small-color: #444;
  --action-color: deepskyblue;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color: white;
    --background: black;
    --small-color: #bbb;
  }
}

body {
  font: 25px/1.4 system-ui, sans-serif;
  background: var(--background);
  color: var(--color);
}

a {
  color: var(--action-color);
}

textarea {
  font-size: inherit;
  font-family: inherit;
  width: 90%;
  height: 350px;
}

.button {
  background: var(--action-color);
  font-size: 25px;
  padding: .25em 1em .3em;
  margin-bottom: 50px;
  border: none;
  border-radius: 16px;
  font-family: inherit;
  color: white;
  text-shadow: 0 1px 0 black;
  outline: none;
  text-decoration: none;
  cursor: pointer;
}
</style>

<header>
  <a href="/">&lt; ip.dog home page</a>
</header>

<p>Translate the following text and send it to me by mail:</p>

<p><textarea>Click anywhere to copy
Copied
ip.dog is the fastest way to get your IP address securely. 🐶
Extra-short domain name.
The whole page is the copy button, or you can just press a key, so your mouse/finger doesn’t have to travel.
It’s a dynamic site with the speed of a static one, distributed near you anywhere in the world, thanks to Cloudflare Workers.
The whole site fits in a single TCP packet (≤ 1460 bytes) to avoid network round trips.
Multilingual (&lt;a href="/translate"&gt;translating&lt;/a&gt; takes two minutes), dark mode, accessible.
Made by &lt;a href="https://dieulot.fr/"&gt;Alexandre Dieulot&lt;/a&gt;. &lt;a href="https://github.com/dieulot/ip.dog"&gt;Source code&lt;/a&gt; available.</textarea></p>

<p><a class="button" href="/">Send by mail</a></p>

<script>
const textarea = document.querySelector('textarea');
const button = document.querySelector('.button');
const email = ['adieulot', 'gmail.com'].join('@');

textarea.addEventListener('input', function (event) {
  button.href = \`mailto:\${email}?body=\${encodeURIComponent(textarea.value)}\`;
})
</script>
`
