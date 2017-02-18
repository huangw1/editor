# editor
富文本编辑器，轻量。

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
