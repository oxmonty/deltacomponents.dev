export default function LikesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Likes</h1>
      {Array.from({ length: 12 }).map((_, i) => (
        <p key={i} className="mt-4 text-muted-foreground">
          Filler paragraph {i + 1} for the likes tab, long enough to make the page scroll so
          re-tapping the active tab can be tested against scrolling back to the top.
        </p>
      ))}
    </>
  );
}
