build:
	jshint js/glower.js
	uglifyjs js/glower.js > js/glower.min.js

clean:
	rm js/glower.min.js

.PHONY: clean build
