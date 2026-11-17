import { strings } from "@/content/strings";

/** Three stacked rounded stones: the Cairn mark (SPEC 3.2). Decorative. */
function CairnMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      className="size-16 text-primary"
    >
      <ellipse cx="32" cy="52" rx="22" ry="8" fill="currentColor" />
      <ellipse
        cx="32"
        cy="36"
        rx="16"
        ry="7"
        fill="currentColor"
        opacity="0.8"
      />
      <ellipse
        cx="32"
        cy="22"
        rx="10"
        ry="6"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

export default function Home() {
  const { home } = strings;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <CairnMark />
      <h1 className="text-4xl font-semibold tracking-tight">{home.title}</h1>
      <div className="flex flex-col gap-2">
        <p className="text-lg">{home.lead}</p>
        <p className="text-muted-foreground">{home.detail}</p>
      </div>
      <p className="rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
        {home.status}
      </p>
    </main>
  );
}
