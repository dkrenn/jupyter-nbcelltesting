jupyter-nbcelltesting
=====================

An extension for testing whether the output of a cell in a Jupyter notebook has changed
(meaning if it is different from a previously saved desired output).

Installation
------------

After cloning this repository, the notebook extension has to be
installed and enabled via

```
  $ git clone https://github.com/dkrenn/jupyter-nbcelltesting.git

  $ jupyter-nbextension install jupyter-nbcelltesting/nbcelltesting --user

  $ cd jupyter-nbcelltesting
  $ npm install diff

  $ jupyter-nbextension enable nbcelltesting/main
  $ jupyter-nbextension enable nbcelltesting/resources/diff.min
```

After doing so, fire up the notebook server (`jupyter-notebook`), open a file and
select `Cell Testing` from the CellToolbar dropdown menu (`View > Cell Toolbar > Cell Testing`).
