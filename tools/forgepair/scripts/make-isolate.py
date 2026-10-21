"""Copy run-session into a throwaway file with its collaborators stubbed.

A warning about that one function is otherwise easy to mistake for a warning
about the whole file. Isolating it is what proved the ACCEPTED / LAST-NOTE
scope bug was real rather than a misread diagnostic.

The generated file sits in the repository root and is not part of the build;
delete it after use.

Usage:
    python scripts/make-isolate.py
"""

import sys

TARGET = "src/application.lisp"
OUTPUT = "isolate-run-session.lisp"

STUB = '''(in-package :forgepair)
(defvar *root* (merge-pathnames "" (truename "/")))
(defvar *runtime* *root*)
(defparameter *max-executor-attempts* 3)
(defparameter *mock-step* 0)
(defun slurp (p) "")
(defun user-prompt (p) "r")
(defun verify-command (c) "")
(defun notes-text (p) "")
(defun run-executor (&rest a) (values "m" "o"))
(defun verify-conformance (&rest a) (values nil "note"))
(defun session-event (&rest a) nil)
(defun render-turn (&rest a) nil)
(defun tail-of (a b) "")
(defun trim (a) a)
'''


def main():
    src = open(TARGET, encoding="utf-8").read()
    index = src.index("(defun run-session")
    body = src[index:]
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(STUB + "\n" + body)
    print("wrote %s with run-session only" % OUTPUT)


if __name__ == "__main__":
    sys.exit(main())