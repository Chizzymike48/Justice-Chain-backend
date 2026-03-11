# TypeScript Migration Guide for JusticeChain

## ✅ Completed Migrations

### Frontend (React)
- ✅ `tsconfig.json` - Main TypeScript configuration
- ✅ `tsconfig.node.json` - Build tools TypeScript config
- ✅ `package.json` - Updated with TypeScript dependencies
- ✅ `vite.config.ts` - Vite configuration (ES modules)
- ✅ `eslint.config.ts` - ESLint configuration for TypeScript
- ✅ `postcss.config.ts` - PostCSS configuration
- ✅ `tailwind.config.ts` - Tailwind CSS configuration
- ✅ `index.html` - Updated script reference to main.tsx
- ✅ `src/main.tsx` - Entry point (converted from main.jsx)
- ✅ `src/App.tsx` - Main App component (converted from App.jsx)
- ✅ `src/theme.ts` - MUI theme configuration (converted from theme.js)
- ✅ `src/context/AuthContext.tsx` - Auth context with types
- ✅ `src/context/AppContext.tsx` - App context with types
- ✅ `.npmrc` - NPM config for legacy peer dependencies
- ✅ `jest.config.ts` - Jest test configuration for React

### Backend (Express + Node.js)
- ✅ `tsconfig.json` - TypeScript configuration for backend
- ✅ `package.json` - Updated with TypeScript & ts-node dependencies
- ✅ `src/server.ts` - Server entry point (converted from server.js)
- ✅ `src/app.ts` - Express app setup (converted from app.js)
- ✅ `ecosystem.config.ts` - PM2 configuration (converted from ecosystem.config.js)
- ✅ `eslint.config.ts` - ESLint configuration for backend
- ✅ `.npmrc` - NPM config for legacy peer dependencies
- ✅ `jest.config.ts` - Jest test configuration for backend

### Installed Dependencies
- ✅ Frontend dependencies installed with `--legacy-peer-deps`
- ✅ Backend dependencies installed with `--legacy-peer-deps`

## 🚀 Available Commands

### Frontend
```bash
cd c:\Users\HP\Desktop\justicechain
npm run dev          # Start Vite development server
npm run build        # Build for production (TypeScript + Vite)
npm run lint         # Run ESLint on .ts/.tsx files
npm run type-check   # Check TypeScript types
npm run preview      # Preview production build
```

### Backend
```bash
cd c:\Users\HP\Desktop\justicechain\africajustice-backend
npm run dev          # Start development with nodemon + ts-node
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript
npm run type-check   # Type check without emitting
npm run test         # Run Jest tests with coverage
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint on .ts files
```

## ⚠️ Next Steps - Convert Remaining Files

### Frontend Files to Convert (jsx → tsx)
The following files still need to be converted from JSX to TSX. Replace extensions and add proper TypeScript types:

**Components:**
- `src/components/AfricaJusticeChatbot.jsx`
- `src/components/CorruptionScore.jsx`
- `src/components/CreatePetitionForm.jsx`
- `src/components/CreateProjectForm.jsx`
- `src/components/EvidenceUpload.jsx`
- `src/components/LeaderboardView.jsx`
- `src/components/MyVerificationsView.jsx`
- `src/components/ReportCard.jsx`
- `src/components/VerificationFeed.jsx`
- `src/components/VerificationSystem.jsx`
- `src/components/VerificationWidget.jsx`
- All files in `src/components/civic/`
- All files in `src/components/common/`
- All files in `src/components/corruption/`
- All files in `src/components/government/`
- All files in `src/components/officials/`
- All files in `src/components/verification/`

**Pages:**
- All files in `src/pages/` (*.jsx → *.tsx)

**Services:**
- `src/services/api.js`
- `src/services/authService.js`
- `src/services/reportService.js`
- `src/services/verificationService.js`

**Utils & Hooks:**
- `src/utils/chatbotClient.js`
- `src/utils/constants.js`
- `src/utils/helpers.js`
- `src/utils/validators.js`
- `src/pages/hooks/` (all files)

### Backend Files to Convert (js → ts)
The following backend files still need to be converted from JavaScript to TypeScript:

**Directories to Convert:**
- `src/config/` (*.js → *.ts) - Add types for exports
- `src/controllers/` (*.js → *.ts) - Add Request/Response types
- `src/middleware/` (*.js → *.ts) - Add Express middleware types
- `src/models/` - Convert Mongoose models with proper types
- `src/routes/` - Add proper route handler types
- `src/services/` - Convert services with interfaces
- `src/socket/` - Add Socket.IO type definitions
- `src/validators/` - Add validator types
- `tests/` - Convert test files to .ts with jest types

## 📋 Conversion Checklist

### For Each File Conversion:

1. **Rename file** from `.js`/`.jsx` to `.ts`/`.tsx`
2. **Add imports** - Use ES6 import syntax (already configured)
3. **Add types** - Define interfaces and types for:
   - Function parameters and return types
   - Component props
   - API responses
   - Database models
4. **Update imports** in files that reference the converted file
5. **Run type checker** to catch any errors: `npm run type-check`

### TypeScript Best Practices for Conversion:

#### React Components
```typescript
import { FC, ReactNode } from 'react'

interface ComponentProps {
  title: string
  children?: ReactNode
  onClose?: () => void
}

const MyComponent: FC<ComponentProps> = ({ title, children, onClose }) => {
  return <div>{title}</div>
}

export default MyComponent
```

#### Express Controllers
```typescript
import { Request, Response, NextFunction } from 'express'

interface CustomRequest extends Request {
  user?: { id: string; email: string }
}

export const myController = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
```

#### Services
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class UserService {
  async getUser(id: string): Promise<ApiResponse<User>> {
    // implementation
  }
}

export default new UserService()
```

## 🔧 Build & Run

### Development
```bash
# Terminal 1: Frontend
cd justicechain
npm run dev

# Terminal 2: Backend
cd africajustice-backend
npm run dev
```

### Production Build
```bash
# Frontend
cd justicechain
npm run build

# Backend
cd africajustice-backend
npm run build
npm start
```

## 📝 Configuration Notes

- **ESLint**: Uses TypeScript ESLint parser with strict rules
- **Jest**: Pre-configured for both frontend (jsdom) and backend (node) environments
- **Module System**: Frontend uses ES modules, backend uses CommonJS (compiled from ES6)
- **Path Aliases**: Both projects support `@/*` for `src/*` paths
- **Strict Mode**: All TypeScript strict options enabled for type safety

## 🎯 Key Files Architecture

```
justicechain/
├── tsconfig.json (frontend main config)
├── tsconfig.node.json (build tools config)
├── vite.config.ts (bundler config)
├── eslint.config.ts (linter config)
├── jest.config.ts (test config)
├── package.json (dependencies + scripts)
└── src/
    ├── main.tsx (entry point)
    ├── App.tsx (root component)
    ├── theme.ts (MUI theme)
    ├── context/ (state management)
    ├── components/ (React components - need conversion)
    ├── pages/ (page components - need conversion)
    ├── services/ (API services - need conversion)
    └── utils/ (utilities - need conversion)

africajustice-backend/
├── tsconfig.json (backend config)
├── jest.config.ts (test config)
├── ecosystem.config.ts (PM2 config)
├── package.json (dependencies + scripts)
└── src/
    ├── server.ts (entry point)
    ├── app.ts (Express setup)
    ├── config/ (configuration - need conversion)
    ├── controllers/ (request handlers - need conversion)
    ├── middleware/ (Express middleware - need conversion)
    ├── models/ (data models - need conversion)
    ├── routes/ (API routes - need conversion)
    ├── services/ (business logic - need conversion)
    └── validators/ (validation logic - need conversion)
```

## ✨ Benefits of TypeScript

- ✅ Type safety catches bugs at compile time
- ✅ Better IDE autocompletion and refactoring
- ✅ Self-documenting code with types
- ✅ Excellent for large projects
- ✅ Strong community support and ecosystem
- ✅ Easy gradual migration (can mix .js and .ts)

## 🔍 Troubleshooting

### TypeScript Errors
If you see "Could not find a declaration file" errors:
- Ensure the imported file is being converted to .ts/.tsx
- Update the import path to use the new extension
- Run `npm run type-check` to validate

### Build Errors
If build fails:
- Run `npm run type-check` to identify type issues
- Check that all dependencies are installed
- Clear node_modules and reinstall if needed

### PM2 Startup
To run backend in production:
```bash
npm run build
npx pm2 start ecosystem.config.ts --name africajustice-backend
```

---

**Migration Status**: 🟢 Core infrastructure complete, ready for file-by-file conversion
**Last Updated**: February 22, 2026
