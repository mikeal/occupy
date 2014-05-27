# Occupy

Simple deployer for the 99% use case.

# Usage

Run the occupy service on your server.

`node server.js`

No other configuration is necessary assuming that your ssh key is in authorized_keys on that server and your application is built to be run with either `node server.js` or `npm start`.

On your local machine enter the working directory of your application and run the cli.

`occupy http://myserver.com`

The output in your console will show you the deploy status and then the stdout and stderr output from the remote server. This will stay open until you `ctrl-c` so you can debug it as long as you wish.
