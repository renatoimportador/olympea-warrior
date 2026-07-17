const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const input = path.join(__dirname, '..', 'public', 'assets', 'logo.png')
const outputDir = path.join(__dirname, '..', 'public')

async function generateIcons() {
  const background = { r: 10, g: 15, b: 20, alpha: 1 }

  // apple-touch-icon.png (180x180)
  await sharp(input)
    .resize(180, 180, { fit: 'contain', background })
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'))

  // icon-192.png
  await sharp(input)
    .resize(192, 192, { fit: 'contain', background })
    .png()
    .toFile(path.join(outputDir, 'icon-192.png'))

  // icon-512.png
  await sharp(input)
    .resize(512, 512, { fit: 'contain', background })
    .png()
    .toFile(path.join(outputDir, 'icon-512.png'))

  // favicon.ico (usar PNG como favicon - navegadores modernos suportam)
  await sharp(input)
    .resize(32, 32, { fit: 'contain', background })
    .png()
    .toFile(path.join(outputDir, 'favicon.ico'))

  console.log('Icones gerados com sucesso a partir de public/assets/logo.png')
}

generateIcons().catch((err) => {
  console.error('Erro ao gerar icones:', err)
  process.exit(1)
})
