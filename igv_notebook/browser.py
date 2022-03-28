import json
import random
import os.path

from IPython.display import HTML, Javascript, display
from .file_reader import register_filecomm

def init():

    register_filecomm()

    igv_filepath = os.path.join(os.path.dirname(__file__), 'js/igv.min.js')
    igv_file = open(igv_filepath, 'r')
    igv_js = igv_file.read()
    display(Javascript(igv_js))

    message_filepath = os.path.join(os.path.dirname(__file__), 'js/messageHandler.js')
    file = open(message_filepath, 'r')
    message_js = file.read()
    display(Javascript(message_js))

    nb_filepath = os.path.join(os.path.dirname(__file__), 'js/localNotebookFile.js')
    nbfile = open(nb_filepath, 'r')
    nb_js = nbfile.read()
    display(Javascript(nb_js))

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
        """
        display(HTML("""<div id="%s"></div>""" % (self.igv_id)))

        self._send({
            "id": self.igv_id,
            "command": "createBrowser",
            "data": config
        })

    def load_track(self, config):
        """
        Load a track.  Corresponds to the igv.js Browser function loadTrack (see https://github.com/igvteam/igv.js/wiki/Browser-Control-2.0#loadtrack).

        :param  track: A dictionary specifying track options.  See https://github.com/igvteam/igv.js/wiki/Tracks-2.0.
        :type dict
        """

        # Check for minimal requirements
        if isinstance(config, dict) == False:
            if isinstance(config, str):
                config = {"url": config}
            else:
                raise Exception("load_track parameter must be a dictionary or string")

        self._send({
            "id": self.igv_id,
            "command": "loadTrack",
            "data": config
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

    def _send(self, msg):
        javascript = """window.igv.MessageHandler.on(%s)""" % (json.dumps(msg))
        # print(javascript)
        display(Javascript(javascript))

    def _gen_id(self):
        return 'jb_' + str(random.randint(1, 10000000))
