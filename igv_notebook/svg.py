from IPython import get_ipython

from IPython.display import update_display, display, SVG, HTML

def register_svgcomm():

    def target_func(comm, opem_msg):

        # Add a callback for received messages.
        @comm.on_msg
        def _recv(msg):

            data = msg['content']['data']
            display_id = data['display_id']
            locus = data['locus']
            svg = data['svg']

            markup = HTML("""<div> <div style="font-size: small;">%s</div> <div style="margin-top:10px;border:solid #ddd;">%s</div></div>""" % (locus, svg))

            update_display(markup, display_id = display_id)

    get_ipython().kernel.comm_manager.register_target('svg', target_func)
