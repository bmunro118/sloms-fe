# Project Standards & Patterns

## Path Aliases (Avoiding Relative Paths)

To maintain a clean and maintainable codebase, avoid using deep relative paths like `../../src/context/AuthContext`. Instead, use configured path aliases.

### 1. Configuration (Expo SDK 49+)
In modern Expo projects, path aliases are handled natively via `tsconfig.json`. Add the `baseUrl` and `paths` properties to `compilerOptions` in `frontend/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@src/*": ["src/*"],
      "@context/*": ["src/context/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ]
}
```

### 2. Usage Examples
Once configured, imports should be updated to use the aliases:

**Standard Import:**
```typescript
import { AuthContext } from '@context/AuthContext';
```

**Alternative via src alias:**
```typescript
import { AuthContext } from '@src/context/AuthContext';
```

### 3. Benefits
- **Standardized**: Uses standard TypeScript configuration.
- **Native Support**: Handled by Metro bundler without extra Babel plugins.
- **IDE Support**: Full auto-completion and navigation in VS Code.
- **Maintainability**: Moving files requires fewer updates to import statements.

### 4. Implementation Note
After modifying `tsconfig.json`, the Expo development server may require a cache clear to recognize the new aliases:
```bash
npx expo start -c
```
