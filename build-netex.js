const fs = require('fs-extra');
const concat = require('concat');

const prefixClass = 'drugstone-plugin-';

function prefixSelector(selector) {
  return selector.split(',').map(sub => {
    // Replace class names (excluding ng-, p-, pi-, fa-, cdk-, vis-, drugstone-plugin-)
    let prefixed = sub.replace(/\.(-?[a-zA-Z_][a-zA-Z0-9_-]*)/g, (match, className) => {
      if (className === 'pi' || className.startsWith('pi-') ||
          className === 'fa' || className.startsWith('fa-') ||
          className.startsWith('ng-') || 
          className.startsWith('p-') || 
          className.startsWith('cdk-') ||
          className.startsWith('vis-') ||
          className.startsWith('drugstone-plugin-')) {
        return match;
      }
      return '.' + prefixClass + className;
    });

    // Replace ID names (excluding drugstone-plugin-)
    prefixed = prefixed.replace(/#(-?[a-zA-Z_][a-zA-Z0-9_-]*)/g, (match, idName) => {
      if (idName.startsWith('drugstone-plugin-')) {
        return match;
      }
      return '#' + prefixClass + idName;
    });

    return prefixed;
  }).join(',');
}

function prefixCSS(css) {
  let output = '';
  let i = 0;
  let depth = 0;
  let currentSegment = '';
  let inString = null; // null, '"', or "'"
  let inComment = false;
  let mediaQueryDepths = [];

  while (i < css.length) {
    const char = css[i];
    const nextChar = css[i + 1];

    if (inComment) {
      currentSegment += char;
      if (char === '*' && nextChar === '/') {
        inComment = false;
        currentSegment += '/';
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inString) {
      currentSegment += char;
      if (char === '\\') {
        currentSegment += nextChar;
        i += 2;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      i++;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inComment = true;
      currentSegment += '/*';
      i += 2;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = char;
      currentSegment += char;
      i++;
      continue;
    }

    if (char === '{') {
      let selector = currentSegment;
      currentSegment = '';
      
      let trimmed = selector.trim();
      let isAtRule = trimmed.startsWith('@');
      
      if (isAtRule) {
        let type = 'other';
        if (trimmed.startsWith('@media') || trimmed.startsWith('@container') || trimmed.startsWith('@supports')) {
          if (trimmed.includes('prefers-color-scheme')) {
            if (trimmed.includes('dark')) {
              type = 'dark-media';
            } else if (trimmed.includes('light')) {
              type = 'light-media';
            }
          } else {
            type = 'media';
          }
        } else if (trimmed.startsWith('@keyframes') || trimmed.startsWith('@-webkit-keyframes')) {
          type = 'keyframes';
        }
        
        let insideDarkMedia = mediaQueryDepths.some(d => d.type === 'dark-media');
        let insideLightMedia = mediaQueryDepths.some(d => d.type === 'light-media');
        
        if (!insideDarkMedia && !insideLightMedia && type !== 'dark-media' && type !== 'light-media') {
          output += selector + '{';
        }
        mediaQueryDepths.push({ depth: depth, type: type });
      } else {
        let insideKeyframes = mediaQueryDepths.some(d => d.type === 'keyframes');
        let insideDarkMedia = mediaQueryDepths.some(d => d.type === 'dark-media');
        
        if (!insideDarkMedia) {
          if (!insideKeyframes) {
            output += prefixSelector(selector) + '{';
          } else {
            output += selector + '{';
          }
        }
      }
      
      depth++;
      i++;
      continue;
    }

    if (char === '}') {
      let blockContent = currentSegment;
      currentSegment = '';
      depth--;
      
      let insideDarkMedia = mediaQueryDepths.some(d => d.type === 'dark-media');
      let isClosingLightMedia = mediaQueryDepths.length > 0 && 
                               mediaQueryDepths[mediaQueryDepths.length - 1].type === 'light-media' &&
                               mediaQueryDepths[mediaQueryDepths.length - 1].depth === depth;
      
      if (!insideDarkMedia && !isClosingLightMedia) {
        output += blockContent + '}';
      }
      
      if (mediaQueryDepths.length > 0 && mediaQueryDepths[mediaQueryDepths.length - 1].depth === depth) {
        mediaQueryDepths.pop();
      }
      i++;
      continue;
    }

    currentSegment += char;
    i++;
  }
  
  output += currentSegment;
  return output;
}

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
    
    // Clean up parent-level root/wrapper variables
    css = css.replace(/#appWindow\s+:root/g, '#appWindow');
    css = css.replace(/#drugstone-plugin-appWindow\s+:root/g, '#drugstone-plugin-appWindow');
    
    // Prefix classes and IDs
    console.log('Prefixing classes in compiled styles.css...');
    css = prefixCSS(css);
    
    // Clean up any remaining wrapper root combinations post-prefixing
    css = css.replace(/#drugstone-plugin-appWindow\s+:root/g, '#drugstone-plugin-appWindow');
    css = css.replace(/#appWindow\s+:root/g, '#appWindow');
    
    await fs.writeFile('drugsTone-build/styles.css', css, 'utf8');
    console.log('Successfully wrote prefixed production styles.css');
  } else {
    await fs.copy(cssPath, 'drugsTone-build/styles.css');
  }

  await fs.copy('./dist/netex/assets/', 'drugsTone-build/assets/');
})();


