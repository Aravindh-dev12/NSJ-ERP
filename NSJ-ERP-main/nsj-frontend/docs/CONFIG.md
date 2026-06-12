# Configuration Files Documentation

This document explains the purpose and settings of various configuration files in the project.

## Table of Contents

- [ESLint (.eslintrc.json)](#eslint-eslintrcjson)
- [Prettier (.prettierrc)](#prettier-prettierrc)
- [lint-staged (.lintstagedrc.json)](#lint-staged-lintstagedrcjson)
- [Editor Config (.editorconfig)](#editor-config-editorconfig)
- [NVM (.nvmrc)](#nvm-nvmrc)

## ESLint (.eslintrc.json)

**Purpose**: Enforces code quality and consistency rules

```json
{
  "extends": "next/core-web-vitals"
}
```

**What it does**:

- Extends Next.js recommended ESLint configuration
- Includes React best practices
- Enforces accessibility standards (a11y)
- Checks for performance issues
- Validates React hooks usage
- Catches common errors

**Run linting**:

```bash
pnpm lint          # Check for errors
pnpm lint --fix    # Auto-fix errors where possible
```

## Prettier (.prettierrc)

**Purpose**: Automatic code formatting

```json
{
  "semi": true, // Always use semicolons
  "trailingComma": "es5", // Trailing commas where valid in ES5
  "singleQuote": false, // Use double quotes for strings
  "printWidth": 80, // Line length limit
  "tabWidth": 2, // 2 spaces for indentation
  "useTabs": false, // Use spaces, not tabs
  "arrowParens": "always", // Always use parens in arrow functions
  "endOfLine": "lf" // Unix-style line endings
}
```

**Run formatting**:

```bash
pnpm format         # Format all files
pnpm format:check   # Check formatting without changing files
```

## lint-staged (.lintstagedrc.json)

**Purpose**: Runs linters on git staged files (pre-commit hook)

```json
{
  "*.{js,jsx,ts,tsx,json,css,md}": ["prettier --write"],
  "*.{js,jsx,ts,tsx}": ["eslint --fix"]
}
```

**What it does**:

- Runs automatically before each commit (via Husky)
- Formats staged files with Prettier
- Lints JavaScript/TypeScript files with ESLint
- Only processes files being committed (fast)

**Triggered by**: Git commit (automatic via Husky)

## Editor Config (.editorconfig)

**Purpose**: Maintains consistent coding styles across different editors

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

**What it does**:

- Sets UTF-8 encoding
- Uses Unix line endings (LF)
- 2 spaces for indentation
- Removes trailing whitespace
- Ensures final newline in files

**Supported editors**: VS Code, IntelliJ, Sublime Text, Vim, and many more

## NVM (.nvmrc)

**Purpose**: Specifies the Node.js version for the project

```
20
```

**What it does**:

- Ensures all developers use the same Node.js version
- Used by NVM (Node Version Manager)
- Prevents version-related bugs

**Usage**:

```bash
nvm use      # Switch to project's Node version
nvm install  # Install project's Node version
```

## Git Hooks (Husky)

**Purpose**: Automates quality checks before commits

Located in `.husky/` directory:

### pre-commit

- Runs `lint-staged` to format and lint staged files
- Ensures code quality before commit
- Prevents committing badly formatted code

### commit-msg

- Validates commit message format
- Enforces conventional commits (see `commitlint.config.cjs`)
- Prevents non-standard commit messages

## Commitlint (commitlint.config.cjs)

**Purpose**: Enforces conventional commit message format

**Format**: `<type>(<scope>): <subject>`

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, etc)
- `revert`: Revert previous commit

**Examples**:

```bash
git commit -m "feat(auth): add login functionality"
git commit -m "fix(api): handle 401 errors correctly"
git commit -m "docs: update deployment guide"
```

## Package Manager

**pnpm-lock.yaml**: Lockfile for deterministic dependency installation

**package.json**: Specifies required engine versions:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.1"
}
```

## VS Code Settings (Recommended)

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.eol": "\n"
}
```

## Additional Resources

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [EditorConfig](https://editorconfig.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Git Hooks](https://typicode.github.io/husky/)
