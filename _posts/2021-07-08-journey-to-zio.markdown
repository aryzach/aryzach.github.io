---
layout: post
title: Journey to ZIO
date: 2021-07-08T11:35:05-04:00
permalink: journey-to-zio
---

I have a job lined up working in Scala and will make heavy use of ZIO. This is a brief and working post about how I'm getting there.

********************************************************************************

#### So far:
 - I'm comfortable with the basics of FP from Haskell including a theoretical understanding of monads, functors, applicative. I can work with the IO monad, bind operator, 'do' syntax. I also understand that list and maybe are also monads. I'd never heavily applied these concepts outside of games. 
 - Read and did exercises from [most of this book](https://books.underscore.io/essential-scala/essential-scala.html#getting-started)
 - Built a sloppy, unfinished hangman to get used to language (link)
 - Followed [this tutorial](https://scalac.io/blog/introduction-to-programming-with-zio-functional-effects/). The first time through without deep understanding just to understand the structure and though process. I then rebuilt it mostly to build muscle memory, get a deeper understanding of the program structure and types
 - Built the game from [FP to the Max](https://www.youtube.com/watch?app=desktop&v=sxudIMiOo68) with ZIO before watching how John De Goes does it. Then I followed along as he build App1, which I understood fairly comfortably. In App2 he builds monads from scratch, which, before he said it, I thought I'd seen it before, and I recognized that the TestIO was similar to the state monad. When he started breaking down IO into Console and Random, that looks plainly like the ZIO types. While I was already beyond my comfort level at this point, I really like the idea of getting to this level of understanding of working in FP and types. While I only understand App2 and App3 at a high level, it makes me excited to work towards this level of understanding, and I think I'll get there much faster if I'm building real world applications with the FP mindset. 
 - I'm getting side tracked and started watching and following along with the series [ZIO from DevInsideYou](https://www.youtube.com/watch?v=XwMKw03w8bs&list=PLJGDHERh23x-ammk-n2XuZWhoRVB-wAF) which I'm finding insightful and demystifying, but lost at the covarience / contravarience discussion.
 - Started building a Tic Tac Toe game, but stopped when I felt I wasn't learning much more. 
 - FP to the Min



#### Todo:
 - FP to the Min
 - Create other games with ZIO
 - Create small real world ZIO app, ideally something that needs concurrency / async
 - Create online multiplayer CLI game using Play framework and ZIO

ZIO is more like an ecosystem than a tooling library, similar to React (middle ground between a framework and a library)