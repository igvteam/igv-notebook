'''
Script to update the igv.js version.
* Set version in igv_notebook/VERSION_IGV
* Run this script
'''

import requests

with open('igv_notebook/VERSION_IGV') as version_file:
    version = version_file.read().strip()

remote_url = "https://cdn.jsdelivr.net/npm/igv@" + version + "/dist/igv.iife.js"

# Define the local filename to save data
local_file = 'igv_notebook/js/igv.min.js'

# Download igv.js
igvjs = requests.get(remote_url)

# Replace the UMD "this" magic with a window global definition.  The UMD header is produced by rollup, this might need to be
# modified if rollup changes, but the basic idea is to assign the value returned by the factory function to "window.igv".

tmp = igvjs.text.replace('var igv','window.igv', 1)

# Save file data to local copy
with open(local_file, 'w') as file:
    file.write(tmp)


