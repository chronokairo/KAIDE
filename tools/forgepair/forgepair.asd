(asdf:defsystem "forgepair"
  :description "Two zero-library coding agents that improve one repository together."
  :version "0.1.0"
  :license "MIT"
  :components ((:file "src/package")
               (:file "src/domain")
               (:file "src/ports")
               (:file "src/providers")
               (:file "src/adapters")
               (:file "src/application")))
