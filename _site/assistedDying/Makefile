open:
	open build/doc.pdf

# live recompile, shell-escape needed for tikz diagrams
live:
	latexmk -view=none -shell-escape -pdf -pvc -output-directory=build/ doc.tex

# recursily remove all files (not dirs) in build/ 
clean:
	find build -type f -exec rm {} \;

