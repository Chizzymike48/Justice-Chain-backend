#!/usr/bin/env node

/**
 * DIAGNOSTIC: Check what languages are actually available on the live Vercel site
 * This script fetches the live frontend and checks the JavaScript code for language definitions
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VERCEL_URL = 'https://justice-chain-frontend.vercel.app';

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

async function analyzeHTML(html) {
  console.log('\n📋 ANALYZING LIVE VERCEL SITE\n');
  console.log(`🌐 URL: ${VERCEL_URL}\n`);

  // Extract script source from HTML
  const scriptMatch = html.match(/src="([^"]*\/assets\/index[^"]*\.js)"/);
  if (!scriptMatch) {
    console.log('❌ Could not find script tag in HTML');
    return;
  }

  const scriptUrl = new URL(scriptMatch[1], VERCEL_URL).href;
  console.log(`📦 Found JS bundle: ${scriptUrl}\n`);
  console.log('📥 Downloading JavaScript bundle...\n');

  try {
    const jsContent = await fetchFromUrl(scriptUrl);
    
    // Check for language indicators in the minified JS
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français|French' },
      { code: 'es', name: 'Español|Spanish' },
      { code: 'sw', name: 'Kiswahili|Swahili' },
      { code: 'pt', name: 'Português|Portuguese' },
      { code: 'am', name: 'አማርኛ|Amharic' },
      { code: 'ha', name: 'Hausa', new: true },
      { code: 'yo', name: 'Yoruba', new: true },
      { code: 'ig', name: 'Igbo', new: true },
    ];

    console.log('🔍 Checking for language definitions:\n');
    let foundCount = 0;

    for (const lang of languages) {
      // Check for language name in bundle
      const namePatterns = lang.name.split('|');
      let found = false;
      
      for (const pattern of namePatterns) {
        if (jsContent.includes(pattern)) {
          found = true;
          break;
        }
      }

      if (found) {
        console.log(`✅ ${lang.code.toUpperCase().padEnd(3)} - ${lang.name.split('|')[0]}${lang.new ? ' (NEW)' : ''}`);
        foundCount++;
      } else {
        console.log(`❌ ${lang.code.toUpperCase().padEnd(3)} - NOT FOUND${lang.new ? ' (NEW)' : ''}`);
      }
    }

    console.log(`\n📊 Summary: ${foundCount}/9 languages found in live bundle\n`);

    if (foundCount < 9) {
      console.log('⚠️  ISSUE DETECTED: Not all 9 languages are in the live bundle!');
      console.log('   This means Vercel is still serving an older version.\n');
    } else {
      console.log('✅ All 9 languages confirmed in live bundle.');
      console.log('   Languages should appear in the dropdown.\n');
    }

    // Check for explicit language array definition
    console.log('🔍 Checking for language array in code...\n');
    
    const languageArrayPatterns = [
      /\{code:"en",name:"English"\}/,
      /\{code:"ha",name:"Hausa"\}/,
      /\{code:"yo",name:"Yoruba"\}/,
      /\{code:"ig",name:"Igbo"\}/,
      /"ha":"Hausa"/,
      /"yo":"Yoruba"/,
      /"ig":"Igbo"/,
    ];

    for (const pattern of languageArrayPatterns) {
      if (pattern.test(jsContent)) {
        console.log(`✅ Found: ${pattern.toString()}`);
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error fetching JavaScript bundle:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Diagnostic: Checking live Vercel deployment\n');
    
    console.log(`📥 Fetching ${VERCEL_URL}...\n`);
    const html = await fetchFromUrl(VERCEL_URL);
    
    await analyzeHTML(html);

    console.log('\n💡 NEXT STEPS:');
    console.log('   If < 9 languages found: Vercel cache needs clearing');
    console.log('   If = 9 languages found: Check browser cache and localStorage\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
