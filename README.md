# jupyter-nbcelltesting


An extension for testing whether the output of a cell in a Jupyter notebook has changed
(meaning if it is different from a previously saved desired output).

## Installation

### From this repository

After cloning this repository, the required JavaScript dependencies have to be
installed with the help of `npm`:

```
 $ npm install
```

Afterwards, the extension has to be installed an enabled for your jupyter-notebook.
To do so, you have two options:

1. Automatically via our `install-nbextension` script for `npm` by calling
  ```
   $ npm run install-nbextension
  ```
  Note that when following this approach, you can configure the level to which the
  extension should be installed with the environment variable `$PYFLAG`, which can
  be set to
  - `--user` to install into the user's home Jupyter directories
  - `--system` to install into the system-wide Jupyter directories
  - `--sys-prefix` to install into Python's `sys.prefix` (useful e.g. for virtualenvs)
  - `--symlink` to symlink this extension instead of copying the files
  - `--debug` for more-verbose output

  For example,
  ```
   $ PYFLAG=--user npm run install-nbextension
  ```
  installs the extension into the user's home Jupyter directory.

2. Manually via `jupyter-nbextension install / enable`. You have to install and
   then enable the extension via
   ```
    $ jupyter-nbextension install path/to/nbcelltesting/
    $ jupyter-nbextension enable nbcelltesting/main
    $ jupyter-nbextension enable nbcelltesting/resources/diff.min
   ```
   See [the Jupyter notebook documentation](http://jupyter-notebook.readthedocs.io/en/latest/extending/frontend_extensions.html?highlight=nbextension#installing-and-enabling-extensions)
   for more information.

## Using the extension

After successfully installing the extension, fire up the notebook server (`jupyter-notebook`), open a file and
select `Cell Testing` from the CellToolbar dropdown menu (`View > Cell Toolbar > Cell Testing`).

Congratulations, you are now using the `celltesting`-extension!
