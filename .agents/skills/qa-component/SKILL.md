---
name: qa-component
description: Run a QA and UX pass over one of this repo's components and publish the findings as a shareable report with repro steps, root causes and screenshots. Use when asked to QA, audit, stress-test or "find issues in" a component, to reproduce a reported bug alongside whatever else is broken, or to produce a hand-off list for an engineer before a fix session.
---

# QA pass over a component

The output is a **published artifact**: a findings page an engineer can work
from without you in the room. Every finding has numbered repro steps, actual
vs expected, the file to look at, and a screenshot. The page is the
deliverable; the chat summary is a pointer to it.

Play two roles at once. As **QA**, break it: every input path, every state,
the edges (empty, wrapped, nested, selected across lines, mobile). As the
**UX reviewer**, notice what is merely wrong: alignment that drifts,
a state you cannot tell apart from another, a control that took focus it
should not have. Both go on the page; severity tells them apart.

## 1. Set up

- Dev server up: `make dev` (4001) or the running instance on 4011. Set
  `QA_BASE_URL` if it is elsewhere.
- **Keystrokes come from Playwright**, not the browser extension. Python
  Playwright with Chromium is installed on this machine
  (`python3 -c "import playwright"`); if it is missing,
  `pip install playwright && playwright install chromium`.
- **Screenshots of the live site can come from Claude in Chrome** when the
  person has it enabled, and it is the right tool for eyeballing a state a
  script has left behind. Know its limit: the MCP tab runs hidden, so
  CodeMirror never syncs a synthetic caret there, `requestAnimationFrame`
  and CSS transitions do not complete, and a menu can stay mid-exit forever.
  Do not report any of those as bugs. Anything that needs a real caret or a
  finished animation is verified in Playwright.
- Read the component's doc page (`content/docs/<slug>.mdx`) first. Every
  promise it makes is a test case, and a broken promise is at least Medium.

## 2. Script the session

Copy the harness next to a scenario script in your scratchpad and write one
function per flow:

```python
import sys; sys.path.insert(0, "<repo>/.agents/skills/qa-component")
from harness import Session

with Session(slug="editor", demo_selector='[data-slot="editor"]:has([role="toolbar"])') as qa:
    def quote_newline(page, target):
        qa.click_line_end(target, -1)
        page.keyboard.press("Enter")
        qa.snap("01b-quote-enter", "after Enter on the quote line")
        page.keyboard.type("second line")
        qa.snap("01c-quote-typed", "typed on the continued line")
    qa.run("01 quote newline", quote_newline)
```

`harness.py` gives you: `run()` (fresh page per flow, a failure is logged
not fatal — a flow that cannot complete is itself a finding), `snap()`
(cropped screenshot + visible text into the log), `note()` for measured
facts, `mobile()` for a 390px touch context, and the caret helpers.
Name steps `NN<letter>-what-it-shows` so the log reads in order.

Cover, at minimum:

| Axis | What to drive |
| --- | --- |
| The reported bug | First, exactly as described, then its neighbours (the same action on the sibling constructs) |
| Every control | Each button, menu item and shortcut the docs list, with and without a selection |
| Toggles | On, off, on again; stacked with another (bold then italic then bold) |
| Text edges | Start of line, end of line, a wrapped line, an empty document, select-all + delete |
| Structure | Enter / Backspace / Tab at the head, middle and end of every block kind; nesting and un-nesting |
| Focus | Where is `document.activeElement` after every menu and button? Does typing land? |
| State reading | Pressed / disabled states match the caret; undo/redo depth |
| Mobile | 390px touch: target sizes, what is off-screen, what scrolls |
| Console | Zero errors across the run (the harness records them) |

## 3. Confirm before you write

A screenshot shows a symptom. Before a finding gets a **Cause**, confirm it:

- Run the command directly in a vitest probe (`tests/_probe.test.ts`, delete
  it after) and print the document and selection after each step.
- Print the syntax tree (`ensureSyntaxTree(...).iterate`) when a decoration
  is wrong: half of the editor's bugs are "the node is not where the
  decorator looks".
- Distinguish "did not happen" from "happened but is concealed": an
  unfocused editor hides every marker, so check the DOM (`h2` tag, class,
  `aria-pressed`) rather than the text.

Write "Not confirmed" and your leads when you could not; never guess in the
Cause row.

## 4. Write the page

Start from `report-template.html` in this directory (the tokens, chips and
layout are settled; do not redesign it). Fill in:

- **Summary table** first, ordered High → Medium → Low, ids zero-padded,
  each row linking to its article.
- **One article per finding**: title as a sentence naming the behaviour, the
  severity chip, a `Reported by user` chip when it came from the person, the
  `file · function` it points at, then Repro / Actual / Expected / Cause,
  then the evidence figure with real `width`/`height` attributes.
- **Checked and working**: every flow that passed, one line each, so the
  engineer knows what the pass covered.

Severity: **High** = data or intent lost, a documented promise broken, or a
control that stops the user typing. **Medium** = wrong result the user can
see and work around. **Low** = polish, affordance, a design call to make.

Copy only the frames you cite into `report/evidence/` and publish with the
Artifact tool, `root` set to the report directory and `files` mapping each
evidence path, favicon `🧪`. Then give the person the link and the three
findings you would fix first, and which ones share a root cause.

## 5. Hand-off

The fixes are a separate session (`/delegate` works well: one subagent per
root cause, the verification stays with you). Each fix should land with a
test that runs the real command or keymap binding — the QA page's Repro
steps are the test's given/when/then.
