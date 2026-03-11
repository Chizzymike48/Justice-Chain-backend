const fs = require('fs');
const path = require('path');

// Path to the v8.json reference file relative to this script
const specPath = path.join(__dirname, 'node_modules', '@maplibre', 'maplibre-gl-style-spec', 'src', 'reference', 'v8.json');

try {
  const rawData = fs.readFileSync(specPath);
  const spec = JSON.parse(rawData);

  console.log(`Loaded MapLibre Style Spec Version: ${spec.$version}`);

  // The 'layer' definition in the root of the JSON contains the 'type' enum
  const layerTypes = Object.keys(spec.layer.type.values);
  
  console.log('\nSupported Layer Types:');
  layerTypes.forEach(type => console.log(` - ${type}`));

} catch (err) {
  console.error('Error reading spec file:', err);
}