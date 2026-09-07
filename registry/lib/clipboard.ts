/** Copy `value`, falling back when the async Clipboard API is unavailable.
 *
 *  `navigator.clipboard` only exists in a secure context — HTTPS, or localhost.
 *  Opening the docs from a phone on the LAN (http://192.168.x.x) is plain
 *  HTTP, so the object is simply absent and reading `.writeText` off it
 *  throws. The same applies to any consumer serving this component over HTTP
 *  on an internal network.
 *
 *  The fallback selects the text in an off-screen node and runs the legacy
 *  `execCommand("copy")`. It is deprecated but universally implemented, and it
 *  is the only path available without TLS. Returns whether the copy landed, so
 *  the button only claims success when it actually copied.
 *
 *  The node is a span, not a focused textarea. `execCommand("copy")` takes
 *  whatever is selected, and a selection needs no focus — while focusing a
 *  field (the usual recipe, which has to flip `contentEditable` on to make iOS
 *  select it at all) reads to iOS as "about to type": Safari collapses its
 *  bottom address bar for a keyboard that never arrives, then puts it back a
 *  frame later when the node is removed. Selecting a plain node skips the
 *  whole performance. `white-space: pre` keeps the newlines, which the copy
 *  takes from the rendered text rather than the string. */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Present but refused (permissions policy, denied prompt) — try the node.
  }

  // Off-screen rather than invisible: text under `display:none` or
  // `visibility:hidden` is not selectable, so the copy would silently do
  // nothing. Parked at the viewport's top-left rather than off at -9999px —
  // selecting something makes the browser reveal it, and revealing a node
  // 9999px to the left is what made mobile lurch sideways on every copy.
  const holder = document.createElement("span")
  holder.textContent = value
  holder.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;white-space:pre;user-select:text;-webkit-user-select:text"
  document.body.appendChild(holder)

  // Put whatever the reader had highlighted back afterwards.
  const selection = document.getSelection()
  const previous =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  try {
    const range = document.createRange()
    range.selectNodeContents(holder)
    selection?.removeAllRanges()
    selection?.addRange(range)
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    selection?.removeAllRanges()
    holder.remove()
    if (previous) selection?.addRange(previous)
  }
}
