# editor
富文本编辑器，轻量。

##目前支持哪些功能
 * 文本编辑
 * 链接插入
 * 图片插入
 * 撤销·重做
 * 全屏编辑
 * 初始化文本

##目前支持哪些事件
 * 简单插件
 * 获取文本

##后续完善
 * 自定义功能拓展
 * 本地图片上传


##如何使用

```javascript

var editor = new Editor('editor')
editor.on('contentchange', function() {
	// html
	console.log(editor.getHTML())
	// plain text
	console.log(editor.getText())
})

```
