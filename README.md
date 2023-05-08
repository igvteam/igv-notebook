# igv.js notebook module

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/igvteam/igv-notebook/main?filepath=examples)   _**Jupyter Notebook**_

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/igvteam/igv-notebook/main?urlpath=lab/tree/examples)  _**JupyterLab**_

[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1-4P_r07Dq-WxaOVUevlbHvVhC9Y11FWC?usp=sharing)    _**Google Colab**_

[![PyPI](https://img.shields.io/pypi/v/igv-notebook?label=pypi%20package)](https://pypi.org/project/igv-notebook/)

============

igv-notebook is a Python package which wraps [igv.js](https://github.com/igvteam/igv.js) for embedding in an IPython notebook.
Both Jupyter and Google Colab platforms are supported. 

### Related projects

Other projects enabling embedding igv.js in notebooks include

* [igv-jupyter](https://github.com/g2nb/igv-jupyter)  (wrapper around igv-notebook that adds g2nb integration)
* [igv-jupyterlab](https://github.com/epi2me-labs/igv-jupyterlab)
* [ipyigv](https://github.com/QuantStack/ipyigv)

The main differences between igv-notebook and these other projects are: 

* igv-notebook is a Python package, while the projects listed above are Jupyter extensions;
* igv-notebook works with Google Colab, in addition to Jupyter and JupyterLab; and 
* igv-notebook supports loading data files from any location on the local or mounted file system when used with Jupyter Notebook or 
Google Colab.  **_NOTE_**: General local file paths do not work with JupyterLab, for JupyterLab the files must be in the JupyterLab file tree.


### Examples

Example notebooks are available in the github repository, and can be run from the Binder and Colab links above. 
To download examples without cloning the repository use this 
[link](https://github.com/igvteam/igv-notebook/archive/master.zip). Notebooks are available in the
"examples" directory.

## Usage

Typical usage proceeds as follow

1. Install igv-notebook
2. Initialize igv-notebook
3. Create igv "browser" object
4. Add tracks to browser 
5. Navigate to loci of interest

**Installation**

```bash
pip install igv-notebook
```

**Initialization**

After installing, import and intialize igv_notebook as follows. 

```python
import igv_notebook
igv_notebook.init()
```
For a Jupyter notebook this should be done once per notebook.   Colab notebooks display output in a sandboxed iFrame 
for each cell, so initialization must be repeated for each cell in which  igv-notebook is used.
`

### Browser creation

The Browser initializer takes a configuration dictionary which is converted to JSON and passed to the igv.js
createBrowser function. The configuration options are described in the
[igv.js documentation](https://github.com/igvteam/igv.js/wiki/Browser-Configuration-2.0).

**Example:**

```python
import igv_notebook
igv_notebook.init()
igv_browser= igv_notebook.Browser(
    {
        "genome": "hg19",
        "locus": "chr22:24,376,166-24,376,456",
        "tracks": [{
            "name": "BAM",
            "url": "https://s3.amazonaws.com/igv.org.demo/gstt1_sample.bam",
            "indexURL": "https://s3.amazonaws.com/igv.org.demo/gstt1_sample.bam.bai",
            "format": "bam",
            "type": "alignment"
        }],
        "roi": [
            {
                "name": "ROI set 1",
                "url": "https://s3.amazonaws.com/igv.org.test/data/roi/roi_bed_1.bed",
                "indexed": False,
                "color": "rgba(94,255,1,0.25)"
            }
        ]
    }
)
```

### URLS and paths

Configuration objects for igv.js have properties to specify URLs to files for data and indexes.  These properties are 
supported in igv-notebook, however igv-notebook also provides equivalent ```path``` properties for specfiying paths to 
local files when used with Jupyter Notebook or Colab.  (_**Note**_: The ```path``` properties cannot be used with JupyterLab, however local files can
be loaded by URL if they are in the Jupyter file tree).  The ```path``` properties are useful for:

* loading data in a Colab notebook from the local Colab file system or a mounted Google Drive; and
* loading data in Jupyter Notebook from the local file system that is outside the Jupyter file tree. 

**URL and Path properties**
| igv.js url property  | igv-notebook path property |
| --------- | ----------- |
 | url  | path |
 | indexURL | indexPath |
 | fastaURL | fastaPath |
 | cytobandURL | cytobandPath |
 | aliasURL | aliasPath | 


For Jupyter servers (Notebook and Lab), local files can be also be loaded via the url property if the file is in the Jupyter 
startup directory tree.  This will usually yield better performance than using ```path``` properties.  URL paths 
that begin with a "/" are relative to the Jupyter server startup directory, i.e. the directory from where you 
started Jupyter Notebook or JupyterLab.  For Jupyter Notebook, URL paths without a leading slash can be used and are 
assumed to be relative to the notebook  directory.  See below for examples.  You can also use the "download url" for 
the file, obtainable through the JupyterLab UI, as the URL for igv.

### Tracks

To load a track, pass a track configuration object to ```igv_browser.load_track()```. Track configuration
objects are described in the [igv.js documentation](https://github.com/igvteam/igv.js/wiki/Tracks-2.0), however
see the note on _URLs and paths_ above. The configuration object will be converted to JSON and passed to the igv.js browser instance.

Data for the track can be loaded by URL, file path, or passed directly as an array of JSON objects.


**Examples:** 

Local file - Jupyter. URL relative to the location of the notebook 

```python
igv_browser.load_track(
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
igv_browser.load_track(
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
igv_browser.load_track(
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
igv_browser.load_track(
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
igv_browser.load_track(
    {
        "name": "BAM",
        "url": "https://s3.amazonaws.com/igv.org.demo/gstt1_sample.bam",
        "indexURL": "https://s3.amazonaws.com/igv.org.demo/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })

```


### API

Most IGV options can be specified in the initial browser configuration, including specifying genome, locus, tracks, and regions-of-interest.  Additional methods are provided to perform actions on the browser post-creation.  These are described below

#### Load a track**

To load a track

```
igv_browser.load_track(track_config)
```

See example track configurations above.   Also [igv.js  wiki](https://github.com/igvteam/igv.js/wiki/Tracks-2.0)


Example:

```python
igv_browser.load_track(
    {
        "name": "Local BAM",
        "url": "data/gstt1_sample.bam",
        "indexURL": "data/gstt1_sample.bam.bai",
        "format": "bam",
        "type": "alignment"
    })

```

#### Load regions of interest**  (version >= 0.4.0)

Regions-of-interest are overlays marking genomic ranges of interest.  They are defined by track configurations, often backed by a "bed" file, and usually with a translucent color.  These can be specified at browser creation with the "roi" property, or loaded afterwards with the ```loadROIs`` function.  This function takes an array of track configuration objects.   See the notebook examples/ROI.ipynb for example usage.

```
igv_browser.loadROIs([roi_configs])
```


#### Navigation

Jump to a specific genomic range

```python
igv_browser.search('chr1:3000-4000')

```

Jump to a specific gene. This uses the IGV search web service, which currently supports a limited number of 
[genomes](https://s3.amazonaws.com/igv.org.genomes/genomes.json).  To customize the search, load a non-indexed annotation
track with the "searchable" property set to true (see [igv.js documentation](https://github.com/igvteam/igv.js/wiki/Annotation-Track#configuration-options)).


```python
igv_browser.search('myc')

```

Zoom in by a factor of 2

```python
igv_browser.zoom_in()
```

Zoom out by a factor of 2

```python
igv_browser.zoom_out()
```

### SVG conversion - Jupyter Notebook only

To convert the current igv view to a static SVG image 

```python
igv_browser.to_svg()
```

This action can also be invoked with the "To SVG" button on the igv.js command bar.  This is useful when converting 
the notebook to formats such as HTML and PDF.  


**Note: This action is not reversible.**


#### Version

To verify the currently installed igv-notebook version (versions >= 0.3.1 only)

```python
igv_notebook.version()
```

To verify the current version of igv.js (igv-notebook versions >= 0.4.0 only)

```python
igv_notebook.igv_version()
```

## Development 

requires python >= 3.9.1

### Development install

```bash
pip install -e .
```

### Build 
```bash
python setup.py build  
```

### Updating igv.js version

1. Edit VERSION_IGV - enter igv.js version with no line feed.  Visit [npmjs.com](https://www.npmjs.com/package/igv) to find latest version
2. Run ```python updateIGV.py``` 

## Release Notes

**0.5.1**

* Update igv.js version to 2.15.7

**0.5.0**

* Add support for loading an igv session
* Generate links to igv-web

**0.4.5**

* Fix path/url problems when using JupyterLab

**0.4.4**

* Add missing requirements to setup.py
* Update igv.js version to 2.13.10

**0.4.3**

* Fix file-not-found error with version() and igv_version() functions

**0.4.1**

* Update documentation

**0.4.0**

* Add support for regions-of-interest
* Add ```igv_notebook.igv_version()``` function.

**0.3.1**

* Update ```browser.to_svg()``` function to support Python 3.6.
* Add ```igv_notebook.version()``` function.

**0.3.0**

* Add ```browser.to_svg()``` function to convert igv instance to static SVG image (Jupyter Notebook only).

