/**
 * Shared geometry for sidebar-anchored dropdown menus (the workspace switcher
 * in the header, the user menu in the footer).
 *
 * The popup is trigger-width plus 10px, shifted 4px left, so that:
 *  - each item's box starts exactly at the trigger row's edge,
 *  - the leading icon slot's centre lands on the sidebar rows' 16px leading
 *    axis (pl-2, with a 20px letter-tile overhanging the 16px slot by 2px a
 *    side),
 *  - gap-2 lands the label on the rows' 32px text axis, and
 *  - pr-1.5 puts a trailing glyph (the check) on the trigger chevron's
 *    vertical axis.
 */
export const SIDEBAR_MENU_GRID =
  "[&_[role=menuitem]]:pl-2 [&_[role=menuitem]]:pr-1.5 [&_[role=menuitem]]:gap-2 [&_[role=menuitemradio]]:pl-2 [&_[role=menuitemradio]]:pr-1.5 [&_[role=menuitemradio]]:gap-2";

export const SIDEBAR_MENU_POPUP = `min-w-[240px] -ml-1 w-[calc(var(--radix-dropdown-menu-trigger-width,var(--anchor-width))_+_10px)] ${SIDEBAR_MENU_GRID}`;
