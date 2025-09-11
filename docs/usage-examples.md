# Usage Examples

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Complete

## 🎯 Basic Usage Pattern

Write a natural language comment in your Azure DevOps Pull Request:

```
@YourUsername /edit /N description
```

Where:
- `@YourUsername` = Your Azure DevOps username
- `/edit` = Command to trigger AI code generation
- `/N` = Number of variants (1-10)
- `description` = What you want to change

## 📝 Real Examples

### Example 1: Error Handling
**PR Comment:**
```
@john.doe /edit /2 Add error handling to the login function
```

**What happens:**
1. System creates 2 branches: `agents/edit-123-1`, `agents/edit-123-2`
2. AI generates different error handling approaches
3. Creates 2 draft PRs with code changes
4. Posts status update in original PR

**Typical AI-generated changes:**
- Variant 1: Try-catch with specific error messages
- Variant 2: Result pattern with custom error types

### Example 2: UI Improvements
**PR Comment:**
```
@sarah.smith /edit /3 Make the navigation menu responsive and add dark mode
```

**Expected AI changes:**
- Variant 1: CSS Grid with media queries + CSS variables for themes
- Variant 2: Flexbox layout + JavaScript theme toggle
- Variant 3: Bootstrap classes + localStorage theme persistence

### Example 3: Refactoring
**PR Comment:**
```
@mike.johnson /edit /1 Refactor the authentication logic to use JWT tokens
```

**Expected AI changes:**
- Replace session-based auth with JWT
- Add token validation middleware
- Update login/logout endpoints

### Example 4: Performance Optimization
**PR Comment:**
```
@anna.lee /edit /2 Optimize the database queries in the user service
```

**Expected AI changes:**
- Variant 1: Add database indexes and query optimization
- Variant 2: Implement caching layer with Redis

### Example 5: Testing
**PR Comment:**
```
@david.chen /edit /1 Add unit tests for the payment processing module
```

**Expected AI changes:**
- Add comprehensive test suite with mocking
- Include edge cases and error scenarios

## 🔄 System Response Flow

### 1. Comment Detection
```
Azure DevOps PR Comment → Webhook → Gateway Service
```

### 2. Intent Analysis
```
Gateway → Orchestrator → LLM-Patch Service
```
- Parses intent from natural language
- Analyzes existing code context
- Determines appropriate changes

### 3. Code Generation
```
LLM-Patch → Ollama/Claude/OpenAI → Generated Patches
```
- Creates N different implementations
- Applies different coding styles/approaches
- Validates syntax and logic

### 4. Branch & PR Creation
```
Orchestrator → Adapter → Azure DevOps
```
- Creates feature branches: `agents/edit-{prId}-{variant}`
- Applies generated patches
- Creates draft PRs for review

### 5. Status Update
```
Adapter → Azure DevOps → Original PR Comment
```
- Posts progress updates
- Links to created draft PRs
- Includes generation summary

## 📊 Status Responses

### Success Response
```
✅ AI Code Generation Complete

Generated 2 code variants:
• Branch: agents/edit-123-1 → Draft PR #124
• Branch: agents/edit-123-2 → Draft PR #125

Review the changes and merge your preferred variant.
```

### Error Response
```
❌ AI Code Generation Failed

Reason: Intent too vague - "fix it" 
Suggestion: Be more specific about what needs to be changed.

Example: "@user /edit /1 Add null checks to user validation"
```

### Clarification Response
```
🤔 Need More Context

Your request: "update the code"
Could you be more specific? For example:
• Add error handling
• Improve performance  
• Add new feature
• Fix specific bug

Try: "@user /edit /2 [specific description]"
```

## 🎯 Best Practices

### ✅ Good Examples
- `@user /edit /2 Add input validation to the signup form`
- `@user /edit /1 Implement rate limiting for the API endpoints`
- `@user /edit /3 Add responsive design to the dashboard`

### ❌ Too Vague
- `@user /edit /1 fix it`
- `@user /edit /2 make it better`
- `@user /edit /1 update`

### 📝 Writing Effective Prompts
1. **Be specific** about what needs to change
2. **Include context** if working on specific files/functions
3. **Mention desired approach** if you have preferences
4. **Use appropriate variant count** (1-3 for simple changes, 2-5 for complex)

## 🔧 Troubleshooting

### Comment Not Recognized
- Ensure exact format: `@username /edit /N description`
- Check webhook is configured correctly
- Verify you're mentioned in the PR

### No Code Changes Generated
- Intent might be too vague - be more specific
- Check if target files exist in the repository
- Verify LLM services are running

### Poor Quality Suggestions
- Provide more context in your description
- Try different variant counts
- Check if codebase context is sufficient

---

**Next:** [System Monitoring](system-monitoring.md) to track AI generation performance.
