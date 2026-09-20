import { readdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const publicDir = join(process.cwd(), '.output', 'public')
const origin = 'https://tatirestagno.com'

async function collectPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const pages = []
  for (const entry of entries) {
    if (entry.isDirectory()) pages.push(...await collectPages(join(directory, entry.name)))
    else if (entry.name === 'index.html') pages.push(directory)
  }
  return pages
}

const paths = (await collectPages(publicDir))
  .map(directory => '/' + relative(publicDir, directory).split(sep).filter(Boolean).join('/'))
  .filter(path => path !== '/' && !path.startsWith('/admin'))
  .sort()

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map(path => `  <url><loc>${origin}${path}/</loc></url>`),
  '</urlset>',
  '',
].join('\n')

await writeFile(join(publicDir, 'sitemap.xml'), xml, 'utf8')
console.log(`Sitemap: ${paths.length} páginas públicas.`)
