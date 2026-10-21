# scripts

Diagnostics for the Common Lisp sources. Nothing here is part of the runtime
path: `src/entrypoint.lisp` loads only `src/*.lisp`.

Run every check from the repository root.

## Checks that must pass

| Command | What it proves |
| --- | --- |
| `sbcl --noinform --disable-debugger --script src/entrypoint.lisp --self-test` | The behaviour assertions hold. Exit code 0. |
| `sbcl --script scripts/reader.lisp` | Every source file reads to completion; one line per top-level form. |
| `sbcl --script scripts/lint.lisp` | Every file compiles with **zero** warnings. Exits 1 if any appear. |

A warning is a defect here, not decoration. In particular the "assigned but
never read" style warning is how an unbalanced `LET*` announces itself.

## When the reader or the compiler reports end of file

SBCL says only "end of file" and the line where the form started, not which
parenthesis is wrong. These two narrow it down.

```
python scripts/balance.py src/application.lisp
```

Prints one line per top-level form as it closes, then names the form left open
at EOF. It skips strings, comments and character literals such as `#\)`, the
way the CL reader does.

```
python scripts/depth.py src/application.lisp 213
```

Prints the running parenthesis depth per line. Use it when the file balances
overall but a nested construct closes early: the line where the depth drops
below what the surrounding form requires holds the extra parenthesis.

## When a warning names the wrong thing

```
python scripts/make-isolate.py
sbcl --noinform --disable-debugger --eval '(pushnew :forgepair *features*)' \
     --eval '(load "src/package.lisp")' \
     --eval '(compile-file "isolate-run-session.lisp")' --quit
```

Copies `run-session` alone into a throwaway file with its collaborators
stubbed, so a warning about that function cannot be mistaken for one about the
file as a whole. Delete the generated file afterwards.

```
sbcl --eval '(pushnew :forgepair *features*)' \
     --eval '(load "src/package.lisp")' \
     --eval '(load "scripts/form-tree.lisp")' --quit
```

Prints the body forms the reader actually produced for `run-session`, and the
bindings of any `LET`/`LET*` among them. Set `*form-tree-target*` to inspect
another function.

## Note on paths

`lint.lisp` writes its `.fasl` output under `forgepair-lint/` in the home
directory, so a check never leaves build artifacts inside the repository.