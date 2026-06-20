# Ledger360 Agent Rules

The following rules apply to all AI agents and subagents working in this workspace.

## Strict Verification Workflow

**CRITICAL RULE:** Before confirming to the user that a fix, feature, or refactor has been implemented, you MUST automatically run a strict and thorough audit of the changes you have made. 

You must follow these steps before ending your turn or declaring success:
1. **Self-Review:** Manually review the diff of your changes. Check for:
   - Security vulnerabilities (e.g., IDOR, missing auth, XSS).
   - Data integrity issues (e.g., missing `$transaction` wrappers for multi-step mutations).
   - Edge cases (e.g., handling `null`, `NaN`, or empty states).
2. **Type Checking:** Run `npx tsc --noEmit` to ensure your changes haven't broken the TypeScript build.
3. **Linting:** Run `npm run lint` (or equivalent) if configured.
4. **Testing:** Run relevant automated tests if they exist for the modified modules.
5. **Report:** In your response to the user, include a brief "Verification Summary" explicitly stating what audits and tests you ran to prove the fix works. Do not claim a task is "done" without evidence.
