console.log('registering comm')
Jupyter.notebook.kernel.comm_manager.register_target('my_comm_target',

    function(comm, msg) {
        // comm is the frontend comm instance
        // msg is the comm_open message, which can carry data

        console.log(`open message: ${msg}`)

        // Register handlers for later messages:
        comm.on_msg(function(msg) {
            console.log(msg)
            comm.send({'foo': 0});
        });
        comm.on_close(function(msg) {
            console.log('closing comm')
        });

    });