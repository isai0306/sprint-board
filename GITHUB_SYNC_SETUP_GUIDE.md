# GitHub Commit Sync - Complete Setup Guide

## Overview

Your project **already has the backend and frontend implementation** for GitHub commit sync! This guide explains:
1. Why your current setup might not work
2. How to properly configure everything
3. Best practices for keeping your project in sync

---

## Part 1: Why Your Current Setup Might Not Work

### Common Issues:

#### 1. **GitHub Webhook Not Configured**
The most common issue - you need to manually set up the webhook in GitHub:
- Go to your GitHub Repository → Settings → Webhooks → Add webhook
- Payload URL: `https://your-backend-domain.com/api/webhooks/github`
- Secret: Use the `webhook_secret` from your connected board
- Events: Select "Pushes" only

#### 2. **Webhook URL Not Reachable**
- GitHub cannot send webhooks to localhost
- Your server must be publicly accessible (use ngrok for local development)
- Or deploy to a cloud provider (Vercel, Railway, etc.)

#### 3. **Board Not Connected**
- You must connect a board to your GitHub repository through your app
- Use the API to create a board with `github_repository_url` parameter
- Or use the UI to connect GitHub to your board

#### 4. **Repository Not in Allowlist**
- Set `WEBHOOK_ALLOWED_REPOS` environment variable
- Format: `username/repository,another/repo`

#### 5. **Webhook Secret Mismatch**
- Each board gets an auto-generated `webhook_secret`
- Make sure this matches the secret in your GitHub webhook configuration
- You can see the webhook URL and secret in the board's GitHub settings

---

## Part 2: Environment Variables Configuration

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/your-db

# JWT
JWT_SECRET=your-secure-secret-key

# Frontend URLs
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# GitHub Webhook (Required for commit sync)
WEBHOOK_ALLOWED_REPOS=your-username/your-repo
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
WEBHOOK_AUTO_MARK_DONE=false

# GitHub OAuth (Optional - for GitHub login)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth (Optional - for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Part 3: Setting Up GitHub Webhook (Step by Step)

### Step 1: Start Your Backend Server
```bash
cd isai-main/server
npm install
npm run dev
```

### Step 2: Connect a Board to GitHub
Using the API:
```bash
curl -X POST http://localhost:5000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Sprint Board",
    "workspace_id": "WORKSPACE_ID",
    "github_repository_url": "https://github.com/your-username/your-repo"
  }'
```

The response will include:
```json
{
  "github": {
    "connected": true,
    "webhook_url": "https://your-server.com/api/webhooks/github",
    "webhook_secret": "abc123...",
    ...
  }
}
```

### Step 3: Configure GitHub Webhook

1. Go to your GitHub Repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Fill in the details:

| Field | Value |
|-------|-------|
| Payload URL | `https://your-server.com/api/webhooks/github` |
| Content type | `application/json` |
| Secret | The `webhook_secret` from your board |
| Events | Select **Pushes** only |

4. Click "Add webhook"

### Step 4: Test the Webhook

Make a commit with a task key:
```bash
git commit -m "TASK-123: Fix login bug"
git push
```

Check your server logs - you should see:
```
Webhook received: your-username/your-repo
Webhook commit | repo=your-username/your-repo | author=Your Name | message=TASK-123: Fix login bug
```

---

## Part 4: How the Sync Works

### Flow Diagram:
```
GitHub Push
    ↓
GitHub Webhook → Your Server (/api/webhooks/github)
    ↓
Verify signature & repo allowlist
    ↓
Find connected boards matching the repo
    ↓
Extract task keys from commit messages (e.g., TASK-123)
    ↓
Find matching tasks in database
    ↓
Create commit comments on tasks
    ↓
Auto-mark done if #done in message or auto_mark_done enabled
    ↓
Publish SSE event to connected clients
    ↓
Frontend invalidates cache & refreshes data
```

### Task Key Detection:
The system extracts task keys from commit messages using this regex:
```
/\b([a-z][a-z0-9]+-\d+)\b/gi
```

Examples:
- `TASK-123` ✅ Detected
- `FIX-456` ✅ Detected
- `123-ABC` ❌ Not detected (must start with letter)
- `task-789` ✅ Detected (case insensitive)

---

## Part 5: Best Practices

### 1. **Use Descriptive Commit Messages**
Include task keys to link commits to tasks:
```
TASK-123: Implement user authentication
FIX-456: Resolve memory leak in dashboard
```

### 2. **Auto-Mark Done**
Enable `auto_mark_done` when creating a board, or include `#done` in commit:
```
TASK-123: Complete feature #done
```

### 3. **Monitor Webhook Deliveries**
GitHub shows webhook delivery status in repository settings. Check for:
- Failed deliveries
- Timeout issues
- Invalid payloads

### 4. **Use Polling as Fallback**
The frontend now has automatic polling fallback:
- Checks for updates every 30 seconds if SSE fails
- Automatically activates after 5 failed SSE reconnect attempts

### 5. **Secure Your Webhook**
- Always verify the webhook signature
- Keep your `webhook_secret` confidential
- Use HTTPS in production

---

## Part 6: Troubleshooting

### Webhook Not Triggering?
```bash
# Check GitHub webhook delivery logs
# Repository → Settings → Webhooks → Click on webhook → Recent deliveries

# Common issues:
# 1. Wrong payload URL
# 2. Invalid secret
# 3. Server not accessible (check firewall/proxy)
```

### Tasks Not Updating?
```bash
# Check server logs for:
# - "No matching connected board"
# - "Repository is not allowed"
# - "Invalid webhook signature"

# Verify:
# 1. Board is connected to correct repo
# 2. Repository is in WEBHOOK_ALLOWED_REPOS
# 3. Webhook secret matches
```

### Frontend Not Reflecting Changes?
```bash
# Check browser console for:
# 1. SSE connection errors
# 2. Network errors

# The polling fallback should kick in automatically
# You can manually trigger a refresh by:
# 1. Refreshing the page
# 2. Clicking on a different board and back
```

---

## Part 7: Manual Sync (Fallback)

If webhooks fail, you can manually trigger a sync check:

```bash
# Check sync status
curl http://localhost:5000/api/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "ok": true,
  "lastSync": "2024-01-15T10:30:00.000Z",
  "updatedTasks": 5,
  "newCommitComments": 12,
  "boardsWithGitHub": 2
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/github` | GitHub webhook receiver |
| GET | `/api/events` | Server-Sent Events stream |
| GET | `/api/sync/status` | Poll for recent changes |
| POST | `/api/sync/trigger` | Manual sync trigger |

---

## Testing Locally with ngrok

For local development, use ngrok to expose your server:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend
cd server && npm run dev

# In another terminal, expose port 5000
ngrok http 5000

# Use the ngrok URL for your GitHub webhook:
# https://abc123.ngrok.io/api/webhooks/github
```

---

## Summary

Your project already has all the code needed! The issue is likely:

1. **GitHub webhook not configured** → Set it up in GitHub repo settings
2. **Board not connected** → Create board with GitHub repo URL
3. **Server not publicly accessible** → Use ngrok or deploy to cloud
4. **Missing environment variables** → Configure allowlist

Once properly configured, commits will automatically:
- Create comments on matching tasks
- Update task status (if #done or auto_mark_done enabled)
- Refresh the frontend in real-time via SSE
- Fall back to polling if SSE fails

