---
layout: post
title: My incredibly badass bitch dev environments with Docker
date: 2022-04-14T23:28:17-07:00
categories: programming
permalink: badass_bitch_dev_env_with_docker
---

I've never liked IDEs, or graphical IDEs for a few reasons:
- I've never really put in the time to learn them / reap the benefits
- when starting programming, they were always a PITA to set up and learn for each new language I was using
- I felt like they obsured a lot, made the dev environment and setup problems hard to debug
- relying on them made it harder to be productive in a new setting (different computer, server, etc)

Also, I was sold on the idea of VIM fairly early on, bit the bullet to get over the learning curve, and it's really paid off.

Now I'm discovering another reason that this, not using graphical IDEs, is paying off.

When getting started with a new language and ecosystem, it's proved to be annoying to download some tools with apt, then maybe you're downloading some more tools globally with npm. Then oh shit, I wasn't supposed to download that globally, or those were the tools they used for this project, but it was built in 2011 and nobody does it this way now, or they used different versions of the tool, so now this project isn't building, and now your computer is in a weird state that you don't quite understand what you installed. So you try to install the right things, undo some others, but it's really not clear what's happening. Once you get it all working, your computer is in a state you don't quite understand, with tools you probably don't need, and you couldn't easily reproduce your environment. 

Also, now if you go to a different computer, you can't work on this project at all. I realize this is a somewhat rare case, having to have a dev environment on multiple computers for short periods of time, but this was the case for me. 

I started co-opting Docker containers to host a full contained dev environment. Here's one for a Purescript project: 

```purescript
FROM node:16.14.0-buster-slim

RUN groupmod -g 1003 node && usermod -u 1003 -g 1003 node

#ENV PURESCRIPT_VERSION 0.13.6
ENV PURESCRIPT_VERSION 0.14.2
ENV SPAGO_VERSION 0.20.7
ENV TERSER_VERSION 5.11.0

ARG UNAME=aryzach
ARG UID=1001
ARG GID=1001
RUN groupadd -g $GID -o $UNAME
RUN useradd -m -u $UID -g $GID -o -s /bin/bash $UNAME

# packages for dev environment
RUN apt-get update 
RUN apt-get install -y curl 
RUN apt-get install -y sudo
RUN apt-get install -y git
RUN apt install -y tmux
RUN apt install -y vim

# for purescript
RUN apt update \
    && apt install -y git libtinfo5 


#USER aryzach 
RUN npm install -g purescript@$PURESCRIPT_VERSION --unsafe-perm \
		&& npm install -g pulp bower \
    && npm install -g spago@$SPAGO_VERSION --unsafe-perm \
    #&& npm install -g terser@$TERSER_VERSION \
    # smoke tests
    && purs --version \
    && spago --version 
    #&& terser --version

RUN npm install -g http-server
RUN npm install -g purs-tidy

# setup env
USER aryzach
WORKDIR /home/aryzach/
RUN git clone https://github.com/aryzach/dotfiles.git
WORKDIR /home/aryzach/dotfiles
RUN /home/aryzach/dotfiles/setup.sh
WORKDIR /home/aryzach/
CMD /bin/bash -i "/home/aryzach/.bashrc"



# docker build --build-arg UID=$(id -u) --build-arg GID=$(id -g) -t usehedwig .
# docker run --net=host -itv `pwd`:/home/aryzach/useHedwig usehedwig /bin/bash
# docker start -i -a usehedwig
```

This is in the git repo. So on a new computer, I clone the repo, then run the docker commands at the bottom. I have the dev and language tools I need, without cluttering the host, fully reproducable, files can be edited from either host or within the container, and the only host dependancy is Docker. (So in this case, you could actually use a graphical IDE on the host. 

Here's another one for a Haskell project:

```haskell
# dockerfile for dev environment
FROM ubuntu:20.04

USER root
RUN apt-get update 
RUN apt-get install -y curl 
RUN apt-get install -y sudo
RUN apt-get install -y git
RUN apt install -y tmux
RUN apt install -y vim

WORKDIR /root/

RUN curl -sSL https://get.haskellstack.org/ | sh


RUN git clone https://github.com/aryzach/dotfiles.git
RUN /root/dotfiles/setup.sh


ADD . .

# docker build -t ssh-img .
# docker run -p 2024:2024 -d ssh -it ssh-img /bin/bash
# docker start -i -a ssh
```

Anyway, it's been a really fun way to learn to set up a new dev environment and make it reproducible without joshin around too much on your host computer. Thanks for reading!
