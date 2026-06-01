const { Compilation, sources } = require('webpack');

function cleanCSS(css) {
  let output = '';
  let i = 0;
  let depth = 0;
  let currentSegment = '';
  let inString = null;
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
        let insideDarkMedia = mediaQueryDepths.some(d => d.type === 'dark-media');
        if (!insideDarkMedia) {
          output += selector + '{';
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

class FixRootSelectorPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('FixRootSelectorPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'FixRootSelectorPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          for (const assetName of Object.keys(assets)) {
            if (assetName.endsWith('.css')) {
              const asset = compilation.getAsset(assetName);
              const originalSource = asset.source.source().toString();
              let updatedSource = originalSource;

              // Replace both dev and prod wrapper :root combinations
              updatedSource = updatedSource.replace(/#appWindow\s+:root/g, '#appWindow');
              updatedSource = updatedSource.replace(/#drugstone-plugin-appWindow\s+:root/g, '#drugstone-plugin-appWindow');

              // Strip prefers-color-scheme dark and flatten prefers-color-scheme light
              updatedSource = cleanCSS(updatedSource);

              compilation.updateAsset(
                assetName,
                new sources.RawSource(updatedSource)
              );
            }
          }
        }
      );
    });
  }
}

module.exports = (config) => {
  config.plugins = config.plugins || [];
  config.plugins.push(new FixRootSelectorPlugin());

  config.ignoreWarnings = config.ignoreWarnings || [];
  config.ignoreWarnings.push(
    (warning) => {
      const message = warning.message || (typeof warning === 'string' ? warning : '');
      return message.includes('Deprecation Warning') ||
             message.includes('Sass @import rules') ||
             message.includes('sass-loader');
    }
  );

  function configureSassLoader(rules) {
    if (!rules) return;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule) continue;
      if (rule.oneOf) {
        configureSassLoader(rule.oneOf);
      }
      if (rule.rules) {
        configureSassLoader(rule.rules);
      }
      if (rule.use) {
        const useArray = Array.isArray(rule.use) ? rule.use : [rule.use];
        for (let j = 0; j < useArray.length; j++) {
          let entry = useArray[j];
          if (typeof entry === 'string' && entry.includes('sass-loader')) {
            entry = { loader: entry, options: {} };
            useArray[j] = entry;
          }
          if (entry && typeof entry === 'object' && entry.loader && entry.loader.includes('sass-loader')) {
            entry.options = entry.options || {};
            entry.options.sassOptions = entry.options.sassOptions || {};
            entry.options.sassOptions.quietDeps = true;
            entry.options.sassOptions.silenceDeprecations = ['import'];
          }
        }
        if (!Array.isArray(rule.use)) {
          rule.use = useArray[0];
        }
      }
    }
  }

  configureSassLoader(config.module.rules);

  return config;
};
