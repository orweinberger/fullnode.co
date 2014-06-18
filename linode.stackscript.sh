#!/bin/bash
yum -y update
cd /root
wget https://bitcoin.org/bin/0.9.2/bitcoin-0.9.2-linux.tar.gz
tar zfx bitcoin-0.9.2-linux.tar.gz
cd bitcoin-0.9.2-linux/bin/64
mkdir /root/.bitcoin
wget https://bitcoin.org/bin/blockchain/bootstrap.dat.torrent -P /root/.bitcoin/
echo "rpcuser=rpcuser" >> /root/.bitcoin/bitcoin.conf
echo "rpcpassword=CHANGETHIS" >> /root/.bitcoin/bitcoin.conf
./bitcoind -txindex &

echo "[nginx]" >> /etc/yum.repos.d/nginx.repo
echo "name=nginx repo" >> /etc/yum.repos.d/nginx.repo
echo "baseurl=http://nginx.org/packages/centos/\$releasever/\$basearch/" >> /etc/yum.repos.d/nginx.repo
echo "gpgcheck=0" >> /etc/yum.repos.d/nginx.repo
echo "enabled=1" >> /etc/yum.repos.d/nginx.repo
yum -y install nginx
mkdir -p /var/www/fullnode
echo "This is a full Bitcoin node powered by http://fullnode.co" >> /var/www/fullnode/index.html
rm -rf /etc/nginx/conf.d/default.conf
echo "server {" >> /etc/nginx/conf.d/default.conf
echo "  listen        80;" >> /etc/nginx/conf.d/default.conf
echo "  server_name   www.fullnode.co fullnode.co;" >> /etc/nginx/conf.d/default.conf
echo "  error_log     /var/log/nginx/fullnode.log;" >> /etc/nginx/conf.d/default.conf
echo "  error_page    404    /404.html;" >> /etc/nginx/conf.d/default.conf
echo "  location / {" >> /etc/nginx/conf.d/default.conf
echo "    autoindex on;" >> /etc/nginx/conf.d/default.conf
echo "    root  /var/www/fullnode;" >> /etc/nginx/conf.d/default.conf
echo "  }" >> /etc/nginx/conf.d/default.conf
echo "  location = /404.html {" >> /etc/nginx/conf.d/default.conf
echo "    root /home/www-data/mysite/static/html;" >> /etc/nginx/conf.d/default.conf
echo "  }" >> /etc/nginx/conf.d/default.conf
echo "}" >> /etc/nginx/conf.d/default.conf
chkconfig nginx on
service nginx restart