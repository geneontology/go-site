;;;;
;;;; Loading this file should prevent accidentally saving a JSON file
;;;; with incorrect syntax.
;;;;

;; This should be in most modern emacs.
(require 'json)

;; Check that the JSON syntax is correct in the current buffer by
;; reading it in and parsing it.
(defun json-current-buffer-syntax-check ()
  "Check the JSON syntax in the current buffer."
  (interactive)
  (condition-case nil
      (if (json-read-from-string (buffer-string)) t nil)))

;; When in JSON mode, add a /local/ before-save-hook that runs our
;; command.
(add-hook 'json-mode-hook
	  (lambda ()
	    (add-hook 'before-save-hook
		      (lambda ()			
			(when (string-match "\\.json$" ; don't need this?
					    (buffer-name (current-buffer)))
			  (json-current-buffer-syntax-check)))
		      nil t)))
