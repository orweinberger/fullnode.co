# fullnode.co (beta)

### Requirements

1. Node.js v0.10.x
2. MongoDB instance
3. joola.io instance (https://github.com/joola/joola.io)
4. Linode.com & DigitalOcean accounts
5. Coinbase account

### How does it work?

1. A visitor to the webpage is presented with a Coinbase button asking him to donate $10
2. Once a payment is sent through, Coinbase will reach out via HTTP to our callback url triggering a new server provision.
3. After the server provision process starts, the visitor will be redirected to another page that will allow him to select a DNS for his new full node
4. If the DNS name is free, it will be set and the visitor will be redirected to the server list page where he can view his new server.
5. Server details will be also pushed to joola.io so we can draw some usage graphs.

### Contribute to this project

A lot of improvements are needed, please feel free to contribute by forking and sending a pull-request.

If you find any bugs or weaknesses in the code, please open a new issue.

If you have any ideas for new features, please create an issue.

### Roadmap

1. Add tests
2. Add more providers

### Buy me a beer

![12idKQBikRgRuZEbtxXQ4WFYB7Wa3hZzhT](http://i.imgur.com/HHQkm9t.png)

12idKQBikRgRuZEbtxXQ4WFYB7Wa3hZzhT
