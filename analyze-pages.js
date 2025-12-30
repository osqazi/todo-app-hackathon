const { chromium } = require('playwright');

async function analyzePages() {
  console.log('=== Page Structure Analysis ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // Analyze Sign Up page
    console.log('1. SIGN UP PAGE');
    await page.goto('http://localhost:3000/sign-up', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const signUpHtml = await page.content();
    console.log('   Page contains form:', signUpHtml.includes('<form') ? '✅' : '❌');
    console.log('   Page contains email input:', signUpHtml.includes('email') ? '✅' : '❌');
    console.log('   Page contains password input:', signUpHtml.includes('password') ? '✅' : '❌');
    console.log('   Page contains submit button:', signUpHtml.includes('submit') ? '✅' : '❌');

    // Get form details
    const forms = await page.$$('form');
    const inputs = await page.$$('input');
    const buttons = await page.$$('button');

    console.log(`   Forms found: ${forms.length}`);
    console.log(`   Inputs found: ${inputs.length}`);
    console.log(`   Buttons found: ${buttons.length}`);

    // List input types
    console.log('   Input details:');
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`     - type="${type}", name="${name}", placeholder="${placeholder || 'N/A'}"`);
    }

    // Analyze Dashboard page structure
    console.log('\n2. DASHBOARD PAGE');
    await page.goto('http://localhost:3000/dashboard', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const dashHtml = await page.content();
    console.log('   Page contains "My Tasks":', dashHtml.includes('My Tasks') ? '✅' : '⚠️');
    console.log('   Page contains search:', dashHtml.toLowerCase().includes('search') ? '✅' : '⚠️');
    console.log('   Page contains filter:', dashHtml.toLowerCase().includes('filter') ? '✅' : '⚠️');
    console.log('   Page contains "Add Task":', dashHtml.includes('Add Task') ? '✅' : '⚠️');

    // Check for TaskForm component
    console.log('   TaskForm component:', dashHtml.includes('TaskForm') ? '✅' : '⚠️');
    console.log('   TaskList component:', dashHtml.includes('TaskList') ? '✅' : '⚠️');

    // Check body text
    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('\n   Body text preview (first 200 chars):');
    console.log('   ' + bodyText.substring(0, 200).replace(/\n/g, ' '));

    // Console errors
    console.log('\n3. CONSOLE ERRORS');
    console.log('   Total errors:', errors.length);
    if (errors.length > 0) {
      errors.forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 100)}`));
    } else {
      console.log('   ✅ No errors!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Analysis Complete ===');
  }
}

analyzePages();
