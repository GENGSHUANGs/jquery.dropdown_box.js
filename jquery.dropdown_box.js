(function(window, $, undefined) {
	'use strict';

	var DropdownBox = function(dom, options) {
		this.$dom = $(dom);
		this.options = $.extend(DropdownBox.defaults, options);
		this.attach();
		this.bind_events();
		window.setTimeout(this.$dom.trigger.bind(this.$dom, 'change'), 0);
	};

	DropdownBox.prototype.bind_events = function() {
		this.$dom.on('change', this.rebuild.bind(this));
	};

	DropdownBox.prototype.attach = function() {
		var $dropdown = this.$dropdown = $(this.options.template);
		this.$dom.attr('__dropdown-old-display', this.$dom.css('display') || '').css('display', 'none');
		this.$dom.after($dropdown);
		var self = this;
		if (!this.options.hover) {
			$dropdown.on('click', '.dropdown-current', function() {
				self[$dropdown.is('.actived') ? 'collapse' : 'expand'].call(self, $dropdown[0]);
			});
		} else {
			$dropdown.on('mouseenter', self.expand.bind(self, $dropdown[0])).on('mouseleave', self.collapse.bind(self, $dropdown[0]));
		}
		$dropdown.on('click', '.dropdown-items > .dropdown-item > a', function() {
			self.switchTo($(this).closest('.dropdown-item').attr('data-value'));
		});
	};

	DropdownBox.prototype.detach = function() {
		this.$dom.css('display', this.$dom.attr('__dropdown-old-display'));
		$dropdown.remove();
	};

	DropdownBox.prototype.build = DropdownBox.prototype.rebuild = function() {
		this.$dropdown.find('.dropdown-items').empty();
		this.$dropdown.find('.dropdown-current').empty();
		var self = this;
		this.$dom.find('option').each(function() {
			var option = this;
			var html = self.options.build(option, option.selected);
			self.$dropdown.find('.dropdown-items').append(html);
		});
		var $option = this.$dom.find('option:selected');
		if ($option.length <= 0)
			return;
		var html = this.options.build_current($option[0]);
		this.$dropdown.find('.dropdown-current').replaceWith(html);
	};

	/**
	切换到 */
	DropdownBox.prototype.switchTo = function(val, keep) {
		var $option = this.$dom.find('option[value="' + (val || '') + '"]');
		if ($option.length > 0)
			this.$dom.val(val || '').trigger('change');
		else
			this.$dom.find(val).attr('selected', true);
		if (!keep)
			this.collapse();
	};

	['expand', 'collapse'].forEach(function(method) {
		DropdownBox.prototype[method] = function(method) {
			return function(dropdown) {
				var delay;
				if (Object.prototype.toString.call(dropdown) === '[object Number]') {
					delay = dropdown;
					dropdown = undefined;
				}
				dropdown = dropdown || this.$dropdown[0];
				if (typeof this.__delay_timer !== 'undefined')
					window.clearTimeout(this.__delay_timer);
				var self = this;
				var next = function() {
					self.options[method].call(self.options[method], dropdown, delay);
					window.clearTimeout(self.__delay_timer);
					self.__delay_timer = undefined;
				};
				if (typeof delay === 'undefined')
					next();
				else
					this.__delay_timer = window.setTimeout(next, delay);
			};
		}(method);
	});

	DropdownBox.prototype.hide = function() {
		this.options.hide();
	};

	/**
	删除 */
	DropdownBox.prototype.remove = function(val) {
		var $option = this.$dom.find('option[value="' + (val || '') + '"]');
		if ($option.length === 0)
			$option = this.$dom.find(val);
		$option.remove();
		this.$dom.trigger('change');
	};

	/**
	排序*/
	DropdownBox.prototype.sort = function(fn) {
		var $options = this.$dom.find('option');
		$options.sort(fn).appendTo(this.$dom);
		this.rebuild();
	};

	DropdownBox.defaults = {
		/**
		是否使用hover 控制展开与收起 */
		hover: false,
		/**
		外部mask ，这是最基本的结构，只能丰富，不能修改 */
		template: '<div class="dropdown"><a class="dropdown-current"></a><ul class="dropdown-items"></ul></div>',
		/**
		构造当前选择的项目
		@param {HTMLOptionElement} option : 当前select选的项目 */
		build_current: function(option) {
			return '<a class="dropdown-current" href="javascript:;">' + (option.innerHTML || '') + '</a>';
		},
		/**
		构造待选择的下拉项目
		@param {HTMLOptionElement} option : 需要构造的项目
		@param {boolean} iselected : 项目是否是被选中的状态(通过option.selected也能得到)*/
		build: function(option, iselected) {
			return '<li class="dropdown-item' + (iselected ? ' actived' : '') + '" data-value="' + (option.value || '') + '"><a href="javascript:;">' + (option.innerHTML || '') + '</a></li>';
		},
		/**
		展开下拉 */
		expand: function(dropdown) {
			$(dropdown).addClass('actived');
		},
		/**
		收起下拉 */
		collapse: function(dropdown) {
			$(dropdown).removeClass('actived');
		}
	};

	$.fn.dropdownBox = function(options, dataKey) {
		dataKey = dataKey || 'dropdownBox';
		return $(this).each(function() {
			var $select = $(this);
			var box;
			$select.data(dataKey, box = ($select.data(dataKey) || new DropdownBox(this, options)));
		});
	};

	$.fn.dropdownBox.constructor = DropdownBox;
})(window, jQuery);
