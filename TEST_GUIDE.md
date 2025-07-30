# 🧪 Salvebot Testing Guide

This guide will help you test all Salvebot functionality after deployment.

## 🏁 Pre-Testing Checklist

Ensure these are completed before testing:

- [ ] Backend deployed to Cloudflare Workers
- [ ] Frontend deployed to GitHub Pages
- [ ] All secrets configured (OpenAI, Stripe, JWT)
- [ ] Stripe products created and configured
- [ ] Stripe webhook configured and active

## 🧪 Test Scenarios

### 1. Authentication Testing

#### Test 1.1: User Registration
1. **Go to**: `https://yourusername.github.io/salvebot/signup`
2. **Fill form**:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123
   - Company: Test Company (optional)
3. **Expected**: Account created, redirected to dashboard
4. **Verify**: User appears in Cloudflare KV USERS namespace

#### Test 1.2: User Login
1. **Go to**: `https://yourusername.github.io/salvebot/signin`
2. **Fill form**:
   - Email: test@example.com
   - Password: TestPassword123
3. **Expected**: Login successful, redirected to dashboard
4. **Verify**: JWT token received and stored

#### Test 1.3: Authentication Protection
1. **Try accessing**: `https://yourusername.github.io/salvebot/dashboard` without login
2. **Expected**: Redirected to signin page
3. **Verify**: Protected routes require authentication

### 2. Chatbot Management Testing

#### Test 2.1: Create Chatbot
1. **Login** and go to dashboard
2. **Click**: "New Chatbot" or "Create Chatbot"
3. **Fill form**:
   - Name: Test Customer Support Bot
   - Domain: example.com
   - Welcome Message: Hello! How can I help?
4. **Expected**: Chatbot created successfully
5. **Verify**: 
   - Chatbot appears in dashboard
   - Embed code generated
   - Status shows "Not Verified"

#### Test 2.2: View Chatbot Details
1. **Click**: "Manage" on created chatbot
2. **Expected**: Shows chatbot configuration
3. **Verify**: All details are correct

#### Test 2.3: Update Chatbot
1. **Edit chatbot settings**:
   - Change welcome message
   - Update theme/position
2. **Save changes**
3. **Expected**: Settings updated successfully
4. **Verify**: Changes reflected in dashboard

### 3. Domain Verification Testing

#### Test 3.1: Domain Verification (Simulated)
Since domain verification requires actual domain ownership, we'll simulate:

1. **Manually update chatbot** in Cloudflare KV:
   ```javascript
   // In Cloudflare Workers dashboard or via API
   // Set chatbot.isVerified = true
   // Set chatbot.isActive = true
   ```
2. **Refresh dashboard**
3. **Expected**: Status shows "Active" and "Verified"

### 4. Chat Widget Testing

#### Test 4.1: Widget Integration
1. **Get embed code** from chatbot dashboard
2. **Create test HTML file**:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Test Chatbot</title>
       <meta charset="utf-8">
   </head>
   <body>
       <h1>Test Website</h1>
       <p>This is a test page for the chatbot widget.</p>
       
       <!-- Paste your chatbot embed code here -->
       <script>
         (function() {
           var script = document.createElement('script');
           script.src = 'https://salvebot-api.your-subdomain.workers.dev/api/chat/widget.js';
           script.async = true;
           script.setAttribute('data-chatbot-id', 'your-chatbot-id');
           script.setAttribute('data-domain', 'example.com');
           document.head.appendChild(script);
         })();
       </script>
   </body>
   </html>
   ```
3. **Open in browser**
4. **Expected**: Chat widget appears in bottom-right corner

#### Test 4.2: Chat Functionality
1. **Click chat widget** to open
2. **Send test message**: "Hello, I need help"
3. **Expected**: 
   - Message sent successfully
   - Bot responds (may be generic if no documents uploaded)
   - Conversation flows naturally

#### Test 4.3: Chat Without Documents
1. **Send message**: "What are your business hours?"
2. **Expected**: Bot responds with message indicating no information available
3. **Verify**: Response suggests contacting support

### 5. Billing Integration Testing

#### Test 5.1: Subscription Creation
1. **Go to**: Pricing page or billing section
2. **Click**: "Get Started" on a plan
3. **Expected**: Redirected to Stripe Checkout
4. **Use Stripe test card**: 4242 4242 4242 4242
5. **Complete checkout**
6. **Expected**: 
   - Payment successful
   - Redirected back to dashboard
   - Trial period active

#### Test 5.2: Subscription Status
1. **Check dashboard** after checkout
2. **Expected**: 
   - Subscription status shows "Active" or "Trial"
   - Trial end date displayed
   - Plan features accessible

#### Test 5.3: Webhook Processing
1. **Check Cloudflare Workers logs**:
   ```bash
   cd salvebot-backend
   wrangler tail
   ```
2. **Create/cancel subscription** in Stripe
3. **Expected**: Webhook events processed successfully
4. **Verify**: User subscription status updated

### 6. API Endpoint Testing

#### Test 6.1: Health Check
```bash
curl https://salvebot-api.your-subdomain.workers.dev/
```
**Expected**: Returns API status and version

#### Test 6.2: Authentication Endpoint
```bash
# Sign up
curl -X POST https://salvebot-api.your-subdomain.workers.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "apitest@example.com", 
    "password": "TestPassword123"
  }'
```
**Expected**: Returns user object and JWT token

#### Test 6.3: Protected Endpoint
```bash
# Get chatbots (requires authentication)
curl https://salvebot-api.your-subdomain.workers.dev/api/chatbots \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected**: Returns user's chatbots

### 7. Error Handling Testing

#### Test 7.1: Invalid Authentication
1. **Try accessing API** with invalid token
2. **Expected**: 401 Unauthorized error

#### Test 7.2: Domain Mismatch
1. **Use chatbot widget** on different domain than configured
2. **Expected**: Access denied error

#### Test 7.3: Rate Limiting (Future)
1. **Send rapid API requests**
2. **Expected**: Rate limit enforcement (when implemented)

### 8. Performance Testing

#### Test 8.1: Widget Load Time
1. **Measure widget load time** in browser dev tools
2. **Expected**: Widget loads within 2 seconds

#### Test 8.2: Chat Response Time
1. **Send chat message** and measure response time
2. **Expected**: Response within 5 seconds (depends on OpenAI API)

#### Test 8.3: Concurrent Users
1. **Open multiple browser tabs** with chat widget
2. **Send messages simultaneously**
3. **Expected**: All conversations handle correctly

## 🐛 Common Issues & Solutions

### Issue: Chatbot Widget Not Loading
**Symptoms**: No chat widget appears on page
**Solutions**:
- Check embed code is correct
- Verify chatbot ID and domain
- Check browser console for errors
- Ensure chatbot is active and verified

### Issue: Chat Not Responding
**Symptoms**: Messages sent but no response
**Solutions**:
- Check OpenAI API key is set
- Verify OpenAI account has credits
- Check Cloudflare Workers logs
- Ensure subscription is active

### Issue: Authentication Errors
**Symptoms**: Can't login or access protected pages
**Solutions**:
- Check JWT secret is set correctly
- Verify API endpoints are reachable
- Clear browser cache/cookies
- Check CORS configuration

### Issue: Stripe Integration Problems
**Symptoms**: Billing not working
**Solutions**:
- Verify Stripe keys are correct
- Check webhook endpoint configuration
- Ensure webhook events are configured
- Test with Stripe test mode first

## 📊 Test Results Template

Use this template to track your testing:

```
## Test Results - [Date]

### ✅ Passed Tests
- [ ] User Registration
- [ ] User Login
- [ ] Chatbot Creation
- [ ] Chat Widget Display
- [ ] Chat Functionality
- [ ] Stripe Integration

### ❌ Failed Tests
- [ ] Issue: [Description]
  - Error: [Error message]
  - Solution: [How to fix]

### 🔄 Pending Tests
- [ ] [Test name] - [Reason for pending]

### 📝 Notes
- [Any additional observations]
- [Performance metrics]
- [User feedback]
```

## 🎯 Production Readiness Checklist

Before going live:

- [ ] All tests pass
- [ ] Use production Stripe keys
- [ ] Set up monitoring and alerts
- [ ] Configure custom domains (optional)
- [ ] Set up backup/disaster recovery
- [ ] Document known issues
- [ ] Prepare support documentation
- [ ] Test with real users (beta)

## 📞 Getting Help

If tests fail:
1. Check the logs in Cloudflare Workers dashboard
2. Review the DEPLOYMENT_GUIDE.md
3. Check Stripe dashboard for webhook status
4. Verify all environment variables are set
5. Test API endpoints directly with curl
6. Open GitHub issue with test results

Happy testing! 🚀