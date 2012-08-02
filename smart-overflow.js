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
	this.element.css('width', '100%')
		.css('height', '100%')
		.css('padding', 0)
		.css('margin', 0);

	this.attributes = this._calculateAttributes();
	this._update = this._bind(this._update, this);

	this.hasTouchEvents = this._hasTouchEvents();

	if (this.config.hasThumb) {
		this._createThumb();
		if (!this.hasTouchEvents && !this._isWindowsPhone()) {
			this.element.css('overflow', 'hidden');
			this._bindThumbEvents();

			this.overflowMethod = 'no-touch, mouse scroll';
		}
	}

	if (this.config.hasShadow) {
		this._createShadow();
	}

	this._bindContentModifiedEvent();

	if (!this.hasTouchEvents && !this._isWindowsPhone()) {
		return;
	}

	this.element.css('overflow', 'auto');
	this.containerElement.css('overflow', 'hidden');

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
		hasThumb: true,
		canMoveThumb: true,
		hasShadow: true,
		shadowTopClass: "so-shadow so-shadow-top",
		shadowBottomClass: "so-shadow so-shadow-bottom",
		thumbClass: "so-thumb"
	},

	/**
	 * Cache of attributes
	 * @type {Object}
	 */
	attributes: {
		_solved: false,
		elementHeight: 0,
		elementWidth: 0,
		scrollHeight: 0,
		scrollTop: 0,

		thumbHeight: 0,
		thumbSpace: 0,
		thumbRatio: 0,

		isShadowTopVisible: false,
		isShadowBottomVisible: false
	},

	/**
	 * Templates
	 * @type {Object}
	 */
	templates: {
		thumb: '<div style="position: absolute; background: grey; top: {1}px; right: 0; width: 15px; height: {2}px;" class="{0}"></div>',
		shadowTop: '<div style="position: absolute; background: black; top: 0; left: 0; width: 100%; height: 15px;" class="{0}"></div>',
		shadowBottom: '<div style="position: absolute; background: black; bottom: 0; left: 0; width: 100%; height: 15px;" class="{0}"></div>'
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
			extendedConfig[i] = ((config)? config[i] : null) || this.config[i];
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

		attributes.elementHeight = this.element.height();
		attributes.elementWidth = this.element.width();
		attributes.scrollHeight = this.domElement.scrollHeight;
		attributes.scrollTop = attributes.scrollTop || 0;
		attributes.scrollTimeStamp = attributes.scrollTimeStamp || 0;
		attributes.scrollTimeStampLast = attributes.scrollTimeStampLast || 0;
		if (!this.config.hasThumb) {
			return attributes;
		}
		attributes.thumbHeight = Math.round(attributes.elementHeight * attributes.elementHeight / attributes.scrollHeight);
		attributes.thumbSpace = attributes.elementHeight - attributes.thumbHeight;
		attributes.thumbRatio = attributes.thumbSpace / (attributes.scrollHeight - attributes.elementHeight - attributes.thumbHeight);
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

		// shadow
		if (!this.elementShadowTop && this.elementShadowBottom) {
			return;
		}

		// shadowTop
		if (!this.attributes.isShadowTopVisible && this.attributes.scrollTop > 0) {
			this.attributes.isShadowTopVisible = true;
			this.elementShadowTop.show();
		}

		else if (this.attributes.scrollTop <= 5) {
			this.attributes.isShadowTopVisible = false;
			this.elementShadowTop.hide();
		}

		// shadowBottom
		if (!this.attributes.isShadowBottomVisible && this.attributes.scrollTop < this.attributes.scrollHeight - this.attributes.elementHeight) {
			this.attributes.isShadowBottomVisible = true;
			this.elementShadowBottom.show();
		}

		else if (this.attributes.scrollTop >= this.attributes.scrollHeight - this.attributes.elementHeight - 5) {
			this.attributes.isShadowBottomVisible = false;
			this.elementShadowBottom.hide();
		}
	},

	/**
	 * Has content overflow?
	 * @return {Boolean}
	 * @private
	 */
	_hasContentOverflow: function () {
		return (this.attributes.scrollHeight > this.element.height());
	},

	/**
	 * Need show thumb?
	 * @return {Boolean}
	 * @private
	 */
	_isNeedShowThumb: function () {
		if (!this.elementThumb || !this.config.hasThumb) {
			return false;
		}
		return this._hasContentOverflow();
	},

	/**
	 * Need show top shadow?
	 * @return {Boolean}
	 * @private
	 */
	_isNeedShowTopShadow: function () {
		if (!this.elementShadowTop || !this.config.hasShadow) {
			return false;
		}
		return this._hasContentOverflow() && (this.attributes.scrollTop > 0);
	},

	/**
	 * Need show bottom shadow?
	 * @return {Boolean}
	 * @private
	 */
	_isNeedShowBottomShadow: function () {
		if (!this.elementShadowTop || !this.config.hasShadow) {
			return false;
		}
		return this._hasContentOverflow() && (this.attributes.scrollTop < this.attributes.scrollHeight - this.attributes.elementHeight);
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
			this._format(
				this.templates.shadowTop,
				[this.config.shadowTopClass]
			)
		), shadowBottom = $(
			this._format(
				this.templates.shadowBottom,
				[this.config.shadowBottomClass]
			)
		);
		this.elementShadowTop = shadowTop;
		this.elementShadowBottom = shadowBottom;
		if (!this._isNeedShowTopShadow()) {
			shadowTop.hide();
		}
		if (!this._isNeedShowBottomShadow()) {
			shadowBottom.hide();
		}
		shadowTop.appendTo(this.containerElement);
		shadowBottom.appendTo(this.containerElement);
		this.containerElement.css('position', 'relative');
	},

	/**
	 * Add thumb
	 * @private
	 */
	_createThumb: function () {
		var thumb = $(
			this._format(
				this.templates.thumb,
				[this.config.thumbClass, '' + this.attributes.scrollTop, '' + this.attributes.thumbHeight]
			)
		);
		this.elementThumb = thumb;
		if (!this._isNeedShowThumb()) {
			thumb.hide();
		}
		thumb.appendTo(this.containerElement);
		this.containerElement.css('position', 'relative');
	},

	/**
	 * Bind touch events
	 * @private
	 */
	_bindTouchEvents: function () {
		var scrollStartPos = 0,
			element = this.element,
			timeStampStart = 0;

		element.on("touchstart", function (event) {
			element.stop();
			event = event.originalEvent;
			timeStampStart = event.timeStamp;
			var value = event.touches[0].pageY;
			scrollStartPos = this.scrollTop + value;
			this.scrollLast = value;
		});

		element.on("touchmove", function (event) {
			event = event.originalEvent;
			var value = event.touches[0].pageY;
			this.scrollSpeed = (value - this.scrollLast);
			this.scrollTop = scrollStartPos - value;
			this.scrollLast = value;
			event.preventDefault();
		});

		var self = this,
			attributes = this.attributes;

		element.on("touchend", function (event) {
			element.stop();
			event = event.originalEvent;
			if (event.timeStamp - timeStampStart <= 150) {
				return;
			}
			var value = this.scrollTop - (this.scrollSpeed * 2);
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

		elementThumb.on("mousedown", function (event) {
			isClicked = true;
			event = event.originalEvent;
			var value = (event.y - element.offset().top) / attributes.thumbRatio;
			scrollStartPos = domElement.scrollTop - value;
			event.preventDefault();
		});

		$(document).on("mousemove.thumb", function (event) {
			if (!isClicked) {
				return;
			}
			event = event.originalEvent;
			if (attributes.scrollTimeStamp > event.timeStamp) {
				return;
			}
			var value = (event.y - element.offset().top) / attributes.thumbRatio;
			attributes.scrollTop = domElement.scrollTop = scrollStartPos + value;

			attributes.scrollTimeStamp = event.timeStamp;
			setTimeout(self._update, 0);
			event.preventDefault();

		});

		$(document).on("mouseup.thumb", function (event) {
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
		this.element.on('DOMSubtreeModified', function (event) {
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

		this.element.on("scroll", function (event) {
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
		if (this.elementThumb) {
			if (!this._isNeedShowThumb()) {
				this.elementThumb.hide();
			}
			else {
				this.elementThumb.show();
			}
			this.elementThumb.css('height', this.attributes.thumbHeight);
		}

		// shadow
		if (!this._hasContentOverflow() && this.config.hasShadow) {
			this.attributes.isShadowTopVisible = false;
			this.elementShadowTop.hide();
			this.attributes.isShadowBottomVisible = false;
			this.elementShadowBottom.hide();
			return;
		}

		if (this.elementShadowBottom && this.elementShadowTop) {
			// shadowTop
			if (this._isNeedShowTopShadow()) {
				this.attributes.isShadowTopVisible = true;
				this.elementShadowTop.show();
			}
			else {
				this.attributes.isShadowTopVisible = false;
				this.elementShadowTop.hide();
			}

			// shadowBottom
			if (this._isNeedShowBottomShadow()) {
				this.attributes.isShadowBottomVisible = true;
				this.elementShadowBottom.show();
			}
			else {
				this.attributes.isShadowBottomVisible = false;
				this.elementShadowBottom.hide();
			}
		}

		this._update();
	},

	/**
	 * Destroy
	 */
	destroy: function () {
		if (!this.element) {
			return;
		}
		this.element.off();
		if (this.config.hasThumb) {
			if (this.config.canMoveThumb) {
				$(document).off("mousemove.thumb");
				$(document).off("mouseup.thumb");
				this.elementThumb && this.elementThumb.off();
			}
			this.elementThumb && this.elementThumb.remove();
		}
		if (this.config.hasShadow) {
			this.elementShadowTop && this.elementShadowTop.remove();
			this.elementShadowBottom && this.elementShadowBottom.remove();
		}
	}
};