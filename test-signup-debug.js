const { chromium } = require('playwright');

async function testSignUp() {
  console.log('=== Testing Sign-Up Flow ===\n');

  const browser = await chromium.launch({
    headless: false, // Show browser
    slowMo: 500, // Slow down actions
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all network requests
  page.on('request', request => {
    if (request.url().includes('/api/auth/')) {
      console.log(`→ ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log('  Data:', request.postData().substring(0, 100));
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/auth/')) {
      console.log(`← ${response.status()} ${response.url()}`);
      try {
        const body = await response.text();
        console.log('  Response:', body.substring(0, 200));
      } catch (e) {
        // Ignore
      }
    }
  });

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  try {
    console.log('1. Going to sign-up page...');
    await page.goto('http://localhost:3000/sign-up', { timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('2. Filling form...');
    console.log('   Email:', testEmail);
    console.log('   Password: TestPass123!');

    await page.fill('input[type="email"]', testEmail);
    const pwdInputs = await page.$$('input[type="password"]');
    await pwdInputs[0].fill(testPassword);
    await pwdInputs[1].fill(testPassword);

    console.log('3. Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('4. After submit URL:', currentUrl);

    // Check for error message
    const errorMsg = await page.$('.bg-red-100');
    if (errorMsg) {
      const errorText = await errorMsg.textContent();
      console.log('   ERROR MESSAGE:', errorText);
    }

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test error:', error.message);
  }

  // Keep browser open for inspection
  console.log('\nBrowser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testSignUp();
