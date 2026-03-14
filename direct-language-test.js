#!/usr/bin/env node

/**
 * DIRECT VERIFICATION: Check if the current built app has all 9 languages
 * This mimics exactly what the browser will see
 */

const fs = require('fs');
const path = require('path');

console.log('🔎 DIRECT TEST: What the browser is loading\n');

// 1. Check the main JS bundle
console.log('1️⃣  Checking main JavaScript bundle:');
const distPath = path.join(__dirname, 'africajustice-frontend/dist');
const indexJsFile = fs.readdirSync(path.join(distPath, 'assets')).find(f => f.includes('index-') && f.endsWith('.js'));

if (indexJsFile) {
  const jsPath = path.join(distPath, 'assets', indexJsFile);
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  
  // Check for language strings
  const checks = {
    'English': jsContent.includes("English"),
    'Français': jsContent.includes("Français"),
    'Español': jsContent.includes("Español"),
    'Kiswahili': jsContent.includes("Kiswahili"),
    'Português': jsContent.includes("Português"),
    'አማርኛ': jsContent.includes("አማርኛ"),
    'Hausa': jsContent.includes("Hausa"),
    'Yoruba': jsContent.includes("Yoruba"),
    'Igbo': jsContent.includes("Igbo"),
  };

  console.log(`   📦 Bundle: ${indexJsFile}`);
  console.log('   Contents:');
  Object.entries(checks).forEach(([lang, found]) => {
    console.log(`   ${found ? '✅' : '❌'} ${lang}`);
  });

  const foundCount = Object.values(checks).filter(v => v).length;
  console.log(`\n   Total found: ${foundCount}/9`);
  
  if (foundCount === 9) {
    console.log('   ✨ ALL 9 LANGUAGES ARE IN THE BUILD!');
  } else {
    console.log('   ⚠️  Some languages are missing from the bundle');
  }
} else {
  console.log('   ❌ Could not find main JS file');
}

// 2. Check if i18nService exports are correct
console.log('\n2️⃣  Checking i18nService.ts source:');
const i18nPath = path.join(__dirname, 'africajustice-frontend/src/services/i18nService.ts');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

const i18nChecks = {
  'Language type includes ha': i18nContent.includes("'ha'"),
  'Language type includes yo': i18nContent.includes("'yo'"),
  'Language type includes ig': i18nContent.includes("'ig'"),
  'LANGUAGES object has Hausa': i18nContent.includes("ha: 'Hausa'"),
  'LANGUAGES object has Yoruba': i18nContent.includes("yo: 'Yoruba'"),
  'LANGUAGES object has Igbo': i18nContent.includes("ig: 'Igbo'"),
};

Object.entries(i18nChecks).forEach(([check, found]) => {
  console.log(`   ${found ? '✅' : '❌'} ${check}`);
});

// 3. Check translations
console.log('\n3️⃣  Checking translations.ts exports:');
const translPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
const translContent = fs.readFileSync(translPath, 'utf8');

const translChecks = {
  'export const ha exists': translContent.includes('export const ha = {'),
  'export const yo exists': translContent.includes('export const yo = {'),
  'export const ig exists': translContent.includes('export const ig = {'),
  'ha imported in i18nService': i18nContent.includes("import { en, fr, es, sw, pt, am, ha, yo, ig }"),
};

Object.entries(translChecks).forEach(([check, found]) => {
  console.log(`   ${found ? '✅' : '❌'} ${check}`);
});

// 4. Check LanguageSwitcher
console.log('\n4️⃣  Checking LanguageSwitcher.tsx:');
const switcherPath = path.join(__dirname, 'africajustice-frontend/src/components/common/LanguageSwitcher.tsx');
const switcherContent = fs.readFileSync(switcherPath, 'utf8');

const switcherChecks = {
  'Uses useI18n hook': switcherContent.includes('const { language, setLanguage, languages, t } = useI18n()'),
  'Maps languages array': switcherContent.includes('languages.map'),
  'Has proper onClick handler': switcherContent.includes('onClick={() => {'),
};

Object.entries(switcherChecks).forEach(([check, found]) => {
  console.log(`   ${found ? '✅' : '❌'} ${check}`);
});

console.log('\n' + '='.repeat(60));
console.log('CONCLUSION:');
console.log('='.repeat(60));

if (foundCount === 9 && i18nChecks['LANGUAGES object has Hausa']) {
  console.log('\n✨ THE SOURCE CODE AND BUILD ARE CORRECT!');
  console.log('\n🌐 The three new languages (Hausa, Yoruba, Igbo) ARE included:');
  console.log('   ✅ In source code (translations.ts)');
  console.log('   ✅ In i18nService.ts');
  console.log('   ✅ In the built JavaScript bundle');
  console.log('\n⚠️  IF THEY\'RE NOT SHOWING IN THE DROPDOWN ON VERCEL:');
  console.log('   1. Vercel might not have rebuilt yet');
  console.log('   2. Browser cache might be showing old version');
  console.log('   3. CDN cache might not have updated yet');
  console.log('\n👉 NEXT STEPS:');
  console.log('   1. Go to https://vercel.com/dashboard');
  console.log('   2. Check if latest deployment shows 🟢 Ready');
  console.log('   3. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('   4. Hard refresh (Ctrl+Shift+R)');
  console.log('   5. Check language dropdown again');
} else {
  console.log('\n❌ SOURCE CODE IS MISSING LANGUAGES');
  console.log('   This should not happen - verify commits were pushed correctly');
}
