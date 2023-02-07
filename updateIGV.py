'''
Script to update the igv.js version.
* Set version in igv_notebook/VERSION_IGV
* Run this script
'''

import requests

with open('igv_notebook/VERSION_IGV') as version_file:
    version = version_file.read().strip()

remote_url = "https://cdn.jsdelivr.net/npm/igv@" + version + "/dist/igv.min.js"

# Define the local filename to save data
local_file = 'igv_notebook/js/igv.min.js'

# Download igv.js
igvjs = requests.get(remote_url)

# Replace the UMD magic with a window global definition.  The UMD header is produced by rollup, this might need to be
# modified if rollup changes, but the basic idea is to assign the value returned by the factory function to "window.igv".

tmp = igvjs.text.replace(
    'function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).igv=e()}',
    'function (global, factory) {window.igv = factory()}', 1)

# Save file data to local copy
with open(local_file, 'w') as file:
    file.write(tmp)


