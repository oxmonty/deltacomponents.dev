"""Playwright harness for a component QA pass.

Import this from a per-component scenario script; it owns the browser, the
per-step evidence (a cropped screenshot plus the visible text) and the log.
Keep the scenarios in the calling script, one function per flow:

    from harness import Session

    with Session(slug="editor", demo_index=0) as qa:
        def quote_newline(page, target):
            qa.click_line_end(target, -1)
            page.keyboard.press("Enter")
            qa.snap("01b-quote-enter", "after Enter on quote line")
        qa.run("01 quote newline", quote_newline)

Run it as `python3 <script>.py`; the dev server must already be up (see
SKILL.md). Evidence lands in ./qa-<slug>/shots, the log in log.json.
"""
from __future__ import annotations

import json
import os
import sys
import traceback
from typing import Callable

from playwright.sync_api import Locator, Page, sync_playwright

BASE_URL = os.environ.get("QA_BASE_URL", "http://localhost:4011")
MOD = "Meta" if sys.platform == "darwin" else "Control"


class Session:
    def __init__(self, slug: str, demo_index: int = 0, demo_selector: str | None = None, out_dir: str | None = None):
        self.slug = slug
        self.url = f"{BASE_URL}/docs/{slug}"
        # The demo under test: the nth component root on the page, or an explicit selector.
        self.demo_selector = demo_selector or f'[data-slot="{slug}"]'
        self.demo_index = demo_index
        self.out = out_dir or os.path.join(os.getcwd(), f"qa-{slug}")
        self.shots = os.path.join(self.out, "shots")
        os.makedirs(self.shots, exist_ok=True)
        self.log: list[dict] = []
        self.errors: list[str] = []

    # -- lifecycle -----------------------------------------------------------
    def __enter__(self):
        self._pw = sync_playwright().start()
        self.browser = self._pw.chromium.launch(headless=True)
        self.ctx = self.browser.new_context(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
        self.page = self.ctx.new_page()
        self.page.on("pageerror", lambda e: self.errors.append(f"pageerror: {e}"))
        self.page.on("console", lambda m: self.errors.append(f"console.error: {m.text}") if m.type == "error" else None)
        return self

    def __exit__(self, *_):
        json.dump({"log": self.log, "errors": self.errors}, open(os.path.join(self.out, "log.json"), "w"), indent=1)
        print(f"\n{len(self.log)} steps, {len(self.errors)} console/page errors -> {self.out}")
        self.browser.close()
        self._pw.stop()

    # -- targets ---------------------------------------------------------------
    def fresh(self, page: Page | None = None) -> Locator:
        """Reload the docs page and return the demo under test, scrolled into view."""
        page = page or self.page
        page.goto(self.url)
        page.wait_for_load_state("networkidle")
        target = page.locator(self.demo_selector).nth(self.demo_index)
        target.scroll_into_view_if_needed()
        page.wait_for_timeout(250)
        return target

    def mobile(self):
        """A second page at phone width with a touch profile. Caller closes the context."""
        ctx = self.browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        return ctx, ctx.new_page()

    # -- scenarios ---------------------------------------------------------------
    def run(self, title: str, scenario: Callable[[Page, Locator], None]):
        """Run one flow from a fresh page. A failure is logged, never fatal."""
        print(f"\n== {title}")
        try:
            target = self.fresh()
            scenario(self.page, target)
        except Exception as exc:  # noqa: BLE001 - a broken step is itself a finding
            print("!! FAILED", title, str(exc)[:200])
            traceback.print_exc(limit=1)
            self.log.append({"failed": title, "error": str(exc)[:400]})

    # -- evidence ----------------------------------------------------------------
    def snap(self, name: str, note: str = "", target: Locator | None = None, text_selector: str = ".cm-line"):
        """Cropped screenshot of the target plus its visible text lines."""
        target = target or self.page.locator(self.demo_selector).nth(self.demo_index)
        target.scroll_into_view_if_needed()
        self.page.wait_for_timeout(120)
        target.screenshot(path=os.path.join(self.shots, f"{name}.png"))
        lines = target.locator(text_selector).all_inner_texts() if target.locator(text_selector).count() else [target.inner_text()]
        self.log.append({"step": name, "note": note, "lines": lines})
        print(f"[{name}] {note}")
        for line in lines:
            if line.strip():
                print("   ", repr(line))

    def note(self, **facts):
        """Log a measured fact (a bounding box, an attribute, a computed style)."""
        self.log.append(facts)
        print("   ", facts)

    # -- editing helpers -------------------------------------------------------------
    def click_line_end(self, target: Locator, index: int, line_selector: str = ".cm-line"):
        line = target.locator(line_selector).nth(index)
        box = line.bounding_box()
        self.page.mouse.click(box["x"] + box["width"] - 2, box["y"] + box["height"] / 2)
        self.page.keyboard.press("End")

    def select_word(self, target: Locator, index: int, x_offset: int = 20, line_selector: str = ".cm-line"):
        box = target.locator(line_selector).nth(index).bounding_box()
        self.page.mouse.dblclick(box["x"] + x_offset, box["y"] + box["height"] / 2)

    def drag_lines(self, target: Locator, first: int, last: int, line_selector: str = ".cm-line"):
        a = target.locator(line_selector).nth(first).bounding_box()
        b = target.locator(line_selector).nth(last).bounding_box()
        self.page.mouse.move(a["x"] + 2, a["y"] + a["height"] / 2)
        self.page.mouse.down()
        self.page.mouse.move(b["x"] + b["width"] - 2, b["y"] + b["height"] / 2)
        self.page.mouse.up()

    def focus_is_in(self, target: Locator) -> bool:
        return target.evaluate("el => el.contains(document.activeElement)")
