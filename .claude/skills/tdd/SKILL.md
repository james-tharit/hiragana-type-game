---
name: tdd
description: Drive a feature or bugfix through red-green-refactor, one isolated subagent per behavior. Use when implementing a feature, fixing a bug, or when the user says "tdd", "test first", "red green refactor", or invokes /tdd. Keeps test output and file reads out of the main context.
---

# TDD

Superpowers' `test-driven-development` owns the discipline. This skill owns the
*dispatch*: you stay in the main thread as coordinator and spend a subagent per
behavior, so the main context holds decisions instead of test logs.

Read `Skill(superpowers:test-driven-development)` yourself only if you need to
adjudicate a worker's report. The worker reads it every time.

## Loop

**1. Split the request into behaviors.** One test's worth each. "Validates email
and rejects empty domains" is two. Name them before you dispatch anything — the
list is the plan, and it is cheap to fix now and expensive to fix at cycle four.

Show the list. Don't ask permission for it.

**1b. Localize once, with `caveman-explore`.** Before the first dispatch, send the
localization question to the `caveman-explore` agent — read-only, haiku, returns
nothing but `path:line  reason` citations, and its greps never enter your context.
One call covering every behavior beats one per worker.

Skip it when you already know the files, or a previous turn returned usable
citations. Paying a subagent to find a file you can already name is waste.

**2. Dispatch one `tdd-worker` per behavior**, in order. Dependent behaviors run
sequentially; genuinely independent ones can go in one batch.

The worker inherits nothing. Its prompt must be self-contained:

- The one behavior, stated as the assertion you want to be true.
- Where it lives: target file, test file, the existing test that is its nearest sibling.
- The test command for this repo, verbatim.
- Constraints the worker cannot infer — the API shape a caller already expects,
  a schema it must not change, a dependency it may not add.

Skip any of that and the worker either guesses or comes back asking, and both
cost more than the sentence you saved.

**3. Read the report, don't re-derive it.** The worker returns `BEHAVIOR / TEST /
RED / GREEN / SUITE / NOTES`. Do not open the files to check its work — that
re-imports the context you just paid to isolate. Verify by consequence: run the
suite once yourself at the end, not after every cycle.

**4. Next behavior.** Keep going without checking in. Stop only for: a failing
suite the worker could not green, a behavior whose spec turns out to be
genuinely ambiguous, or an irreversible/destructive/outward-facing step.

**5. At the end** run the full suite once, then report: behaviors shipped, files
touched, any `ponytail:` shortcut a worker flagged in NOTES.

## Rulings, not stalls

A worker comes back blocked on an ambiguity? Decide it, state the decision and
what it costs if wrong, redispatch. A wrong ruling costs one visible cycle. A
parked session costs the afternoon.

## When to skip the worker

One-line changes, config edits, a test you are only renaming. Dispatching a
subagent to change a constant costs more than the change. Do it inline and say so.

## The two levers

They cut different things and compose:

| | Cuts | Where it comes from |
|---|---|---|
| **ponytail** | code written — YAGNI, stdlib, shortest diff | `SubagentStart` hook, every worker |
| **caveman** | tokens read and written — shrunk command output, compressed payloads, terse prose | `PreToolUse` shrink-hook + MCP tools + the `caveman` skill |

Ponytail alone still reads whole files to write three lines. Caveman alone still
compresses the output of code that should not exist. Run both: fewer tokens in,
fewer lines out.

Enforcement is already wired — ponytail injects into every subagent through its
own `SubagentStart` hook, and caveman's hooks cover subagent tool calls from
user-level settings. The worker prompt restates both so the kit survives being
copied somewhere neither is installed. Nothing here re-enforces them.
