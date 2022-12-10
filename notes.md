## Development notes

#### Installing into a conda environment:

```bash
conda create -n igv_notebook python=3.9.1
conda activate igv_notebook
conda install pip
conda install jupyter
pip install -e .
```

#### Deploying to pypi

* Bump version number
*  Add version tag
*  Build the archive

```bash
python setup.py sdist bdist_wheel
```
* Upload to test.pypi

```bash
python -m twine upload --repository-url https://test.pypi.org/legacy/ dist/*
```

* Upload to pypi

```bash
python -m twine upload dist/*
```


**Installing from test.pypi**

```bash
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple igv_notebook
```

#### Updating igv.js version

1. Edit VERSION_IGV - enter igv.js version with no line feed.  Visit [npmjs.com](https://www.npmjs.com/package/igv) to find latest version
2. Run ```python updateIGV.py```

