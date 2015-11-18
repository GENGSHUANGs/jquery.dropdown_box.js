(function(window, $, undefined) {
	'use strict';

	var DropdownBox = function(dom, options, autoattach) {
		this.$dom = $(dom);
		this.options = $.extend({}, DropdownBox.defaults, options);
		if (!autoattach)
			return;
		this.attach();
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
			$dropdown.on('mouseenter', this.expand.bind(this, $dropdown[0])).on('mouseleave', this.collapse.bind(this, $dropdown[0]));
		}
		$dropdown.on('click', '.dropdown-items > .dropdown-item > a', function() {
			self.switchTo($(this).closest('.dropdown-item').attr('data-value'));
		});

		this.$dom.on('change', this.rebuild.bind(this));
		window.setTimeout(this.$dom.trigger.bind(this.$dom, 'change'), 0);
	};

	DropdownBox.prototype.detach = function() {
		this.$dom.css('display', this.$dom.attr('__dropdown-old-display'));
		this.$dom.off('change', this.rebuild.bind(this));
		this.$dropdown.remove();
	};

	DropdownBox.prototype.build = DropdownBox.prototype.rebuild = function() {
		this.$dropdown.find('.dropdown-items').empty();
		this.$dropdown.find('.dropdown-current').empty();
		var self = this;
		this.$dom.find('> * ').each(function() {
			var option = this;
			var isgroup = option.tagName === 'OPTGROUP';
			var html = self.options.build(option, option.selected, isgroup);
			self.$dropdown.find('.dropdown-items').append(html);
			if (isgroup) {
				$(option).find('> * ').each(function() {
					var html = self.options.build(this, this.selected, false);
					self.$dropdown.find('.dropdown-items').append(html);
				});
			}
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
			/**
			展开，收起
			@param {number} delay : 延迟(ms)*/
			return function(dropdown) {
				if (typeof this.$dropdown === 'undefined')
					return;

				var delay;
				if (Object.prototype.toString.call(dropdown) === '[object Number]') {
					delay = dropdown;
					dropdown = undefined;
				}

				dropdown = dropdown || this.$dropdown[0];
				if (typeof this.__delay_timer !== 'undefined')
					window.clearTimeout(this.__delay_timer);

				var self = this;
				if (method === 'expand' && this.options.mutexWith !== false) {
					$(this.options.mutexWith).each(function() {
						if (self.$dom.is(this))
							return;
						var box = $(this).data('dropdownBox');
						if (typeof box === 'undefined' || box === null)
							return;
						box.collapse();
					});
				}

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

	/**
	删除 
	@param {string} val : 选项值或者selector */
	DropdownBox.prototype.remove = function(val) {
		var $option = this.$dom.find('option[value="' + (val || '') + '"]');
		if ($option.length === 0)
			$option = this.$dom.find(val);
		$option.remove();
		this.$dom.trigger('change');
	};

	/**
	排序
	@param {function} fn : function(a,b){...} */
	DropdownBox.prototype.sort = function(fn) {
		var $options = this.$dom.find('> * ');
		$options.sort(function(a, b) {
			if (a.tagName === 'OPTGROUP')
				$(a).find('> * ').sort(fn).appendTo(a);
			if (b.tagName === 'OPTGROUP')
				$(b).find('> * ').sort(fn).appendTo(b);
			return fn(a, b);
		}).appendTo(this.$dom);
		this.rebuild();
	};

	DropdownBox.defaults = {
		/**
		是否使用hover 控制展开与收起(与点击互斥) */
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
		@param {boolean} iselected : 项目是否是被选中的状态(通过option.selected也能得到)
		@param {boolean} isgroup : 是否是分组元素 */
		build: function(option, iselected, isgroup) {
			if (!isgroup)
				return '<li class="dropdown-item' + (iselected ? ' actived' : '') + '" data-value="' + (option.value || '') + '"><a href="javascript:;">' + (option.innerHTML || '') + '</a></li>';
			else
				return '<li class="dropdown-group-item" >' + (option.getAttribute('label') || '') + '</li>';
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
		},
		/**
		互斥模式(当前只能保留一个是展开状态)，只在使用默认dataKey的情况下有效 ; 如果false，则不处理互斥关系 ;
		如果想要某个特定的dropdownBox互斥，只需要配置为相应的select控件的selector即可;
		默认和所有的select控件互斥 */
		mutexWith: 'select'
	};

	/**
	jQuery 插件接口
	@param {map} options : 选项 ，参看 DropdownBox.defaults
	@param {string} dataKey : 对象存储名称（通过$('select').data(dataKey)获取），默认: dropdownBox
	Usage :
	```javascript
	// 构建控件
	$('select').dropdownBox({...}); 
	// 获取操控对象
	$('select').data('dropdownBox').xxx();
	```*/
	$.fn.dropdownBox = function(options, dataKey, autoattach) {
		if (Object.prototype.toString.call(dataKey) === '[object Boolean]') {
			autoattach = dataKey;
			dataKey = undefined;
		}
		autoattach = typeof autoattach === 'undefined' ? true : autoattach;
		dataKey = dataKey || 'dropdownBox';
		return $(this).each(function() {
			var $select = $(this);
			var box;
			$select.data(dataKey, box = ($select.data(dataKey) || new DropdownBox(this, options, autoattach)));
		});
	};

	$.fn.dropdownBox.constructor = DropdownBox;
})(window, window.jQuery || window.Zepto);
