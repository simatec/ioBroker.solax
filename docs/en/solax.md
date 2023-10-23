![Logo](../../admin/solax.png)
# ioBroker.solax

[![NPM version](http://img.shields.io/npm/v/iobroker.solax.svg)](https://www.npmjs.com/package/iobroker.solax)
[![Downloads](https://img.shields.io/npm/dm/iobroker.solax.svg)](https://www.npmjs.com/package/iobroker.solax)
![Number of Installations (latest)](http://iobroker.live/badges/solax-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/solax-stable.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/simatec/ioBroker.solax/badge.svg)](https://snyk.io/test/github/simatec/ioBroker.solax)
![Test and Release](https://github.com/simatec/ioBroker.solax/workflows/Test%20and%20Release/badge.svg)

[![License](https://img.shields.io/github/license/simatec/ioBroker.solax?style=flat)](https://github.com/simatec/ioBroker.solax/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/paypal-donate%20|%20spenden-blue.svg)](https://paypal.me/mk1676)
[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/simatec)



***

**If you like it, please consider a donation:**
  
[![paypal](https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif)](https://paypal.me/mk1676)

***


#### Solax Cloud Connection

Solax Inverter API Cloud Connection

This adapter calls the data of your inverter from the manufacturer Solax into the iobroker.

What you need for this is an account with Solax, your token ID and the serial number of your WiFi module.

#### API-Token

<span><img src="../img/solax_api.png"></span>

#### serial number

<span><img src="../img/wifi-stick.png"></span>


#### Expert settings

The local connection is currently only supported by the Pocket Wifi Sticks. LAN sticks can only be operated in cloud mode.

Attention, if you activate the local mode in the expert settings, you should check the current firmware version of your Pocket Wifi Stick in advance.<br>
The stick must not have a firmware version greater than 2.30.20 (Wifi-Pocket V1/V2) and smaler than 3.001 (Wifi-Pocket V3) installed, since Solax blocks local access in higher versions and causes the Wifi stick to crash.

How to check the firmware version and how to downgrade to the correct version is explained here.

To check the firmware on the stick, you have to connect to the stick's hotspot.
Your hotspot name should look like this: `Solax_SWXXXXXXXX` or `Wifi_SWXXXXXXXX`. XXXXXXXX will be replaced with your serial number.

If you are connected to the hotspot, go to the web interface of the Wifi stick in your browser with the following IP address: `5.8.8.8`<br>
If you did not change your password during the initial setup, the default login data is admin:admin

<span><img src="../img/webif.png"></span>

In the web interface you go to the "System" tab and you will find the currently installed firmware version there.<br>
If the version is greater than 2.033.20 (Wifi-Pocket V1/V2) and smaler than 3.001 (Wifi-Pocket V3), you can flash the correct version in the same tab via the "Update Firmware (.usb)" menu item.

You can download version 2.033.20 from the following link:

[Download Pocket Wifi Firmware](https://github.com/simatec/ioBroker.solax/raw/master/docs/files/618.00122.00_Pocket_WIFI_V2.033.20_20190313.usb.zip)

The zip file must be unpacked and the file with the ".usb" extension must be selected.<br>
Now you can start the downgrade and after about 20-30 seconds you will get a message that the update was successful and the stick will be restarted.

After a successful restart, you can now access the WiFi stick via the hotspot with the IP address `5.8.8.8` or via your local IP in your network.

Before connecting to the adapter, please check again whether the downgrade was successful and the correct firmware is installed.
Fortunately the stick does not perform an automatic firmware upgrade and is fully functional with version 2.033.20.

The local IP address (not the hotspot IP) and the password of the web interface must be entered in the adapter and you now have a local analysis of your inverter that is accurate to the second