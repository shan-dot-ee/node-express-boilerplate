# Import Removal Checklist

When removing an import statement from a file, always follow this process to ensure proper cleanup:

## Process

1. **Remove the import statement** from the file
   ```javascript
   // BEFORE
   const xss = require('xss-clean');

   // AFTER
   // (removed)
   ```

2. **Search for remaining usage** across the entire codebase
   - Use Grep tool to search for the package name
   - Check both require/import statements AND actual usage
   ```
   Pattern: package-name
   ```

3. **If no usage found**, remove from package.json dependencies
   - Check both `dependencies` and `devDependencies`
   - Run `yarn remove package-name` or `npm uninstall package-name`

4. **Verify the package.json was updated**
   - Confirm the package is removed from package.json
   - Confirm lockfile is updated (yarn.lock or package-lock.json)

## Example

```javascript
// Step 1: Removed import
- const xss = require('xss-clean');

// Step 2: Search codebase
Grep: xss-clean
Result: No matches found

// Step 3: Remove from package.json
yarn remove xss-clean

// Step 4: Verify
✓ package.json updated
✓ yarn.lock updated
```

## Why This Matters

- **Security**: Unused packages increase attack surface
- **Performance**: Smaller node_modules, faster installs
- **Maintenance**: Reduces dependency update burden
- **Clarity**: Keeps package.json accurate and trustworthy

## Common Exceptions

Do NOT remove if:
- Package is used in configuration files (.eslintrc, babel.config.js, etc.)
- Package is a peer dependency of another package
- Package provides CLI tools used in package.json scripts
- Package is imported dynamically (require() inside functions)