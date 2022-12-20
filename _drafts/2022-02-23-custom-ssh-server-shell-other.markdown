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
<<<<<<< HEAD
The hackclub project uses a library to help with the ssh server part. So far, I've found a similar Haskell library to use for this. The current [release on Hackage](https://hackage.haskell.org/package/hssh) wasn't quite working how I expected, but the latest commit on the Github repo has working examples that I was able to get running locally. To import it into my project, I had to make a few changes, so I [forked and made changes here](https://github.com/aryzach/hssh). I'm unsure why I could compile and run the latest source Stack executables locally, but when importing to my own projects, I got type errors. I've since figured out how to serve an ssh session. So now, when the client opens the SSH session, I have access to a stream of their input in bytes, and can send bytes to the client by writing to the output stream. Now it's time to decided what to do!

(I've also put up an AWS instance, expose the right ports, buy a domain name, and make DNS point to my AWS IP)

### Structure of post:
1. Design decision || Engineering decision
2. Why this decision? Other alternatives?
=======
The hackclub project uses a library to help with the ssh server part. So far, I've found a similar Haskell library to use for this. The current [release on Hackage](https://hackage.haskell.org/package/hssh) wasn't quite working how I expected, but the latest commit on the Github repo has working examples that I was able to get running locally. To import it into my project, I had to make a few changes, so I [forked it here](https://github.com/aryzach/hssh). I'm unsure why I could compile and run the latest source Stack executables locally, but when importing to my own projects, I got type errors. I've since figured out how to serve an ssh session. So now, when the client opens the SSH session, I have access to a (stream / buffer) of their input (in bytes?), and can send them (bytes?). Now it's time to decided what to do!

(I've also had to figure out how to: put up an AWS instance, expose the right ports, buy a domain name, and make DNS point to my AWS IP)

### Structure of post:
1. Design decision || Engineering decision
2. Why? Other alternatives?
>>>>>>> 33beb237b04a22235307d3d409d13356fd53f4d5
3. Narrative / obstacles
4. Reflections
5. Next steps / TODO (maybe something that could be cleaner / more optimized but not most pressing)

### Engineering decision: Reproducable builds and deploys
<<<<<<< HEAD

Prior to deciding what I want this *MAGICAL SSH EXPERIENCE* to look like, I'm going to spend some time creating a simple CI/CD pipeline. It'll just be a simple Dockerfile that both builds and runs the app. I'll also document some OS setup, if any, to expose the app publically. I've already started to do this, and am already running into issues where it's behaving differently in Docker than on the host machine.
#### Why this decision?:

This is low hanging fruit, is generally a huge time saver, and I mostly know how to do it. It's become fairly standard part of my project setup process, especially for projects with lots of dependencies.
#### Narrative:

Because I had to bind to an IP, I ran into some docker networking issues. I've decided to just use the host network for the container to simplify things for now. I'll want to change this in the future, but works for now. To build the image, I copy the files, run `stack build` then `stack run`. When running this on host after changing a file, either stack or the compiler can quickly rebuild based off just that one file change. This isn't the case when create the image. Ideally I'd like to find a way to write the Dockerfile to make builds quicker. Currently it takes 5 - 10 minutes because everything has to be rebuilt if I want to build a container with with source changes.
#### Reflections:

It's working and gives a piece of mind to have a reproducable build in the repo.
#### Next steps / TODO:

I want to get something to share as quickly as possible, so I'm going to delay optimizing this process. In the future, ideally I'd like to have it run in it's own network namespace. I'd also like to be able to pass in IP and port parameters with something like `stack run [params]`. 
The next steps are to think about what I want the user experience to look like. I'm still in an exporatory phase where I don't quite understand how the shell works, or how other people have created custom shells. Since I'd like something to share quickly, I think the first features I'd like is some way for people to read about some work I've done, the type of work I'd like to do, and some way for them to write me a note and send me an email through the app.
I'm also going to delay writing tests. I'm in exploratory stage and don't quite understand how the shell works, so priority 1 is getting something to work quickly. 


### Design decision: Create multi-client snake game with [Brick](https://github.com/jtdaugherty/brick/), a terminal user interface library
While reading the source from this [ssh chat server](https://github.com/shazow/ssh-chat), I see that they're using a library to helpwith interfacing with a terminal-like setting. I thought I was going to implement my own interface to look like a terminal, but Haskell has some libraries for that, which will save me a lot of time. While searching, I found Brick, which sounds like a widely-used and widely-liked library to create a 'terminal user interface'. 

(note: [vty](https://github.com/jtdaugherty/vty) is another library to look into for something similar to ncurses)

The current loosely-defined goal: 
- multi-client [canabalistic snake game](https://aryzach.github.io/snake/web.html) with an self-learning AI snake 
- option to write and send me a note over email
- info about my [blog thing](https://aryzach.github.io/)

Expected easy-ish parts:
- game logic (I've created games like this before in functional languages, except not multi-client)
- UI (lots of Brick resources)

Expected hard parts or unknowns:
- handling the multi-client concurrency
- maintaining consistent state with all clients (I'm expecting to keep a client-server model, and not peer-to-peer like WebRTC)
- implementing the AI

#### Why this decision?

The goal is to build a platform to showcase a portfolio and develop over time. I'd also like something to put out into the world in the next month or two. This should allow me to get something released quicker and an app that's more impressive than I originally intended.


### Engineering decision: Implement something very simple with Brick, and expose interaction to the ssh clients
While I'm fairly sure this should work, I'd like to quickly do an end-to-end test of the client input -> update state -> render state -> send rendered bytes to client -> client sees updated UI as expect

#### Why this decision? 
I'm unsure of how to work with Brick, and what the API is. I think getting a raw rendered state output in bytes that I can send over SSH is the biggest unknown.










=======
Prior to deciding what I want this **MAGICAL SSH EXPERIENCE** to look like, I'm going to spend some time creating a simple CI/CD pipeline. It'll just be a simple Dockerfile that both builds and runs the app. I'll also document some OS setup, if any, to expose the app publically. I've already started to do this, and am already running into issues where it's behaving differently in Docker than on the host machine.
Why?:
This is low hanging fruit, is generally a huge time saver, and I mostly know how to do it. It's become fairly standard part of my project setup process, especially for projects with dependencies.
>>>>>>> 33beb237b04a22235307d3d409d13356fd53f4d5

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
<<<<<<< HEAD
something with concurrency
=======
>>>>>>> 33beb237b04a22235307d3d409d13356fd53f4d5

I'm writing it in Haskell because:
1. I like it
2. I want to get better at it
3. Working in it would be nice, and this might show somebody I can


https://github.com/shazow/ssh-chat
https://github.com/quackduck/devzat

<<<<<<< HEAD
terminal solutions:
https://hackage.haskell.org/package/terminal
tui solution:
https://hackage.haskell.org/package/brick
https://github.com/jtdaugherty/brick/blob/master/docs/samtay-tutorial.md

=======
>>>>>>> 33beb237b04a22235307d3d409d13356fd53f4d5
remember to:
pin client to limited protocols and cipher suites if possible
sandbox with docker	

