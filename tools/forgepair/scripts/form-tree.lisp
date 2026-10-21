;;;; Print the shape of one top-level form: its body forms, and the bindings of
;;;; any LET or LET* at the top. This answers "what did the reader actually
;;;; produce", which is the question a paren mistake leaves open.
;;;;
;;;; Usage, from the repository root:
;;;;   sbcl --eval '(pushnew :forgepair *features*)' \
;;;;        --eval '(load "src/package.lisp")' \
;;;;        --eval '(load "scripts/form-tree.lisp")' --quit
;;;;
;;;; Set *form-tree-target* to the function to inspect.

(pushnew :forgepair *features*)
(load "src/package.lisp")
(in-package :forgepair)

(defparameter *form-tree-target* 'run-session)

(defun indent (depth)
  (make-string (* 2 depth) :initial-element #\Space))

(defun outline (form depth)
  (when (consp form)
    (let ((op (car form)))
      (cond
        ((member op '(let let*))
         (format t "~&~A~A bindings: ~{~S~^ ~}"
                 (indent depth) op (mapcar #'car (second form)))
         (dolist (body (cddr form))
           (outline body (1+ depth))))
        ((eq op 'loop)
         (format t "~&~Aloop~%" (indent depth))
         (dolist (body (cdr form))
           (outline body (1+ depth))))
        (t
         (format t "~&~A~A~%" (indent depth) op)
         (dolist (body (cdr form))
           (outline body (1+ depth))))))))

(defun form-tree (path name)
  (with-open-file (stream path)
    (loop for form = (read stream nil :eof)
          until (eql form :eof)
          when (and (consp form)
                    (eq (car form) 'defun)
                    (eq (second form) name))
            do (progn
                 (format t "~&=== ~A in ~A ===~%" name path)
                 (dolist (body (cddr form))
                   (outline body 1))))))

(dolist (path '("src/domain.lisp" "src/providers.lisp" "src/adapters.lisp"
                "src/application.lisp" "src/entrypoint.lisp"))
  (form-tree path *form-tree-target*))