#!/bin/bash
if [ ! -f /opt/hostgen ]; then
    randhost="$(strings /dev/urandom | grep -o '[[:alnum:]]' | head -n 12 | tr -d '\n')"
    sed -i '$ d' /etc/sysconfig/network
    echo -ne "HOSTNAME=" >> /etc/sysconfig/network && echo $randhost >> /etc/sysconfig/network
    hostname $randhost
    echo -ne "127.0.0.1 " >> /etc/hosts
    echo " $randhost" >> /etc/hosts
    echo aaa >> /opt/hostgen
    exit 1
fi
