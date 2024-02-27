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



**************************************************************************************************************

**Wenn Ihnen ioBroker.solax gefällt, denken Sie bitte über eine Spende nach::**
  
[![paypal](https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif)](https://paypal.me/mk1676)

**************************************************************************************************************

## Solax Adapter for ioBroker

**************************************************************************************************************

### Solax Cloud-Verbindung

Solax Wechselrichter API-Cloud-Verbindung

Dieser Adapter ruft die Daten deines Wechselrichters vom Hersteller Solax für iobroker ab.

Was dazu benötigt wird, ist ein Konto bei Solax, eine Token-ID und die Seriennummer des Pocket Wifi oder LAN Sticks.

### API-Token

<span><img src="../img/solax_api.png"></span>

### Seriennummer

<span><img src="../img/wifi-stick.png"></span>


### Experteneinstellungen

Die lokale Verbindung wird aktuell nur von dem Pocket Wifi Sticks unterstützt. LAN-Sticks können nur im Cloud-Modus betrieben werden.

Achtung, wer in den Experteneinstellungen den lokalen Modus aktiviert sollte im Vorfeld zwingend die aktuelle Firmwareversion seines Pocket Wifi Sticks prüfen.
Eine Firmware Version größer 2.30.20 (Wifi-Pocket V1/V2) und kleiner als 3.001 (Wifi-Pocket V3) darf der Stick nicht installiert haben, da Solax in höheren Versionen den lokalen Zugriff blockiert und es zu einem Absturz des Wifi Sticks führt.

Wie man die Firmware Version prüfen kann und ein Downgrade auf die korrekte Version hinbekommt, wird hier erklärt.

Um die Firmware auf dem Stick zu prüfen, müsst ihr euch mit dem Hotspot des Sticks verbinden.
Der Name des Hotspots sollte bei euch wie folgt aussehen: `Solax_SWXXXXXXXX` oder `Wifi_SWXXXXXXXX`. XXXXXXXX wird durch eure Seriennummer ersetzt.

Wenn ihr mit dem Hotspot verbunden seit, dann geht ihr mit folgender IP-Adresse in euren Browser auf das Webinterface des Wifi-Sticks: `5.8.8.8`<br>
Solltet ihr euer Passwort bei der Ersteinrichtung nicht geändert haben, sind die Standard Login-Daten admin:admin

<span><img src="../img/webif.png"></span>

Im Webinterface geht ihr auf den Tab "System" und findet dort die aktuell installierte Firmware-Version.<br>
Sollte die Version größer 2.033.20 (Wifi-Pocket V1/V2) und kleiner 3.001 (Wifi-Pocket V3) sein, könnt ihr im gleichen Tab über den Menüpunkt "Update Firmware (.usb)" die korrekte Version flashen.

Die Version 2.033.20 könnt ihr euch unter folgenden Link herunterladen:

[Download Pocket Wifi Firmware](https://github.com/simatec/ioBroker.solax/raw/master/docs/files/618.00122.00_Pocket_WIFI_V2.033.20_20190313.usb.zip)

Die Zip-Datei muss entpackt werden und es muss die Datei mit der Endung ".usb" ausgewählt werden.<br>
Nun könnt Ihr den Downgrade starten und werdet nach ca. 20-30 Sekunden eine Meldung bekommen, dass das Update erfolgreich war und der Stick neu gestartet wird.

Nach erfolgreichen Neustart könnt ihr nun über den Hotspot mit der IP-Adresse `5.8.8.8` oder auch über eure lokale IP in eurem Netzwerk auf den Wifi-Stick zugreifen.

Prüft bitte vor einer Verbindung zu dem Adapter noch einmal, ob der Downgrade erfolgreich war und die korrekte Firmware installiert ist.
Der Stick aktualisiert die Firmware nicht automatisch und ist mit der Version 2.033.20 voll funktionsfähig.

Im Adapter müssen die lokale IP-Adresse (nicht die Hotspot IP) und das Passwort des Webinterfaces eingetragen werden, und ihr habt nun eine sekundengenaue lokale Analyse eures Wechselrichters

Aktuell werden im lokalen Modus folgende Umrichter unterstützt:

* X1 mini
* X1 boost
* X3-Hybiyd/Fit
* X3-20K/30K
* X3-MIC/PRO
* X3-Hybrid-G4
* X3-MIC/PRO-G2
* X1-Hybrid-G4
* X1/X3-EVC Wallbox

Wer gerne weitere Umrichter integriert haben möchte, sollte die Datenauswertung des lokalen Requests als Issue zur Verfügung stellen.