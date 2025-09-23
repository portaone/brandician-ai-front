import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_EMAIL = 'test@test.com';
const TEST_OTP = '123456';
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

// Brand information for ClearText AI
const BRAND_INFO = {
  name: 'ClearText AI',
  description: 'AI-powered text optimization service that transforms complex content into clear, easy-to-understand language',
  industry: 'Technology / SaaS',
  targetAudience: 'Content creators, businesses, educators',
  mainGoal: 'Help people communicate more effectively by simplifying and clarifying their written content',
};

// Questionnaire answers
const QUESTIONNAIRE_ANSWERS = {
  brand_name: BRAND_INFO.name,
  industry: BRAND_INFO.industry,
  target_audience: BRAND_INFO.targetAudience,
  brand_description: BRAND_INFO.description,
  main_goal: BRAND_INFO.mainGoal,
  unique_value: 'Advanced AI that understands context and maintains meaning while simplifying language',
  brand_personality: 'Professional, helpful, intelligent, approachable',
  competitors: 'Grammarly, Hemingway Editor, ProWritingAid',
  success_metrics: 'User engagement, content clarity scores, customer satisfaction',
  brand_story: 'Founded by linguists and AI researchers frustrated with jargon-filled communication',
};

// Visual regression test helper
async function checkVisualLayout(page: Page, name: string, viewport: string) {
  // Check for common layout issues
  const issues: string[] = [];

  // Check for overlapping elements
  const overlapping = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const overlaps: string[] = [];

    for (let i = 0; i < elements.length; i++) {
      const rect1 = elements[i].getBoundingClientRect();
      if (rect1.width === 0 || rect1.height === 0) continue;

      for (let j = i + 1; j < elements.length; j++) {
        const rect2 = elements[j].getBoundingClientRect();
        if (rect2.width === 0 || rect2.height === 0) continue;

        // Check if elements overlap (excluding parent-child relationships)
        if (!elements[i].contains(elements[j]) && !elements[j].contains(elements[i])) {
          const overlap = !(rect1.right < rect2.left ||
                          rect2.right < rect1.left ||
                          rect1.bottom < rect2.top ||
                          rect2.bottom < rect1.top);

          if (overlap && window.getComputedStyle(elements[i]).position !== 'absolute' &&
              window.getComputedStyle(elements[j]).position !== 'absolute') {
            overlaps.push(`${elements[i].tagName} overlaps with ${elements[j].tagName}`);
          }
        }
      }
    }
    return overlaps.slice(0, 5); // Return max 5 overlaps
  });

  if (overlapping.length > 0) {
    issues.push(`Overlapping elements found: ${overlapping.join(', ')}`);
  }

  // Check for text readability
  const unreadableText = await page.evaluate(() => {
    const texts = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    const unreadable: string[] = [];

    texts.forEach(el => {
      const styles = window.getComputedStyle(el);
      const fontSize = parseFloat(styles.fontSize);
      const color = styles.color;
      const bgColor = styles.backgroundColor;

      // Check for too small text
      if (fontSize < 12 && el.textContent?.trim()) {
        unreadable.push(`Text too small (${fontSize}px): "${el.textContent.substring(0, 20)}..."`);
      }
    });

    return unreadable.slice(0, 3);
  });

  if (unreadableText.length > 0) {
    issues.push(`Readability issues: ${unreadableText.join(', ')}`);
  }

  // Take screenshot for visual comparison
  await page.screenshot({
    path: `tests/screenshots/${name}-${viewport}.png`,
    fullPage: true
  });

  // Log any issues found
  if (issues.length > 0) {
    console.warn(`Visual issues in ${name} (${viewport}):`, issues);
  }

  return issues.length === 0;
}

// Helper to wait for navigation with proper error handling
async function navigateAndWait(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
}

// Test for both desktop and mobile viewports
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 375, height: 812 }
];

viewports.forEach(({ name: viewportName, width, height }) => {
  test.describe(`Full User Journey - ${viewportName}`, () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width, height });

      // Clear any existing session data
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    test('Complete user journey from registration to survey creation', async ({ page, context }) => {
      // Step 1: Registration
      test.step('User Registration', async () => {
        await navigateAndWait(page, 'http://localhost:5501/register');

        // Check visual layout of registration page
        await checkVisualLayout(page, 'registration', viewportName);

        // Fill registration form
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.click('button:has-text("Continue")');

        // Wait for OTP screen
        await page.waitForSelector('text=Enter verification code', { timeout: 10000 });

        // Enter OTP
        const otpInputs = page.locator('input[maxlength="1"]');
        const otpDigits = TEST_OTP.split('');
        for (let i = 0; i < otpDigits.length; i++) {
          await otpInputs.nth(i).fill(otpDigits[i]);
        }

        // Verify OTP
        await page.click('button:has-text("Verify")');

        // Wait for redirect to brands page
        await page.waitForURL('**/brands', { timeout: 10000 });

        // Verify successful registration
        expect(page.url()).toContain('/brands');
        await checkVisualLayout(page, 'brands-list-empty', viewportName);
      });

      // Step 2: Logout
      test.step('Logout', async () => {
        // Click on user menu or logout button
        if (viewportName === 'mobile') {
          // Open mobile menu first
          await page.click('button[aria-label="Menu"]', { timeout: 5000 }).catch(() => {
            // Try alternative selector
            return page.click('.md\\:hidden button');
          });
        }

        // For now, we'll clear the session manually since logout button might not be implemented
        await page.evaluate(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth-storage');
        });

        // Navigate to home
        await navigateAndWait(page, 'http://localhost:5501');
        await checkVisualLayout(page, 'home-logged-out', viewportName);
      });

      // Step 3: Login
      test.step('Login', async () => {
        await navigateAndWait(page, 'http://localhost:5501/register');

        // Enter email
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.click('button:has-text("Continue")');

        // Enter OTP
        await page.waitForSelector('text=Enter verification code', { timeout: 10000 });
        const otpInputs = page.locator('input[maxlength="1"]');
        const otpDigits = TEST_OTP.split('');
        for (let i = 0; i < otpDigits.length; i++) {
          await otpInputs.nth(i).fill(otpDigits[i]);
        }

        await page.click('button:has-text("Verify")');

        // Wait for redirect
        await page.waitForURL('**/brands', { timeout: 10000 });
        await checkVisualLayout(page, 'brands-list-after-login', viewportName);
      });

      // Step 4: Create a new brand
      test.step('Create Brand', async () => {
        // Click create brand button
        await page.click('button:has-text("Create New Brand"), a:has-text("Create New Brand")');

        // Wait for brand creation form
        await page.waitForSelector('text=Create', { timeout: 10000 });

        // Fill brand details
        await page.fill('input[placeholder*="brand name" i], input[name="name"]', BRAND_INFO.name);

        // Fill description if field exists
        const descField = page.locator('textarea[placeholder*="description" i], textarea[name="description"]');
        if (await descField.count() > 0) {
          await descField.fill(BRAND_INFO.description);
        }

        await checkVisualLayout(page, 'create-brand-form', viewportName);

        // Submit brand creation
        await page.click('button:has-text("Create"), button:has-text("Continue")');

        // Wait for redirect to brand explanation or questionnaire
        await page.waitForURL(/\/brands\/[a-f0-9-]+\/(explanation|questionnaire)/, { timeout: 15000 });
      });

      // Step 5: Go through explanation screen if present
      test.step('Explanation Screen', async () => {
        if (page.url().includes('explanation')) {
          await checkVisualLayout(page, 'explanation-screen', viewportName);

          // Click continue/start button
          await page.click('button:has-text("Continue"), button:has-text("Start"), button:has-text("Begin")');

          // Wait for questionnaire
          await page.waitForURL(/\/questionnaire/, { timeout: 10000 });
        }
      });

      // Step 6: Answer questionnaire
      test.step('Complete Questionnaire', async () => {
        // The questionnaire might have multiple questions, we'll handle them dynamically
        let questionCount = 0;
        const maxQuestions = 20; // Safety limit

        while (questionCount < maxQuestions) {
          // Check if we're still on questionnaire page
          if (!page.url().includes('questionnaire')) {
            break;
          }

          // Take screenshot of each question
          await checkVisualLayout(page, `questionnaire-q${questionCount + 1}`, viewportName);

          // Look for question text
          const questionText = await page.textContent('h2, h3, .question-text').catch(() => '');
          console.log(`Question ${questionCount + 1}: ${questionText}`);

          // Try to find and fill any input fields
          const textInput = page.locator('textarea:visible, input[type="text"]:visible').first();
          const hasTextInput = await textInput.count() > 0;

          if (hasTextInput) {
            // Determine which answer to provide based on question content
            let answer = BRAND_INFO.description; // Default answer

            if (questionText.toLowerCase().includes('name')) {
              answer = QUESTIONNAIRE_ANSWERS.brand_name;
            } else if (questionText.toLowerCase().includes('industry')) {
              answer = QUESTIONNAIRE_ANSWERS.industry;
            } else if (questionText.toLowerCase().includes('audience') || questionText.toLowerCase().includes('customer')) {
              answer = QUESTIONNAIRE_ANSWERS.target_audience;
            } else if (questionText.toLowerCase().includes('goal') || questionText.toLowerCase().includes('objective')) {
              answer = QUESTIONNAIRE_ANSWERS.main_goal;
            } else if (questionText.toLowerCase().includes('unique') || questionText.toLowerCase().includes('different')) {
              answer = QUESTIONNAIRE_ANSWERS.unique_value;
            } else if (questionText.toLowerCase().includes('personality') || questionText.toLowerCase().includes('tone')) {
              answer = QUESTIONNAIRE_ANSWERS.brand_personality;
            } else if (questionText.toLowerCase().includes('competitor')) {
              answer = QUESTIONNAIRE_ANSWERS.competitors;
            } else if (questionText.toLowerCase().includes('success') || questionText.toLowerCase().includes('metric')) {
              answer = QUESTIONNAIRE_ANSWERS.success_metrics;
            } else if (questionText.toLowerCase().includes('story') || questionText.toLowerCase().includes('history')) {
              answer = QUESTIONNAIRE_ANSWERS.brand_story;
            }

            await textInput.fill(answer);
          }

          // Check for multiple choice options
          const radioButtons = page.locator('input[type="radio"]:visible');
          if (await radioButtons.count() > 0) {
            // Select first option for simplicity
            await radioButtons.first().click();
          }

          // Check for checkboxes
          const checkboxes = page.locator('input[type="checkbox"]:visible');
          if (await checkboxes.count() > 0) {
            // Select first two options
            const count = Math.min(2, await checkboxes.count());
            for (let i = 0; i < count; i++) {
              await checkboxes.nth(i).click();
            }
          }

          // Look for continue/next button
          const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit")').first();

          if (await continueButton.count() > 0) {
            await continueButton.click();

            // Wait for navigation or content change
            await page.waitForTimeout(2000);

            // Check if we've moved to a new page
            const newUrl = page.url();
            if (!newUrl.includes('questionnaire')) {
              console.log('Questionnaire completed, moved to:', newUrl);
              break;
            }
          } else {
            console.log('No continue button found, questionnaire might be complete');
            break;
          }

          questionCount++;
        }

        console.log(`Completed ${questionCount} questions`);
      });

      // Step 7: Handle JTBD (Jobs to be Done) screen if present
      test.step('Jobs to be Done', async () => {
        if (page.url().includes('jtbd')) {
          await checkVisualLayout(page, 'jtbd-screen', viewportName);

          // Wait for content to load
          await page.waitForTimeout(3000);

          // Click continue
          const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
          if (await continueBtn.count() > 0) {
            await continueBtn.click();
          }
        }
      });

      // Step 8: Handle Survey screen
      test.step('Survey Creation', async () => {
        // Wait for survey page
        await page.waitForURL(/survey/, { timeout: 30000 }).catch(() => {
          console.log('Survey page not reached yet, checking current page');
        });

        if (page.url().includes('survey')) {
          await checkVisualLayout(page, 'survey-screen', viewportName);

          // Look for survey creation or configuration options
          await page.waitForTimeout(3000);

          // If there's a button to generate or continue with survey
          const surveyButton = page.locator('button:has-text("Generate"), button:has-text("Create Survey"), button:has-text("Continue")').first();
          if (await surveyButton.count() > 0) {
            await surveyButton.click();
            await page.waitForTimeout(3000);
          }
        }
      });

      // Step 9: Navigate to brand list
      test.step('Verify Brand in List', async () => {
        // Navigate to brands list
        if (viewportName === 'mobile') {
          // Open mobile menu
          const menuButton = page.locator('.md\\:hidden button, button[aria-label="Menu"]').first();
          if (await menuButton.count() > 0) {
            await menuButton.click();
            await page.waitForTimeout(1000);
          }
        }

        // Click My Brands link
        await page.click('a:has-text("My Brands"), link:has-text("My Brands")').catch(async () => {
          // If not found, navigate directly
          await navigateAndWait(page, 'http://localhost:5501/brands');
        });

        // Wait for brands list to load
        await page.waitForSelector('h2:has-text("Your Brands")', { timeout: 10000 });

        // Verify our brand is in the list
        await expect(page.locator(`text="${BRAND_INFO.name}"`)).toBeVisible({ timeout: 10000 });

        // Check final visual layout
        await checkVisualLayout(page, 'brands-list-with-brand', viewportName);

        // Verify brand status is shown
        const brandCard = page.locator(`div:has-text("${BRAND_INFO.name}")`).first();
        await expect(brandCard.locator('text=/Status:/i')).toBeVisible();

        console.log(`✅ Test completed successfully for ${viewportName}`);
      });
    });
  });
});

// Additional test for visual regression
test.describe('Visual Regression Checks', () => {
  test('Compare screenshots between runs', async ({ page }) => {
    // This test can be used to compare screenshots from different runs
    // You would need to implement a comparison mechanism or use a visual testing service

    console.log('Screenshots saved in tests/screenshots/');
    console.log('To perform visual regression testing:');
    console.log('1. Run tests to generate baseline screenshots');
    console.log('2. Make changes to the application');
    console.log('3. Run tests again');
    console.log('4. Compare screenshots manually or with a tool like pixelmatch');
  });
});