import base64
from IPython import get_ipython

from IPython.display import HTML, Javascript, SVG, display

try:
    import google.colab.output
    IN_COLAB = True
except:
    IN_COLAB = False



def register_svgcomm(display):


    if IN_COLAB:

        def callback(data, start=None, end=None):
            id = data['id']
            svg = data['svg']
            #cache[id] = svg

        google.colab.output.register_callback('svg', callback)

    else:

        def target_func(comm, opem_msg):


            # Add a callback for received messages.
            @comm.on_msg
            def _recv(msg):

                #print(msg)
                data = msg['content']['data']
                #print(data)
                id = data['id']
                svg = data['svg']
                display.update(SVG(svg))


        get_ipython().kernel.comm_manager.register_target('svg', target_func)
