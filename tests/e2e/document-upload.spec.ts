import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'andrew8@asgard.ti.cz';
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

test.describe('Document Upload Feature', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Navigate to login page (using baseURL from config)
    await page.goto('/login');
  });

  test('should upload brand vision document as alternative to questionnaire', async () => {
    // Login with test user
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button:has-text("Send OTP")');

    // Wait for OTP input to appear
    await page.waitForSelector('input[placeholder*="OTP"]', { timeout: 5000 });

    // Ask for OTP from user
    console.log('\n⚠️  Please provide the OTP code for', TEST_EMAIL);
    console.log('Waiting for OTP input...');

    // For testing purposes, we'll use a mock OTP
    // In actual testing, you'd need to retrieve this from email or test backend
    const OTP = await promptForOTP(); // You'll need to implement this or provide it

    await page.fill('input[placeholder*="OTP"]', OTP);
    await page.click('button:has-text("Verify")');

    // Wait for navigation to brands page
    await page.waitForURL('**/brands', { timeout: 10000 });

    // Navigate to a brand's explanation page
    // First, let's check if there's an existing brand or create a new one
    const brandCards = await page.locator('.brand-card').count();

    if (brandCards === 0) {
      // Create a new brand
      await page.click('button:has-text("Create New Brand")');
      await page.fill('input[placeholder*="brand name"]', 'Test Brand for Upload');
      await page.fill('textarea[placeholder*="description"]', 'A test brand for document upload feature');
      await page.click('button:has-text("Create Brand")');
    } else {
      // Click on the first brand
      await page.locator('.brand-card').first().click();
    }

    // Wait for the explanation page to load
    await page.waitForSelector('h2:has-text("Process overview")', { timeout: 10000 });

    // Test 1: Check if upload section is visible
    await expect(page.locator('h3:has-text("Alternative: Upload Your Brand Vision")')).toBeVisible();
    await expect(page.locator('text=Have an existing document with your brand vision')).toBeVisible();

    // Test 2: Check file input and label
    const fileInput = page.locator('input#document-upload');
    await expect(fileInput).toBeHidden(); // Input should be hidden
    const uploadLabel = page.locator('label[for="document-upload"]');
    await expect(uploadLabel).toBeVisible();
    await expect(uploadLabel).toContainText('Choose Document');

    // Test 3: Create a test file and upload it
    const testFileName = 'brand-vision.txt';
    const testFileContent = `
      Brand Vision Document for Test Brand

      Our Mission:
      To revolutionize the industry through innovative solutions and exceptional customer service.

      Target Audience:
      - Small to medium businesses
      - Tech-savvy entrepreneurs
      - Digital marketing agencies

      Core Values:
      1. Innovation
      2. Integrity
      3. Customer-centricity
      4. Sustainability

      Brand Personality:
      Professional, approachable, innovative, and reliable.

      Unique Value Proposition:
      We provide cutting-edge solutions that are both powerful and easy to use,
      helping businesses scale efficiently while maintaining their unique identity.
    `;

    // Set file input
    await fileInput.setInputFiles({
      name: testFileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent)
    });

    // Test 4: Verify file selection UI updates
    await expect(page.locator(`text=${testFileName}`)).toBeVisible();
    await expect(page.locator('button:has-text("Upload and Process Document")')).toBeVisible();

    // Test 5: Check remove file functionality
    const removeButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await removeButton.click();
    await expect(page.locator(`text=${testFileName}`)).not.toBeVisible();

    // Test 6: Re-upload the file
    await fileInput.setInputFiles({
      name: testFileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent)
    });

    // Test 7: Test file validation with invalid file type
    const invalidFile = {
      name: 'invalid.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('invalid content')
    };

    // Clear current file first
    await removeButton.click();
    await fileInput.setInputFiles(invalidFile);

    // Should show error for invalid file type
    await expect(page.locator('text=Please upload a PDF, Word document, or text file')).toBeVisible();

    // Test 8: Upload valid file and process
    await fileInput.setInputFiles({
      name: testFileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent)
    });

    // Click upload button
    await page.click('button:has-text("Upload and Process Document")');

    // Wait for processing (button should show loading state)
    await expect(page.locator('text=Processing Document')).toBeVisible();

    // The actual upload will fail without backend implementation
    // but we're testing the UI functionality

    // Test 9: Verify original questionnaire option is still available
    await expect(page.locator('button:has-text("Proceed to Questionnaire")')).toBeVisible();
    await expect(page.locator('text=Or continue with the questionnaire')).toBeVisible();
  });

  test('should handle large file upload error', async () => {
    // Similar login process
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button:has-text("Send OTP")');

    const OTP = await promptForOTP();
    await page.fill('input[placeholder*="OTP"]', OTP);
    await page.click('button:has-text("Verify")');

    await page.waitForURL('**/brands');

    // Navigate to brand explanation page
    const brandCards = await page.locator('.brand-card').count();
    if (brandCards > 0) {
      await page.locator('.brand-card').first().click();
    }

    await page.waitForSelector('h2:has-text("Process overview")');

    // Create a large file (over 10MB)
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB of data
    const largeFile = {
      name: 'large-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(largeContent)
    };

    const fileInput = page.locator('input#document-upload');
    await fileInput.setInputFiles(largeFile);

    // Should show file size error
    await expect(page.locator('text=File size must be less than 10MB')).toBeVisible();
  });

  test('should support multiple file formats', async () => {
    // Test different file formats
    const fileFormats = [
      { name: 'document.pdf', mimeType: 'application/pdf' },
      { name: 'document.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { name: 'document.doc', mimeType: 'application/msword' },
      { name: 'document.txt', mimeType: 'text/plain' },
      { name: 'document.md', mimeType: 'text/markdown' }
    ];

    // Login first
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button:has-text("Send OTP")');

    const OTP = await promptForOTP();
    await page.fill('input[placeholder*="OTP"]', OTP);
    await page.click('button:has-text("Verify")');

    await page.waitForURL('**/brands');

    // Navigate to brand explanation page
    const brandCards = await page.locator('.brand-card').count();
    if (brandCards > 0) {
      await page.locator('.brand-card').first().click();
    }

    await page.waitForSelector('h2:has-text("Process overview")');

    const fileInput = page.locator('input#document-upload');
    const removeButton = page.locator('button').filter({ has: page.locator('svg') }).last();

    for (const format of fileFormats) {
      // Upload file
      await fileInput.setInputFiles({
        name: format.name,
        mimeType: format.mimeType,
        buffer: Buffer.from('Test content for ' + format.name)
      });

      // Verify file appears
      await expect(page.locator(`text=${format.name}`)).toBeVisible();

      // Clear for next test
      await removeButton.click();
      await expect(page.locator(`text=${format.name}`)).not.toBeVisible();
    }
  });
});

// Helper function to prompt for OTP (you'll need to implement this based on your needs)
async function promptForOTP(): Promise<string> {
  // In a real test environment, you might:
  // 1. Read from environment variable
  // 2. Fetch from test email service
  // 3. Use a test backend that provides predictable OTPs
  // 4. Prompt user input during interactive testing

  // For now, return a placeholder that should be replaced with actual OTP
  return process.env.TEST_OTP || '123456';
}