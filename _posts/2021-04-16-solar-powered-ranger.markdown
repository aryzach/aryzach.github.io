---
layout: post
title:  "Solar Powered Ranger"
date:   2021-04-16 11:47:25 -0700
categories: engineering electrical
permalink: solar-powered-ranger
---
<img src="images/ranger.jpg"
     alt="ranger"
		 />


I wanted to passively charge a [Polaris Ranger EV](https://ranger.polaris.com/en-us/ranger-ev/) from solar panels. Two 100 watt solar panels had been installed on top of the ranger from when the ranger originally had a lead-acid solar charging system. Running and charging lead-acid from solar is simple with a solar controller, but the ranger had already been converted to run off of a lithium battery, which meant it had a [battery management system (BMS)](https://en.wikipedia.org/wiki/Battery_management_system). I was using an [Orion BMS Jr.](https://www.orionbms.com/manuals/pdf/wiring_jr.pdf). Powering the BMS was the crux of this problem.


In a lead-acid solar charging system, the three main components are the solar panels, solar controller, and lead-acid batteries. Here, the solar controller can be powered by the panels and only when they are producing energy. This system "just works" right off the shelf.

In a lithium solar charging system, there are four main components- the fourth being the BMS. The BMS must be powered when the battery is being charged or discharged through use. If the BMS isn't on when the battery is charging, you risk the cells having different voltages or catching fire (which both shorten the life of the battery pack), and if the BMS is on all the time, you shorten the range and possibly risk damaging the batteries. System failure here could mean somebody gets hurt or the $2000 - $5000 battery pack is ruined.

I decided I only wanted to power the BMS when the solar panels had an open-circuit voltage above a certain threshold to avoid the bad scenarios above. This turned out to be non-trivial, which led to a super fun learning experience and why I'm writing this post! 

Some specs:
- Two 100 watt solar panels (I think they were both 24v panels)
- BMS takes range of voltage 9v - 60v, 3amp max current, toggles a pin from float to ground to indicate that the battery is ready to be charged
- 48v lithium battery (I think lithium iron phosphate, LiFePO4)

Idea / iteration 1: Power the BMS with a DC converter so that the BMS is on when the panels are producing a voltage within the DC converter input range

I was able to achieve this using a combination of the following:
 - isolated 9-60v to 24v DC [converter](https://www.digikey.com/en/products/detail/cui-inc/PQAE50-D24-S24-D/13563301?utm_adgroup=DC%20DC%20Converters&utm_source=google&utm_medium=cpc&utm_campaign=Shopping_Product_Power%20Supplies%20-%20Board%20Mount_NEW&utm_term=&utm_content=DC%20DC%20Converters&gclid=Cj0KCQjw8vqGBhC_ARIsADMSd1Ao04uo4vTQqNOUY5ago-pk_4bIGioo2zeDo9YiX6XfKT8Wd89V3r0aAu0_EALw_wcB)
 - high voltage, solid state [relay](https://www.amazon.com/dp/B07PFDJQLV/?coliid=IL264W22BQM4Z&colid=2M5Y12QIIIVYU&psc=1&ref_=lv_ov_lig_dp_it)
 - diodes (to prevent back feeding grid power or back feeding the solar controller)
 - voltage distributor
 - 3A fuse

<img src="images/solarOnRanger.jpg"
     alt="solar panels on ranger"
		 />

So here we take solar power (two 100 watt panels in series, so 0 - 56 volts), convert it to 24v to power the BMS. Then the BMS is sampling the battery. When the BMS determines the battery should be charged, it toggles an output pin from float to ground. Then I also take 24v to signal to the relay. At this point, when the BMS is powered and pulls the output pin to ground, the relay closes. The relay will open and close the connection from the solar controller to the battery. 

<img src="images/rangerBoard.jpeg"
     alt="ranger board"
		 />

This approach worked in simple scenarios such as when the sun was shining or when it wasn't, but I ran into two coupled issues:
 - partial light conditions near a solar panel power boundary (9 - 14v panel voltage)
 - partial light conditions (open-circuit panel voltage <40v) when hooked up to the battery and when the BMS indicates to charge. In this scenario, the relay closes, connecting the solar controller to the batteries. Then when the batteries start charging, they pull the panel voltage down (to under 9v), which in turn turns off the BMS. Once the BMS turns off and the batteries stop charging, the solar panel open-circuit voltage rises again, which triggers the BMS to turn on. And the cycle repeats with a period of about 1 second.

<img src="images/boardInRanger.jpg"
     alt="testing board"
		 />

These issues indicated a need for hysteresis in the system. Because the hysteresis had to be low power, I couldn't use a software solution which would've relied on a bare minimum of powering a microcontroller. I found a low powered active circuit solution that relied on a [comparator](https://en.wikipedia.org/wiki/Comparator#:~:text=In%20electronics%2C%20a%20comparator%20is,and%20one%20binary%20digital%20output%20.). I used the [LM339](https://www.ti.com/product/LM339) and found this [calculator](https://www.daycounter.com/Calculators/Comparator-Hysteresis-Calculator.phtml) useful. I don't have a good intuition for how a comparator should behave, so I leaned heavy on trial and error with the calculator to find appropriate voltage and resistor values. 

<img src="images/hysteresisDiagram.jpg"
     alt="hysteresis diagram"
		 />

Hysteresis diagram

__________

<img src="images/circuitDiagramWithHysteresis.jpg"
     alt="solar panels on ranger"
		 style="transform:rotate(270deg); margin-bottom: -60px; margin-top: -50px;"
		 />

Full circuit diagram with hysteresis circuit

__________

The goal of the comparator / hysteresis circuit is to differentiate ON vs OFF threshold values. In my case, I wanted the BMS to turn on when the solar panel voltage was above 40v and turn off when it was below 10v. This would eliminate the power cycling of the BMS when in partial sun and when the battery was connected to the solar controller / solar panels. I learned two technical lessons through experimentation with the comparator: 
 - a higher reference voltage or supply voltage will give you greater difference between your high (on) and low (off) threshold voltages
 - find resistor ratios that are easy to make with your given set of resistors
Because the comparator consumed such low power, I used the battery to supply 24v to the comparator through a separate DC converter.

The BMS DC converter has an optional enable pin. Adding the hysteresis circuit between the solar panels (comparator signal input) and DC converter (comparator signal output) allowed hysteresis control over the BMS. Now, the power cycle went as follows:
 - BMS is off
 - at 40v or higher, the BMS turns on
 - if the BMS decides to charge the batteries, the relay is closed
 - the panel voltage is pulled down from the battery (panel is at 15 - 30v), but BMS stays on
 - when the panel is pulled down from the battery and reads under 10v, the BMS will be shut off and battery will stop charging
40v was set as the high threshold because when the panels read an open-cicuit voltage of <40v, the closed-circuit voltage is under 9v. Because the DC converter voltage minimum was 9v, this created the unwanted power cycle effect.

<img src="images/rangerHysteresisBreadboard.jpeg"
     alt="ranger hysteresis breadboard"
		 style="transform:rotate(270deg); margin-bottom: -50px; margin-top: -50px;"
		 />

Now, this circuit worked as expected. The new issue was to harden the system to tolerate both vibration and mud, which is a lot less interesting to talk about. 

Originally, the ranger used a different [solar controller for the lead-acid batteries](https://www.amazon.com/Genasun-GVB-8-Pb-48V-WP-Waterproof-Controller-Batteries/dp/B07H8SYB28/ref=pd_lpo_86_t_0/138-2639310-8966331?_encoding=UTF8&pd_rd_i=B07H8SYB28&pd_rd_r=f6de1b83-7f25-4575-9c5c-064d36f5a8df&pd_rd_w=jZxcf&pd_rd_wg=4Q7tc&pf_rd_p=fb1e266d-b690-4b4f-b71c-bd35e5395976&pf_rd_r=1N0XHAM1TXFKEFB1A66T&psc=1&refRID=1N0XHAM1TXFKEFB1A66T), but when that didn't work (3 charging cycles were too reserved for the lithium), I used [this](https://www.amazon.com/dp/B08JZCRKDR/?coliid=I3TSBTV63CHLZD&colid=2M5Y12QIIIVYU&psc=1&ref_=lv_ov_lig_dp_it)


Notes:
BMS DC converter needs to be isolated because the auxiliary ground is different from the battery ground 

What I learned:
 - When working with signal voltages, use the highest resistance possible without diluting your signal. This avoids burning off power in the resister
 - Using solar as a switch and only powering the BMS when it was sunny turned out to be an unneeded constraint. The BMS consumes about 2 watts. A simpler solution would've been powering the BMS directly from the battery and taking the power hit of 2 watts. The issue with this would be the possibility of draining and damaging the battery if it got too low. The benefit would be that the batteries would charge in times where the hysteresis circuit would prevent charging but when there was still some sun, notably around an open-circuit panel voltage of 30 - 40v. This is the solution I ended up implementing, so as not to spend more time hardening the breadboard prototype circuit.
 - Instead of hysteresis, could've used a timer circuit. This could reduce BMS power cycling when driving through shade, but when it's still sunny elsewhere

The BMS is the [Orion BMS Jr.](https://www.orionbms.com/manuals/pdf/wiring_jr.pdf)


