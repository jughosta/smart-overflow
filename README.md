Cross-platform "overflow: auto" to scroll a vertical large content on desktop or mobile devices.
Has a thumb and top/bottom shadow.

Supports depending on the platform:
1. on devices with touch events
    - native scrolling + "onscroll" events
    - programmatic scrolling on "touchstart/touchmove/touchend" events
2. on devices without touch events
    - native scrolling with native thumb
    - programmatic scrolling on "mousedown/mousemove/mouseend" events

Platforms:
- Desktop browsers
- Android
- iOS
- WindowsPhone

Scrolling content can consist any DOM elements with own click events.