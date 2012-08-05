/**
 * SmartOverflow
 * @param {String} containerSelector
 * @param {String} selector
 * @param {Object} config
 * @constructor
 */
function SmartOverflow (containerSelector, selector, config) {

	this.config = this._extendConfig(config);

	this.containerElement = $(containerSelector);
	if (this.containerElement.length === 0) {
		return;
	}

	this.element = $(selector);
	if (this.element.length === 0) {
		return;
	}
	this.domElement = this.element.get(0);

	this.containerElement.addClass(this.config.containerClass);
	this.element.addClass(this.config.contentClass);

	this.attributes = this._calculateAttributes();
	this._update = this._bind(this._update, this);

	this.hasTouchEvents = this._hasTouchEvents();

	if (this.config.hasThumb) {
		this._createThumb();
		if (!this.hasTouchEvents && !this._isWindowsPhone()) {
			this._bindThumbEvents();
			this.overflowMethod = 'no-touch, mouse scroll';
		}
	}

	if (this.config.hasShadow) {
		this._createShadow();
	}

	this._checkContentScrolled();

	this._bindContentModifiedEvent();

	if (!this.hasTouchEvents && !this._isWindowsPhone()) {
		// no touch
		this.containerElement.addClass(this.config.hasNotTouchClass);
		return;
	}
	// has touch
	this.containerElement.addClass(this.config.hasTouchClass);

	this.hasOverflowScroll = this._hasOverflowScrolling() || this._isWindowsPhone();

	if (this.hasOverflowScroll) {
		if (this.config.hasThumb) {
			this._bindScrollEvents();

			this.overflowMethod = 'touch, native scroll + onscroll events';
		}
		return;
	}

	this._bindTouchEvents();

	this.overflowMethod = 'touch, touch scroll';
}

SmartOverflow.prototype = {

	/**
	 * Configuration
	 * @type {Object}
	 */
	config: {
		containerClass: "so-container",
		contentClass: "so-content",
		hasTouchClass: "so-touch",
		hasNotTouchClass: "so-no-touch",

		hasThumb: true,
		hasThumbTrack: true,
		autoThumbVisible: true,
		canMoveThumb: true,
		thumbClass: "so-thumb",
		thumbTrackClass: "so-thumb-track",

		hasShadow: true,
		shadowTopClass: "so-shadow so-shadow-top",
		shadowBottomClass: "so-shadow so-shadow-bottom",

		inertia: 3
	},

	/**
	 * Cache of attributes
	 * @type {Object}
	 */
	attributes: {
		_solved: false,
		elementHeight: 0,

		scrollSpace: 0,
		scrollHeight: 0,
		scrollTop: 0,

		thumbHeight: 0,
		thumbSpace: 0,
		thumbRatio: 0,

		isTopHidden: false,
		isBottomHidden: false
	},

	/**
	 * Element with "overflow: auto;"
	 * @type {Object}
	 */
	element: null,

	/**
	 * DOM element with "overflow: auto;"
	 * @type {Object}
	 */
	domElement: null,

	/**
	 * Parent container
	 * @type {Object}
	 */
	containerElement: null,

	/**
	 * Thumb element
	 * @type {Object}
	 */
	elementThumb: null,

	/**
	 * Thumb track element
	 * @type {Object}
	 */
	elementThumbTrack: null,

	/**
	 * Top shadow element
	 * @type {Object}
	 */
	elementShadowTop: null,

	/**
	 * Bottom shadow element
	 * @type {Object}
	 */
	elementShadowBottom: null,

	/**
	 * Has touch events?
	 * @type {Boolean}
	 */
	hasTouchEvents: false,

	/**
	 * Has native overflow scroll?
	 * @type {Boolean}
	 */
	hasOverflowScroll: false,

	/**
	 * Overflow method in SmartOverflow
	 * @type {String}
	 */
	overflowMethod: 'none',

	/**
	 * Extend client config
	 * @param {Object} config
	 * @return {Object}
	 * @private
	 */
	_extendConfig: function (config) {
		var extendedConfig = {};
		for (var i in this.config) {
			if (!this.config.hasOwnProperty(i)) {
				continue;
			}
			if (!config || typeof config[i] === 'undefined') {
				extendedConfig[i] = this.config[i];
				continue;
			}
			extendedConfig[i] = config[i];
		}
		return extendedConfig;
	},

	/**
	 * Calculate attributes to cache them
	 * @return {Object}
	 * @private
	 */
	_calculateAttributes: function () {
		var attributes = (this.attributes._solved)? this.attributes : {_solved: true};
		if (!this.element || !this.domElement) {
			return this.attributes;
		}

		attributes.elementHeight = this.containerElement.height();
		attributes.scrollHeight = this.domElement.scrollHeight;
		attributes.scrollSpace = attributes.scrollHeight - attributes.elementHeight;
		attributes.scrollTop = attributes.scrollTop || 0;
		attributes.scrollTimeStamp = attributes.scrollTimeStamp || 0;
		attributes.scrollTimeStampLast = attributes.scrollTimeStampLast || 0;
		if (!this.config.hasThumb) {
			return attributes;
		}
		attributes.thumbHeight = Math.round(attributes.elementHeight * attributes.elementHeight / attributes.scrollHeight);
		attributes.thumbSpace = attributes.elementHeight - attributes.thumbHeight;
		attributes.thumbRatio = this._truncateValue(attributes.thumbSpace / attributes.scrollSpace, 0, 1);
		return attributes;
	},

	/**
	 * Update state
	 * @private
	 */
	_update: function () {
		if (this.attributes.scrollTimeStamp < this.attributes.scrollTimeStampLast) {
			return;
		}
		this.scrollTimeStampLast = this.scrollTimeStamp;

		// thumb
		if (this.elementThumb) {
			this.elementThumb.css('top', this._truncateValue(this.attributes.scrollTop * this.attributes.thumbRatio, 0, this.attributes.thumbSpace));
		}

		this._checkContentScrolled();
	},

	/**
	 * Has content overflow?
	 * @return {Boolean}
	 * @private
	 */
	_hasContentOverflow: function () {
		return (this.attributes.scrollHeight > this.attributes.elementHeight);
	},

	/**
	 * Check content overflow
	 * @private
	 */
	_checkContentOverflow: function () {
		this._onContentOverflowChanged(this._hasContentOverflow());
	},

	/**
	 * Check scrolled content state
	 * @private
	 */
	_checkContentScrolled: function () {
		if (!this.attributes.isTopHidden && this.attributes.scrollTop > 0) {
			this._onNonTopOfContent();
		}
		else if (this.attributes.scrollTop === 0) {
			this._onTopOfContent();
		}

		if (!this.attributes.isBottomHidden && this.attributes.scrollTop < this.attributes.scrollSpace) {
			this._onNonBottomOfContent();
		}
		else if (this.attributes.scrollTop >= this.attributes.scrollSpace) {
			this._onBottomOfContent();
		}
	},

	/**
	 * Event: onTopOfContent
	 * @private
	 */
	_onTopOfContent: function () {
		this._changeShadowVisible(false, null);
		this._changeScrollingContentState(false, null);
	},

	/**
	 * Event: onBottomOfContent
	 * @private
	 */
	_onBottomOfContent: function () {
		this._changeShadowVisible(null, false);
		this._changeScrollingContentState(null, false);
	},

	/**
	 * Event: onNonTopOfContent
	 * @private
	 */
	_onNonTopOfContent: function () {
		this._changeShadowVisible(true, null);
		this._changeScrollingContentState(true, null);
	},

	/**
	 * Event: onNonBottomOfContent
	 * @private
	 */
	_onNonBottomOfContent: function () {
		this._changeShadowVisible(null, true);
		this._changeScrollingContentState(null, true);
	},

	/**
	 * Event: onContentOverflowChanged
	 * @param {Boolean} hasOverflow
	 * @private
	 */
	_onContentOverflowChanged: function (hasOverflow) {
		this._onContentOverflowWithThumbChanged(hasOverflow);
		this._onContentOverflowWithShadowChanged(hasOverflow);
	},

	/**
	 * Event: onContentOverflowWithThumbChanged
	 * @param {Boolean} hasOverflow
	 * @private
	 */
	_onContentOverflowWithThumbChanged: function (hasOverflow) {
		if (!this.config.hasThumb) {
			return;
		}

		if (this.config.autoThumbVisible) {
			this._changeThumbVisible(hasOverflow);
		}
		else {
			this._changeThumbVisible(true);
		}
	},

	/**
	 * Event: onContentOverflowWithShadowChanged
	 * @param {Boolean} hasOverflow
	 * @private
	 */
	_onContentOverflowWithShadowChanged: function (hasOverflow) {
		if (this.config.hasShadow && !hasOverflow) {
			this._changeShadowVisible(false, false);
		}
	},

	/**
	 * Change thumb visible
	 * @param {Boolean} isVisible
	 * @private
	 */
	_changeThumbVisible: function (isVisible) {
		if (!this.config.hasThumb) {
			return;
		}
		if (isVisible) {
			this.elementThumb.show();
			this.elementThumbTrack && this.elementThumbTrack.show();
		}
		else {
			this.elementThumb.hide();
			this.elementThumbTrack && this.elementThumbTrack.hide();
		}
	},

	/**
	 * Change shadow visible
	 * @param {Boolean|null} isTopShadowVisible
	 * @param {Boolean|null} isBottomShadowVisible
	 * @private
	 */
	_changeShadowVisible: function (isTopShadowVisible, isBottomShadowVisible) {
		if (!this.config.hasShadow) {
			return;
		}
		// top shadow
		if (isTopShadowVisible) {
			this.elementShadowTop.show();
		}
		else if (isTopShadowVisible != null) {
			this.elementShadowTop.hide();
		}

		// bottom shadow
		if (isBottomShadowVisible) {
			this.elementShadowBottom.show();
		}
		else if (isBottomShadowVisible != null) {
			this.elementShadowBottom.hide();
		}
	},

	/**
	 * Change scrolling content state
	 * @param {Boolean|null} isTopHidden
	 * @param {Boolean|null} isBottomHidden
	 * @private
	 */
	_changeScrollingContentState: function (isTopHidden, isBottomHidden) {
		if (isTopHidden != null) {
			this.attributes.isTopHidden = isTopHidden;
		}
		if (isBottomHidden != null) {
			this.attributes.isBottomHidden = isBottomHidden;
		}
	},

	/**
	 * Has touch events?
	 * @return {Boolean}
	 * @private
	 */
	_hasTouchEvents: function () {
		return ("ontouchmove" in document);
	},

	/**
	 * Has native overflow scrolling?
	 * @return {Boolean}
	 * @private
	 */
	_hasOverflowScrolling: function () {
		return ("WebkitOverflowScrolling" in document.documentElement.style);
	},

	/**
	 * Is windows phone?
	 * @return {Boolean}
	 * @private
	 */
	_isWindowsPhone: function () {
		return ((/MSIE.*(IEMobile|ZuneWP)/gi).test(navigator.appVersion));
	},

	/**
	 * Add shadow
	 * @private
	 */
	_createShadow: function () {
		var shadowTop = $(
				document.createElement("div")
			).addClass(this.config.shadowTopClass),
			shadowBottom = $(
				document.createElement("div")
			).addClass(this.config.shadowBottomClass);

		this.elementShadowTop = shadowTop;
		this.elementShadowBottom = shadowBottom;

		this._onContentOverflowWithShadowChanged(this._hasContentOverflow());

		shadowTop.appendTo(this.containerElement);
		shadowBottom.appendTo(this.containerElement);
	},

	/**
	 * Add thumb
	 * @private
	 */
	_createThumb: function () {
		var thumbTrack;
		if (this.config.hasThumbTrack) {
			thumbTrack = $(document.createElement("div")).addClass(this.config.thumbTrackClass);

			this.elementThumbTrack = thumbTrack;
			thumbTrack.appendTo(this.containerElement);
		}
		var thumb = $(
				document.createElement("div")
			).addClass(this.config.thumbClass)
			.css("height", this.attributes.thumbHeight);

		this.elementThumb = thumb;

		this._onContentOverflowWithThumbChanged(this._hasContentOverflow());

		thumb.appendTo(this.containerElement);
	},

	/**
	 * Bind touch events
	 * @private
	 */
	_bindTouchEvents: function () {
		var scrollStartPos = 0,
			element = this.element,
			timeStampStart = 0,
			self = this,
			attributes = this.attributes,
			inertia = this.config.inertia;

		element.on("touchstart.so", function (event) {
			element.stop();
			event = event.originalEvent;
			timeStampStart = event.timeStamp;
			var value = event.touches[0].pageY;
			scrollStartPos = this.scrollTop + value;
			this.scrollLast = value;
		});

		element.on("touchmove.so", function (event) {
			event = event.originalEvent;
			var value = event.touches[0].pageY;
			this.scrollSpeed = (value - this.scrollLast);
			this.scrollTop = self._truncateValue(scrollStartPos - value, 0, attributes.scrollSpace);
			this.scrollLast = value;
			event.preventDefault();
		});

		element.on("touchend.so", function (event) {
			element.stop();
			event = event.originalEvent;
			if (event.timeStamp - timeStampStart <= 150) {
				// tap event
				return;
			}
			var value = this.scrollTop - (this.scrollSpeed * inertia);
			value = self._truncateValue(value, 0, attributes.scrollSpace);
			element.animate({ scrollTop: value }, "fast");

			attributes.scrollTop = value;
			attributes.scrollTimeStamp = event.timeStamp;
			setTimeout(self._update, 0);

			event.preventDefault();
		});
	},

	/**
	 * Bind thumb's events
	 * @private
	 */
	_bindThumbEvents: function () {
		var scrollStartPos = 0,
			elementThumb = this.elementThumb,
			domElement = this.domElement,
			isClicked = false;

		elementThumb.attr('onDragStart', 'return false;');

		var self = this,
			attributes = this.attributes,
			element = this.element;

		elementThumb.on("mousedown.so", function (event) {
			isClicked = true;
			event = event.originalEvent;
			var value = (event.pageY - element.offset().top) / attributes.thumbRatio;
			scrollStartPos = domElement.scrollTop - value;
			event.preventDefault();
		});

		$(document).on("mousemove.so", function (event) {
			if (!isClicked) {
				return;
			}
			event = event.originalEvent;
			if (attributes.scrollTimeStamp > event.timeStamp) {
				return;
			}
			var value = (event.pageY - element.offset().top) / attributes.thumbRatio;
			domElement.scrollTop = self._truncateValue(scrollStartPos + value, 0, attributes.scrollSpace);

			attributes.scrollTop = domElement.scrollTop;
			attributes.scrollTimeStamp = event.timeStamp;
			setTimeout(self._update, 0);
			event.preventDefault();

		});

		$(document).on("mouseup.so", function (event) {
			isClicked = false;
			event.preventDefault();
		});
	},

	/**
	 * Bind content modified event
	 * @private
	 */
	_bindContentModifiedEvent: function () {
		var self = this;
		this.element.on('DOMSubtreeModified.so', function (event) {
			self.refresh();
		});
	},

	/**
	 * Bind scroll events
	 * @private
	 */
	_bindScrollEvents: function () {
		var self = this,
			attributes = this.attributes;

		this.element.on("scroll.so", function (event) {
			if (event.timeStamp - attributes.scrollTimeStamp < 100) {
				return;
			}
			attributes.scrollTimeStamp = event.timeStamp;
			attributes.scrollTop = this.scrollTop;
			setTimeout(self._update, 0);
		});
	},

	/**
	 * Format string
	 * @param {String} string
	 * @param {String[]} args
	 * @return {String}
	 * @private
	 */
	_format: function (string, args) {
		var pattern = /\{\d+\}/g;
		return string.replace(pattern, function(capture){return args[capture.match(/\d+/)];});
	},

	/**
	 * Bind
	 * @param {Function} fn
	 * @param {Object} context
	 * @param {.} param
	 * @return {Function}
	 * @private
	 */
	_bind: function (fn, context, param) {
		return function() {
			return fn.call(context, param);
		};
	},

	/**
	 * Truncate value
	 * @param {Number} value
	 * @param {Number} min
	 * @param {Number} max
	 * @return {Number}
	 * @private
	 */
	_truncateValue: function (value, min, max) {
		if (value < min) {
			return min;
		}
		if (value > max) {
			return max;
		}
		return value;
	},

	/**
	 * Get SmartOverflow's overflow method
	 * @return {*}
	 */
	getOverflowMethod: function () {
		return this.overflowMethod;
	},

	/**
	 * Refresh elements and attributes
	 */
	refresh: function () {
		this.attributes = this._calculateAttributes();

		// thumb
		if (this.config.hasThumb) {
			this.elementThumb.css("height", this.attributes.thumbHeight);
		}

		// shadow
		if (this.config.hasShadow) {

		}

		this._checkContentOverflow();

		this._update();
	},

	/**
	 * Destroy
	 */
	destroy: function () {
		if (!this.element) {
			return;
		}
		this.element.off(".so");
		if (this.config.hasThumb) {
			if (this.config.canMoveThumb) {
				$(document).off(".so");
				this.elementThumb && this.elementThumb.off(".so");
			}
			this.elementThumb && this.elementThumb.remove();
			this.elementThumbTrack && this.elementThumbTrack.remove();
		}
		if (this.config.hasShadow) {
			this.elementShadowTop && this.elementShadowTop.remove();
			this.elementShadowBottom && this.elementShadowBottom.remove();
		}
	}
};