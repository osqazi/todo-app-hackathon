const { chromium } = require('playwright');

async function fullAuthAndFeatureTest() {
  console.log('=== Full Auth & Feature Test ===\n');

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
    }
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  const testEmail = `testuser${Date.now()}@test.com`;
  const testPassword = 'TestPass123!';

  try {
    // Step 1: Sign Up
    console.log('1. SIGN UP PROCESS');
    console.log('   Email:', testEmail);

    await page.goto('http://localhost:3000/sign-up', { timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.fill('input[type="email"]', testEmail);
    console.log('   Filled email');

    // Get all password inputs
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill(testPassword);
      await passwordInputs[1].fill(testPassword);
      console.log('   Filled passwords');
    } else if (passwordInputs.length === 1) {
      await passwordInputs[0].fill(testPassword);
      console.log('   Filled password');
    }

    // Click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('   Clicked submit');

      // Wait for navigation or response
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);

      // Check if signed in
      const bodyText = await page.$eval('body', el => el.innerText);
      const isSignedIn = bodyText.includes('My Tasks') || bodyText.includes('Sign Out') || bodyText.includes('Dashboard');
      console.log('   Signed in:', isSignedIn ? '✅' : '❌');

      if (!isSignedIn && currentUrl.includes('sign-up')) {
        console.log('   Still on sign-up page, checking for errors...');
      }
    }

    // Step 2: If not signed up, try sign in with existing test account
    console.log('\n2. CHECK AUTH STATUS');
    await page.goto('http://localhost:3000/api/auth/get-session', { timeout: 10000 });
    await page.waitForTimeout(2000);
    const sessionText = await page.$eval('body', el => el.innerText);
    console.log('   Session response:', sessionText.substring(0, 100));

    // Step 3: Navigate to dashboard
    console.log('\n3. DASHBOARD ACCESS');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const dashUrl = page.url();
    console.log('   URL:', dashUrl);

    if (dashUrl.includes('sign-in') || dashUrl.includes('sign-up')) {
      console.log('   ⚠️  Redirected to auth page (not authenticated)');

      // Sign in with the test user
      console.log('\n4. SIGN IN WITH TEST USER');
      await page.goto('http://localhost:3000/sign-in', { timeout: 15000 });
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      await page.fill('input[type="email"]', testEmail);
      const pwdInputs = await page.$$('input[type="password"]');
      if (pwdInputs.length > 0) await pwdInputs[0].fill(testPassword);

      const signInBtn = await page.$('button[type="submit"]');
      if (signInBtn) {
        await signInBtn.click();
        await page.waitForTimeout(5000);

        const afterSignInUrl = page.url();
        console.log('   After sign in URL:', afterSignInUrl);
      }
    }

    // Step 5: Try dashboard again
    console.log('\n5. DASHBOARD (AFTER AUTH)');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log('   Final URL:', finalUrl);

    const finalBodyText = await page.$eval('body', el => el.innerText);
    console.log('   Contains "My Tasks":', finalBodyText.includes('My Tasks') ? '✅' : '⚠️');
    console.log('   Contains "Add Task":', finalBodyText.includes('Add Task') ? '✅' : '⚠️');
    console.log('   Contains "Search":', finalBodyText.toLowerCase().includes('search') ? '✅' : '⚠️');

    // Test search input
    const searchInput = await page.$('input[placeholder*="search" i]');
    console.log('   Search input found:', searchInput ? '✅' : '⚠️');

    // Test priority selector
    const prioritySelect = await page.$('select, .priority-selector');
    console.log('   Priority selector found:', prioritySelect ? '✅' : '⚠️');

    // Test tag input
    const tagInput = await page.$('input[placeholder*="tag" i], .tag-input');
    console.log('   Tag input found:', tagInput ? '✅' : '⚠️');

    // Test date picker
    const datePicker = await page.$('input[type="date"], .date-picker');
    console.log('   Date picker found:', datePicker ? '✅' : '⚠️');

    // Console errors
    console.log('\n6. CONSOLE ERRORS');
    console.log('   Total errors:', errors.length);
    if (errors.length > 0) {
      errors.forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 100)}`));
    } else {
      console.log('   ✅ No errors!');
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    const hasFeatures =
      finalBodyText.includes('Add Task') &&
      finalBodyText.toLowerCase().includes('search') &&
      searchInput;

    console.log('Dashboard accessible:', finalUrl.includes('dashboard') ? '✅' : '❌');
    console.log('Task features visible:', hasFeatures ? '✅' : '⚠️');
    console.log('Console errors:', errors.length === 0 ? '0 ✅' : `${errors.length} ❌`);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===');
  }
}

fullAuthAndFeatureTest();
