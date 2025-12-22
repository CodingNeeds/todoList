# n8n Workflow Setup Guide: Module Creator

This guide walks you through setting up the n8n workflow that receives form data from the Next.js application and inserts it into PostgreSQL.

---

## Prerequisites

1. **n8n running locally** (typically at `http://localhost:5678`)
2. **PostgreSQL database** with the `modules` table created (see `database/schema.sql`)
3. **PostgreSQL credentials** ready (host, port, database, user, password)

---

## Step 1: Start n8n

If n8n is not running, start it:

```bash
# If installed globally via npm
n8n start

# Or if using Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

Open n8n in your browser: `http://localhost:5678`

---

## Step 2: Create PostgreSQL Credentials in n8n

Before creating the workflow, set up your PostgreSQL connection:

1. Click on **Settings** (gear icon) → **Credentials**
2. Click **Add Credential**
3. Search for **Postgres**
4. Fill in your connection details:
   - **Host**: `localhost` (or your PostgreSQL host)
   - **Database**: Your database name
   - **User**: Your PostgreSQL username
   - **Password**: Your PostgreSQL password
   - **Port**: `5432` (default)
   - **SSL**: Disable for local development
5. Click **Save**
6. Name it something memorable like `SchoolDB`

---

## Step 3: Create New Workflow

1. Click **Workflows** in the left sidebar
2. Click **Create new workflow**
3. Name it: `Create Module`

---

## Step 4: Add Webhook Node (Trigger)

This node receives data from the Next.js form.

1. Click the **+** button to add a node
2. Search for **Webhook** and select it
3. Configure the webhook:
   - **HTTP Method**: `POST`
   - **Path**: `create-module`
4. Click on the **Webhook URLs** section to see your URLs:
   - **Test URL**: `http://localhost:5678/webhook-test/create-module` (use while testing in n8n)
   - **Production URL**: `http://localhost:5678/webhook/create-module` (use when workflow is active)

> ⚠️ **Important**: The form component uses the production URL by default. Make sure to activate the workflow before testing from the Next.js app.

---

## Step 5: Add PostgreSQL Node (Insert)

This node inserts the module into the database.

1. Click the **+** button after the Webhook node
2. Search for **Postgres** and select it
3. Configure the Postgres node:

### Connection
- **Credential**: Select the `SchoolDB` credential you created

### Operation Settings
- **Operation**: `Insert`
- **Schema**: `public`
- **Table**: `modules`
- **Columns**: `title, description, teacher_id, teacher_name`

### Mapping Values
Click on **Add Column** for each field and map the values from the webhook:

| Column | Value |
|--------|-------|
| `title` | `{{ $json.title }}` |
| `description` | `{{ $json.description }}` |
| `teacher_id` | `{{ $json.teacherId }}` |
| `teacher_name` | `{{ $json.teacherName }}` |

> **Tip**: You can also use the expression editor by clicking the toggle next to each field and selecting the values from the incoming JSON.

---

## Step 6: Add Response Node (Respond to Webhook)

This node sends a response back to the Next.js form.

1. Click the **+** button after the Postgres node
2. Search for **Respond to Webhook** and select it
3. Configure the response:
   - **Response Body**: Define using JSON

```json
{
  "success": true,
  "message": "Module created successfully",
  "moduleId": "{{ $json.id }}"
}
```

> The `$json.id` will contain the auto-generated UUID from PostgreSQL.

---

## Step 7: Add Error Handling (Optional but Recommended)

To handle errors gracefully:

1. Click on the **Postgres** node
2. Click on **Settings** (gear icon)
3. Enable **Continue On Fail**
4. Add a **Respond to Webhook** node connected to the error output:

```json
{
  "success": false,
  "message": "Failed to create module. Please try again."
}
```

---

## Step 8: Test the Workflow

### Method 1: Test in n8n

1. Click **Test workflow** button (or press `Ctrl+Enter`)
2. The webhook node will show "Waiting for Test Event"
3. Use a tool like Postman or curl to send a test request:

```bash
curl -X POST http://localhost:5678/webhook-test/create-module \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Module",
    "description": "This is a test module description",
    "teacherId": "t1",
    "teacherName": "Dr. Sarah Johnson"
  }'
```

4. Check the execution results in n8n

### Method 2: Test from Next.js

1. **First, activate the workflow** (toggle the "Active" switch in n8n)
2. Run the Next.js dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000/modules/create`
4. Fill in the form and submit
5. Check n8n execution history for results

---

## Complete Workflow Visual

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Webhook   │ ──► │  Postgres   │ ──► │ Respond to       │
│   (POST)    │     │  (Insert)   │     │ Webhook (Success)│
└─────────────┘     └─────────────┘     └──────────────────┘
                           │
                           ▼ (on error)
                    ┌──────────────────┐
                    │ Respond to       │
                    │ Webhook (Error)  │
                    └──────────────────┘
```

---

## Webhook URL Summary

| Environment | URL | When to Use |
|-------------|-----|-------------|
| Test URL | `http://localhost:5678/webhook-test/create-module` | Testing directly in n8n UI |
| Production URL | `http://localhost:5678/webhook/create-module` | From Next.js app (workflow must be active) |

---

## Updating the Webhook URL in the Form

The webhook URL is configured in the form component at:

```
src/components/ModuleCreatorForm.tsx
```

Look for this constant at the top of the file:

```typescript
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/create-module";
```

Update this URL if:
- n8n is running on a different port
- You're deploying to production
- You've changed the webhook path

---

## Troubleshooting

### "Failed to fetch" error
- Make sure n8n is running
- Make sure the workflow is **activated** (not just saved)
- Check for CORS issues (n8n allows CORS by default)

### "HTTP error! status: 500"
- Check n8n execution logs for database errors
- Verify PostgreSQL credentials
- Make sure the `modules` table exists

### Form submits but no data in database
- Check n8n execution history
- Verify the column mappings are correct
- Check that field names match (`teacherId` vs `teacher_id`)

---

## Next Steps

1. **Add authentication**: Add a header check in n8n for API key validation
2. **Fetch teachers from DB**: Create another webhook workflow to query teachers table
3. **List modules**: Create a webhook that returns all modules for a listing page
