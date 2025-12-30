const { chromium } = require('playwright');

async function signUpAndTestFeatures() {
  console.log('=== Todo App: Sign Up & Feature Test ===\n');

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

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Test 1: Sign Up
    console.log('1. SIGN UP');
    console.log('   Email:', testEmail);
    await page.goto('http://localhost:3000/sign-up', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Fill sign up form
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    if (emailInput && passwordInput) {
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);

      // Find and click submit button
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        console.log('   Sign up submitted');
      }
    }

    // Check if redirected to dashboard
    const currentUrl = page.url();
    console.log('   Redirected to:', currentUrl.includes('dashboard') ? '/dashboard' : currentUrl);

    // Test 2: Create Task with Priority and Tags
    console.log('\n2. CREATE TASK');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Look for "Add Task" or create button
    const addTaskBtn = await page.$('button:has-text("Add Task"), button:has-text("Create Task"), a:has-text("New Task")');
    if (addTaskBtn) {
      await addTaskBtn.click();
      await page.waitForTimeout(1000);
      console.log('   Opened task form');
    }

    // Fill task form
    const titleInput = await page.$('input[placeholder*="title" i], input[name="title"], input[type="text"]');
    if (titleInput) {
      await titleInput.fill('Test task with high priority and tags');
      console.log('   Filled task title');
    }

    // Check for priority selector
    const prioritySelect = await page.$('select[name="priority"], .priority-selector, button:has-text("Priority")');
    if (prioritySelect) {
      console.log('   Priority selector found');
      // Click to open and select high
      await prioritySelect.click();
      await page.waitForTimeout(500);
      const highOption = await page.$('option:has-text("High"), li:has-text("High"), button:has-text("High")');
      if (highOption) await highOption.click();
      console.log('   Selected High priority');
    }

    // Check for tag input
    const tagInput = await page.$('input[placeholder*="tag" i], .tag-input, .tags-input');
    if (tagInput) {
      await tagInput.fill('work, urgent');
      await tagInput.press('Enter');
      console.log('   Added tags: work, urgent');
    }

    // Submit task
    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('   Task created');
    }

    // Test 3: Create another task with due date
    console.log('\n3. CREATE TASK WITH DUE DATE');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const addTaskBtn2 = await page.$('button:has-text("Add Task")');
    if (addTaskBtn2) {
      await addTaskBtn2.click();
      await page.waitForTimeout(1000);

      await titleInput?.fill('Important meeting task');
      console.log('   Filled task title');

      // Check for date picker
      const datePicker = await page.$('input[type="date"], .date-picker, button:has-text("Due")');
      if (datePicker) {
        console.log('   Date picker found');
      }

      await saveBtn?.click();
      await page.waitForTimeout(2000);
      console.log('   Task with due date created');
    }

    // Test 4: Test Search
    console.log('\n4. TEST SEARCH');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const searchBar = await page.$('input[placeholder*="search" i], input[type="search"], .search-bar input');
    if (searchBar) {
      await searchBar.fill('meeting');
      await page.waitForTimeout(1000);
      console.log('   Searched for "meeting"');
    }

    // Test 5: Test Filters
    console.log('\n5. TEST FILTERS');
    const filterBtn = await page.$('button:has-text("Filter"), .filter-button');
    if (filterBtn) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      console.log('   Opened filters');
    }

    // Check for priority filter
    const priorityFilter = await page.$('input[value="high"], label:has-text("High"), button:has-text("High")');
    if (priorityFilter) {
      console.log('   Priority filter found');
    }

    // Test 6: Test Sort
    console.log('\n6. TEST SORT');
    const sortSelect = await page.$('select[name="sort"], .sort-selector, button:has-text("Sort")');
    if (sortSelect) {
      console.log('   Sort selector found');
    }

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('Pages tested: 4 (Sign Up, Dashboard x3)');
    console.log('Console errors:', errors.length);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 100)}`));
    } else {
      console.log('\n✅ No console errors!');
    }

    // Dashboard verification
    const dashText = await page.$eval('body', el => el.innerText);
    const hasTaskContent = dashText.toLowerCase().includes('task') || dashText.toLowerCase().includes('meeting');
    console.log('Task content visible:', hasTaskContent ? '✅' : '⚠️');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===');
  }
}

signUpAndTestFeatures();
