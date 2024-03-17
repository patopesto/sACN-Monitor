+++
title = "FAQ"
description = "Frequently Asked Questions"
+++

## What is sACN?

sACN or Streaming-ACN is a protocol to carry DMX512-A packets using UDP over an IP network.
Each sACN universe is transmitted on a separate multicast group.

sACN is defined by the ANSI E1.31 standard which can be found [here](https://tsp.esta.org/tsp/documents/docs/ANSI_E1-31-2018.pdf).  
DMX512-A (DMX) is defined by the ANSI E1.11 standard which can be found [here](https://tsp.esta.org/tsp/documents/docs/ANSI-ESTA_E1-11_2008R2018.pdf).  

## What is ArtNet?

ArtNet is a royalty-free protocol designed and copyright by Artistic Licence Holdings Ltd. It also carries DMX512-A packets using UDP over an IP network.  
It used IP broadcast to send universes between the sender and the receivers.

ArtNet v4 specification can be found [here](https://artisticlicence.com/WebSiteMaster/User%20Guides/art-net.pdf)

## The app won't open on MacOS

The macos binary is currently not signed or notarized by Apple resulting in an error message when first attempting to open the app.  
This can be circumvented by **right-clicking on the app and selecting `Open`.** A warning popup will appear where you can confirm to open the app.
This is only required when opening the app the first time after an install or an update. 

## A sACN universe doesn't not show in the app but a source is sending it

This app uses the sACN universe discovery mechanism defined in the standard to look for universes being advertised by a source on the network. Once a new universe is found, it automatically joins the multicast group corresponding to that universe to receive the data.  
As per the specification, any sACN compliant source should also implement the Discovery mechanism. Unfortunately not all implementations support it and most open-source libraries available don't either.  
**You can manually add a universe to listen for by clicking on the + button in the bottom-right corner of the Universes column in the app.**
