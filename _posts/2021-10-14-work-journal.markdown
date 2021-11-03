---
layout: post
title: Work Journal
date: 2021-10-14T21:02:42-07:00
categories: robotics career
permalink: work-journal
---

### 10/13/21
I deleted our git server!
We do some kinda secret stuff and have to meet some security standars. We can't have an unsanctioned cloud git server (haven't had permission to do it yet), so we had a local one. I was setting up a wiki to keep better docs and totally deleted /var/lib instead of /var/lib/mediawiki. Not my best day. Note to self: be more careful with sys admin / dev ops. It's a different mindset than programming. Move slower

### 10/14/21
I fixed our git server! So I really did delete everything. Luckily, we had all the repos on different peoples computers. I learned a lot today, mostly from debugging problems when setting up git and it wasn't working like the docs said it would. `journalctl -xe` ! `systemctl status <program_name>` ! `ss -tupln` ! I also learned a little about nginx and kinda had it working how I wanted it. I've never really worked with logs before, but today, they were incredibly useful. I felt like a wizard. I'm not sure if I would've had the confidence to do this if I hadn't done the [jvns.com networking exercise](aryzach.github.io/quicklearn-networking) that I did last weekend.

### 10/15/21
I started to take on the task of making us security compliant (CMMC L3). I'm learning a bit about security and will probably learn a lot more about sys admin which is useful. Today I read through all the requirements and read about how other people have fulfilled compliance for each requirement. It's mostly large companies that have to be compliant, so we're in a somewhat new / underserved area. Windows has more or less off-the-shelf solutions for this, but we use non-Red Hat linux, so we have to figure out solutions ourselves. 

### 10/28/21
I'm deep into security compliance stuff. We're part way done with implementation, but almost done with understanding all we have to do. Security is a totally different mindset, and I'm glad I'm learning to think in this way. Some fun tech / Linux take aways:
	- PAM and /etc/pam.d/ controls authentication on a granular level. Multi-factor auth, limiting logon attemps, ssh, etc
	- You can very easily send your syslogs to a remote server with rsyslog
	- Log commands ran with sudo through `visudo`
On another note, I'm doing some legit engineering too! Currently making a translator between two message formats. The mapping between the two message types is poorly defined. And we're toying with the idea of using Haskell for this! Because it's good for parse-y type things. And we have fun thinking in Haskell. The major downside is that it brings unneeded complexity onto our stack for such a small project. We'll probably just do it in python, which is cool, too, because it'll be fast to get going. 

### 11/2/21
I'm averaging about two jars of peanut butter a month.
The workstation I'm on has been having issues (previous employees experienced it too with this computer), and while trying to debug, put it in a state where I can't really use it (can't access my hard drive). I could figure it out, but was already starting to feel like I was spread thin, and now my quick workflows are all thrown off. I'm now working between two different computers for different projects. It's coming together though! We have a plan, everybody got more or less on the same page today, I feel some calmness about CMMC security stuff, and we have a plan to move forward with more core engineering project I'll be able to own. Woo! 

