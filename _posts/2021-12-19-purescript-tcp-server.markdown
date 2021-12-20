---
layout: post
title: Purescript TCP Server
date: 2021-12-19T21:23:33-08:00
categories: purescript example
permalink: purescript-tcp-server
---

There's not a lot of basic purescript examples out there! So I'm putting this up. This is a TCP echo server. Because there aren't a ton of examples of Purescript, I found it helpful to find a NodeJS example of what I want to do, and then use that to create the Purescript implementation. This is helpful because the Purescript wrapper API to the underlying NodeJS code uses similar terminology / function names as the NodeJS examples.

```purescript
module Main where

import Prelude

import Effect (Effect)
import Effect.Console (log, logShow)
import Node.Net.Server as Serv
import Node.Net.Socket as Sock
import Node.Encoding as Encode
import Data.Options as Opt
import Data.Unit
import Data.Either as E
import Data.Maybe as M
import Node.Buffer as Buff
import Effect.Exception as Except

main :: Effect Unit
main = do
 server <- Serv.createServer (Opt.Options []) connectionCallback
 a      <- Serv.listenTCP server 8989 "10.0.0.248" 2 listenCallback
 pure unit

connectionCallback:: Sock.Socket -> Effect Unit
connectionCallback s = do
    addr <- Sock.remoteAddress s
    port <- Sock.remotePort s
    _    <- Sock.setEncoding s Encode.UTF8
    _    <- Sock.onData s handleData
    _    <- Sock.onClose s $ handleClose addr
    _    <- Sock.onError s handleError
    logShow addr
```
