# GitHub Commit Sync Project Plan

## Information Gathered

### Current Codebase Analysis:

1. **Backend Implementation (Already Complete):**
   - `server/src/routes/api.js` - Contains `/api/webhooks/github` endpoint that:
     - Verifies GitHub webhook signatures
     - Validates repository against allowlist
     - Processes push events and extracts commits
     - Calls `syncTasksFromGitHubPush()` to update tasks
   
   - `server/src/services/commitTaskSync.js` - Commit sync service that:
     - Extracts task keys from commit messages (e.g., TASK-123)
     - Creates comments on matching tasks
     - Auto-marks tasks as "done" if commit contains "#done" or auto_mark_done is enabled
     - Tracks developer activity statistics
   
   - `server/src/services/realtime.js` - SSE service that:
     - Maintains connected clients by user ID
     - Broadcasts events to specific users
   
   - `server/src/index.js` - Express server with:
     - Raw body capture for signature verification
     - CORS configuration
     - Rate limiting

2. **Frontend Implementation (Already Complete):**
   - `src/components/RealtimeSync.tsx` - Real-time sync component that:
     - Connects to `/api/events` endpoint via EventSource (SSE)
     - Listens for `tasks.synced_from_commit` events
     - Invalidates React Query cache to refresh data

### Why Current Setup Might Not Work:

1. **Webhook Not Configured in GitHub** - User needs to set up webhook in GitHub repo settings
2. **Webhook URL Not Reachable** - GitHub cannot access localhost or private servers
3. **Signature Verification Failing** - Webhook secret not properly configured
4. **Repo Not in Allowlist** - Repository must be in `WEBHOOK_ALLOWED_REPOS` env variable
5. **Board Not Connected** - User needs to connect a board to the GitHub repository first

## Plan

### Step 1: Backend Enhancements
- Add explicit webhook debugging/logging
- Add health check endpoint for webhook configuration
- Implement fallback polling endpoint as alternative

### Step 2: Frontend Enhancements  
- Improve RealtimeSync with reconnection logic
- Add polling fallback with useEffect interval
- Add UI indicators for sync status

### Step 3: Documentation
- GitHub webhook setup instructions
- Environment variables configuration
- Troubleshooting guide

### Step 4: Testing
- Test webhook endpoint locally using ngrok
- Verify real-time updates propagate correctly

## Dependent Files to be Edited

1. `isai-main/server/src/routes/api.js` - Add polling fallback endpoint
2. `isai-main/src/components/RealtimeSync.tsx` - Add polling fallback and improved error handling
3. Create setup guide documentation

## Followup Steps

1. Configure environment variables
2. Set up GitHub webhook with correct URL
3. Connect board to GitHub repository through UI
4. Test by pushing commits with task keys
5. Verify real-time updates appear in frontend

---

## Implementation Details

### GitHub Webhook Setup (for reference):
1. Go to GitHub Repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-server.com/api/webhooks/github`
3. Content type: application/json
4. Secret: Use the webhook_secret from your board (or GITHUB_WEBHOOK_SECRET env)
5. Events: Select "Pushes" only

### Environment Variables Required:
```
WEBHOOK_ALLOWED_REPOS=your-username/your-repo
GITHUB_WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_AUTO_MARK_DONE=false
```

