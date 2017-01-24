jupyter-nbcelltesting
=====================

An extension for testing cells in Jupyter notebooks.

Installation
------------

After cloning this repository, the notebook extension has to be
installed and enabled via

```
  $ jupyter-nbextension install jupyter-nbcelltesting/nbcelltesting --user
  $ jupyter-nbextension enable nbcelltesting/main
```

After doing so, fire up the notebook server (`jupyter-notebook`), open a file and
select `Cell Testing` from the CellToolbar dropdown menu (`View > Cell Toolbar > Cell Testing`).