---
layout: post
title: Quicklearn Containers
date: 2021-10-31T11:17:29-07:00
categories: work linux containters
permalink: quicklearn-containers
---

## Background 
I'm again running into an issue at work where there are gaps in what I know, and it's slowing down my debugging process. The overall project has to do with running a MANET network with some nodes. Usually the nodes would be real physical devices that move around and dynamically connect and disconnect from each other (self-healing network). The MANET network layer is beta software, and mostly not in our domain. Our job is to try to turn their beta software into a usable product. For testing, we want to run the nodes on virtual machines (VMs). The current process is to use Vagrant to start a few VMs. This starts / configures a few Linux VMs with virtualbox. Then we run an Ansible playbook to install / configure the MANET network software. The current problem is that the ansible build fails. Each node hosts a web page, which is supposedly accessible from the host machine. Even when I ssh into the VM and manually start each service with failed before (which is mostly successful), I still can't find the web page. One issue is that I don't know what IP it's supposed to show up from, but I do know the port. When I start the VMs, my host machine has another network interface, which indicates something about docker.

### VM setup
I've read this post on [virtualbox network settings](https://www.nakivo.com/blog/virtualbox-network-setting-guide/) which was very clarifying. I think we should be on a NAT network, but other people who I work with have gotten it to work with the NAT setting. Also, when I try to simply choose 'NAT Network' it doesn't work / requires further setup. Because others have gotten it working with just NAT, I'm moving on from this for now.  

### Curious observations
- from a VM, I can ping the host
- from a VM, I can ping some other physical computer on our network
- from a VM, I can ping the "default gateway" from their side (I think, if I remember correctly. I'm forgetting that IP rn)
- from host, I can ping the docker interface (which has it's own IP, and which I'm assuming is the host-side IP)
- from host, I can't ping the VM
- (need more data on this bc I don't remember right now)
- I can see that the VM web server port is open

## Current questions
- what is a container / what is docker (I kinda know but need a deeper level)
- does it make sense that my host network interface called 'docker' is the public IP to a private VM network?
- why can a VM ping host, but host can't ping VM?
- how do I find out where the host can access the web page hosted on the VM
- why are we using VMs instead of containers here? All VMs are running Linux. Host is Linux. Does CentOS7 have a different kernel than Ubuntu? Or maybe it was a design choice that that you didn't need a native Linux computer.

Networks with docker are confusing me right now, and while I don't think this exercise will answer all my questions, I think I'll gain a better framework for understanding how this internal network is working and will help me debug it.

This post is like the [Quicklearn Networking](https://aryzach.github.io/quicklearn-networking) post, but following Julia's [Kubernetes / containers](https://jvns.ca/#kubernetes---containers) section.

So I first reread the NAT section from the virtualbox networking post linked above. "A guest operating system on a VM can access hosts in a physical local area network (LAN) by using a virtual NAT (Network Address Translation) device. External networks, including the internet, are accessible from a guest OS. A guest machine is not accessible from a host machine, or from other machines in the network when the NAT mode is used for VirtualBox networking." Well that answers some questions! But then how is the host supposed to be able to access the web page served from a VM? I'm guessing through the docker network interface (if that's even what that interface is used for). The issue is that when I tried to use the docker IP with web server port, it didn't work.

## Post summaries 

### [Docker is amazing](https://jvns.ca/blog/2015/11/09/docker-is-amazing/)
- Dockerfile can define OS and what to install on it
- good for when you need something but has conflicting dependencies from your computer

### [Some questions about Docker and rkt](https://jvns.ca/blog/2016/09/15/whats-up-with-containers-docker-and-rkt/)
- reasons: package versioning (like python venv), make different types of computers behave the same, reproducing dev environment on your personal computer, restrict which system calls you can run in the container for security

## Skipping a few that don't seem relevant 

### [What even is a container: namespaces and cgroups](https://jvns.ca/blog/2016/10/10/what-even-is-a-container/)
- namespaces and cgroups are new linux kernel features
- seems like you can have a seperate namespace of every type and limit the system calls allowed


### []()
### []()
### []()
### []()
### []()
### []()
### []()
### []()
### []()
### []()
