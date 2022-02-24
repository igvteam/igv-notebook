# igv.js notebook module

[![Binder](https://beta.mybinder.org/badge.svg)](https://mybinder.org/v2/gh/igvteam/igv-notebook/main?filepath=examples)
=======

igv-notebook is a package which wraps [igv.js](https://github.com/igvteam/igv.js) for embedding in an IPython notebook.  


### Development

Requirements:
* python >= 3.6.4

#### Creating a conda environment:
```bash
conda create -n igv_notebook python=3.9.1
conda activate igv_notebook
conda install pip
conda install jupyter
```

#### Build and install from source:

```bash
python setup.py build  
pip install -e .
```






