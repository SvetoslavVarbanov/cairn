import { describe, expect, it } from "vitest";

import {
  REASONS,
  checkCommand,
  tokenize,
} from "../../../.claude/hooks/guard-commands.mjs";

const onBranch = (branch: string) => ({
  cwd: "/repo",
  getBranch: () => branch,
});
const feature = onBranch("chore/m0-foundations");

function reasonFor(command: string, ctx = feature) {
  return checkCommand(command, ctx).reason;
}

describe("tokenize", () => {
  it("splits on separators and keeps quoted text together", () => {
    expect(tokenize(`echo "a; b" && rm -rf x | cat; ls (y)`)).toEqual([
      ["echo", "a; b"],
      ["rm", "-rf", "x"],
      ["cat"],
      ["ls"],
      ["y"],
    ]);
  });

  it("handles single quotes, escaped double quotes and line breaks", () => {
    expect(tokenize(`say 'it''s' "a \\"b\\""\nnext\r\nline`)).toEqual([
      ["say", "its", 'a "b"'],
      ["next"],
      ["line"],
    ]);
  });

  it("keeps the backslashes of quoted Windows paths", () => {
    expect(
      tokenize(`Get-Content "C:\\Users\\Some User\\x\\.env.local"`),
    ).toEqual([["Get-Content", "C:\\Users\\Some User\\x\\.env.local"]]);
  });

  it("keeps empty quoted arguments and drops empty segments", () => {
    expect(tokenize(`git commit -m ""  ;;  `)).toEqual([
      ["git", "commit", "-m", ""],
    ]);
  });
});

describe("deleting folders with everything in them", () => {
  it.each([
    "rm -rf node_modules",
    "rm -fr dist",
    "rm -r -f dist",
    "rm -Rf dist",
    "rm --recursive --force dist",
    "sudo rm -rf /",
    "/bin/rm -rf build",
    "find . -name tmp -exec rm -rf {} +",
    "echo hi && rm -rf build",
    "x=$(rm -rf build)",
    `bash -c "rm -rf dist"`,
    "sh -lc 'rm -rf dist'",
    "Remove-Item -Recurse -Force .next",
    "Remove-Item .next -r -fo",
    "Remove-Item .next -Recurse:$true -Force",
    "ri -Recurse -Force x",
    "rm -Recurse -Force x",
    "del /s /q build",
    "rmdir /S /Q build",
    "cmd /c rd /s /q build",
    `powershell -Command "Remove-Item -Recurse -Force x"`,
    "pwsh -c Remove-Item -Recurse -Force x",
    "powershell.exe -NoProfile -Command Remove-Item -Recurse -Force x",
    `powershell "Remove-Item -Recurse -Force x"`,
    `pwsh -NoProfile "Remove-Item old-dir -Recurse"`,
    `powershell /Command "Remove-Item -Recurse x"`,
    `"C:\\Program Files\\Git\\bin\\bash.exe" -c "rm -rf x"`,
    // Without a force flag: Claude's shell has no terminal, so nothing asks first.
    "rm -r old-dir",
    "rm -R old-dir",
    "rm -ir old-dir",
    "rm --recursive old-dir",
    "Remove-Item old-dir -Recurse",
    "Remove-Item old-dir -re",
    "rd /s build",
    "rd /s/q build",
    "del /s *.tmp",
    // Other tools that delete whole folders.
    "npx rimraf .next",
    "rimraf dist",
    "x=`rm -rf build`",
    "echo `rm -r build`",
    `npx tsx -e "require('fs').rmSync('docs', { recursive: true })"`,
    `node -e "require('fs').rmSync('x', { recursive: true, force: true })"`,
    `python -c "import shutil; shutil.rmtree('x')"`,
  ])("blocks %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.delete);
  });

  it.each([
    "rm file.txt",
    "rm -f file.txt",
    "rm -Force file.txt",
    "rmdir empty-dir",
    "rd build",
    "del /q file.txt",
    "Remove-Item file.txt",
    "Remove-Item -Force file.txt",
    `Remove-Item -LiteralPath "a b.txt"`,
    "Remove-Item *.log -Filter x",
    "Remove-Item old.txt -Confirm",
    `node -e "console.log({ recursive: true })"`,
    "npm uninstall rimraf",
    "npm ls rimraf",
    `echo "rm -rf is blocked"`,
    `git commit -m "block rm -rf in hooks"`,
  ])("allows %s", (command) => {
    expect(checkCommand(command, feature).blocked).toBe(false);
  });
});

describe("git clean", () => {
  it.each([
    "git clean -fdx",
    "git clean -f",
    "git clean -fd",
    "git clean --force -X",
    "git -C sub clean -xf",
  ])("blocks %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.clean);
  });

  it.each(["git clean -n", "git clean -nfdx", "git clean --dry-run -fdx"])(
    "allows the dry run %s",
    (command) => {
      expect(checkCommand(command, feature).blocked).toBe(false);
    },
  );
});

describe("encoded PowerShell", () => {
  it.each([
    "powershell -EncodedCommand ZQBjAGgAbwA=",
    "pwsh -enc ZQBjAGgAbwA=",
    "powershell -e ZQBjAGgAbwA=",
  ])("blocks %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.encoded);
  });

  it("allows other PowerShell flags", () => {
    expect(
      checkCommand("powershell -ExecutionPolicy Bypass -File x.ps1", feature)
        .blocked,
    ).toBe(false);
  });
});

describe("git safety", () => {
  it.each([
    "git commit --no-verify -m x",
    "git commit -n -m x",
    "git commit -anm x",
    "git push --no-verify origin feature",
    "git -c core.hooksPath=/dev/null commit --no-verify -m x",
    "git -c core.hooksPath=/dev/null commit -m x",
    "git -c CORE.HOOKSPATH=x push origin feature",
    "git --config-env core.hooksPath=EMPTY commit -m x",
    "git config core.hooksPath /dev/null",
    "git config --local core.hookspath .nohooks",
  ])("blocks skipping checks: %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.noVerify);
  });

  it.each([
    "git push --force origin feature",
    "git push -f",
    "git push -uf origin feature",
    "git push --force-with-lease origin feature",
    "git push --force-with-lease=feature origin feature",
    "git push --force-if-includes origin feature",
    "git push origin +feature",
  ])("blocks force pushes: %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.forcePush);
  });

  it.each([
    "git push origin main",
    "git push origin master",
    "git push origin HEAD:main",
    "git push origin feature:refs/heads/main",
    "git push origin :main",
    "git push origin --delete main",
    "git push --all",
    "git push --mirror origin",
    "git -C ../other push origin main",
    "git --git-dir .git push origin main",
    "git --work-tree . push origin main",
    "git push -o ci.skip origin main",
    "git push --push-option ci.skip origin main",
    "git push --repo origin main",
  ])("blocks pushes to main: %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.pushMain);
  });

  it.each([
    "git push",
    "git push origin",
    "git push -u origin HEAD",
    "git push origin @",
    "git push -o ci.skip origin",
    "git --git-dir .git push",
  ])("blocks %s while on main", (command) => {
    expect(reasonFor(command, onBranch("main"))).toContain(REASONS.pushMain);
  });

  it.each([
    "git push",
    "git push -u origin HEAD",
    "git push origin feature/x",
    "git push -u origin chore/m0-foundations",
    "git push origin v0.1.0",
    "git push origin HEAD:feature/x",
    "git push -o ci.skip origin feature/x",
    "git status",
    "git log --oneline -n 5",
    "git commit -m 'feat: add page'",
    "git -C sub status",
    "git -c core.autocrlf=false status",
    "git config user.name x",
    "git",
  ])("allows %s on a feature branch", (command) => {
    expect(checkCommand(command, feature).blocked).toBe(false);
  });

  it("allows a push when the branch cannot be determined", () => {
    expect(checkCommand("git push", onBranch("")).blocked).toBe(false);
  });

  it("looks up the real branch when none is injected", () => {
    // Outside any repository the branch is unknown, so the push is allowed.
    expect(checkCommand("git push", { cwd: "/" }).blocked).toBe(false);
  });
});

describe("database resets", () => {
  it.each([
    "supabase db reset --linked",
    "supabase db reset --db-url postgres://user@host/db",
    "supabase db reset --db-url=postgres://user@host/db",
    "npx supabase --workdir x db reset --linked",
    `psql "$URL" -c "DROP DATABASE postgres"`,
    `psql -c 'drop schema public cascade'`,
    `echo "DROP DATABASE x" | psql`,
  ])("blocks %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.dbReset);
  });

  it.each([
    `git commit -m "guard: block drop database"`,
    `grep -n "drop schema" docs/SPEC.md`,
    "supabase db reset",
    "supabase start",
    "supabase db push",
    "supabase",
  ])("allows %s", (command) => {
    expect(checkCommand(command, feature).blocked).toBe(false);
  });
});

describe(".env files in the shell", () => {
  it.each([
    "cat .env.local",
    "type .env",
    "Get-Content .env.production",
    "echo KEY=1 > .env.local",
    "echo KEY=1 >.env.local",
    "cp .env.example .env.local",
    "cat ./config/.env.test",
    "cat .env*",
    "cat .e[n]v.local",
    "cat .en?.local",
    "cat .*",
    `Get-Content "C:\\Users\\Some User\\Desktop\\Projects\\Cairn\\.env.local"`,
    "node --env-file=.env.local server.mjs",
    "Get-Content -Path:.env",
  ])("blocks %s", (command) => {
    expect(reasonFor(command)).toContain(REASONS.env);
  });

  it.each([
    "cat .env.example",
    "node --env-file=.env.example server.mjs",
    "git add .gitignore",
    "ls -la",
    "cat environment.md",
  ])("allows %s", (command) => {
    expect(checkCommand(command, feature).blocked).toBe(false);
  });
});

describe("everyday commands", () => {
  it.each([
    "npm run check",
    "npx playwright test",
    `node -e "console.log(1)"`,
    "bash -c",
    "cmd /c echo hi",
    "pwsh -NoProfile",
  ])("allows %s", (command) => {
    expect(checkCommand(command, feature)).toEqual({ blocked: false });
  });

  it("prefixes every block with the hook's name", () => {
    expect(reasonFor("rm -rf x")).toMatch(/^Blocked by Cairn's safety hook: /);
  });
});
