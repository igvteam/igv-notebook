# igv.js notebook module

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/igvteam/igv-notebook/main?filepath=examples)   _**Jupyter Notebook**_

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/igvteam/igv-notebook/main?urlpath=lab/tree/examples)  _**JupyterLab**_

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1ebC3QUJiDGNUON34V2O99cGIdc11D3D5?usp=sharing)

============

igv-notebook is a python package which wraps [igv.js](https://github.com/igvteam/igv.js) for embedding in an IPython notebook.
Both Jupyter and Google Colab runtimes are supported. 

### Related projects

Other projects enabling embedding igv.js in notebooks include

* [igv-jupyter](https://github.com/g2nb/igv-jupyter)  (predecessor to igv-notebook)
* [igv-jupyterlab](https://github.com/epi2me-labs/igv-jupyterlab)
* [ipyigv](https://github.com/QuantStack/ipyigv)

The main differences between igv-notebook and these projects are: (1) igv-notebook is a python package, while the 
projects listed above are Jupyter extensions, (2) igv-notebook works with Google Colab, and (3) igv-notebook
supports loading data files from any location on the local or mounted file system when used with Jupyter Notebook or 
Google Colab.


### Examples

Example notebooks are available in the github repository, and can be run from the Binder and Colab links above. 
To download examples without cloning the repository use this 
[link](https://github.com/igvteam/igv.js-jupyter/archive/master.zip). Notebooks are available in the
"examples" directory.

### Usage

Typical usage proceeds as follow

1. Install igv-notebook
2. Initialize igv-notebook
3. Create igv "browser" object
4. Add tracks to browser 
5. Navigate to loci of interest

### Installation

```bash
pip install igv-notebook
```

### Initialization

After installing import and intialize igv_notebook as follows. 

```python
import igv_notebook
igv_notebook.init()
```
For a Jupyter notebook this should be done once per notebook.   Colab notebooks display output in a sandboxed iFrame 
for each cell, so these steps must be repeated for each cell in which  igv-notebook is used.


### URLS and paths

Configuration objects for igv.js have properties to specify URLs to files for data and indexes.  These properties are 
supported in igv-notebook, however igv-notebook also provides equivalent ```path``` properties for specfiying paths to 
local files when used with Jupyter Notebook or Colab.  (_**Note**_: The ```path``` properties cannot be used with JupyterLab, however local files can
be loaded by URL).  The ```path``` properties are useful for

1. Loading data in a Colab notebook from the local Colab file system or a mounted Google Drive
1. Loading data in Jupyter Notebook from the local file system that is outside the Jupyter file tree. 

**URL and Path properties**
| igv.js url property  | igv-notebook path property |
| --------- | ----------- |
 | url  | path |
 | indexURL | indexPath |
 | fastaURL | fastaPath |
 | cytobandURL | cytobandPath |
 | aliasURL | aliasPATH | 


For Jupyter servers (Notebook and Lab) local files can be also be loaded via the url property if the file is in Jupyter startup directory
tree.  This will usually yield better performance than using ```path``` properties.  URL paths that begin with a "/" are relative to the Jupyter server startup directory, that is the directory from where you started Jupyter Notebook or JupyterLab.  URL paths without a leading slash are assumed to be relative to the notebook directory.  See below for examples.  You can also use the "download url" for the file, obtainable through the JupyterLab UI, as the URL for igv.

### Browser creation

The Browser initializer takes a configuration dictionary which is converted to JSON and passed to the igv.js
createBrowser function. The configuration options are described in the
[igv.js documentation](https://github.com/igvteam/igv.js/wiki/Browser-Configuration-2.0).

**Example:**

```python
b = igv_notebook.Browser(
    {
        "genome": "hg19",
        "locus": "chr22:24,376,166-24,376,456"
    }
)
```



### Tracks

To load a track pass a track configuration object to ```b.load_track()```. Track configuration
objects are described in the [igv.js documentation](https://github.com/igvteam/igv.js/wiki/Tracks-2.0), however
see the note on urls and paths below.The configuration object will be converted to JSON and passed to the igv.js browser instance.

Data for the track can be loaded by URL, file path,  or passed directly as an array of JSON objects.


**Examples:** 

Local file - Jupyter. URL relative to the location of the notebook 

```python
b.load_track(
    {
        "name": "Local BAM",
        "url": "data/gstt1_sample.bam",
        "indexURL": "data/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })

```

Local file - Jupyter.  URL relative to root of Jupyter file tree

```python
b.load_track(
    {
        "name": "Local BAM",
        "url": "/examples/data/gstt1_sample.bam",
        "indexURL": "/examples/data/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })

```

Local file - Jupyter.  Absolute file path, potentially outside the Jupyter file tree.  Note the use of ```path``` and ```indexPath```.

```python
b.load_track(
    {
        "name": "Local BAM",
        "path": "/any_path_you_like/data/gstt1_sample.bam",
        "indexPath": "/any_path_you_like/data/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })

```



Local file - Colab.  In Colab files are loaded by file path.

```python
b.load_track(
    {
        "name": "Local BAM",
        "path": "/content/igv-notebook/examples/data/gstt1_sample.bam",
        "indexPath": "/content/igv-notebook/examples/data/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })
```

Remote file - Jupyter.   

```python
b.load_track(
    {
        "name": "BAM",
        "url": "https://s3.amazonaws.com/igv.org.demo/gstt1_sample.bam",
        "indexURL": "https://s3.amazonaws.com/igv.org.demo/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })

```



### Navigation

Jump to a specific genomic range

```python
b.search('chr1:3000-4000')

```

Jump to a specific gene. This uses the IGV search web service, which currently supports a limited number of 
[genomes](https://s3.amazonaws.com/igv.org.genomes/genomes.json).  To customize the search load a non-indexed annotation
track with the "searchable" property set to true (see [igv.js documentation](https://github.com/igvteam/igv.js/wiki/Annotation-Track#configuration-options)).


```python
b.search('myc')

```

Zoom in by a factor of 2

```python
b.zoom_in()
```

Zoom out by a factor of 2

```python
b.zoom_out()
```




### Development 

requires python >= 3.6.4

```bash
pip install -e .
```

Build 
```bash
python setup.py build  
```
