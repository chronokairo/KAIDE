;;;; Forgepair package and shared runtime state.

(defpackage :forgepair
  (:use :cl)
  (:export :run-entrypoint))
(in-package :forgepair)

(defparameter *root*
  (namestring
   (truename
    (merge-pathnames "../"
                     (make-pathname :name nil :type nil :defaults *load-truename*)))))
(defparameter *work-dir* (namestring (truename ".")))
(defparameter *runtime* (merge-pathnames ".forgepair/runtime/" *root*))
