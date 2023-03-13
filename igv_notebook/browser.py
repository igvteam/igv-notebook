import json
import random
import os.path
import requests

from IPython.display import HTML, Javascript, display
from .file_reader import register_filecomm
from .svg import register_svgcomm

_igv_version = None

def init(version = None):
    global _igv_version
    register_filecomm()
    register_svgcomm()

    if version is None:
        igv_filepath = os.path.join(os.path.dirname(__file__), 'js/igv.min.js')
        igv_file = open(igv_filepath, 'r')
        igv_js = igv_file.read()
    else:
        _igv_version = version
        igv_js = download_igv(version)
    display(Javascript(igv_js))

    message_filepath = os.path.join(os.path.dirname(__file__), 'js/messageHandler.js')
    file = open(message_filepath, 'r')
    message_js = file.read()
    display(Javascript(message_js))

    nb_filepath = os.path.join(os.path.dirname(__file__), 'js/localNotebookFile.js')
    nbfile = open(nb_filepath, 'r')
    nb_js = nbfile.read()
    display(Javascript(nb_js))

def igv_version():
    global _igv_version
    if _igv_version is None:
        filepath = os.path.join(os.path.dirname(__file__), 'VERSION_IGV')
        with open(filepath) as version_file:
            _igv_version = version_file.read().strip()
    return _igv_version


class Browser(object):

    # Always remember the *self* argument
    def __init__(self, config):

        """Initialize a python Browser object for communicating with a igv.js javascript Browser object
        :param: config - A dictionary specifying the browser configuration.  This will be converted to JSON and passed
                to "igv.createBrowser(config)" as described in the igv.js documentation.
        :type dict
        """

        id = self._gen_id()
        config["id"] = id
        self.igv_id = id

        """
        Create an igv.js "Browser" instance on the front end.
        Retain a DisplayHandle for later updates (e.g. to convert browser to SVG)
        """
        self.d = display(HTML("""<div id="%s"></div>""" % (self.igv_id)), display_id=id)

        self._send({
            "id": self.igv_id,
            "command": "createBrowser",
            "data": config
        })

    def load_session(self,session=None, url=None, path=None ):

        """
        Load a session.  Corresponds to the igv.js Browser function loadSession (see https://github.com/igvteam/igv.js/wiki/Browser-Control-2.0#loadtrack).
        :param url: A url to na igv session file
        :param path: A local file path to an igv session file
        :param json: A dictionary representing an igv session object
        :return:
        """

       # Check for minimal requirements
       # if isinstance(config, dict) == False:
       #     if isinstance(config, str):
       #         config = {"url": config}
       #     else:
       #         raise Exception("load_track parameter must be a dictionary or url (string) to a track data file")


        if path is not None:
            with open(path) as user_file:
                session = json.load(user_file)

        elif url is not None:
            session = requests.get(url).json()

        if session is not None:
            self._send({
                "id": self.igv_id,
                "command": "loadSession",
                "data": session
            })



    def load_track(self, config):
        """
        Load a track.  Corresponds to the igv.js Browser function loadTrack (see https://github.com/igvteam/igv.js/wiki/Browser-Control-2.0#loadtrack).

        :param  config: A dictionary specifying track options.  See https://github.com/igvteam/igv.js/wiki/Tracks-2.0.
        :type dict
        """

        # Check for minimal requirements
        if isinstance(config, dict) == False:
            if isinstance(config, str):
                config = {"url": config}
            else:
                raise Exception("load_track parameter must be a dictionary or url (string) to a track data file")

        self._send({
            "id": self.igv_id,
            "command": "loadTrack",
            "data": config
        })



    def load_roi(self, config):
        """
        Load regions of interest.  Corresponds to the igv.js Browser function loadROI (see https://github.com/igvteam/igv.js/wiki/Browser-API-2.0#loadroiconfigorarray).

        :param  config: A dictionary specifying a set of ROIs as a track of type 'annotation'.  See https://github.com/igvteam/igv.js/wiki/Tracks-2.0.
        :type dict
        """

        # Check for minimal requirements
        if isinstance(config, dict) == False and isinstance(config, list) == False:
            if isinstance(config, str):
                config = {"url": config}
            else:
                raise Exception("load_track parameter must be a dictionary, list of dictionaries, or url (string) to an annotation file")

        self._send({
            "id": self.igv_id,
            "command": "loadROI",
            "data": config
        })

    def clear_rois(self):
        self._send({
            "id": self.igv_id,
            "command": "clearROIs"
        })


    def search(self, locus):
        """
        Go to the specified locus.

        :param locus:  Chromosome location of the form  "chromsosome:start-end", or for supported genomes (hg38, hg19, and mm10) a gene name.
        :type str

        """

        self._send({
            "id": self.igv_id,
            "command": "search",
            "data": locus
        })

    def zoom_in(self):
        """
        Zoom in by a factor of 2
        """

        self._send({
            "id": self.igv_id,
            "command": "zoomIn"
        })

    def zoom_out(self):
        """
        Zoom out by a factor of 2
        """
        self._send({
            "id": self.igv_id,
            "command": "zoomOut"
        })

    def to_svg(self):
        self._send({
            "id": self.igv_id,
            "command": "toSVG",
            "data": self.igv_id
        })

    def _send(self, msg):
        javascript = """window.igv.MessageHandler.on(%s)""" % (json.dumps(msg))
        # print(javascript)
        display(Javascript(javascript))

    def _gen_id(self):
        return 'jb_' + str(random.randint(1, 10000000))


def download_igv(version):

    remote_url = "https://cdn.jsdelivr.net/npm/igv@" + version + "/dist/igv.min.js"

    igvjs = requests.get(remote_url)

    # Replace the UMD magic with a window global definition.  The UMD header is produced by rollup, this might need to be
    # modified if rollup changes, but the basic idea is to assign the value returned by the factory function to "window.igv".
    return igvjs.text.replace(
        'function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).igv=e()}',
        'function (global, factory) {window.igv = factory()}', 1)

