import e404Html from './404.template.html'
const translations = {
  'de': (await import('./translations/de.txt')).default,
  'en': (await import('./translations/en.txt')).default,
  'fr': (await import('./translations/fr.txt')).default,
  'hi': (await import('./translations/hi.txt')).default,
  'cs': (await import('./translations/cs.txt')).default,
}
// The above cannot put in a loop because Wrangler (2.11) chokes on imports with dynamic names.
const indexHtml = (await import('./index.template.html')).default
  .replaceAll('\n', '')
  .replaceAll('  ', '')
  .replaceAll(': ', ':')
  .replaceAll(';}', '}')
const translateHtml = (await import('./translate.template.html')).default
  .replace('{{TEXT}}', translations['en']
    .trim()
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  )
export default {
  fetch,
}
async function fetch(request, env) {
  const {pathname} = new URL(request.url)
  console.log('Country:', request.cf?.country)
  console.log('Accept-Language:', request.headers.get('accept-language'))
  
  let ipData
  if (env.isDev) {
    ipData = generateRandomIpData()
  }
  else {
    ipData = getIpData(request)
  }
  
  let body = ''
  let status = 200
  const headers = new Headers()
  headers.append('Content-Type', 'text/html; charset=utf-8')
  headers.append('Strict-Transport-Security', 'max-age=33333333; includeSubDomains; preload')
  switch (pathname) {
    case '/':
      body = transform(indexHtml, ipData, getLang(request.headers.get('accept-language')))
      break
    case '/translate':
      body = translateHtml
      break
    default:
      status = 404
      body = e404Html
  }
  return new Response(body, {
    status,
    headers,
  })
}

function getIpData(request) {
  // Získáme všechny možné IP adresy z různých headerů
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const cfPseudoIpv4 = request.headers.get('cf-pseudo-ipv4')
  
  // Sestavíme seznam všech možných IP adres
  const allIps = []
  
  if (cfPseudoIpv4) allIps.push(cfPseudoIpv4)
  if (cfConnectingIp) allIps.push(cfConnectingIp)
  if (xRealIp) allIps.push(xRealIp)
  if (xForwardedFor) {
    xForwardedFor.split(',').forEach(ip => allIps.push(ip.trim()))
  }
  
  // Odfiltrujeme prázdné hodnoty
  const validIps = allIps.filter(ip => ip && ip !== '')
  
  console.log('All available IPs:', validIps)
  
  // Najdeme IPv4 a IPv6 adresy
  let ipv4 = null
  let ipv6 = null
  
  for (const ip of validIps) {
    if (isIPv4(ip) && !ipv4) {
      ipv4 = ip
    } else if (isIPv6(ip) && !ipv6) {
      ipv6 = ip
    }
  }
  
  // Vytvoříme objekt s daty
  const ipData = {
    primary: ipv4 || ipv6 || 'unknown', // IPv4 prioritně
    ipv4: ipv4,
    ipv6: ipv6,
    protocol: ipv4 ? 'IPv4' : ipv6 ? 'IPv6' : 'unknown'
  }
  
  console.log('IP Data:', ipData)
  return ipData
}

function isIPv4(ip) {
  // Kontrola IPv4 formátu (xxx.xxx.xxx.xxx)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipv4Regex.test(ip)
}

function isIPv6(ip) {
  // Kontrola IPv6 formátu
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
  return ipv6Regex.test(ip)
}

function transform(html, ipData, lang) {
  const translationLines = translations[lang].split('\n')
  html = html
    .replace('{{LANG}}', lang)
    .replaceAll(/\{\{LINE([0-9]+)\}\}/g, (all, p1) => {
      return translationLines[p1 - 1]
    })
    .replaceAll('{{IP}}', ipData.primary)
    .replace(' copyElement.value.length', ipData.primary.length)
  
  // Přidáme podporu pro zobrazení obou IP adres
  if (ipData.ipv4 && ipData.ipv6) {
    html = html.replace('{{IP_INFO}}', `
      <div class="ip-details">
        <p><strong>Primární IP:</strong> ${ipData.primary} (${ipData.protocol})</p>
        <p><strong>IPv4:</strong> ${ipData.ipv4}</p>
        <p><strong>IPv6:</strong> ${ipData.ipv6}</p>
      </div>
    `)
  } else {
    html = html.replace('{{IP_INFO}}', '')
  }
  
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

function generateRandomIpData() {
  const hasIpv4 = Math.random() < 0.9 // 90% šance na IPv4
  const hasIpv6 = Math.random() < 0.6 // 60% šance na IPv6
  
  let ipv4 = null
  let ipv6 = null
  
  if (hasIpv4) {
    ipv4 = crypto.getRandomValues(new Uint8Array(4)).join('.')
  }
  
  if (hasIpv6) {
    ipv6 = Array.from(crypto.getRandomValues(new Uint16Array(8)))
      .map((e) => e.toString(16)).join(':')
  }
  
  // Pokud nemáme ani jednu, vygenerujeme IPv4
  if (!ipv4 && !ipv6) {
    ipv4 = crypto.getRandomValues(new Uint8Array(4)).join('.')
  }
  
  return {
    primary: ipv4 || ipv6,
    ipv4: ipv4,
    ipv6: ipv6,
    protocol: ipv4 ? 'IPv4' : 'IPv6'
  }
}
