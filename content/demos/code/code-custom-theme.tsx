"use client";

import { Code } from "@/registry/ui/code";
import { PATRICK_DARK } from "@/lib/docs/code-themes";

const RUST_SAMPLE = `use std::collections::HashMap;

/// Counts how many times each word appears.
pub fn word_counts(text: &str) -> HashMap<String, usize> {
    let mut counts: HashMap<String, usize> = HashMap::new();

    for word in text.split_whitespace() {
        let key = word.trim_matches(|c: char| !c.is_alphanumeric());
        if key.is_empty() {
            continue;
        }
        *counts.entry(key.to_lowercase()).or_insert(0) += 1;
    }

    counts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_repeats() {
        let counts = word_counts("the cat the hat");
        assert_eq!(counts["the"], 2);
    }
}`;

export default function CodeCustomTheme() {
  return (
    <div className="w-full max-w-[520px]">
      <Code
        filename="word_count.rs"
        language="rust"
        theme={PATRICK_DARK}
        code={RUST_SAMPLE}
      />
    </div>
  );
}
