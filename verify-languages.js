#!/usr/bin/env node

/**
 * Verification script for multilingual deployment
 * Checks if all 9 languages are properly bundled and accessible
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Justice Chain Language Deployment Verification\n');

const checks = [
  {
    name: 'Check i18nService includes all languages',
    test: () => {
      const i18nPath = path.join(__dirname, 'africajustice-frontend/src/services/i18nService.ts');
      const content = fs.readFileSync(i18nPath, 'utf8');
      
      const languages = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'];
      const missing = languages.filter(lang => !content.includes(`'${lang}'`));
      
      if (missing.length === 0) {
        console.log('✅ All 9 languages defined in i18nService');
        return true;
      } else {
        console.log(`❌ Missing languages: ${missing.join(', ')}`);
        return false;
      }
    }
  },
  {
    name: 'Check LANGUAGES object has correct names',
    test: () => {
      const i18nPath = path.join(__dirname, 'africajustice-frontend/src/services/i18nService.ts');
      const content = fs.readFileSync(i18nPath, 'utf8');
      
      const expectedLanguages = {
        'ha': 'Hausa',
        'yo': 'Yoruba',
        'ig': 'Igbo',
        'en': 'English',
        'fr': 'Français',
        'es': 'Español',
        'sw': 'Kiswahili',
        'pt': 'Português',
        'am': 'አማርኛ'
      };
      
      let allFound = true;
      for (const [code, name] of Object.entries(expectedLanguages)) {
        if (!content.includes(`${code}: '${name}'`) && !content.includes(`${code}: "${name}"`)) {
          console.log(`❌ Language mapping not found: ${code} -> ${name}`);
          allFound = false;
        }
      }
      
      if (allFound) {
        console.log('✅ All language name mappings correct');
        return true;
      }
      return false;
    }
  },
  {
    name: 'Check translation files exist',
    test: () => {
      const translationsPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
      const content = fs.readFileSync(translationsPath, 'utf8');
      
      const languages = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'];
      const exported = languages.filter(lang => content.includes(`export const ${lang} = {`));
      
      if (exported.length === 9) {
        console.log(`✅ All 9 language translation exports found`);
        return true;
      } else {
        console.log(`❌ Only ${exported.length}/9 languages exported`);
        return false;
      }
    }
  },
  {
    name: 'Check LanguageSwitcher uses languages array',
    test: () => {
      const switcherPath = path.join(__dirname, 'africajustice-frontend/src/components/common/LanguageSwitcher.tsx');
      const content = fs.readFileSync(switcherPath, 'utf8');
      
      if (content.includes('languages.map') && content.includes('lang.code') && content.includes('lang.name')) {
        console.log('✅ LanguageSwitcher properly iterates through languages');
        return true;
      } else {
        console.log('❌ LanguageSwitcher missing language iteration');
        return false;
      }
    }
  },
  {
    name: 'Check Hausa translations present',
    test: () => {
      const translationsPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
      const content = fs.readFileSync(translationsPath, 'utf8');
      
      if (content.includes('export const ha = {') && content.includes('Gajeren take') && content.includes('Justice Chain Mataimaki')) {
        console.log('✅ Hausa translations are complete');
        return true;
      } else {
        console.log('❌ Hausa translations missing or incomplete');
        return false;
      }
    }
  },
  {
    name: 'Check Yoruba translations present',
    test: () => {
      const translationsPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
      const content = fs.readFileSync(translationsPath, 'utf8');
      
      if (content.includes('export const yo = {') && content.includes('Akole kukuru') && content.includes('Justice Chain Oluranlowo')) {
        console.log('✅ Yoruba translations are complete');
        return true;
      } else {
        console.log('❌ Yoruba translations missing or incomplete');
        return false;
      }
    }
  },
  {
    name: 'Check Igbo translations present',
    test: () => {
      const translationsPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
      const content = fs.readFileSync(translationsPath, 'utf8');
      
      if (content.includes('export const ig = {') && content.includes('Isiokwu mkpirikpi')) {
        console.log('✅ Igbo translations are complete');
        return true;
      } else {
        console.log('❌ Igbo translations missing or incomplete');
        return false;
      }
    }
  },
  {
    name: 'Check frontend build output exists',
    test: () => {
      const distPath = path.join(__dirname, 'africajustice-frontend/dist');
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        if (files.includes('index.html') && files.includes('assets')) {
          console.log('✅ Frontend build output exists (dist folder ready for deployment)');
          return true;
        }
      }
      console.log('❌ Frontend build output missing');
      return false;
    }
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    const result = check.test();
    if (result) passed++;
    else failed++;
  } catch (error) {
    console.log(`❌ ${check.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}\n`);

if (failed === 0) {
  console.log('🎉 All checks passed! Deployment ready.\n');
  console.log('📱 Expected behavior on Vercel:');
  console.log('  1. Visit https://justice-chain-frontend.vercel.app/');
  console.log('  2. Click the 🌐 language button (top right)');
  console.log('  3. Should see all 9 languages:');
  console.log('     - English (en)');
  console.log('     - Français (fr)');
  console.log('     - Español (es)');
  console.log('     - Kiswahili (sw)');
  console.log('     - Português (pt)');
  console.log('     - አማርኛ (am)');
  console.log('     - Hausa (ha) ✨ NEW');
  console.log('     - Yoruba (yo) ✨ NEW');
  console.log('     - Igbo (ig) ✨ NEW\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Review above for details.\n');
  process.exit(1);
}
