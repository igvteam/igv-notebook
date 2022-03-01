import base64

from ipykernel.comm import Comm


def target_func(comm, opem_msg):

    # Add a callback for received messages.
    @comm.on_msg
    def _recv(msg):

        print('reading data')
        print(msg)
        data = msg['content']['data']
        id = data['id']
        path = data['path']

        with open(path, 'rb') as binary_file:
            if 'start' in data:
                start = int(data['start'])
                end = int(data['end'])
                size = end - start
                binary_file.seek(start)
                binary_file_data = binary_file.read(size)
            else:
                binary_file_data = binary_file.read()
            comm.send({'id': id, 'data': binary_file_data})


def register_filecomm():
    get_ipython().kernel.comm_manager.register_target('file_request', target_func)
