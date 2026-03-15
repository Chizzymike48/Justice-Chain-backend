#!/usr/bin/env node

/**
 * MONITORING: Check if Vercel has deployed v1.1.0 with all 9 languages
 * Run this periodically to verify deployment completion
 */

const https = require('https');

const VERCEL_URL = 'https://justice-chain-frontend.vercel.app';
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const MAX_ATTEMPTS = 60; // Check for up to 30 minutes

async function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function checkDeployment(attempt) {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Attempt ${attempt}/${MAX_ATTEMPTS}: Checking Vercel deployment...`);
    
    const html = await fetchFromUrl(VERCEL_URL);
    const jsMatch = html.match(/src="([^"]*\/assets\/index[^"]*\.js)"/);
    
    if (!jsMatch) {
      console.log('  ⏳ Could not find script tag');
      return false;
    }

    const bundleUrl = new URL(jsMatch[1], VERCEL_URL).href;
    const bundleHash = jsMatch[1].match(/index-([A-Z0-9]+)\.js/)?.[1];
    
    console.log(`  📦 Bundle hash: ${bundleHash}`);
    
    const jsContent = await fetchFromUrl(bundleUrl);
    
    // Check for all 9 languages
    const languageChecks = {
      en: jsContent.includes('English'),
      fr: jsContent.includes('Français'),
      es: jsContent.includes('Español'),
      sw: jsContent.includes('Kiswahili'),
      pt: jsContent.includes('Português'),
      am: jsContent.includes('አማርኛ'),
      ha: jsContent.includes('Hausa'),
      yo: jsContent.includes('Yoruba'),
      ig: jsContent.includes('Igbo'),
    };

    const found = Object.values(languageChecks).filter(Boolean).length;
    
    if (found === 9) {
      console.log(`\n✅ SUCCESS! All 9 languages deployed!`);
      console.log(`\n📋 Languages confirmed:`);
      console.log(`  ✅ English`);
      console.log(`  ✅ Français`);
      console.log(`  ✅ Español`);
      console.log(`  ✅ Kiswahili`);
      console.log(`  ✅ Português`);
      console.log(`  ✅ አማርኛ (Amharic)`);
      console.log(`  ✅ Hausa (NEW)`);
      console.log(`  ✅ Yoruba (NEW)`);
      console.log(`  ✅ Igbo (NEW)`);
      console.log(`\n🎉 Version 1.1.0 successfully deployed!`);
      console.log(`\n🌐 Visit ${VERCEL_URL}/ and check the language dropdown`);
      return true;
    } else {
      console.log(`  ⏳ Only ${found}/9 languages found - deployment still in progress...`);
      const missing = Object.entries(languageChecks)
        .filter(([_, found]) => !found)
        .map(([code]) => code.toUpperCase());
      console.log(`  ⏳ Missing: ${missing.join(', ')}`);
      return false;
    }

  } catch (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
    return false;
  }
}

async function monitor() {
  console.log('🚀 VERCEL DEPLOYMENT MONITOR');
  console.log(`🌐 Watching: ${VERCEL_URL}`);
  console.log(`⏱️  Checking every 30 seconds (up to 30 minutes)...\n`);

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const success = await checkDeployment(i);
    
    if (success) {
      process.exit(0);
    }
    
    if (i < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  console.log(`\n❌ Deployment monitoring timed out after ${MAX_ATTEMPTS * 0.5} minutes`);
  console.log(`\n💡 Next steps:`);
  console.log(`  1. Check Vercel dashboard at https://vercel.com/dashboard`);
  console.log(`  2. Verify the deployment completed without errors`);
  console.log(`  3. Run this script again to continue monitoring`);
  process.exit(1);
}

monitor().catch(console.error);
