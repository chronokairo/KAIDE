"""Print the running parenthesis depth for each line, from a given line onward.

Use this when a form is balanced overall but a nested construct closes early:
the line where the depth drops below what the surrounding form requires is the
one holding the extra parenthesis.

Usage:
    python scripts/depth.py src/application.lisp 213
"""

import sys


def line_depths(text, first_line):
    """Return [(line_number, depth_before, depth_after, text)] from first_line."""
    out = []
    depth = 0
    for index, line in enumerate(text.split("\n")):
        before = depth
        i = 0
        while i < len(line):
            ch = line[i]
            if ch == "\\" and i + 1 < len(line):
                i += 2
                continue
            if ch == '"':
                i += 1
                while i < len(line):
                    if line[i] == "\\":
                        i += 2
                        continue
                    if line[i] == '"':
                        break
                    i += 1
                i += 1
                continue
            if ch == ";":
                break
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
            i += 1
        out.append((index + 1, before, depth, line))
    return [row for row in out if row[0] >= first_line]


def main(path, first_line):
    text = open(path, encoding="utf-8").read()
    for number, before, after, line in line_depths(text, first_line):
        print("%4d d%2d->%2d | %s" % (number, before, after, line[:72]))


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "src/application.lisp"
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    main(path, start)