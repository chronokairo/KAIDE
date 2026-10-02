;;;; Forgepair package and shared runtime state.
;;;;
;;;; A PATH-installed Forgepair is started from any directory, so "where this
;;;; program lives" (*root*) and "what it is working on" (*project-root*) are
;;;; different places. Confusing the two is why a globally installed agent ends
;;;; up editing its own installation: it reads the install directory's config.sexp,
;;;; .env and AGENTS.md and ignores the project it was invoked in.

(defpackage :forgepair
  (:use :cl)
  (:export :run-entrypoint))
(in-package :forgepair)

(defparameter *root*
  (namestring
   (truename
    (merge-pathnames "../"
                     (make-pathname :name nil :type nil :defaults *load-truename*)))))

(defparameter *work-dir* (namestring (truename "."))
  "The directory the binary was opened in: the folder the executor may edit.")

(defun project-marker-p (directory)
  "True when DIRECTORY, a pathname, holds a marker that makes it a project root.
.forgepair is Forgepair's own runtime directory, .git is git's, config.sexp is
ours, AGENTS.md is an agent rules file."
  (not (null (member-if (lambda (marker) (probe-file (merge-pathnames marker directory)))
                       '(".git/" ".forgepair/" "config.sexp" "AGENTS.md")))))

(defun resolve-project-root (&optional (start *work-dir*))
  "Walk up from START until a directory with a project marker is found, the way
git looks for .git and npm for package.json. Falls back to START when no marker
exists anywhere above it, so a bare directory is still a usable project."
  (let ((origin (or (handler-case (truename start) (error () nil))
                    (truename *default-pathname-defaults*))))
    (loop with current = origin
          for components = (pathname-directory current)
          do (when (or (null components) (< (length components) 1))
               (return (namestring origin)))
             (let ((directory (make-pathname :directory components :defaults origin)))
               (when (project-marker-p directory)
                 (return (namestring directory))))
          do (setf current (make-pathname :directory (butlast components)
                                          :defaults origin)))))

(defparameter *project-root* (resolve-project-root *work-dir*)
  "Nearest ancestor of *work-dir* carrying a project marker. Subdirectories of a
project resolve to the project itself, so running the agent in src/ still edits
the whole repository.")

(defparameter *runtime* (merge-pathnames ".forgepair/runtime/" *project-root*)
  "Scratch space for this run. It lives in the project, not in the installation:
the install directory may be read-only and is shared by every project.")

(defun blank-trim (text)
  "Whitespace trim for this file only. domain.lisp defines the general TRIM, but
domain.lisp is loaded after package.lisp and *CACHE-DIR* needs it at load time."
  (string-trim '(#\Space #\Tab #\Return #\Newline) text))

(defun environment-value (name)
  "Value of environment variable NAME, or NIL. Reading a variable's presence is
not the same as reading a credential's value, and nothing here does the latter."
  (let ((value (ignore-errors (sb-ext:posix-getenv name))))
    (when (and value (> (length (blank-trim value)) 0)) (blank-trim value))))

(defun user-cache-dir ()
  "Per-user cache root: %LOCALAPPDATA% on Windows, ~/.cache elsewhere, following
the same convention npm uses for its cache."
  (let ((local (environment-value "LOCALAPPDATA")))
    (if local
        (merge-pathnames "forgepair/" (pathname (concatenate 'string local "/")))
        (merge-pathnames ".cache/forgepair/" (user-homedir-pathname)))))

(defparameter *cache-dir*
  (let ((override (environment-value "FORGEPAIR_CACHE")))
    (if override
        (merge-pathnames (pathname (concatenate 'string override "/")))
        (user-cache-dir)))
  "Where the model catalogue is cached between runs. FORGEPAIR_CACHE overrides it.")

(defun config-search-path (&optional (dir *project-root*))
  "Directories to search for project-owned files, nearest first, ending at the
installation so an unconfigured project still gets working defaults."
  (remove-duplicates (list (merge-pathnames (pathname dir))
                           (merge-pathnames *project-root*)
                           (merge-pathnames (pathname *root*)))
                     :test #'equal))

(defun find-project-file (name &optional (dir *project-root*))
  "First existing NAME among config-search-path, or NIL."
  (loop for base in (config-search-path dir)
        for path = (merge-pathnames name base)
        when (probe-file path) return (namestring path)))

(defun dotenv-paths ()
  ".env locations from least to most specific: the installation first so the
project's own file overrides it, and the project last because that is the one
the user is standing in."
  (remove-duplicates (list (merge-pathnames ".env" *root*)
                           (merge-pathnames ".env" *project-root*))
                     :test #'equal))

;;;; Test support. The self-test needs a real directory to prove that project
;;;; files win over installation files; it must not depend on the CWD it runs in.

(defun temp-area ()
  (or (ignore-errors (sb-ext:posix-getenv "TMPDIR"))
      (ignore-errors (sb-ext:posix-getenv "TEMP"))
      (ignore-errors (sb-ext:posix-getenv "TMP"))
      "/tmp"))

(defun make-temp-project (name)
  "Create and return a throwaway project directory NAME under the temp area."
  (let ((path (merge-pathnames (format nil "forgepair-test-~A/" name)
                              (pathname (concatenate 'string (temp-area) "/")))))
    (ensure-directories-exist path)
    (namestring (truename path))))

(defun write-project-file (directory name text)
  (let ((path (merge-pathnames name (pathname directory))))
    (ensure-directories-exist path)
    (with-open-file (out path :direction :output :if-exists :supersede
                           :if-does-not-exist :create)
      (write-string text out))
    (namestring (truename path))))

(defun delete-directory (path &key (recursive t))
  "Remove PATH and its contents. DELETE-DIRECTORY is not an ANSI Common Lisp
function; SBCL provides it, and this project targets SBCL alone (rule 5: no
runtime libraries beyond the platform)."
  (ignore-errors (sb-ext:delete-directory (pathname path) :recursive recursive)))