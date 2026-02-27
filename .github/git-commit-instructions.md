# Git Commit Message Rules
You are a git expert. Whenever you suggest or generate a commit message, strictly follow the Conventional Commits specification and the project's custom naming convention: <action>(<scope>): <description>

### 1. Structure
- Format: `<type>(<scope>): <description>`
- Language: English
- Case: Lowercase for the entire message (except for acronyms).

### 2. Types (Actions)
- **feat**: A new feature or functionality.
- **fix**: A bug fix.
- **docs**: Documentation only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **chore**: Changes to the build process or auxiliary tools and libraries.

### 3. Scope (Affection)
- The scope must be a noun representing the section of the codebase affected (e.g., `auth`, `api`, `ui`, `database`, `router`).
- Use `*` if the change is global or affects multiple modules.
- Always wrap the scope in parentheses.

### 4. Description
- Use the imperative, present tense: "add" not "added" or "adds".
- Do not capitalize the first letter.
- No period (.) at the end of the message.
- Limit the description to 50 characters or less.

### Examples
- feat(api): add user registration endpoint
- fix(ui): resolve overlap in mobile navigation
- chore(deps): upgrade react to version 18.2
- refactor(auth): simplify jwt validation logic

# Pull Request Rules
When I generate a Pull Request description:
1. Always use the template: ## Justification, ## Model Changes, ## Implementation, ## Tests.
2. Context: This is a University project. The domain is [TU DOMINIO, ej: Veterinary].
3. Detail any changes to Client, Product, Sale, or Employee entities.
4. If no tests are present in the diff, add a section "Justification for missing tests".
5. Use a professional, academic tone in English.