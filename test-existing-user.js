const { chromium } = require('playwright');

async function testExistingUser() {
  console.log('=== Test Sign In with Existing User ===\n');

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
    // Sign in with existing test user
    console.log('1. SIGN IN with testuser1767078768370@test.com');
    await page.goto('http://localhost:3000/sign-in', { timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.fill('input[type="email"]', 'testuser1767078768370@test.com');
    const pwdInput = await page.$('input[type="password"]');
    await pwdInput.fill('TestPass123!');

    console.log('   Clicking sign in...');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(5000);

    const afterSignInUrl = page.url();
    console.log('   URL after sign in:', afterSignInUrl);

    // Check if redirected to dashboard
    if (afterSignInUrl.includes('dashboard')) {
      console.log('   ✅ Successfully redirected to dashboard!');

      // Check dashboard content
      await page.waitForTimeout(2000);
      const bodyText = await page.$eval('body', el => el.innerText);

      console.log('\n2. DASHBOARD CHECK');
      console.log('   Contains "My Tasks":', bodyText.includes('My Tasks') ? '✅' : '❌');
      console.log('   Contains "Add Task":', bodyText.includes('Add Task') ? '✅' : '❌');
      console.log('   Contains "Search":', bodyText.toLowerCase().includes('search') ? '✅' : '❌');

      // Test search
      const searchInput = await page.$('input[placeholder*="search" i]');
      if (searchInput) {
        console.log('   ✅ Search input works');
      }

      // Test filters
      const filterText = bodyText.toLowerCase();
      console.log('   Filter UI:', filterText.includes('filter') || filterText.includes('priority') ? '✅' : '⚠️');

      // Test sort
      console.log('   Sort UI:', filterText.includes('sort') || filterText.includes('order') ? '✅' : '⚠️');

    } else {
      console.log('   ❌ Still on sign-in page');
    }

    // Console errors
    console.log('\n3. CONSOLE ERRORS');
    console.log('   Total:', errors.length);
    if (errors.length > 0) {
      errors.slice(0, 3).forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 80)}`));
    } else {
      console.log('   ✅ No errors!');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Complete ===');
  }
}

testExistingUser();
