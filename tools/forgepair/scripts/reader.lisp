;;;; Reader check: read each source file form by form and report where the
;;;; reader stops. Catches an unclosed form before the compiler hides it
;;;; behind a misleading style warning.
;;;;
;;;; Usage, from the repository root:
;;;;   sbcl --script scripts/reader.lisp

(pushnew :forgepair *features*)
(load "src/package.lisp")

(dolist (path '("src/package.lisp" "src/domain.lisp" "src/ports.lisp"
                "src/providers.lisp" "src/adapters.lisp"
                "src/application.lisp" "src/entrypoint.lisp"))
  (handler-case
      (with-open-file (s path)
        (loop for form = (read s nil :eof)
              count 1 into n
              until (eql form :eof)
              finally (format t "~&OK   ~A: ~D formas~%" path n)))
    (error (c)
      (format t "~&FAIL ~A: ~A~%" path c))))