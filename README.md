# fullnode.co (alpha)

This repository is the backend behind http://fullnode.co

### Requirements

1. Node.js v0.10.x
2. MongoDB instance
3. joola.io instance (https://github.com/joola/joola.io)
4. Linode.com account
5. Blockchain.info wallet account

### How does it work?

1. Every X seconds (defined in the config) the script will run two functions, `run()` and `queue()`.
2. The `queue()` function checks the hot wallet for the current balance. If the current balance is enough to fund a new server it will add a server to the queue and it will also add a transaction to a queue to transfer the BTC from the hot wallet to the cold wallet.
3. The `run()` function will check the queue for any unattended items and will provision new servers and will actually move the coins between wallets.
4. A lot of logging is currently going to the console, this is to debug any issues (hey, we're still in alpha).

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
