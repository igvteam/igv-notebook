# igv.js notebook module

[![Binder](https://beta.mybinder.org/badge.svg)](https://mybinder.org/v2/gh/igvteam/igv-notebook/main?filepath=examples)
=======
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1ebC3QUJiDGNUON34V2O99cGIdc11D3D5?usp=sharing)
=======

igv-notebook is a package which wraps [igv.js](https://github.com/igvteam/igv.js) for embedding in an IPython notebook.
Both Jupyter Notebook and Google Colab runtimes are supported. The package will work in JupyterLab if all data file paths 
are specified as absolute https URLs.  To use relative URLs or paths to local files see one of following JupyterLab 
"extension" projects.
 
*  [igv-jupyter](https://github.com/g2nb/igv-jupyter)  
*  [igv-jupyterlab](https://github.com/epi2me-labs/igv-jupyterlab)

``  

#### Examples

Example notebooks are available in the github repository. To download without cloning the repository use 
this [link](https://github.com/igvteam/igv.js-jupyter/archive/master.zip). Notebooks are available in the
"examples" directory.

## Usage

Typical usage proceeds as follow

1. Install igv-notebook
2. Initialize igv-notebook
3. Create igv "browser" object
4. Add tracks to browser 
5. Navigate to loci of interest

### Installation

```bash
pip install git+https://github.com/igvteam/igv-notebook.git
```

### Initialization

After installing intialize igv_notebook as follows.  For a Jupyter notebook this should be done once per notebook.  
Colab notebooks display output in a sandboxed iFrame for each cell, so these steps must be repeated for each cell in which 
igv-notebook is used.

**Example:**

```python
import igv_notebook
igv_notebook.init()
```

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
objects are described in the [igv.js documentation](https://github.com/igvteam/igv.js/wiki/Tracks-2.0).
The configuration object will be converted to JSON and passed to the igv.js browser instance.

Data for the track can be loaded by URL, file path,  or passed directly as an array of JSON objects.

**Examples:** 

Local file - Jupyter.   The paths are relative to the location of the notebook 

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

Local file - Colab.  

```python
b.load_track(
    {
        "name": "Local BAM",
        "url": "/content/igv-notebook/examples/data/gstt1_sample.bam",
        "indexURL": "/content/igv-notebook/examples/data/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })
```

URL

```python
b.load_track(
    {
        "name": "Segmented CN",
        "url": "https://data.broadinstitute.org/igvdata/test/igv-web/segmented_data_080520.seg.gz",
        "format": "seg",
        "indexed": False
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
