# 🔍 Claude Code Review Checklist

> This checklist helps human reviewers evaluate Claude-generated code for IlliniHunt V2

---

## 📋 Overview

When reviewing pull requests created by @claude, use this checklist to ensure code quality, security, and maintainability. Claude-generated code should meet the same standards as human-written code.

---

## ✅ Code Quality Review

### TypeScript & Type Safety
- [ ] **No `any` types used** - All variables and functions have proper TypeScript types
- [ ] **Interfaces are well-defined** - Props, data structures, and API responses have clear interfaces
- [ ] **Strict mode compliance** - Code compiles without TypeScript errors
- [ ] **Type imports/exports** - Proper use of `import type` for type-only imports
- [ ] **Generic types used appropriately** - Where applicable, generic types provide flexibility

### React Best Practices
- [ ] **Functional components with hooks** - No class components, proper hook usage
- [ ] **Component composition** - Components are well-composed and reusable
- [ ] **Props interface** - All components have proper TypeScript props interfaces
- [ ] **State management** - Appropriate use of useState, useEffect, useContext
- [ ] **Performance considerations** - useMemo, useCallback used where appropriate
- [ ] **Key props for lists** - Proper keys for mapped elements
- [ ] **Event handlers** - Properly typed event handlers with correct event types

### Code Structure & Organization
- [ ] **File organization** - Components in appropriate directories
- [ ] **Naming conventions** - Consistent PascalCase for components, camelCase for functions
- [ ] **Import organization** - Imports grouped logically (React, libraries, local)
- [ ] **Single responsibility** - Components and functions have clear, single purposes
- [ ] **Code reusability** - Common functionality extracted into utilities/hooks
- [ ] **Directory structure** - Follows existing project conventions

---

## 🎨 UI/UX Implementation

### Design System Compliance
- [ ] **shadcn/ui components used** - Leverages existing component library
- [ ] **UIUC brand colors** - Proper use of uiuc-orange (#FF6B35) and uiuc-blue (#13294B)
- [ ] **Tailwind CSS classes** - Consistent with existing styling patterns
- [ ] **Design consistency** - Matches existing UI patterns and layouts
- [ ] **Icon usage** - Appropriate icons from Lucide React library

### Responsive Design
- [ ] **Mobile-first approach** - Design works on mobile devices (< 640px)
- [ ] **Tablet optimization** - Proper display on tablet sizes (640px-1024px)
- [ ] **Desktop layout** - Optimal use of space on larger screens (> 1024px)
- [ ] **Touch targets** - Buttons and interactive elements are appropriately sized for mobile
- [ ] **Text readability** - Font sizes and line heights work across devices

### User Experience
- [ ] **Loading states** - Proper loading indicators for async operations
- [ ] **Error states** - Clear error messages and recovery actions
- [ ] **Empty states** - Helpful messages when no data is available
- [ ] **Success feedback** - User feedback for successful actions
- [ ] **Form validation** - Real-time validation with clear error messages
- [ ] **Navigation flow** - Intuitive user flow between screens/states

---

## 🔒 Security & Data Handling

### Authentication & Authorization
- [ ] **Protected routes** - Authentication required where appropriate
- [ ] **Permission checks** - User permissions verified before sensitive operations
- [ ] **Auth context usage** - Proper integration with existing authentication system
- [ ] **Token handling** - No hardcoded tokens or credentials
- [ ] **@illinois.edu restriction** - Auth restrictions properly maintained

### Data Security
- [ ] **Input validation** - User inputs properly validated and sanitized
- [ ] **SQL injection prevention** - Parameterized queries through Supabase client
- [ ] **XSS prevention** - No dangerouslySetInnerHTML without sanitization
- [ ] **Data exposure** - No sensitive data logged or exposed in client
- [ ] **Environment variables** - Secrets properly stored in environment variables
- [ ] **RLS policies** - Database access properly restricted with Row Level Security

### API & Database
- [ ] **Supabase integration** - Proper use of Supabase client and patterns
- [ ] **Error handling** - Database errors caught and handled gracefully
- [ ] **Data validation** - Server-side validation through database constraints
- [ ] **Real-time subscriptions** - Proper cleanup of subscriptions to prevent memory leaks
- [ ] **Query optimization** - Efficient queries that don't impact performance

---

## ♿ Accessibility & Performance

### Accessibility (WCAG Compliance)
- [ ] **Semantic HTML** - Proper use of HTML5 semantic elements
- [ ] **ARIA labels** - Screen reader support for interactive elements
- [ ] **Keyboard navigation** - All functionality accessible via keyboard
- [ ] **Focus management** - Proper focus handling, especially in modals
- [ ] **Color contrast** - Text meets WCAG AA contrast requirements
- [ ] **Alt text for images** - Descriptive alt text for all images
- [ ] **Form labels** - All form inputs have associated labels

### Performance
- [ ] **Bundle size impact** - Feature doesn't significantly increase bundle size
- [ ] **Lazy loading** - Components/routes lazy loaded where appropriate
- [ ] **Image optimization** - Images properly sized and formatted
- [ ] **Memory leaks** - Event listeners and subscriptions properly cleaned up
- [ ] **Re-render optimization** - Components don't re-render unnecessarily
- [ ] **Network requests** - API calls are efficient and cached where appropriate

---

## 🧪 Testing & Quality Assurance

### Code Testing
- [ ] **Unit tests** - Critical functionality has unit tests
- [ ] **Integration tests** - Component integration tested where appropriate
- [ ] **Error scenarios** - Error cases and edge cases tested
- [ ] **Mock implementations** - External dependencies properly mocked in tests
- [ ] **Test coverage** - Reasonable test coverage for new functionality

### Manual Testing
- [ ] **Feature functionality** - All specified features work as expected
- [ ] **Cross-browser testing** - Works in Chrome, Firefox, Safari, Edge
- [ ] **Mobile device testing** - Tested on actual mobile devices
- [ ] **User flow testing** - Complete user journeys work end-to-end
- [ ] **Edge case testing** - Boundary conditions and error scenarios tested
- [ ] **Performance testing** - No significant performance degradation

### Quality Checks
- [ ] **Build passes** - `npm run build` completes without errors
- [ ] **Linting passes** - `npm run lint` shows no errors
- [ ] **Type checking passes** - `npm run type-check` shows no errors
- [ ] **No console errors** - Console is clean of errors and warnings
- [ ] **No dead code** - Unused imports, variables, or functions removed

---

## 📚 Documentation & Maintainability

### Code Documentation
- [ ] **JSDoc comments** - Complex functions have JSDoc documentation
- [ ] **Inline comments** - Business logic is explained with comments
- [ ] **README updates** - Documentation updated if needed
- [ ] **Type definitions** - Complex types are well-documented
- [ ] **Component props** - Component interfaces clearly define expected props

### Maintainability
- [ ] **Code clarity** - Code is readable and self-explanatory
- [ ] **Consistent patterns** - Follows established project patterns
- [ ] **Error messages** - Clear, actionable error messages for developers
- [ ] **Logging** - Appropriate logging for debugging (no sensitive data)
- [ ] **Configuration** - Configurable values externalized appropriately

---

## 🎓 Educational Value (For Student Contributors)

### Learning Opportunities
- [ ] **Best practices demonstrated** - Code showcases modern React/TypeScript patterns
- [ ] **Architectural patterns** - Good examples of component architecture
- [ ] **Problem-solving approach** - Clear problem decomposition and solution
- [ ] **Industry standards** - Follows industry best practices and conventions
- [ ] **Commenting quality** - Code explains the "why" not just the "what"

### Knowledge Transfer
- [ ] **Implementation explanation** - PR description explains technical decisions
- [ ] **Alternative approaches** - Mentions why certain approaches were chosen
- [ ] **Learning resources** - Links to relevant documentation or learning materials
- [ ] **Review feedback** - Constructive feedback for learning opportunities

---

## ✅ Final Review Checklist

### Pre-Merge Requirements
- [ ] **All automated checks pass** - CI/CD pipeline shows green
- [ ] **Feature requirements met** - Implements all requirements from specification
- [ ] **No breaking changes** - Existing functionality remains intact
- [ ] **Performance impact assessed** - No significant performance degradation
- [ ] **Security review complete** - No security vulnerabilities introduced
- [ ] **Documentation updated** - All relevant docs updated
- [ ] **Stakeholder approval** - Original feature requester has tested and approved

### Deployment Readiness
- [ ] **Environment variables** - All required env vars documented
- [ ] **Database migrations** - Any schema changes properly migrated
- [ ] **Feature flags** - Feature can be safely enabled/disabled if needed
- [ ] **Rollback plan** - Clear plan for rollback if issues arise
- [ ] **Monitoring** - Appropriate logging/monitoring for new feature

---

## 🚀 Approval Guidelines

### Approval Criteria
**Code may be approved when:**
- All critical checklist items are satisfied
- No security vulnerabilities exist
- Feature works as specified
- Code quality meets project standards
- Performance impact is acceptable

### Request Changes When
**Request changes if:**
- Security vulnerabilities are present
- Code quality standards not met
- Breaking changes introduced without justification
- Accessibility requirements not met
- Performance significantly degraded

### Learning-Focused Feedback
**For student contributors, provide:**
- Explanation of why changes are needed
- Links to relevant documentation or examples
- Suggestions for alternative approaches
- Encouragement and positive reinforcement for good practices

---

## 🤖 Using @claude for Code Review

You can also get AI assistance during the review process:

```markdown
@claude review this PR for security vulnerabilities and performance issues

@claude explain the architecture decisions in this implementation

@claude suggest improvements for the error handling in this component
```

---

*Review checklist for IlliniHunt V2 • Updated for Claude Code integration*