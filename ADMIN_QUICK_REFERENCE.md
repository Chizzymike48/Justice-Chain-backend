# ADMIN SYSTEM - QUICK REFERENCE GUIDE

## 🚀 GETTING STARTED (5 minutes)

### Step 1: Login as Admin
```
1. Open http://localhost:5173
2. Login with: admin@example.com / AdminPass123!
3. Click "Dashboard" or navigate to http://localhost:5173/admin
```

### Step 2: View Dashboard
- **Reports**: Total/pending count
- **Verifications**: Total/pending count  
- **Evidence**: Total files
- **Users**: Total/admins/moderators count
- Quick links to review queues

---

## 📋 MODERATION WORKFLOWS

### Reviewing Reports (`/admin/reports`)

```
Your Task: Approve or reject corruption reports

Steps:
1. Click link or visit http://localhost:5173/admin/reports
2. Read report details:
   - Title (corruption type)
   - Category (Finance, Land, Health, etc.)
   - Office (which agency)
   - Amount (if applicable)
   - Description (full narrative)
   - Reporter's evidence/links

3. For each report, click:
   ✓ APPROVE → Status becomes "investigating" (sent for verification)
   ✗ REJECT → Status becomes "rejected" (removed from public view)

4. Confirmation dialog appears
5. Confirm action → Success notification
6. Move to next report

Pagination: Navigate between pages (20 per page)
```

### Reviewing Verifications (`/admin/verifications`)

```
Your Task: Verify or dispute claims submitted by citizens

Steps:
1. Click /admin/verifications
2. Read verification details:
   - Claim text (what is being verified)
   - Source URL (where claim came from)
   - Current status (pending)
   - Confidence score (you set this)

3. For each verification, click:
   ✓ VERIFY → Confidence: 0-100, Notes (optional)
   ✗ DISPUTE → Mark as contested

4. Enter confidence score (0 = no confidence, 100 = certain)
5. Add internal notes (visible to other moderators)
6. Confirm action → Status updated
```

### Reviewing Evidence (`/admin/evidence`)

```
Your Task: Approve or reject uploaded evidence documents

Steps:
1. Click /admin/evidence
2. See file list:
   - Filename
   - File type (PDF, image, etc.)
   - File size
   - Upload date

3. Preview files:
   - Click "Preview" → Opens in new tab
   - View document

4. Decide:
   ✓ APPROVE → Evidence used in reports
   ✗ REJECT → Add reason why (irrelevant, illegal, etc.)

5. Confirm → Success notification
```

---

## 👥 USER MANAGEMENT (`/admin/users`)

### View All Users
```
Navigate to: http://localhost:5173/admin/users

Table shows:
- Email address
- Name
- Current role (Citizen / Moderator / Admin)
- Actions (change role)
```

### Change User Role

```
Step 1: Find user in table
Step 2: Click role dropdown
Step 3: Select new role:
        - citizen (default user, can report corruption)
        - moderator (can review reports/verifications)
        - admin (can manage users)
Step 4: Change applied immediately
Step 5: User has new permissions on next login

⚠️ Safety:
- Cannot demote yourself
- Promote carefully (moderators need training)
```

---

## 🔑 KEY FEATURES & SHORTCUTS

### Dashboard Actions
| Card | Action | Result |
|------|--------|--------|
| Reports | Click card | See pending reports to review |
| Verifications | Click card | See claims to verify |
| Evidence | Click card | See files to approve |
| Users | Click card | Manage user roles |

### Status Values (Backend)

**Report Status:**
- `pending` → Awaiting moderator review
- `investigating` → Approved, investigating
- `rejected` → Rejected by moderator
- `resolved` → Investigation complete

**Verification Status:**
- `pending` → Awaiting review
- `reviewed` → Admin confirmed/disputed
- `verified` → Marked as true
- `disputed` → Marked as false

**Evidence Status:**
- `pending` → Awaiting approval
- `approved` → Accepted as valid
- `rejected` → Marked as invalid

---

## 🛠️ TROUBLESHOOTING

### "Access Denied" Error
**Problem:** You don't have permission for this page
**Solution:** 
- Check your user role (must be admin or moderator)
- Ask another admin to promote your account
- Restart browser and login again

### "No results" on review pages
**Problem:** Queue is empty
**Solution:**
- This is good! Moderation is caught up
- Check filters (status dropdown)
- Come back later for new submissions

### Page not loading
**Problem:** 500 error or blank page
**Solution:**
1. Check backend is running: `npm run dev` in `africajustice-backend/`
2. Check frontend is running: `npm run dev` in root folder
3. Check browser console for errors (F12)
4. Restart both frontend and backend

### Can't see other users
**Problem:** User management page is empty
**Solution:**
- You must be logged in as admin
- Other users must exist in database
- Try creating test accounts first

---

## 📊 DASHBOARD METRICS

The dashboard automatically updates every time you:
- View the admin page
- Complete a moderation action
- Navigate back from a detail page

### What Each Metric Means

**Total Reports:** All reports ever submitted  
**Pending Reports:** Reports awaiting review

**Total Verifications:** All claims submitted  
**Pending Verifications:** Claims awaiting verification

**Total Evidence:** All files uploaded  
**Pending Evidence:** Files awaiting approval

**Total Users:** All registered accounts  
**Admins:** Users with admin role  
**Moderators:** Users with moderator role

---

## 🔐 SECURITY TIPS

1. ✅ **Keep JWT token secure** – Don't share login
2. ✅ **Clear browser cache** – After logout
3. ✅ **Strong passwords** – Admin account especially
4. ✅ **Monitor audit logs** – See who changed what (Phase 4.2)
5. ✅ **Review decisions** – Multiple moderators catch mistakes

---

## ⌨️ KEYBOARD SHORTCUTS (Coming Soon)

_Not yet implemented, but planned:_
- `A` → Approve current item
- `R` → Reject current item  
- `N` → Next page
- `P` → Previous page
- `Esc` → Close dialog

---

## 📝 BEST PRACTICES

### For Moderators
1. **Read completely** – Don't skim reports
2. **Use evidence** – Ask for sources when unclear
3. **Add notes** – Explain your decisions
4. **Escalate** – Ask admin if unsure
5. **Consistent** – Apply same standards to all

### For Admins
1. **Backup data** – Export reports weekly
2. **Monitor activity** – Check audit logs
3. **Train moderators** – Document decision criteria
4. **Rotate roles** – Prevent single points of failure
5. **Security first** – Change passwords regularly

---

## 🚨 CRITICAL ISSUES

### If something looks wrong:
1. Screenshot the issue
2. Check backend error logs: `cd africajustice-backend && npm run dev`
3. Check browser console: F12 → Console tab
4. Report to development team

### Common issues:
- **Pagination broken** → Check query params in URL
- **Buttons not responding** → Check browser network tab
- **Data not saving** → Check MongoDB connection
- **Permissions error** → Verify user role in database

---

## 📞 SUPPORT

**Questions about:**
- **Moderation policy** → Contact admin team lead
- **Technical issues** → Open GitHub issue or contact dev team
- **User management** → Ask admin team
- **System down** → Check AWS/Vercel status page

---

## 🎯 QUICK COMMANDS (Development)

```bash
# Check admin system works
curl -X GET http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <your-token>"

# Create test admin
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.admin@example.com",
    "password": "TestPass123!",
    "name": "Test Admin",
    "role": "admin"
  }'

# List users (debug)
# Use MongoDB CLI or compass to run:
db.users.find({}, {email: 1, name: 1, role: 1})
```

---

## 📅 NEXT UP

**Phase 4.2:** Testing Infrastructure
- Unit tests for admin endpoints
- Component tests for admin pages
- E2E tests for moderation workflows

**Phase 4.3:** Real-time Features
- Live updates when new reports arrive
- Notifications for moderators
- WebSocket integration

**Phase 4.4:** Advanced Admin Features
- Audit log history
- Bulk moderation actions
- Export reports (PDF/CSV)
- Admin reports generator

---

**Last Updated:** March 5, 2026  
**Admin System Status:** ✅ LIVE & READY
