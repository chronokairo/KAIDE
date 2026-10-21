;;;; Compile every source file and report every warning by condition class, so
;;;; no warning reaches the console as decoration. This repo treats a warning
;;;; as a defect: the target is zero.
;;;;
;;;; Usage, from the repository root:
;;;;   sbcl --script scripts/lint.lisp
;;;;
;;;; Output goes to a temporary directory; nothing is written inside the repo.

(pushnew :forgepair *features*)
(load "src/package.lisp")
(in-package :forgepair)

(defparameter *warnings* 0)
(defparameter *out-dir* (merge-pathnames "forgepair-lint/" (user-homedir-pathname)))

(ensure-directories-exist *out-dir*)

(handler-bind ((warning
                 (lambda (condition)
                   (incf *warnings*)
                   (format t "~&WARN ~A: ~A~%"
                           (type-of condition) condition))))
  (dolist (path '("src/package.lisp" "src/domain.lisp" "src/ports.lisp"
                  "src/providers.lisp" "src/adapters.lisp"
                  "src/application.lisp" "src/entrypoint.lisp"))
    (let ((before *warnings*))
      (compile-file path
                    :output-file (merge-pathnames
                                  (format nil "lint-~A.fasl" (pathname-name path))
                                  *out-dir*)
                    :verbose nil :print nil)
      (format t "~&--- ~A: ~D warning(s)~%" path (- *warnings* before)))))

(format t "~&total de warnings: ~D~%" *warnings*)

(when (plusp *warnings*)
  (sb-ext:exit :code 1))