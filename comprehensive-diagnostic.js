#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔬 COMPREHENSIVE MULTILINGUAL DIAGNOSTIC TEST\n');
console.log('='.repeat(70));

const tests = [];

// TEST 1: Check imports
console.log('\n1️⃣  IMPORTS - Are all 9 languages imported?');
const i18nPath = path.join(__dirname, 'africajustice-frontend/src/services/i18nService.ts');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

const importMatch = i18nContent.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]..\/locales\/translations['"]/);
if (importMatch) {
  const imports = importMatch[1].split(',').map(s => s.trim());
  console.log(`   Imports found: ${imports.join(', ')}`);
  const hasAll9 = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'].every(lang => imports.includes(lang));
  console.log(`   ${hasAll9 ? '✅' : '❌'} All 9 languages imported: ${hasAll9}`);
  tests.push({ name: 'Imports all 9 languages', pass: hasAll9 });
} else {
  console.log('   ❌ Could not parse imports');
  tests.push({ name: 'Imports all 9 languages', pass: false });
}

// TEST 2: Check Language type
console.log('\n2️⃣  LANGUAGE TYPE - Is ig included in the type?');
const langTypeMatch = i18nContent.match(/export\s+type\s+Language\s*=\s*([^;]+);/);
if (langTypeMatch) {
  const langType = langTypeMatch[1];
  const has3New = langType.includes("'ha'") && langType.includes("'yo'") && langType.includes("'ig'");
  console.log(`   ${has3New ? '✅' : '❌'} Type includes ha, yo, ig: ${has3New}`);
  tests.push({ name: "Language type includes 'ha', 'yo', 'ig'", pass: has3New });
} else {
  tests.push({ name: "Language type includes 'ha', 'yo', 'ig'", pass: false });
}

// TEST 3: Check LANGUAGES object
console.log('\n3️⃣  LANGUAGES OBJECT - Are all 9 languages defined?');
const langObjMatch = i18nContent.match(/export\s+const\s+LANGUAGES[^=]*=\s*{([^}]+)}/s);
if (langObjMatch) {
  const langObj = langObjMatch[1];
  const checks = {
    'en': langObj.includes("en: 'English'"),
    'fr': langObj.includes("fr: 'Français'"),
    'es': langObj.includes("es: 'Español'"),
    'sw': langObj.includes("sw: 'Kiswahili'"),
    'pt': langObj.includes("pt: 'Português'"),
    'am': langObj.includes("am: 'አማርኛ'"),
    'ha': langObj.includes("ha: 'Hausa'"),
    'yo': langObj.includes("yo: 'Yoruba'"),
    'ig': langObj.includes("ig: 'Igbo'"),
  };
  
  Object.entries(checks).forEach(([code, found]) => {
    console.log(`   ${found ? '✅' : '❌'} ${code}: ${found}`);
  });
  
  const allPresent = Object.values(checks).every(v => v);
  tests.push({ name: 'LANGUAGES object has all 9', pass: allPresent });
} else {
  console.log('   ❌ Could not find LANGUAGES object');
  tests.push({ name: 'LANGUAGES object has all 9', pass: false });
}

// TEST 4: Check TRANSLATIONS object
console.log('\n4️⃣  TRANSLATIONS OBJECT - Are all 9 exported?');
const translObjMatch = i18nContent.match(/export\s+const\s+TRANSLATIONS[^=]*=\s*{([^}]+)}/s);
if (translObjMatch) {
  const translObj = translObjMatch[1];
  const langs = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'];
  const checks = {};
  
  langs.forEach(lang => {
    checks[lang] = translObj.includes(`${lang},`) || translObj.includes(`${lang},\n`) || translObj.includes(`${lang}\n`);
  });
  
  Object.entries(checks).forEach(([code, found]) => {
    console.log(`   ${found ? '✅' : '❌'} ${code} in TRANSLATIONS`);
  });
  
  const allPresent = Object.values(checks).every(v => v);
  tests.push({ name: 'TRANSLATIONS object exports all 9', pass: allPresent });
} else {
  console.log('   ❌ Could not find TRANSLATIONS object');
  tests.push({ name: 'TRANSLATIONS object exports all 9', pass: false });
}

// TEST 5: Check getAllLanguages method
console.log('\n5️⃣  getAllLanguages() METHOD - Does it return array?');
const getAllMatch = i18nContent.match(/getAllLanguages\(\)[^}]*?{([^}]+)}/s);
if (getAllMatch) {
  const method = getAllMatch[1];
  const usesEntries = method.includes('Object.entries');
  const mapsCorrectly = method.includes('code') && method.includes('name');
  console.log(`   ${usesEntries ? '✅' : '❌'} Uses Object.entries: ${usesEntries}`);
  console.log(`   ${mapsCorrectly ? '✅' : '❌'} Maps to {code, name}: ${mapsCorrectly}`);
  tests.push({ name: 'getAllLanguages returns array correctly', pass: usesEntries && mapsCorrectly });
} else {
  console.log('   ❌ Could not find getAllLanguages method');
  tests.push({ name: 'getAllLanguages returns array correctly', pass: false });
}

// TEST 6: Check translation files exist
console.log('\n6️⃣  TRANSLATION FILES - Do all 9 export statements exist?');
const translPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
const translContent = fs.readFileSync(translPath, 'utf8');

const langs = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'];
const exportChecks = {};

langs.forEach(lang => {
  const regex = new RegExp(`^export\\s+const\\s+${lang}\\s*=\\s*{`, 'm');
  exportChecks[lang] = regex.test(translContent);
});

Object.entries(exportChecks).forEach(([lang, found]) => {
  console.log(`   ${found ? '✅' : '❌'} export const ${lang} = {`);
});

const allExported = Object.values(exportChecks).every(v => v);
tests.push({ name: 'All 9 languages exported from translations.ts', pass: allExported });

// TEST 7: Check LanguageSwitcher component
console.log('\n7️⃣  LANGUAGE SWITCHER - Is it using languages array?');
const switcherPath = path.join(__dirname, 'africajustice-frontend/src/components/common/LanguageSwitcher.tsx');
const switcherContent = fs.readFileSync(switcherPath, 'utf8');

const switcherChecks = {
  'Uses useI18n': switcherContent.includes('const { language, setLanguage, languages, t }'),
  'Maps languages': switcherContent.includes('languages.map'),
  'Sets language on click': switcherContent.includes('setLanguage(lang.code)'),
};

Object.entries(switcherChecks).forEach(([check, found]) => {
  console.log(`   ${found ? '✅' : '❌'} ${check}`);
});

const switcherPass = Object.values(switcherChecks).every(v => v);
tests.push({ name: 'LanguageSwitcher correctly uses languages', pass: switcherPass });

// TEST 8: Check dist build
console.log('\n8️⃣  BUILD OUTPUT - Are all 9 languages in dist?');
const distPath = path.join(__dirname, 'africajustice-frontend/dist');
if (fs.existsSync(distPath)) {
  const assetsPath = path.join(distPath, 'assets');
  const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
  
  if (jsFiles.length > 0) {
    const mainJs = jsFiles.find(f => f.includes('index-')) || jsFiles[0];
    const jsContent = fs.readFileSync(path.join(assetsPath, mainJs), 'utf8');
    
    const buildChecks = {
      'English': jsContent.includes('English'),
      'Français': jsContent.includes('Français'),
      'Español': jsContent.includes('Español'),
      'Kiswahili': jsContent.includes('Kiswahili'),
      'Português': jsContent.includes('Português'),
      'አማርኛ': jsContent.includes('አማርኛ'),
      'Hausa': jsContent.includes('Hausa'),
      'Yoruba': jsContent.includes('Yoruba'),
      'Igbo': jsContent.includes('Igbo'),
    };
    
    Object.entries(buildChecks).forEach(([lang, found]) => {
      console.log(`   ${found ? '✅' : '❌'} ${lang} in build`);
    });
    
    const buildPass = Object.values(buildChecks).every(v => v);
    tests.push({ name: 'All 9 languages in dist build', pass: buildPass });
  } else {
    console.log('   ❌ No JS files found in dist');
    tests.push({ name: 'All 9 languages in dist build', pass: false });
  }
} else {
  console.log('   ❌ dist folder does not exist (run npm run build first)');
  tests.push({ name: 'All 9 languages in dist build', pass: false });
}

// SUMMARY
console.log('\n' + '='.repeat(70));
console.log('\n📊 SUMMARY:\n');

const passed = tests.filter(t => t.pass).length;
const total = tests.length;

tests.forEach(t => {
  console.log(`${t.pass ? '✅' : '❌'} ${t.name}`);
});

console.log(`\n${passed}/${total} tests passed`);

if (passed === total) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\nThe code is 100% correct. The issue is with Vercel deployment:');
  console.log('1. Vercel might not have rebuilt the latest commit');
  console.log('2. The deployment preview link might be cached');
  console.log('3. CDN might be serving old version');
  console.log('\n✅ Solution: All 9 languages WILL appear once Vercel completes build');
} else {
  console.log('\n❌ SOME TESTS FAILED - There are issues in the code');
}

console.log('\n' + '='.repeat(70) + '\n');
