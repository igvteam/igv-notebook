import base64
from IPython import get_ipython

from IPython.display import update_display, display, SVG

try:
    import google.colab.output
    IN_COLAB = True
except:
    IN_COLAB = False



def register_svgcomm():


    if IN_COLAB:

        def callback(display_id, svg):
            update_display(SVG(svg), display_id = display_id, clear=True)

        google.colab.output.register_callback('ToSVG', callback)

    else:

        def target_func(comm, opem_msg):

            # Add a callback for received messages.
            @comm.on_msg
            def _recv(msg):

                data = msg['content']['data']
                display_id = data['display_id']
                svg = data['svg']
                update_display(SVG(svg), display_id = display_id, clear=True)


        get_ipython().kernel.comm_manager.register_target('svg', target_func)
