"use client"

import * as React from "react"

import { cn } from "@/registry/lib/utils"
import { fontWeights } from "@/registry/lib/font-weight"

// Pastels at matched lightness and chroma, so a page of mixed alerts reads as
// one family. Light: the pastel is a solid fill under near-black ink (11.4:1
// at worst). Dark: the same pastel becomes the ink, over a 15% wash of itself,
// so each type keeps its hue without a light slab on a dark page.
const alertTypes = {
  note: "[--alert:#ffeba1]",
  tip: "[--alert:#a1f0d5]",
  info: "[--alert:#a1d5ff]",
  warning: "[--alert:#ffd2a1]",
  danger: "[--alert:#ffb1a1]",
  success: "[--alert:#b6f0a1]",
  caution: "[--alert:#ffc4a1]",
} as const

type AlertType = keyof typeof alertTypes

interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  type?: AlertType
  title?: React.ReactNode
}

function Alert({
  type = "note",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-type={type}
      className={cn(
        "p-4 text-base leading-normal",
        "bg-(--alert) text-[#0a0a0a] dark:bg-(--alert)/15 dark:text-(--alert)",
        alertTypes[type],
        className
      )}
      {...props}
    >
      {title && (
        <div
          data-slot="alert-title"
          className="[text-box-trim:trim-start]"
          style={{ fontVariationSettings: fontWeights.medium }}
        >
          {title}
        </div>
      )}
      {children && (
        <div
          data-slot="alert-description"
          className={cn(
            "[text-box-trim:trim-start]",
            // Rich children (links, code, <p>) take the alert's ink and size
            // rather than the page's, which would clash with the pastel.
            "[&_*]:!text-inherit [&_*]:![font-size:inherit]",
            title && "mt-1.5"
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export { Alert }
export type { AlertProps, AlertType }
