# AI News RAG v2 - Claude Instructions

## Project Location
`C:\Users\zivda\projects\ai-news-rag`

## Quick Reference

**Workflow ID:** `JRCaBo3mLsqGeKpk`
**n8n Access:** https://home.danielshaprvt.work/ -> Sidebar -> n8n

## Available Skills

Read these before making changes:

1. **`.claude/skills/project-overview.md`** - What this project does, workflow flow, triggers
2. **`.claude/skills/fixes-and-lessons.md`** - CRITICAL: Known issues and how to avoid them
3. **`.claude/skills/testing-guide.md`** - How to test and verify the workflow
4. **`.claude/skills/technical-architecture.md`** - APIs, data models, tech stack

## Before Making Any Changes

1. Read `fixes-and-lessons.md` to understand n8n pitfalls
2. Key rule: **Never use `$('NodeName')` inside SplitInBatches loops to reference nodes outside the loop**
3. Run `n8n_validate_workflow` before deploying

## Common Tasks

### Check if workflow is working
```bash
n8n_executions action="list" workflowId="JRCaBo3mLsqGeKpk" limit=1
```

### Debug a failed execution
```bash
n8n_executions action="get" id="EXECUTION_ID" mode="error"
```

### Verify workflow structure
```bash
n8n_get_workflow id="JRCaBo3mLsqGeKpk" mode="structure"
```

## Testing

Use Manual Trigger from n8n UI (webhook may fail due to HA ingress).
See `testing-guide.md` for full instructions.
