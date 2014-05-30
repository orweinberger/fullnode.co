# fullnode.co (alpha)

This repository is the backend behind http://fullnode.co

### Requirements

1. Node.js v0.10.x
2. MongoDB instance
3. joola.io instance (https://github.com/joola/joola.io)
4. Linode.com account
5. Coinbase account

### How does it work?

1. The visitor is able to choose a name for his server
2. If the DNS is available, he will be opted to click the 'Pay with Bitcoin' coinbase button
3. Once the payment is done ($20) the app will get a callback from Coinbase that a payment was made along with the requested DNS name
4. The app will then start the provisioning process which also includes the setup of the new DNS record.
5. Once done, all data will be pushed to a joola.io instance. This will allow us to update the charts/tables on the website in real-time with the creation of the new server.


### Contribute to this project

A lot of improvements are needed, please feel free to contribute by forking and sending a pull-request.

If you find any bugs or weaknesses in the code, please open a new issue.

If you have any ideas for new features, please create an issue.

### Roadmap

1. Add more providers, namely DigitalOcean and possibly Vultr
2. Add tests
3. Generate an address per visitor instead of one pool. This will allow cool features such as donating money to provision a node and allowing the donor to specify a unique DNS record such as reddit.fullnode.co. If we keep all BTC under one address it will make it very difficult to achieve this specific feature.


### Buy me a beer

![12idKQBikRgRuZEbtxXQ4WFYB7Wa3hZzhT](http://i.imgur.com/HHQkm9t.png)

12idKQBikRgRuZEbtxXQ4WFYB7Wa3hZzhT
