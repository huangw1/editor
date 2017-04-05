;(function() {
	// 工具函数
	var Util = {
		addEvent: function(ele, type, handler) {
			ele.attachEvent? ele.attachEvent('on'+type, handler) :ele.addEventListener(type, handler)
			
		},
		removeEvent: function(ele, type, handler) {
			ele.detachEvent? ele.detachEvent('on'+type, handler) :ele.removeEventListener(type, handler)
		},
		fireEvent: function(ele, type) {
			if('createEvent' in document) {
				var eve = document.createEvent('HTMLEvents')
        		eve.initEvent(type, false, true)
        		el.dispatchEvent(eve)
			} else {
				var eve = document.createEventObject()
		        eve.eventType = type
		        el.fireEvent('on'+eve.eventType, eve)
			}
		},
		extend: function(obj, src) {
		    for (var key in src) {
		        if (src.hasOwnProperty(key)) obj[key] = src[key]
		    }
		    return obj
		},
		type: function(obj) {
			return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '')
		},
		getDom: function(id) {
			return document.getElementById(id.replace('#', ''))
		},
		fullScreen: function() {
			if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
				var doc = document.documentElement;
				if(doc.requestFullscreen) {
					doc.requestFullscreen()
				} else if(doc.mozRequestFullScreen) {
					doc.mozRequestFullScreen()
				} else if(doc.webkitRequestFullScreen) {
					doc.webkitRequestFullScreen()
				} else if(elem.msRequestFullscreen) {
					elem.msRequestFullscreen()
				};
			} else {
				if(document.exitFullscreen) {
					document.exitFullscreen()
				} else if(document.mozCancelFullScreen) {
					document.mozCancelFullScreen()
				} else if(document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen()
				} else if(document.msExitFullscreen) {
					document.msExitFullscreen()
				}
			};
		}
	}

	// 类型判断
	var types = ['String', 'Function', 'Array', 'Number', 'Object']
		types.forEach(function(item) {
		Util['is' + item] = function(obj) {
			return Util.type(obj) == item
		}
	})

	// 发布订阅
	var Event = {
		on: function(events, listener) {
			var self = this, events = events.split(' ')
			if (!this.hasOwnProperty('listeners')) {
				this.listeners || (this.listeners = {})
			};
			events.forEach(function(event){
				self.listeners[event] || (self.listeners[event] = [])
				self.listeners[event].push(listener)
			})
			return this
		},
		emit: function(e) {
			var args = arguments.length > 1? Array.prototype.slice.call(arguments, 0): [e],
				type = args.shift(),
				that = this,
				events
			events = this.listeners ? this.listeners[type] : (void 0)
			if(!events) {
				return
			}
			events.forEach(function(event) {
				event.apply(that, args)
			}) 
		}
	}

	// 节点构建
	var Element = function(tagName, props, children, handlers) {
		if(Util.isArray(props)) {
			children = props
			props = {}
		}
		this.tagName = tagName
		this.props = props || {}
		this.children = children || []
		this.handlers = handlers || {} 
	}
	Element.prototype.render = function() {
		var el = document.createElement(this.tagName)
		for(var prop in this.props) {
			if(this.props[prop]) {
				el.setAttribute(prop, this.props[prop])
			}
		}
		for(var type in this.handlers) {
			Util.addEvent(el, type, this.handlers[type])
		}
		this.children.forEach(function(child) {
			if (Util.isArray(child)) {
				child.forEach(function(item){
					item && (item instanceof HTMLElement ? el.appendChild(item) : el.insertAdjacentHTML('beforeend', item))
				})
			} else {
				child && (child instanceof HTMLElement ? el.appendChild(child) : el.insertAdjacentHTML('beforeend', child))
			}
		})

		return el
	}

	var c = function(tagName, props, children, handler) {
		return new Element(tagName, props, children, handler).render()
	}

	// 操作节点及视图
	var Dom = {}
	Dom.Common = {
		hasState: function(state) {
			this.getDom().classList.contains('editor-' + state)
		},
		addState: function(state) {
			this.getDom().classList.add('editor-' + state)
		},
		removeState: function(state) {
			this.getDom().classList.remove('editor-' + state)
		},
		setDisabled: function(disabled) {
			if(disabled) {
				this.addState('disabled')
			} else {
				this.removeState('disabled')
			}
		}
	}
	Dom.View = {
		uid: 0,
		cacheView: {},
		getDom: function(viewId) {
			return this.cacheView[viewId]
		},
		removeDom: function(viewId) {
			this.cacheView[viewId] = null
		},
		clear: function(e) {
			var dom = this.getDom(this.currentPopup),
				current = e.target
	    	if (dom && current !== dom && !dom.contains(current)) {
				this.hidePopup()
	    	} 
		},

		// 说明
		currentHint: 0,
		showHint: function(e) {
			if(e.target.classList.contains('editor-item')) {
				var info = c('span', {class: 'editor-hint'}, [e.target.getAttribute('data-title') || e.target])
				this.cacheView[++this.uid] = info
				this.currentHint = this.uid
				e.target.appendChild(info)
			}
		},
		hideHint: function(e) {
			if(e.target.classList.contains('editor-item')) {
				var dom = this.getDom(this.currentHint)
				dom && dom.parentNode.removeChild(dom)
				this.removeDom(this.currentHint)
			}
		},

		// 弹框
		currentPopup: 0,
		showPopup: function(e, content) {
			this.cacheView[++this.uid] = content
			this.currentPopup = this.uid
			e.target.appendChild(content)
		},
		hidePopup: function() {
			var dom = this.getDom(this.currentPopup)
			dom && dom.parentNode.removeChild(dom)
			this.removeDom(this.currentPopup)
		},

		// 颜色
		colorPicker: {
			init: function (callback) {
				this.renderColorBoard()
				this.bindEvent(callback || function() {})
				return this
			},
			renderColorBoard: function() {
				var colors = ['FF','CC','00','33','66','99']
				var table = document.createElement('table')
				table.classList.add('editor-color-picker')
				table.setAttribute('cellpadding', 0)
				table.setAttribute('cellspacing', 0)
				var tbody = document.createElement('tbody')
				table.appendChild(tbody)
				for(var i = 0; i < colors.length; i++){
				    var tr = document.createElement('tr')
				    tbody.appendChild(tr)
				    for(var j = 0; j < colors.length; j++){
				        for(var k = 0; k < colors.length; k++){
				            var td = document.createElement( 'td' )
				            td.style.backgroundColor = '#' + colors[i] + colors[j] + colors[k]
				            td.setAttribute('title', '#' + colors[i] + colors[j] + colors[k])
				            tr.appendChild(td)
				        }
				    }
				}
				this.table = table
				return this
			},
			getColorBoard: function() {
				return this.table
			},
			bindEvent: function(callback) {
				Util.addEvent(this.table, 'click', function(e) {
					console.log('colorPicker')
					if(e.target.nodeName == "TD") {
						callback(e.target.getAttribute('title'))
					}
				})
				return this
			}
		}
	}

	Dom.Button = function(options) {
		this.id = uid++
		this.name = options.name
		this.title = options.title
		this.style = options.style
		this.className = options.className
		this.handlers = options.handlers
	}
	Dom.Button.prototype = {
		render: function() {
			return c('li', {id: this.id, class: 'editor-item re-toolbar-icon', 'data-title': this.title}, [
					this.className
				], this.handlers)
		}
	}
	Util.extend(Dom.Button.prototype, Dom.Common)


	// 默认参数
	var uid = 0,
		selectedRange = null,
		defaultToolbars = [
			'heading', 'blockquote', 'bold', 'italic', 'underline', 'strikethrough',
			'foreColor', 'backColor', 'justifyLeft', 'justifyCenter', 'justifyRight',
			'justifyFull', 'insertOrderedList', 'insertUnorderedList', 'indent',
			'outdent', 'createLink', 'insertImage','undo', 'redo', 'fullscreen'
		]

	// 语言	
	var langs = {}
		langs['zh-ch'] = {
		heading: {
			title: '标题',
			icon: '\uf1dc'
		},
		blockquote: {
			title: '引用',
			icon: '\uf10d'
		},
		bold: {
			title: '加粗',
			icon: '\uf032'
		},
		italic: {
			title: '斜体',
			icon: '\uf033'
		},
		underline: {
			title: '下划线',
			icon: '\uf0cd'
		},
		strikethrough: {
			title: '删除线',
			icon: '\uf0cc'
		},
		foreColor: {
			title: '字体颜色',
			icon: '\uf1fc'
		},
		backColor: {
			title: '背景色',
			icon: '\uf043'
		},
		justifyLeft: {
			title: '居左',
			icon: '\uf036'
		},
		justifyCenter: {
			title: '居中',
			icon: '\uf037'
		},
		justifyRight: {
			title: '居右',
			icon: '\uf038'
		},
		justifyFull: {
			title: '两端对齐',
			icon: '\uf039'
		},
		insertOrderedList: {
			title: '有序列表',
			icon: '\uf0cb'
		},
		insertUnorderedList: {
			title: '无序列表',
			icon: '\uf0ca'
		},
		indent:{
			title:'缩进',
			icon:'\uf03c'
		},
		outdent:{
			title:'取消缩进',
			icon:'\uf03b'
		},
		createLink: {
			title: '链接',
			icon: '\uf0c1'
		},
		insertImage: {
			title: '插入图片',
			icon: '\uf03e'
		},
		emotion: {
			title: '表情',
			icon: '\uf118'
		},
		fullscreen: {
			title: '全屏',
			icon: '\uf066'
		},
		undo: {
			title: '撤销',
			icon: '\uf0e2'
		},
		redo: {
			title: '重做',
			icon: '\uf01e'
		},
		save: {
			title: '保存',
			icon: '\uf0c7'
		}
	}

	// 构造函数
	var Editor = window.Editor  = function(selector, options) {
		this.buttons = []
		this.container = Util.getDom(selector)
		this.options = options || {}

		this.setUp()
		this.initToolbar()
	}
	Editor.langs = langs
	Editor.commands = {}
	// 插件
	Editor.plugin = (function() {
		var plugins = {}
		return {
			register: function(name, fn) {
				plugins[name] = {
					name: name,
					exec: fn
				}
			},
			load: function(editor) {
				Object.keys(plugins).forEach(function(name) {
					plugins[name]['exec'](editor)
				})
			}
		}
	})();
	// 原型
	Editor.prototype = {
		setUp: function() {
			var cacheView = this.container.innerHTML
			this.container.innerHTML = ''
			this.container.classList.add('re-container')

			var editorView = this.editorView = document.createElement('div')
			editorView.classList.add('re-editor')
			editorView.setAttribute('tabindex', 1)
			editorView.setAttribute('contenteditable', true)
			editorView.setAttribute('spellcheck', false)
			editorView.innerHTML = cacheView

			this.container.appendChild(editorView)

			Editor.plugin.load(this)
			Util.addEvent(editorView, 'blur', this.saveSelection.bind(this))
			Util.addEvent(document, 'click', Dom.View.clear.bind(Dom.View))
		},
		initToolbar: function() {
			var toolbars = this.options.toolbars || defaultToolbars,
				that = this
			toolbars.forEach(function(toolbar) {
				console.log(toolbar)
				that.buttons.push(new Editor.directive[toolbar](that))
			})

			var toolbarsContainer = this.toolbar = c('ul', {class: 're-toolbar re-toolbar-top'})
			this.buttons.forEach(function(button) {
				toolbarsContainer.appendChild(button.render())
			})
			this.container.insertBefore(toolbarsContainer, this.container.firstChild)
		},
		getHTML: function() {
			return this.editorView.innerHTML
		},
		getText: function() {
			return this.editorView.textContent
		},
		execCommand: function(command, val) {
			this.restoreSelection()
			Editor.commands[command]['execCommand'](val)
			this.saveSelection()

			this.emit('contentchange')
		},
		getCurrentRange: function() {
			if(window.getSelection) {
				var selection = window.getSelection()
				if(selection.rangeCount > 0){
					return selection.getRangeAt(0)
				}
			} else {
				var selection = document.selection
				return selection.createRange()
			}
		},
		saveSelection: function() {
			selectedRange = this.getCurrentRange()
		},
		restoreSelection: function() {
			var selection = window.getSelection()
			if(selectedRange) {
				try {
					selection.removeAllRanges()
				} catch(e) {
					document.body.createTextRange().select()
					document.selection.empty()
				}
				selection.addRange(selectedRange)
			}
		},
		getRangeElement: function(tagName) {
			this.restoreSelection()
			var range = this.getCurrentRange()
			var dom = range.commonAncestorContainer 

			if(tagName) {
				while(dom) {
					if(dom.nodeName.toLowerCase() == tagName) {
						return dom
					}
					dom = dom.parentNode
				}
			}
		}
	}
	Util.extend(Editor.prototype, Event)

	// 命令
	Editor.directive = {}
	
	// 直接命令
	var directCommand =  [
		'bold', 'italic', 'underline', 'strikethrough',
		'justifyLeft', 'justifyCenter', 'justifyRight',
		'justifyFull', 'insertOrderedList', 'insertUnorderedList', 
		'indent', 'outdent', 'undo', 'redo'
	]
	directCommand.forEach(function(command) {
		Editor.commands[command] = {
			execCommand: function() {
				document.execCommand(command,false,null)

			}
		}
		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function() {
						editor.execCommand(command)
					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})

	// 标题
	var heading = ['heading']
	heading.forEach(function(command) {
		Editor.commands['formatBlock'] = {
			execCommand: function(val) {
				document.execCommand('formatBlock',false,val)

			}
		}
		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function(e) {
						editor.restoreSelection()
						editor.saveSelection()
						setTimeout(function() {
							var hs = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
							var content = c('div', {class: 'editor-popup'}, hs.map(function(h, i) {
								return c('h' + (i + 1), {'data-h': h}, ['标题' + (i + 1)], {
									click: function(e) {
										editor.execCommand('formatBlock', e.target.getAttribute('data-h'))
										Dom.View.hidePopup()
									}
								})
							}))
							Dom.View.showPopup(e, content)
						})
					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})
	// 引用
	var blockquote = ['blockquote']
	blockquote.forEach(function(command) {
		Editor.commands[command] = {
			execCommand: function(val) {
				document.execCommand('insertHTML',false,val)

			}
		}
		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function() {
						if(editor.getRangeElement('blockquote')) {
							var node = editor.getRangeElement('blockquote')
							var html = node.innerHTML
							node.parentNode.removeChild(node)
						} else {
							var html = '<blockquote class="editor-block"><p><br></p></blockquote>',
								placeholder = document.createElement('p')
							placeholder.innerHTML = '<br>'
							editor.editorView.appendChild(placeholder)
						}
						editor.execCommand(command, html)

					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})
	// 链接
	var createLink = ['createLink']
	createLink.forEach(function(command) {
		Editor.commands[command] = {
			execCommand: function(val) {
				document.execCommand(command,false,val)
			}
		}
		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function(e) {
						if(e.target.classList.contains('editor-item')) {

							function insertLink() {
								var href = document.getElementById('input-link').value;
								if (href) {
									editor.execCommand(command, href)
								}
								Dom.View.hidePopup()
							}

							var content = c('div', {class: 'editor-panel'},[					    			
				    			c('div', {class: 'panel-content'},[	
			    					c('input', {id: 'input-link', class: 'input-text', type: 'text', placeholder:'http://'}),
			    					c('div', {class: 'panel-handles'},[
			    						c('span', {class:'panel-cancel'}, ['取消'], {click: function(){
			    							Dom.View.hidePopup()
			    						}}),
			    						c('span', {class:'panel-confirm'}, ['确定'], {click: function() {
			    							insertLink()
			    						}})					    					
				    				])
				    			])
				    		])

				    		editor.restoreSelection()
				    		editor.saveSelection()
				    		setTimeout(function() {
				    			Dom.View.showPopup(e, content)
				    		})
						}
					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})
// 链接
	var insertImage = ['insertImage']
	insertImage.forEach(function(command) {
		Editor.commands[command] = {
			execCommand: function(val) {
				console.log()
				document.execCommand('insertHTML',false,val)
			}
		}
		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function(e) {
						if(e.target.classList.contains('editor-item')) {

							function insertImage() {
								var src = document.getElementById('input-link').value;
								if (src) {
									var html = '<img src="'+src+'">'
									editor.execCommand(command, html)
								}
								Dom.View.hidePopup()
							}

							var content = c('div', {class: 'editor-panel'},[					    			
				    			c('div', {class: 'panel-content'},[	
			    					c('input', {id: 'input-link', class: 'input-text', type: 'text', placeholder:'http://'}),
			    					c('div', {class: 'panel-handles'},[
			    						c('span', {class:'panel-cancel'}, ['取消'], {click: function(){
			    							Dom.View.hidePopup()
			    						}}),
			    						c('span', {class:'panel-confirm'}, ['确定'], {click: function() {
			    							insertImage()
			    						}})					    					
				    				])
				    			])
				    		])

				    		editor.restoreSelection()
				    		editor.saveSelection()
				    		setTimeout(function() {
				    			Dom.View.showPopup(e, content)
				    		})
						}
					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})
	// 全屏
	var fullscreen = ['fullscreen']
	fullscreen.forEach(function(command) {
		Editor.commands[command] = {
			execCommand: function() {
				document.execCommand(command,false,null)

			}
		}
		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function() {
						Util.fullScreen()
						editor.execCommand(command)
					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})

	// 字体·背景
	var foreColor = ['foreColor', 'backColor']
	foreColor.forEach(function(command) {
		Editor.commands[command] = {
			execCommand: function(val) {
				document.execCommand(command,false,val)
			}
		}

		Editor.directive[command] = function(editor) {
			var directive = new Dom.Button({
				name: command,
				className: Editor.langs['zh-ch'][command]['icon'],
				title: Editor.langs['zh-ch'][command]['title'],
				handlers: {
					click: function(e) {
						function execCommand(val) {
							editor.execCommand(command, val)
							Dom.View.hidePopup()
						}
						editor.restoreSelection()
						editor.saveSelection()
						setTimeout(function() {
							Dom.View.showPopup(e, Dom.View.colorPicker.init(execCommand).getColorBoard())
						})
					},
					mouseover: function(e) {
						Dom.View.showHint(e)
					},
					mouseout: function(e) {
						Dom.View.hideHint(e)
					}
				}
			})
			return directive
		}
	})
	

})();
