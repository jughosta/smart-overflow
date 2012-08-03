#Cross-platform "overflow: auto" to scroll a vertical large content on desktop or mobile devices.
Has a thumb and top/bottom shadow.

#Supports (depending on the platform):
* devices with touch events
    - native scrolling + "onscroll" events
    - or programmatic scrolling on "touchstart/touchmove/touchend" events
* devices without touch events
    - native scrolling with native thumb
    - or programmatic scrolling on "mousedown/mousemove/mouseend" events

#Platforms:
- Desktop browsers
- Android
- iOS
- WindowsPhone

Scrolling content can consist any DOM elements with own click events.

Required jQuery 1.7.1 and later.