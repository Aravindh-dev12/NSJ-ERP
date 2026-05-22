/**
 * PostCSS Configuration
 *
 * Processes CSS with plugins:
 * - Tailwind CSS: Utility-first CSS framework
 * - Autoprefixer: Adds vendor prefixes for browser compatibility
 */

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    tailwindcss: {}, // Process Tailwind directives
    autoprefixer: {}, // Add vendor prefixes automatically
  },
};
