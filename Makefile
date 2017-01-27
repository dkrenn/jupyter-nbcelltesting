all: setup

install:
	jupyter-nbextension install ./nbcelltesting --user

setup: install
	jupyter-nbextension enable nbcelltesting/main
	jupyter-nbextension enable nbcelltesting/resources/diff.min
