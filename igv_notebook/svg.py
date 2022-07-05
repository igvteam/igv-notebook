from IPython import get_ipython

from IPython.display import update_display, SVG

def register_svgcomm():

    def target_func(comm, opem_msg):

        # Add a callback for received messages.
        @comm.on_msg
        def _recv(msg):

            data = msg['content']['data']
            display_id = data['display_id']
            svg = data['svg']
            update_display(SVG(svg), display_id = display_id, clear=True)

    get_ipython().kernel.comm_manager.register_target('svg', target_func)
