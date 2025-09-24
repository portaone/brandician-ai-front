# Playwright MCP Test Execution Guide

## Full User Journey Test

This document contains the complete test flow using Playwright MCP commands.

### Test Configuration
- **Email**: test@test.com
- **OTP**: 123456
- **Brand Name**: ClearText AI
- **Base URL**: http://localhost:5501

### Prerequisites
1. Ensure the development server is running (`npm run dev`)
2. Ensure the backend API is accessible
3. Clear browser data before starting

## Test Execution Steps

### Part 1: Desktop Testing (1920x1080)

#### Step 1: Setup and Navigate to Registration
```
1. browser_resize: width=1920, height=1080
2. browser_navigate: url="http://localhost:5501/register"
3. browser_take_screenshot: filename="desktop-registration-page.png"
```

#### Step 2: Complete Registration
```
1. browser_fill_form:
   - email field: "test@test.com"
2. browser_click: "Continue" button
3. Wait for OTP screen
4. browser_fill_form:
   - OTP inputs: "1", "2", "3", "4", "5", "6"
5. browser_click: "Verify" button
6. browser_take_screenshot: filename="desktop-registration-complete.png"
```

#### Step 3: Logout
```
1. browser_evaluate: Clear localStorage (auth tokens)
2. browser_navigate: url="http://localhost:5501"
3. browser_take_screenshot: filename="desktop-logged-out.png"
```

#### Step 4: Login
```
1. browser_navigate: url="http://localhost:5501/register"
2. browser_fill_form:
   - email field: "test@test.com"
3. browser_click: "Continue" button
4. browser_fill_form:
   - OTP inputs: "1", "2", "3", "4", "5", "6"
5. browser_click: "Verify" button
6. browser_take_screenshot: filename="desktop-login-complete.png"
```

#### Step 5: Create Brand
```
1. browser_click: "Create New Brand" button
2. browser_fill_form:
   - name: "ClearText AI"
   - description: "AI-powered text optimization service"
3. browser_click: "Create" button
4. browser_take_screenshot: filename="desktop-brand-created.png"
```

#### Step 6: Complete Questionnaire
```
1. For each question:
   - browser_fill_form: Answer based on context
   - browser_click: "Continue" button
   - browser_take_screenshot: filename="desktop-questionnaire-{n}.png"
2. Complete all questions until survey page
```

#### Step 7: Verify Brand in List
```
1. browser_navigate: url="http://localhost:5501/brands"
2. browser_snapshot: Check for "ClearText AI" in list
3. browser_take_screenshot: filename="desktop-brands-list.png"
```

### Part 2: Mobile Testing (375x812)

#### Repeat all steps with mobile viewport:
```
1. browser_resize: width=375, height=812
2. Follow same flow as desktop
3. Note: May need to click hamburger menu for navigation
4. Screenshots: Use "mobile-" prefix instead of "desktop-"
```

## Visual Verification Checks

### For each page, verify:
1. **No overlapping elements**
   - Use browser_evaluate to check element positions

2. **Text readability**
   - Font size >= 12px
   - Sufficient contrast

3. **Form accessibility**
   - All inputs are clickable
   - Labels are visible

4. **Responsive layout**
   - No horizontal scrolling on mobile
   - Proper element stacking

## Expected Results

### Success Criteria:
- ✅ User can register with email/OTP
- ✅ User can logout and login
- ✅ Brand creation works
- ✅ Questionnaire can be completed
- ✅ Survey is generated
- ✅ Brand appears in list
- ✅ All pages display correctly on desktop
- ✅ All pages display correctly on mobile
- ✅ No visual layout issues

### Screenshots Location:
All screenshots are saved in `.playwright-mcp/` directory

## Troubleshooting

### Common Issues:
1. **OTP not working**: Ensure backend is configured for test mode
2. **Page not loading**: Check if dev server is running
3. **Elements not found**: Page structure may have changed
4. **Visual issues**: Check responsive breakpoints

## Running the Test

To execute this test manually:
1. Open the application in Playwright MCP
2. Follow each step in sequence
3. Verify visual layout at each step
4. Document any issues found