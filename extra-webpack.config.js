const { Compilation, sources } = require('webpack');

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
              
              compilation.updateAsset(
                assetName,
                new sources.RawSource(updatedSource)
              );
              console.log(`[FixRootSelectorPlugin] Fixed :root selectors in asset: ${assetName}`);
            }
          }
        }
      );
    });
  }
}

module.exports = {
  plugins: [
    new FixRootSelectorPlugin()
  ]
};
