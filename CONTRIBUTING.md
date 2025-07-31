# Contributing to IlliniHunt V2 🚀

Welcome to IlliniHunt V2! We're excited to have UIUC students, faculty, and staff contribute to this problem-solving discovery platform for our university community.

## 🎓 For UIUC Students

IlliniHunt is built **by students, for students**. Contributing to this project offers unique opportunities:

- **Portfolio Building**: Showcase real-world React/TypeScript/Supabase experience
- **Academic Credit**: Many contributions can align with coursework and research
- **Skill Development**: Learn modern web development and AI-assisted coding
- **Community Impact**: Help fellow students discover innovative projects
- **Career Benefits**: Open source contributions valued by employers and graduate programs

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **UIUC Email**: @illinois.edu email required for testing authentication
- **GitHub Account**: Connected to your UIUC email  
- **Node.js 18+**: Required for local development
- **Basic Git Knowledge**: Fork, clone, commit, push workflow

### Setup Steps
1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/illinihunt.git
   cd illinihunt
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add Supabase credentials (see Development Setup below)
   ```

4. **Start Development**
   ```bash
   npm run dev
   # Open http://localhost:5173
   ```

5. **Make Your First Contribution**
   - Look for issues labeled `good-first-issue` or `student-friendly`
   - Comment on an issue to get assigned
   - Create a branch: `git checkout -b feature/your-feature-name`

## 🤖 AI-Powered Development with Claude

IlliniHunt now includes **Claude Code automation** to help students learn and contribute more effectively!

### How It Works
- **Mention @claude** in any GitHub issue or PR comment
- Claude will automatically provide code suggestions, reviews, and implementations
- Perfect for learning: Claude explains its reasoning and teaches best practices

### Example Usage
```markdown
@claude implement a dark mode toggle for the user settings page

@claude review this PR for security issues and performance improvements  

@claude fix the TypeScript error in the ProjectCard component
```

### Learning Benefits
- **Code Explanations**: Claude explains complex patterns and architectural decisions
- **Best Practices**: Learn React, TypeScript, and Supabase patterns through AI guidance
- **Code Reviews**: Get detailed feedback on your contributions
- **Problem Solving**: Work alongside AI to tackle challenging features

## 🎯 Development Workflow

### 1. Choose Your Contribution Type

#### 🟢 **Beginner-Friendly** (0-6 months experience)
- UI improvements and bug fixes
- Adding icons or visual elements
- Documentation updates
- Simple component modifications

#### 🟡 **Intermediate** (6+ months experience)  
- New feature components
- Database schema changes
- API integration improvements
- Performance optimizations

#### 🔴 **Advanced** (1+ years experience)
- Architecture improvements
- Complex feature implementations
- Security enhancements
- DevOps and deployment improvements

### 2. Issue Assignment Process
1. **Browse Issues**: Look for labels like `student-friendly`, `course-project`, or `research-opportunity`
2. **Comment to Claim**: Comment "I'd like to work on this" and mention your experience level
3. **Get Assigned**: Maintainers will assign the issue and provide guidance
4. **Ask Questions**: Use @claude or GitHub discussions for help

### 3. Development Process
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/meaningful-name
   # Examples: feature/user-notifications, fix/mobile-responsive-cards
   ```

2. **Follow Code Standards**
   - **TypeScript**: Strict mode enabled, avoid `any` types
   - **React**: Functional components with hooks
   - **Styling**: Tailwind CSS with existing design system
   - **Testing**: Add tests for new features (when applicable)

3. **Use AI Assistance**
   ```bash
   # Create issues for complex features
   @claude implement user notification system with real-time updates
   
   # Get code reviews
   @claude review this component for accessibility and performance
   ```

4. **Commit Standards**
   ```bash
   # Format: type: description
   git commit -m "feat: add user notification bell component"
   git commit -m "fix: resolve mobile responsive issue in ProjectCard"
   git commit -m "docs: add component usage examples"
   ```

### 4. Pull Request Process
1. **Create PR**: Use our PR template (auto-generated)
2. **Request Review**: Tag maintainers and use @claude for automated review
3. **Address Feedback**: Work with reviewers and AI assistance to improve code
4. **Merge**: Once approved, your code becomes part of the platform!

## 🎨 Code Standards & Best Practices

### React/TypeScript Standards
```typescript
// ✅ Good: Proper TypeScript with interfaces
interface ProjectCardProps {
  project: {
    id: string
    name: string
    category: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold">{project.name}</h3>
    </div>
  )
}

// ❌ Avoid: Any types and inline styles
export function ProjectCard({ project }: any) {
  return <div style={{background: 'white'}}>{project.name}</div>
}
```

### Styling with Tailwind CSS
```typescript
// ✅ Use existing design system colors
<button className="bg-uiuc-orange text-white hover:bg-uiuc-orange/90">
  Submit Project
</button>

// ✅ Follow responsive patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map(project => <ProjectCard key={project.id} project={project} />)}
</div>
```

### Database/Supabase Patterns
```typescript
// ✅ Use typed database service
import { ProjectsService } from '@/lib/database'

const projects = await ProjectsService.getProjectsByCategory(categoryId)

// ✅ Handle errors gracefully
try {
  const result = await ProjectsService.createProject(projectData)
  if (result.error) {
    showErrorMessage(result.error.message)
    return
  }
  // Success handling
} catch (error) {
  console.error('Project creation failed:', error)
}
```

## 🏫 Academic Integration Opportunities

### Course Project Integration
- **CS 225**: Data structures implementations for search/filtering
- **CS 411**: Database design and optimization projects  
- **CS 465**: UI/UX design improvements and user research
- **CS 519**: Scientific visualization for project analytics
- **BADM 350**: Business model development and user engagement

### Research Opportunities
- **Human-Computer Interaction**: User experience research on discovery platforms
- **Software Engineering**: Development methodology and AI-assisted coding studies
- **Data Science**: Analytics on student project trends and engagement
- **Social Computing**: Community building and collaboration patterns

### Getting Academic Credit
1. **Talk to Your Professor**: Discuss IlliniHunt contributions as course project
2. **Document Your Work**: Keep detailed logs of contributions and learning outcomes
3. **Present Results**: Use your contributions in class presentations or papers
4. **Connect to Research**: Link improvements to ongoing UIUC research initiatives

## 🛠️ Development Environment Setup

### Required Tools
```bash
# Node.js and npm
node --version  # Should be 18+
npm --version

# Git configuration
git config --global user.name "Your Name"
git config --global user.email "your-email@illinois.edu"
```

### Supabase Configuration
1. **Get Credentials**: Contact maintainers for development database access
2. **Environment Variables**: Add to `.env.local`
   ```bash
   VITE_SUPABASE_URL=your-dev-supabase-url
   VITE_SUPABASE_ANON_KEY=your-dev-anon-key
   ```
3. **Test Connection**: `npm run dev` should connect successfully

### IDE Setup (Recommended)
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense  
  - ES7+ React/Redux/React-Native snippets
  - GitHub Pull Requests and Issues

## 🎯 Finding the Right Issues

### Issue Labels for Students
- `good-first-issue`: Perfect for newcomers
- `student-friendly`: Designed for learning
- `course-project`: Suitable for class assignments  
- `research-opportunity`: Can lead to academic papers
- `ui-improvement`: Design and frontend focus
- `backend-feature`: Database and API work
- `documentation`: Writing and communication skills

### Priority Levels
- `priority-high`: Core platform functionality
- `priority-medium`: Enhancement features  
- `priority-low`: Nice-to-have improvements

### Skill Categories
- `react-typescript`: Frontend development
- `supabase-database`: Backend and data
- `ui-ux-design`: User interface and experience
- `testing-qa`: Quality assurance
- `devops-deployment`: Infrastructure and CI/CD

## 🤝 Getting Help

### Community Support
- **GitHub Discussions**: Ask questions and share ideas
- **Issues Comments**: Tag maintainers for guidance
- **AI Assistant**: Use @claude for coding help and explanations
- **Code Review**: Get feedback on your contributions

### Maintainer Contact
- **Response Time**: Usually within 24-48 hours
- **Office Hours**: Check GitHub discussions for virtual office hours
- **Urgent Issues**: Tag @vishalsachdev for time-sensitive problems

### Learning Resources
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase Docs**: https://supabase.com/docs

## 🎉 Recognition and Success

### Contributor Recognition
- **GitHub Contributors**: Automatic recognition in repository
- **LinkedIn Recommendations**: Available for significant contributors
- **Portfolio Projects**: Use IlliniHunt contributions in job applications
- **Research Authorship**: Co-authorship opportunities for research contributions

### Success Stories
*We'll showcase student contributors who have:*
- Landed internships at tech companies
- Published research papers from their contributions
- Started their own projects inspired by IlliniHunt
- Received academic credit for open source work

## 📋 Contribution Checklist

Before submitting your PR:

- [ ] **Code Quality**
  - [ ] TypeScript compilation passes (`npm run type-check`)
  - [ ] Linting passes (`npm run lint`)
  - [ ] No console errors in development
  - [ ] Responsive design works on mobile

- [ ] **Testing**
  - [ ] Manual testing completed
  - [ ] Edge cases considered
  - [ ] Error handling implemented

- [ ] **Documentation**
  - [ ] Code comments for complex logic
  - [ ] README updated if needed
  - [ ] Commit messages follow standards

- [ ] **AI Review**
  - [ ] Used @claude for code review
  - [ ] Addressed AI suggestions
  - [ ] Learned from AI explanations

## 🚀 Next Steps

Ready to contribute? Here's your action plan:

1. **🍴 Fork the repository**
2. **📝 Find a `good-first-issue`**  
3. **💬 Comment to get assigned**
4. **🔧 Set up your development environment**
5. **🤖 Use @claude for help and learning**
6. **📤 Submit your first PR**

**Welcome to the IlliniHunt contributor community!** 🎊

---

*Questions? Start a [GitHub Discussion](https://github.com/vishalsachdev/illinihunt/discussions) or comment on any issue. We're here to help you succeed!*