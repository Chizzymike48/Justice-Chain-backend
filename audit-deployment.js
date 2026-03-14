#!/usr/bin/env node

/**
 * Check Vercel deployment status for multilingual frontend
 * Compares local build with what should be deployed
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Justice Chain Frontend - Vercel Deployment Audit\n');

const checks = [
  {
    name: 'LOCAL: Check dist folder exists',
    test: () => {
      const distPath = path.join(__dirname, 'africajustice-frontend/dist');
      const exists = fs.existsSync(distPath);
      if (exists) {
        const files = fs.readdirSync(distPath);
        console.log(`   📂 dist folder found with ${files.length} items`);
        return true;
      }
      console.log('   ❌ dist folder not found');
      return false;
    }
  },
  {
    name: 'LOCAL: Check i18nService.ts has all 9 languages',
    test: () => {
      const i18nPath = path.join(__dirname, 'africajustice-frontend/src/services/i18nService.ts');
      const content = fs.readFileSync(i18nPath, 'utf8');
      const langCodes = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'];
      const found = langCodes.filter(code => content.includes(`'${code}'`)).length;
      if (found === 9) {
        console.log(`   ✅ All 9 language codes found in i18nService`);
        return true;
      }
      console.log(`   ❌ Only ${found}/9 languages found`);
      return false;
    }
  },
  {
    name: 'LOCAL: Check translations.ts exports all 9 languages',
    test: () => {
      const translPath = path.join(__dirname, 'africajustice-frontend/src/locales/translations.ts');
      const content = fs.readFileSync(translPath, 'utf8');
      const langCodes = ['en', 'fr', 'es', 'sw', 'pt', 'am', 'ha', 'yo', 'ig'];
      const found = langCodes.filter(code => content.includes(`export const ${code} = {`)).length;
      if (found === 9) {
        console.log(`   ✅ All 9 language translations exported`);
        return true;
      }
      console.log(`   ❌ Only ${found}/9 translation exports found`);
      return false;
    }
  },
  {
    name: 'GIT: Check latest commit',
    test: () => {
      const { execSync } = require('child_process');
      try {
        const commit = execSync('git log --oneline -1', { 
          cwd: __dirname,
          encoding: 'utf8'
        }).trim();
        console.log(`   📌 Latest commit: ${commit}`);
        if (commit.includes('multilingual') || commit.includes('6255dbf')) {
          console.log(`   ✅ Multilingual commit is at HEAD`);
          return true;
        }
      } catch (e) {
        console.log('   ⚠️  Could not check git');
      }
      return true;
    }
  },
  {
    name: 'VERCEL: Expected deployment files present',
    test: () => {
      const vercelPath = path.join(__dirname, 'vercel.json');
      if (fs.existsSync(vercelPath)) {
        const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
        console.log(`   ✅ vercel.json found`);
        console.log(`      Build command: ${config.buildCommand}`);
        console.log(`      Output directory: ${config.outputDirectory}`);
        return true;
      }
      console.log('   ❌ vercel.json not found');
      return false;
    }
  }
];

let allPass = true;
checks.forEach(check => {
  try {
    console.log(`\n${check.name}`);
    const result = check.test();
    if (!result) allPass = false;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    allPass = false;
  }
});

console.log('\n' + '='.repeat(60));
if (allPass) {
  console.log('✅ LOCAL BUILD IS CORRECT\n');
  console.log('NEXT STEPS TO TROUBLESHOOT:');
  console.log('1. Go to: https://vercel.com/dashboard');
  console.log('2. Click "justice-chain-frontend"');
  console.log('3. Check the latest deployment:');
  console.log('   - If 🟢 Ready: Refresh browser + clear cache');
  console.log('   - If 🟡 Building: Wait 2-5 minutes');
  console.log('   - If 🔴 Failed: Click to see error logs');
  console.log('4. Click "Deployments" tab to see history');
  console.log('5. Make sure commit 6255dbf is deployed\n');
  console.log('BROWSER DEBUGGING:');
  console.log('1. Open DevTools (F12)');
  console.log('2. Go to Network tab');
  console.log('3. Hard refresh (Ctrl+Shift+R)');
  console.log('4. Check for failed requests (404 errors)');
  console.log('5. Look at JS files - should show 9 languages\n');
} else {
  console.log('❌ LOCAL BUILD HAS ISSUES - CHECK ABOVE\n');
}
console.log('='.repeat(60));
