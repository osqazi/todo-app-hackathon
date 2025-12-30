const { chromium } = require('playwright');

async function testTodoApp() {
  console.log('=== Comprehensive Todo App Test ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'log' || msg.type() === 'info') {
      consoleLogs.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    // Test 1: Landing page
    console.log('1. Landing Page:');
    const response = await page.goto('http://localhost:3000', { timeout: 15000 });
    console.log(`   ✅ Status: ${response.status()}`);
    console.log(`   Title: ${await page.title()}`);

    const bodyText = await page.$eval('body', el => el.innerText);
    console.log(`   Contains "Sign Up": ${bodyText.includes('Sign Up') ? '✅' : '❌'}`);
    console.log(`   Contains "Sign In": ${bodyText.includes('Sign In') ? '✅' : '❌'}`);

    // Test 2: Sign In page
    console.log('\n2. Sign In Page:');
    await page.goto('http://localhost:3000/sign-in', { timeout: 15000 });
    await page.waitForTimeout(2000);
    const signInText = await page.$eval('body', el => el.innerText);
    console.log(`   Loads correctly: ${signInText.includes('Sign') ? '✅' : '❌'}`);

    // Test 3: Sign Up page
    console.log('\n3. Sign Up Page:');
    await page.goto('http://localhost:3000/sign-up', { timeout: 15000 });
    await page.waitForTimeout(2000);
    const signUpText = await page.$eval('body', el => el.innerText);
    console.log(`   Loads correctly: ${signUpText.includes('Sign') ? '✅' : '❌'}`);

    // Test 4: Dashboard (after sign in would be needed, but check structure)
    console.log('\n4. Dashboard Page Structure:');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(3000);
    const dashText = await page.$eval('body', el => el.innerText);
    console.log(`   Page loads: ${dashText.length > 50 ? '✅' : '❌'}`);

    // Check for dashboard components
    const hasSearchBar = dashText.toLowerCase().includes('search');
    const hasFilters = dashText.toLowerCase().includes('filter');
    const hasTasks = dashText.toLowerCase().includes('task');

    console.log(`   Search bar: ${hasSearchBar ? '✅' : '⚠️'}`);
    console.log(`   Filters: ${hasFilters ? '✅' : '⚠️'}`);
    console.log(`   Task content: ${hasTasks ? '✅' : '⚠️'}`);

    // Test 5: Check React components rendered
    console.log('\n5. React Component Check:');
    const inputCount = await page.$$eval('input, textarea, select', els => els.length);
    const buttonCount = await page.$$eval('button', els => els.length);
    console.log(`   Form inputs: ${inputCount}`);
    console.log(`   Buttons: ${buttonCount}`);

    // Check for specific components
    const searchInput = await page.$('input[placeholder*="search" i], input[type="text"]');
    console.log(`   Search input found: ${searchInput ? '✅' : '⚠️'}`);

    // Test 6: Console errors
    console.log('\n6. Console Summary:');
    console.log(`   Total logs: ${consoleLogs.length}`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n   ❌ Errors found:');
      errors.forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 100)}`));
    } else {
      console.log('   ✅ No console errors!');
    }

    // Test 7: Backend connectivity check
    console.log('\n7. Backend API Check:');
    const apiResponse = await page.request.get('http://localhost:8000/api/health');
    console.log(`   Health endpoint: ${apiResponse.status() === 200 ? '✅' : '❌'}`);

    // Test 8: Check for DEBUG auth messages
    const hasAuthDebug = consoleLogs.some(log => log.includes('auth.ts'));
    console.log(`   Auth configured: ${hasAuthDebug ? '✅' : '⚠️'}`);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===');
  }
}

testTodoApp();
