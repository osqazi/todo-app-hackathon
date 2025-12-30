const { chromium } = require('playwright');

async function testDashboardDetailed() {
  console.log('=== Detailed Dashboard Test ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // Sign in first
    console.log('1. SIGN IN');
    await page.goto('http://localhost:3000/sign-in', { timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'testuser1767078768370@test.com');
    const pwdInput = await page.$('input[type="password"]');
    await pwdInput.fill('TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Navigate to dashboard
    console.log('2. NAVIGATE TO DASHBOARD');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(5000);

    const url = page.url();
    console.log('   URL:', url);

    // Get full page HTML
    const html = await page.content();
    console.log('\n3. PAGE HTML ANALYSIS');
    console.log('   Contains #__next:', html.includes('id="__next"') ? 'OK' : 'MISSING');
    console.log('   Contains My Tasks:', html.includes('My Tasks') ? 'OK' : 'MISSING');
    console.log('   Contains Add Task:', html.includes('Add Task') ? 'OK' : 'MISSING');
    console.log('   Contains search:', html.toLowerCase().includes('search') ? 'OK' : 'MISSING');
    console.log('   Contains filter:', html.toLowerCase().includes('filter') ? 'OK' : 'MISSING');

    // Get body text
    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('\n4. BODY TEXT ANALYSIS');
    console.log('   Text length:', bodyText.length);
    console.log('   Preview:', bodyText.substring(0, 300).replace(/\s+/g, ' '));

    // Check for specific elements
    console.log('\n5. ELEMENT CHECK');
    const buttons = await page.$$('button');
    console.log('   Button count:', buttons.length);

    const inputs = await page.$$('input');
    console.log('   Input count:', inputs.length);

    // Console errors
    console.log('\n6. CONSOLE ERRORS');
    console.log('   Total:', errors.length);
    if (errors.length > 0) {
      const realErrors = errors.filter(e => !e.includes('Hydration'));
      console.log('   Real errors:', realErrors.length);
      if (realErrors.length > 0) {
        realErrors.slice(0, 3).forEach((e, i) => console.log('   ' + (i + 1) + '. ' + e.substring(0, 80)));
      }
    } else {
      console.log('   OK - No errors!');
    }

  } catch (error) {
    console.error('TEST ERROR:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Complete ===');
  }
}

testDashboardDetailed();
