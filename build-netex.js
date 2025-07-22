const fs = require('fs-extra');
const concat = require('concat');
(async function build() {
  const files = [
    './dist/netex/runtime.js',
    './dist/netex/polyfills.js',
    './scripts/vis-network-10.0.1.min.js',
    './scripts/canvas2svg.js',
    // './dist/netex/scripts.js',
    './dist/netex/main.js'
  ];
  await fs.ensureDir('drugsTone-build');
  await concat(files, 'drugsTone-build/drugstone.js');
  await fs.copy('./dist/netex/styles.css', 'drugsTone-build/styles.css');
  await fs.copy('./dist/netex/assets/', 'drugsTone-build/assets/');
})();

