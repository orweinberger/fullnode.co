#!/bin/bash
nohup knife bootstrap localhost -x root -i /root/fullnode.pem -c knife.rb --run-list "recipe[fullnode::default]"