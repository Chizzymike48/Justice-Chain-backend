# User Guidance - Quick Start Guide for Developers

This guide shows how to use the new guidance components in your pages.

---

## 🚀 Quick Examples

### 1. Add a Help Icon to Your Page

```typescript
import { HelpIcon } from '../components/common/HelpComponents'

export const MyPage = () => {
  return (
    <div>
      <h1>
        My Feature 
        <HelpIcon 
          title="What is this feature?" 
          description="It lets you do X, Y, and Z. Here are some tips..."
        />
      </h1>
    </div>
  )
}
```

**Result:** (?) icon appears next to title. Click it to see popup explanation.

---

### 2. Add Warning Box to Forms

```typescript
import { ContextualHelp } from '../components/common/HelpComponents'

export const ReportForm = () => {
  return (
    <form>
      <ContextualHelp type="warning" title="Be Specific">
        Include location, date, names, and specific actions for maximum impact
      </ContextualHelp>
      
      <input type="text" placeholder="Enter report title" />
      {/* rest of form */}
    </form>
  )
}
```

**Result:** Yellow warning box with icon appears.

---

### 3. Add Tool Tips on Hover

```typescript
import { Tooltip } from '../components/common/HelpComponents'

export const UploadButton = () => {
  return (
    <Tooltip text="PNG, JPG, PDF accepted. Max 50MB per file">
      <button>Upload Evidence</button>
    </Tooltip>
  )
}
```

**Result:** Hover over button to see tooltip.

---

### 4. Show Step-by-Step Instructions

```typescript
import { GuideStep } from '../components/common/HelpComponents'

export const SetupPage = () => {
  return (
    <div>
      <GuideStep 
        number={1}
        title="Create Account"
        description="Sign up with your email address"
        tips={["Use a strong password", "Verify your email"]}
      />
      
      <GuideStep 
        number={2}
        title="Complete Profile"
        description="Add your name and location"
      />
      
      <GuideStep 
        number={3}
        title="Start Reporting"
        description="Submit your first report!"
      />
    </div>
  )
}
```

**Result:** 3 numbered steps with tips below.

---

### 5. Wrap Entire Page with Guidance

```typescript
import { PageGuidance } from '../components/common/PageGuidance'

export const VerificationPage = () => {
  return (
    <PageGuidance
      title="Verify Claims"
      description="Help strengthen community reports by verifying facts"
      sections={[
        {
          title: "What You Can Do",
          content: [
            "Review submitted claims",
            "Check supporting evidence",
            "Add your verification",
            "See results in real-time"
          ],
          type: "info"
        },
        {
          title: "Best Practices",
          content: [
            "Only verify in your area",
            "Use your local knowledge",
            "Be impartial and fair",
            "Explain your reasoning"
          ],
          type: "tip"
        },
        {
          title: "Safety Note",
          content: "Your identity is always protected. Others see only your confidence score.",
          type: "info"
        }
      ]}
    >
      {/* Your page content here */}
    </PageGuidance>
  )
}
```

**Result:** Colored header with 3 info boxes, then your content below.

---

### 6. Add Inline Help to Form Labels

```typescript
import { InlineHelp } from '../components/common/HelpComponents'

export const LoginForm = () => {
  return (
    <form>
      <InlineHelp 
        label="Email Address" 
        help="Use the email you registered with. Case doesn't matter."
      />
      <input type="email" />
      
      <InlineHelp 
        label="Password" 
        help="Never share your password. Passwords are case-sensitive."
      />
      <input type="password" />
    </form>
  )
}
```

**Result:** Form label with (?) button. Click to show/hide help text.

---

### 7. Use Multiple Info Types

```typescript
import { ContextualHelp } from '../components/common/HelpComponents'

// Info box
<ContextualHelp type="info" title="How It Works">
  Your report will be reviewed by moderators within 48 hours
</ContextualHelp>

// Tip box (green)
<ContextualHelp type="tip" title="Pro Tip">
  Adding photos/videos increases verification rate by 80%
</ContextualHelp>

// Warning box (yellow)
<ContextualHelp type="warning" title="Important">
  Never record in dangerous situations. Safety comes first.
</ContextualHelp>
```

---

## 🎯 Common Patterns

### Pattern 1: Form Validation Help

```typescript
const [email, setEmail] = useState('')
const [error, setError] = useState('')

return (
  <div>
    <InlineHelp 
      label="Email" 
      help="We use this to send updates about your report"
    />
    <input 
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    {error && <ContextualHelp type="warning" title="Error">{error}</ContextualHelp>}
  </div>
)
```

### Pattern 2: Feature Introduction

```typescript
return (
  <div>
    <PageGuidance
      title="Submit Evidence"
      description="Attach files to strengthen your report"
      sections={[
        {
          title: "Supported Files",
          content: "PDF, images, videos, audio, and documents",
          type: "info"
        }
      ]}
    >
      <UploadComponent />
    </PageGuidance>
  </div>
)
```

### Pattern 3: Safety Warnings

```typescript
return (
  <section>
    <ContextualHelp 
      type="warning" 
      title="⚠️ Stay Safe"
    >
      Never record in dangerous situations. Your personal safety is more important than any evidence.
    </ContextualHelp>
    
    <Video capture component />
  </section>
)
```

---

## 📚 Using Pre-written Help Content

Pre-written help content is available in `contextual-help.ts`:

```typescript
import { helpContent } from '../utils/contextual-help'

// Get help for live streaming
const livestreamHelp = helpContent.livestream.goLive
// Access: livestreamHelp.title, .description, .tips, etc.

// Get reporting help
const reportingHelp = helpContent.reporting.corruptionReport
// Access: reportingHelp.what_counts_as_corruption, .best_practices, etc.

// Get FAQs
const faqs = helpContent.faqs
// Array of objects with .q (question) and .a (answer)

// Get safety content
const safety = helpContent.safety_and_privacy.protecting_yourself
// Array of protection tips
```

**Usage Example:**

```typescript
import { helpContent } from '../utils/contextual-help'
import { ContextualHelp } from '../components/common/HelpComponents'

export const ReportPage = () => {
  const help = helpContent.reporting.corruptionReport
  
  return (
    <div>
      <h1>{help.title}</h1>
      <p>{help.description}</p>
      
      <ContextualHelp type="info" title="What Counts">
        <ul>
          {help.what_counts_as_corruption.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </ContextualHelp>
      
      {/* Form content */}
    </div>
  )
}
```

---

## 🎨 Styling Integration

All components use CSS modules in `src/styles/`:

- `help-guide.css` - Help page styling
- `help-components.css` - Component styling
- `onboarding.css` - Onboarding animation
- `page-guidance.css` - Page guidance styling

Components use class names like `.help-icon-btn`, `.contextual-help`, etc.

To customize colors, update the CSS variables at the top of each file.

---

## 🔧 Advanced Usage

### Create Custom Help Section

```typescript
export const CustomSection = () => {
  return (
    <section className="contextual-help help-tip">
      <div className="contextual-help-title">
        <Lightbulb size={20} />
        <strong>Pro Tip</strong>
      </div>
      <div className="contextual-help-content">
        <p>Your custom advice here</p>
      </div>
    </section>
  )
}
```

### Add Help to Existing Modal

```typescript
import { HelpIcon, ContextualHelp } from '../components/common/HelpComponents'

export const MyModal = () => {
  return (
    <div className="modal">
      <div className="modal-header">
        <h2>Submit Report <HelpIcon title="Need help?" description="..." /></h2>
      </div>
      
      <ContextualHelp type="warning" title="Required Fields">
        All marked fields must be filled before submitting
      </ContextualHelp>
      
      {/* Form */}
    </div>
  )
}
```

---

## ✅ Best Practices

1. **Keep Help Text Concise**
   - ✅ DO: "Attach a recent photo for faster verification"
   - ❌ DON'T: "When providing evidence, you may wish to consider attaching a photograph..."

2. **Use Numbers for Steps**
   ```typescript
   <GuideStep number={1} title="..." />
   <GuideStep number={2} title="..." />
   ```

3. **Match Help Type to Content**
   - `type="info"` - Explanations
   - `type="tip"` - Helpful suggestions
   - `type="warning"` - Important cautions

4. **Position Help Before Content**
   ```typescript
   <ContextualHelp ... />
   {/* Form/content below */}
   ```

5. **Link to /help for More**
   ```typescript
   <a href="/help">Learn more →</a>
   ```

---

## 🐛 Troubleshooting

**Help icon not showing?**
- Check import: `import { HelpIcon } from '../components/common/HelpComponents'`
- Verify CSS is linked in `App.tsx` or component file

**Tooltip not appearing?**
- Make sure parent has `position: relative`
- Check z-index doesn't conflict

**Styling looks wrong?**
- Import CSS file at top of page
- Check for CSS conflicts in browser DevTools

**localStorage issues?**
- Onboarding checks `localStorage.getItem('onboarding-completed')`
- Clear localStorage to reset onboarding

---

## 📞 Support

Need help implementing guidance?

1. Check the [main implementation document](USER_GUIDANCE_IMPLEMENTATION.md)
2. Review component source code in `src/components/common/`
3. Look at examples in existing pages
4. Contact support@africajustice.org

---

**Happy guiding! 🎯**

Each user interaction is an opportunity to help them succeed. Use these components to guide your users toward the outcomes they want.
