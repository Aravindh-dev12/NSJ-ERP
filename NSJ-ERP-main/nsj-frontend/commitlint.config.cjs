/**
 * Commitlint Configuration
 *
 * Enforces conventional commit message format:
 * <type>(<scope>): <subject>
 *
 * Examples:
 * - feat(auth): add login functionality
 * - fix(api): handle 401 errors correctly
 * - docs: update deployment guide
 */

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only
        "style", // Code style changes (formatting, etc)
        "refactor", // Code refactoring
        "perf", // Performance improvement
        "test", // Adding tests
        "build", // Build system changes
        "ci", // CI/CD changes
        "chore", // Other changes (dependencies, etc)
        "revert", // Revert previous commit
      ],
    ],
  },
};
