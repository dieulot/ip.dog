import indexTemplate from './index.html'

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

translations['de'] = `Zum kopieren irgendwo hinklicken
Kopiert!
ip.dog is der schnellste Weg um deine IP Adresse sicher zu bekommen. 🐶
Super-kurze domain.
Die gesamte Seite ist der "kopieren" Button, deine Maus/dein Finger muss sich also nicht weit bewegen! Du kannst auch eine Taste drücken, um deine IP Adresse zu kopieren!
Dies ist eine dynamische Seite mit der Geschwindigkeit einer statischen Seite, verteilt über den ganzen Globus, möglich gemacht durch Cloudflare Workers.
Die gesamte Seite passt in ein einziges TCP Paket (≤ 1460 Bytes) um Netzrundfahrten zu vermeiden.
Mehrsprachig (das <a href="/translate">Übersetzen</a> dauert nur 2 Minuten), dark mode, barrierefrei.
Entwickelt von <a href="https://dieulot.fr/">Alexandre Dieulot</a>. <a href="https://github.com/dieulot/ip.dog">Quellcode</a> verfügbar.
`
translations['en'] = `Click anywhere to copy
Copied
ip.dog is the fastest way to get your IP address securely. 🐶
Extra-short domain name.
The whole page is the copy button, or you can just press a key, so your mouse/finger doesn’t have to travel.
It’s a dynamic site with the speed of a static one, distributed near you anywhere in the world, thanks to Cloudflare Workers.
The whole site fits in a single TCP packet (≤ 1460 bytes) to avoid network round trips.
Multilingual (<a href="/translate">translating</a> takes two minutes), dark mode, accessible.
Made by <a href="https://dieulot.fr/">Alexandre Dieulot</a>. <a href="https://github.com/dieulot/ip.dog">Source code</a> available.
`
translations['fr'] = `Cliquez n’importe où pour copier
Copié
ip.dog est le moyen le plus rapide d’obtenir votre adresse IP de façon sécurisée. 🐶
Nom de domaine super court.
La page entière est le bouton pour copier, ou vous pouvez simplement appuyer sur une touche, ainsi votre souris/doigt n’a pas à se déplacer.
C’est un site dynamique avec la vitesse d’un site statique, distribué près de chez vous partout dans le monde, grâce à Cloudflare Workers.
Le site entier tient dans un seul paquet TCP (≤ 1460 octets) pour éviter les aller-retours réseau.
Multilingue (<a href="/translate">traduire</a> prend deux minutes), thème sombre, accessible.
Conçu par <a href="https://dieulot.fr/">Alexandre Dieulot</a>. <a href="https://github.com/dieulot/ip.dog">Code source</a> disponible.
`
translations['hi'] = `कहीं भी कॉपी करने के लिए क्लिक करें
कॉपी किया गया
ip.dog आपके आईपी पते को सुरक्षित रूप से प्राप्त करने का सबसे तेज़ तरीका है। 🐶
अतिरिक्त-संक्षिप्त डोमेन नाम।
पूरा पृष्ठ कॉपी बटन है, या आप केवल एक कुंजी दबा सकते हैं, इसलिए आपके माउस / उंगली को यात्रा नहीं करनी होगी।
यह एक गतिशील साइट है जिसकी गति स्थिर है, जिसे क्लाउडफ़ेयर वर्कर्स की बदौलत दुनिया में कहीं भी वितरित किया जा सकता है।
नेटवर्क राउंड ट्रिप से बचने के लिए पूरी साइट एक एकल टीसीपी पैकेट (by 1460 बाइट्स) में फिट होती है।
बहुभाषी (<a href="/translate"> अनुवाद करना </a> दो मिनट लगते हैं), डार्क मोड, सुलभ।
<a href="https://dieulot.fr/"> अलेक्जेंड्रे डाईलुओट </a> द्वारा बनाया गया। <a href="https://github.com/dieulot/ip.dog"> स्रोत कोड </a> उपलब्ध है।
`


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
