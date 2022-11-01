const fs = require('fs-extra');
const concat = require('concat');
(async function build() {
  const files = [
    './dist/netex/runtime-es5.js',
    './dist/netex/polyfills-es5.js',
    './scripts/vis-network.min.js',
    // './dist/netex/scripts.js',
    './dist/netex/main-es5.js'
  ];
  await fs.ensureDir('drugsTone-build');
  await concat(files, 'drugsTone-build/drugstone.js');
  await fs.copy('./dist/netex/styles.css', 'drugsTone-build/styles.css');
  // await fs.copy('./dist/netex/assets/', 'drugsTone-build/assets/');
})();

