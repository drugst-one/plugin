const fs = require('fs-extra');
const concat = require('concat');
(async function build() {
  const files = [
    './dist/netex/runtime.js',
    './dist/netex/polyfills.js',
    './scripts/vis-network-10.0.2.min.js',
    './scripts/canvas2svg.js',
    './dist/netex/main.js'
  ];
  await fs.ensureDir('drugsTone-build');
  await concat(files, 'drugsTone-build/drugstone.js');

  const cssPath = './dist/netex/styles.css';
  if (await fs.pathExists(cssPath)) {
    let css = await fs.readFile(cssPath, 'utf8');
    css = css.replace(/#appWindow\s+:root/g, '#appWindow');
    css = css.replace(/#drugstone-plugin-appWindow\s+:root/g, '#drugstone-plugin-appWindow');
    await fs.writeFile('drugsTone-build/styles.css', css, 'utf8');
    console.log('Successfully copied and post-processed production styles.css');
  } else {
    await fs.copy(cssPath, 'drugsTone-build/styles.css');
  }

  await fs.copy('./dist/netex/assets/', 'drugsTone-build/assets/');
})();

