---
layout: post
title: Custom SSH server / shell
date: 2022-02-23T19:15:05-08:00
categories: software backend functional haskell design engineering
permalink: custom-ssh-server-shell
---

I first saw [this custom SSH server / shell project for a group called Hack Club](https://github.com/hackclub/jobs) on [hackernews](https://news.ycombinator.com/item?id=27189288) and thought it was super cool! It's a novel way to use the medium and I didn't know you could use an SSH server that way. Now I want to make one because I think it could be a cool way to live demo some projects. And I might use it to select for future employers, just like the original did, but in reverse.

The Hack Club project is written in Go. I'm deciding to implement the base of my project in Haskell because I see the advantages, and I'd like to get better and become more productive working in a language like this.

### Prior to starting this journal
The hackclub project uses a library to help with the ssh server part. So far, I've found a similar Haskell library to use for this. The current [release on Hackage](https://hackage.haskell.org/package/hssh) wasn't quite working how I expected, but the latest commit on the Github repo has working examples that I was able to get running locally. To import it into my project, I had to make a few changes, so I [forked it here](https://github.com/aryzach/hssh). I'm unsure why I could compile and run the latest source Stack executables locally, but when importing to my own projects, I got type errors. I've since figured out how to serve an ssh session. So now, when the client opens the SSH session, I have access to a (stream / buffer) of their input (in bytes?), and can send them (bytes?). Now it's time to decided what to do!

(I've also had to figure out how to: put up an AWS instance, expose the right ports, buy a domain name, and make DNS point to my AWS IP)

### Structure of post:
1. Design decision || Engineering decision
2. Why? Other alternatives?
3. Narrative / obstacles
4. Reflections
5. Next steps / TODO (maybe something that could be cleaner / more optimized but not most pressing)

### Engineering decision: Reproducable builds and deploys
Prior to deciding what I want this **MAGICAL SSH EXPERIENCE** to look like, I'm going to spend some time creating a simple CI/CD pipeline. It'll just be a simple Dockerfile that both builds and runs the app. I'll also document some OS setup, if any, to expose the app publically. I've already started to do this, and am already running into issues where it's behaving differently in Docker than on the host machine.
Why?:
This is low hanging fruit, is generally a huge time saver, and I mostly know how to do it. It's become fairly standard part of my project setup process, especially for projects with dependencies.

Design decision:

### Project Plan
Ideas:
Custom shell
cmdline tools
graphics library (like google mfa qr code)
framework for others to create something similar
games
resume
program so somebody can type something and it get's sent to me in an email or something

I'm writing it in Haskell because:
1. I like it
2. I want to get better at it
3. Working in it would be nice, and this might show somebody I can


https://github.com/shazow/ssh-chat
https://github.com/quackduck/devzat

remember to:
pin client to limited protocols and cipher suites if possible
sandbox with docker	

