"""Report the parenthesis balance of every top-level form in a Lisp file.

SBCL reports an unclosed form only as "end of file", with no indication of
which form never closed. This walks the text the way the CL reader does --
skipping strings, character literals such as #\\( and comments -- and prints
one line per closed top-level form, then names any form left open at EOF.

The same class of mistake is what let ACCEPTED and LAST-NOTE read as undefined:
one closing parenthesis too many ended a LET* before the code that used it.

Usage:
    python scripts/balance.py src/application.lisp
"""

import sys


def scan(text):
    """Yield (line, col, kind, depth_after) events for each parenthesis."""
    i = 0
    depth = 0
    line = 1
    col = 0
    n = len(text)
    while i < n:
        ch = text[i]
        col += 1
        if ch == "\n":
            line += 1
            col = 0
            i += 1
            continue
        # A character literal such as #\) or #\space: the next character is
        # part of the name and must not count as a parenthesis.
        if ch == "#" and i + 1 < n and text[i + 1] == "\\":
            j = i + 2
            while j < n and text[j].isalnum():
                j += 1
            col += (j - i) - 1
            i = j
            continue
        if ch == '"':
            i += 1
            while i < n:
                c = text[i]
                if c == "\\":
                    i += 2
                    continue
                if c == "\n":
                    line += 1
                    col = 0
                else:
                    col += 1
                i += 1
                if c == '"':
                    break
            continue
        if ch == ";":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ch == "(":
            if depth == 0:
                yield (line, col, "open", depth)
            depth += 1
        elif ch == ")":
            depth -= 1
            yield (line, col, "close", depth)
            if depth < 0:
                depth = 0
        i += 1
    yield (line, col, "eof", depth)


def main(path):
    text = open(path, encoding="utf-8").read()
    lines = text.split("\n")
    open_at = None
    for line, col, kind, depth in scan(text):
        if kind == "open":
            open_at = line
        elif kind == "close" and depth == 0:
            head = lines[open_at - 1][:50] if open_at else ""
            print("form %4d: closed OK   %s" % (open_at, head))
        elif kind == "eof":
            if depth == 0:
                print("all top-level forms balanced")
            else:
                print("UNTERMINATED: depth %d at EOF, last form started at line %s"
                      % (depth, open_at))
                return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "src/application.lisp"))