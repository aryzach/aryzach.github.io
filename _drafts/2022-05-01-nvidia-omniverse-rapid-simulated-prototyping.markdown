---
layout: post
title: Nvidia, Omniverse, rapid simulated prototyping
date: 2022-05-01T21:45:36-07:00
categories: prototype engineering 
permalink: nvidia-omniverse
---

Nvidia started by competing in a crowded, commidified market of graphics cards. Normally, these shops would go through the cycle of:

1. layout specification of features 
2. design hardware 
3. small batch physical prototype 
4. test prototype to meet spec 
5. repeat steps 2 - 5 until the proposed specification met 
6. large production batch

This is a lengthy process.

The commoditized competitors generally had the same feature-set as each other and would make mostly lockstep progress with each other. Nvidia was in a bind, and got ahold of software that could somehow better verify if the electronic CAD graphics cards would meet spec when testing. Instead of going through the lengthy design cycle, Nvidia decided to use this testing software, then go straight to production. The result was that only part of the new features worked, but they were able to get production to market with a subset of new features many months (maybe close to a year) before the other competitors. The decision to use a far-from-perfect simulation tool to do rapid virtual prototyping, and then commit to a design that was known to likely be only partially correct allowed the company to be set apart from competitors (and with this Nvidia had to convice it's customers, I think driver developers, to use just this limited new feature set).

Omniverse
Musk 51% then commit
