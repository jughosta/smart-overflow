#Cross-platform "overflow: auto" to scroll a vertical large content on desktop or mobile devices.
Has a thumb and top/bottom shadow.

#Supports (auto detect platform):
* devices with touch events
    - native scrolling + "onscroll" events (Android 4.x, WindowsPhone, iOS)
    - or scrolling on "touchstart/touchmove/touchend" events (iOS, Android 2.x)
* devices without touch events
    - native scrolling with native thumb
    - or scrolling on "mousedown/mousemove/mouseend" events

#Platforms:
- Desktop browsers
- Android
- iOS
- WindowsPhone

Scrolling content can consist any DOM elements with own click events.

Required jQuery 1.7.1 and later.

Demo http://juliarechkunova.github.com/smart-overflow/
