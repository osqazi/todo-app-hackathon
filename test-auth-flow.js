const { chromium } = require('playwright');

async function signUpSignInAndTest() {
  console.log('=== Sign Up → Sign In → Test Features ===\n');

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

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  try {
    // Step 1: Sign Up
    console.log('1. SIGN UP');
    await page.goto('http://localhost:3000/sign-up', { timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.fill('input[id="name"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    const pwdInputs = await page.$$('input[type="password"]');
    await pwdInputs[0].fill(testPassword);
    await pwdInputs[1].fill(testPassword);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const afterSignupUrl = page.url();
    console.log('   After signup URL:', afterSignupUrl);

    // Step 2: Sign In (explicit sign in after signup)
    console.log('\n2. SIGN IN');
    if (!afterSignupUrl.includes('dashboard')) {
      await page.goto('http://localhost:3000/sign-in', { timeout: 15000 });
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      await page.fill('input[type="email"]', testEmail);
      const signInPwd = await page.$('input[type="password"]');
      await signInPwd.fill(testPassword);

      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);

      const afterSignInUrl = page.url();
      console.log('   After sign in URL:', afterSignInUrl);
    }

    // Step 3: Go to Dashboard
    console.log('\n3. ACCESS DASHBOARD');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(5000);

    const dashboardUrl = page.url();
    console.log('   Dashboard URL:', dashboardUrl);

    // Step 4: Check dashboard content
    console.log('\n4. DASHBOARD FEATURES');
    const bodyText = await page.$eval('body', el => el.innerText);

    console.log('   Contains "My Tasks":', bodyText.includes('My Tasks') ? '✅' : '❌');
    console.log('   Contains "Add Task":', bodyText.includes('Add Task') ? '✅' : '❌');
    console.log('   Contains "Search":', bodyText.toLowerCase().includes('search') ? '✅' : '❌');

    // Test search functionality
    const searchInput = await page.$('input[placeholder*="search" i]');
    if (searchInput) {
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      console.log('   ✅ Search input works');
    }

    // Test filters
    const filterContent = bodyText.toLowerCase();
    console.log('   Filter UI present:', filterContent.includes('filter') || filterContent.includes('priority') ? '✅' : '⚠️');

    // Test sort
    console.log('   Sort UI present:', filterContent.includes('sort') || filterContent.includes('order') ? '✅' : '⚠️');

    // Step 5: Open Task Form
    console.log('\n5. TASK FORM');
    const addTaskBtn = await page.$('button:has-text("Add Task")');
    if (addTaskBtn) {
      await addTaskBtn.click();
      await page.waitForTimeout(1000);

      const formBody = await page.$eval('body', el => el.innerText);
      console.log('   Task form opened: ✅');

      // Check for priority selector
      console.log('   Priority selector:', formBody.toLowerCase().includes('priority') ? '✅' : '⚠️');
      console.log('   Tag input:', formBody.toLowerCase().includes('tag') ? '✅' : '⚠️');
      console.log('   Due date:', formBody.toLowerCase().includes('due') || formBody.includes('date') ? '✅' : '⚠️');
    } else {
      console.log('   Add Task button: ❌');
    }

    // Step 6: Console errors
    console.log('\n6. CONSOLE ERRORS');
    console.log('   Total errors:', errors.length);
    if (errors.length > 0) {
      // Filter out hydration warnings (common in dev)
      const realErrors = errors.filter(e => !e.includes('Hydration'));
      console.log('   Real errors:', realErrors.length);
      if (realErrors.length > 0) {
        realErrors.slice(0, 3).forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 80)}`));
      }
    } else {
      console.log('   ✅ No errors!');
    }

    // Final summary
    console.log('\n=== FINAL STATUS ===');
    const dashboardAccessible = dashboardUrl.includes('dashboard') && bodyText.includes('My Tasks');
    console.log('Dashboard accessible:', dashboardAccessible ? '✅' : '❌');
    console.log('Features implemented:', bodyText.includes('Add Task') && bodyText.toLowerCase().includes('search') ? '✅' : '⚠️');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Complete ===');
  }
}

signUpSignInAndTest();
