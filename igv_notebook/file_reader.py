import base64
from IPython import get_ipython

try:
    import google.colab.output
    IN_COLAB = True
except:
    IN_COLAB = False

def read_file(path, start=None, end=None):

    with open(path, 'rb') as binary_file:
        if start != None:
            size = end - start
            binary_file.seek(start)
            binary_file_data = binary_file.read(size)
        else:
            binary_file_data = binary_file.read()
    return binary_file_data



def register_filecomm():

    if IN_COLAB:

        def callback(path, start=None, end=None):
            if start != None:
                start = int(start)
            if end != None:
                end = int(end)
            binary_file_data = read_file(path, start, end)
            return base64.b64encode(binary_file_data)
            #return binary_file_data

        google.colab.output.register_callback('ReadFile', callback)

    else:

        def target_func(comm, opem_msg):

            # Add a callback for received messages.
            @comm.on_msg
            def _recv(msg):

                print('reading data')
                print(msg)
                data = msg['content']['data']
                id = data['id']
                path = data['path']

                if 'start' in data:
                    start = int(data['start'])
                    end = int(data['end'])
                    size = end - start
                    binary_file_data = read_file(path, start, end)
                else:
                    binary_file_data = read_file(path)
                comm.send({'id': id, 'data': binary_file_data})

        get_ipython().kernel.comm_manager.register_target('file_request', target_func)
