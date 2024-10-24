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

#### Updating igv.js 

1. Clone the [igv.js project](https://github.com/igvteam/igv.js)
2. Run `npm run build_iife`.  See the igv.js README for further build instructions
3. Copy `dist/igv.iife.js` from the igv.js repository to `igv_notebook/js/igv.iife.js`
4. Replace "var igv=" with "window.igv=" at start of file



