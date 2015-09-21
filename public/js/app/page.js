// 主页渲染
//-------------

//----------------------
// 编辑器模式
function editorMode() {
	this.writingHash = "writing";
	this.normalHash = "normal";
	this.isWritingMode = location.hash.indexOf(this.writingHash) >= 0;
	this.toggleA = null;
}

editorMode.prototype.toggleAText = function(isWriting) {
	var self = this;
	setTimeout(function() {
		var toggleA = $(".toggle-editor-mode a");
		var toggleSpan = $(".toggle-editor-mode span");
		if(isWriting) {
			toggleA.attr("href", "#" + self.normalHash);
			toggleSpan.text(getMsg("normalMode"));
		} else {
			toggleA.attr("href", "#" + self.writingHash);
			toggleSpan.text(getMsg("writingMode"));
		}	
	}, 0);
}
editorMode.prototype.isWriting = function(hash) {
	if(!hash) {
		hash = location.hash;
	}
	return hash.indexOf(this.writingHash) >= 0
}
editorMode.prototype.init = function() {
	this.$themeLink = $("#themeLink");
	this.changeMode(this.isWritingMode);
	var self = this;
	$(".toggle-editor-mode").click(function(e) {
		e.preventDefault();
		saveBookmark();
		var $a = $(this).find("a");
		var isWriting = self.isWriting($a.attr("href"));
		self.changeMode(isWriting);
		// 
		if(isWriting) {
			setHash("m", self.writingHash);
		} else {
			setHash("m", self.normalHash);
		}
		
		restoreBookmark();
	});
}
// 改变模式
editorMode.prototype.changeMode = function(isWritingMode) {
	this.toggleAText(isWritingMode);
	if(isWritingMode) {
		this.writtingMode();
	} else {
		this.normalMode();
	}
}

editorMode.prototype.resizeEditor = function() {
	// css还没渲染完
	setTimeout(function() {
		resizeEditor();
	}, 10);
	setTimeout(function() {
		resizeEditor();
	}, 20);
	setTimeout(function() {
		resizeEditor();
	}, 500);
}
editorMode.prototype.normalMode = function() {
	// 最开始的时候就调用?
	/*
	var $c = $("#editorContent_ifr").contents();
	$c.contents().find("#writtingMode").remove();
	$c.contents().find('link[href$="editor-writting-mode.css"]').remove();
	*/

	$("#noteItemListWrap, #notesAndSort").show();
	$("#noteList").unbind("mouseenter").unbind("mouseleave"); 
	
	var theme = UserInfo.Theme || "default";
	theme += ".css";
	var $themeLink = $("#themeLink");
	// 如果之前不是normal才换
	if(this.$themeLink.attr('href').indexOf('writting-overwrite.css') != -1) {
		this.$themeLink.attr("href", "/css/theme/" + theme);
	}
	
	$("#noteList").width(UserInfo.NoteListWidth);
	$("#note").css("left", UserInfo.NoteListWidth);
}

editorMode.prototype.writtingMode = function() {
	if(this.$themeLink.attr('href').indexOf('writting-overwrite.css') == -1) {
		this.$themeLink.attr("href", "/css/theme/writting-overwrite.css");
	}
	
	/*
	setTimeout(function() {
		var $c = $("#editorContent_ifr").contents();
		$c.contents().find("head").append('<link type="text/css" rel="stylesheet" href="/css/editor/editor-writting-mode.css" id="writtingMode">');
	}, 0);
	*/
		
	$("#noteItemListWrap, #notesAndSort").fadeOut();
	$("#noteList").hover(function() {
		$("#noteItemListWrap, #notesAndSort").fadeIn();
	}, function() {
		$("#noteItemListWrap, #notesAndSort").fadeOut();
	});
	
	// 点击扩展会使html的height生成, 切换后会覆盖css文件的
	// $("#mceToolbar").css("height", "40px");
	
	//$("#pageInner").addClass("animated fadeInUp");

	this.resizeEditor();
	
	$("#noteList").width(250);
	$("#note").css("left", 0);
	
	// 切换到写模式
	Note.toggleWriteable();
}

editorMode.prototype.getWritingCss = function() {
	if(this.isWritingMode) {
		return ["/css/editor/editor-writting-mode.css"];
	}
	return [];
}
var em = new editorMode();
LEA.em = em;

//----------------
// 拖拉改变变宽度
var Resize = {
	lineMove: false,
	mdLineMove: false,
	target: null,
	
	leftNotebook: $("#leftNotebook"),
	notebookSplitter: $("#notebookSplitter"),
	noteList: $("#noteList"),
	noteAndEditor: $("#noteAndEditor"),
	noteSplitter: $("#noteSplitter"),
	note: $("#note"),
	body: $("body"),
	leftColumn: $("#left-column"),
	rightColumn: $("#right-column"), // $("#preview-panel"), // 
	mdSplitter: $("#mdSplitter2"),
	
	init: function() {
		var self = this;
		self.initEvent();
	},
	
	initEvent: function() {
		var self = this;
		
		// 鼠标点下
		$(".noteSplit").bind("mousedown", function(event) {
			event.preventDefault(); // 防止选择文本
			self.lineMove = true;
			$(this).css("background-color", "#ccc");
			self.target = $(this).attr("id");
			// 防止iframe捕获不了事件
			$("#noteMask").css("z-index", 99999); // .css("background-color", // "#ccc");
		});
		
		// 鼠标点下
		self.mdSplitter.bind("mousedown", function(event) {
			event.preventDefault(); // 防止选择文本
			if($(this).hasClass('open')) {
				self.mdLineMove = true;
			}
			// $(this).css("background-color", "#ccc");
		});
		
		// 鼠标移动时
		self.body.bind("mousemove", function(event) {
			if(self.lineMove) { // 如果没有这个if会导致不能选择文本
				event.preventDefault();
				self.resize3Columns(event);
			} else if(self.mdLineMove) {
				event.preventDefault();
				self.resizeMdColumns(event);
			}
		});	

		// 鼠标放开, 结束
		self.body.bind("mouseup", function(event) {
			self.stopResize();
			// 取消遮罩
			$("#noteMask").css("z-index", -1);
		});
		
		// 瞬间
		var everLeftWidth;
		$('.layout-toggler-preview').click(function() {
			var $t = $(this);
			var $p = self.leftColumn.parent();
			// 是开的
			if($t.hasClass('open')) {
				var totalWidth = $p.width();
				var minRightWidth = 22;
				var leftWidth = totalWidth - minRightWidth;
				everLeftWidth = self.leftColumn.width();
				self.leftColumn.width(leftWidth);
				self.rightColumn.css('left', 'auto').width(minRightWidth);
				
				// 禁止split
				$t.removeClass('open');//.addClass('close');
				self.rightColumn.find('.layout-resizer').removeClass('open');
				$('.preview-container').hide();
			} else {
				$t.addClass('open');
				self.rightColumn.find('.layout-resizer').addClass('open');
				self.leftColumn.width(everLeftWidth);
				$('.preview-container').show();
				self.rightColumn.css('left', everLeftWidth).width('auto');
				
				if(MD) { 
					MD.onResize();
				}
			}
		});
	},
	// 停止, 保存数据
	stopResize: function() {
		var self = this;
		if(self.lineMove || self.mdLineMove) {
			// ajax保存
			ajaxGet("/user/updateColumnWidth", {mdEditorWidth: UserInfo.MdEditorWidth, notebookWidth: UserInfo.NotebookWidth, noteListWidth: UserInfo.NoteListWidth}, function() {
			});
		}
		self.lineMove = false;
		self.mdLineMove = false;
		$(".noteSplit").css("background", "none");
		self.mdSplitter.css("background", "none");
	},
	
	// 最终调用该方法
	set3ColumnsWidth: function(notebookWidth, noteListWidth) {
		var self = this;
		if(notebookWidth < 150 || noteListWidth < 100) {
			return;
		}
		var noteWidth = self.body.width() - notebookWidth - noteListWidth;
		if(noteWidth < 400) {
			return;
		}
		
		self.leftNotebook.width(notebookWidth);
		self.notebookSplitter.css("left", notebookWidth);
		
		self.noteAndEditor.css("left", notebookWidth);
		self.noteList.width(noteListWidth);
		self.noteSplitter.css("left", noteListWidth);
		self.note.css("left", noteListWidth);
		
		UserInfo.NotebookWidth = notebookWidth;
		UserInfo.NoteListWidth = noteListWidth;
	},
	resize3Columns: function(event, isFromeIfr) {
		var self = this;
		if (isFromeIfr) {
			event.clientX += self.body.width() - self.note.width();
		}
		
		var notebookWidth, noteListWidth;
		if(self.lineMove) {
			if (self.target == "notebookSplitter") {
				notebookWidth = event.clientX;
				noteListWidth = self.noteList.width();
				self.set3ColumnsWidth(notebookWidth, noteListWidth);
			} else {
				notebookWidth = self.leftNotebook.width();
				noteListWidth = event.clientX - notebookWidth;
				self.set3ColumnsWidth(notebookWidth, noteListWidth);
			}
	
			resizeEditor();
		}
	},
	
	// mdeditor
	resizeMdColumns: function(event) {
		var self = this;
		if (self.mdLineMove) {
			var mdEditorWidth = event.clientX - self.leftColumn.offset().left; // self.leftNotebook.width() - self.noteList.width();
			self.setMdColumnWidth(mdEditorWidth);
		}
	},
	// 设置宽度
	setMdColumnWidth: function(mdEditorWidth) { 
		var self = this;
		if(mdEditorWidth > 100) {
			UserInfo.MdEditorWidth = mdEditorWidth;
			log(mdEditorWidth)
			self.leftColumn.width(mdEditorWidth);
			self.rightColumn.css("left", mdEditorWidth);
			// self.mdSplitter.css("left", mdEditorWidth);
		}
		
		// 这样, scrollPreview 才会到正确的位置
		if(MD) {
			MD.onResize();
		}
	}
}

//--------------------------
// 手机端访问之
Mobile = {
	// 点击之笔记
	// 切换到编辑器模式
	noteO: $("#note"),
	bodyO: $("body"),
	setMenuO: $("#setMenu"),
	// 弃用, 统一使用Pjax
	hashChange: function() {
		var self = Mobile;
		var hash = location.hash;
		// noteId
		if(hash.indexOf("noteId") != -1) {
			self.toEditor(false);
			var noteId = hash.substr(8);
			Note.changeNote(noteId, false, false);
		} else {
			// 笔记本和笔记列表
			self.toNormal(false);
		}
	},
	init: function() {
		var self = this;
		self.isMobile();
		// $(window).on("hashchange", self.hashChange);
		// self.hashChange();
		/*
		$("#noteItemList").on("tap", ".item", function(event) {
			$(this).click();
		});
		$(document).on("swipeleft",function(e){
			e.stopPropagation();
			e.preventDefault();
			self.toEditor();
		});
		$(document).on("swiperight",function(e){
			e.stopPropagation();
			e.preventDefault();
			self.toNormal();
		});
		*/
	},
	isMobile: function() {
		var u = navigator.userAgent;
		LEA.isMobile = false;
		LEA.isMobile = /Mobile|Android|iPhone|iPad/i.test(u);
		LEA.isIpad =  /iPad/i.test(u);
		LEA.isIphone = /iPhone/i.test(u);
		if(!LEA.isMobile && $(document).width() <= 700){ 
			LEA.isMobile = true
		}
		return LEA.isMobile;
	},
	// 改变笔记, 此时切换到编辑器模式下
	// note.js click事件处理, 先切换到纯编辑器下, 再调用Note.changeNote()
	changeNote: function(noteId) {
		var self = this;
		if(!LEA.isMobile) {return true;}
		self.toEditor(true, noteId);
		return false;
	},
	
	toEditor: function(changeHash, noteId) {
		var self = this;
		self.bodyO.addClass("full-editor");
		self.noteO.addClass("editor-show");
		/*
		if(changeHash) {
			if(!noteId) {
				noteId = Note.curNoteId;
			}
			location.hash = "noteId=" + noteId;
		}
		*/
	},
	toNormal: function(changeHash) {
		var self = this;
		self.bodyO.removeClass("full-editor");
		self.noteO.removeClass("editor-show");
	
		/*
		if(changeHash) {
			location.hash = "notebookAndNote";
		}
		*/
	},
	switchPage: function() {
		var self = this;
		if(!LEA.isMobile || LEA.isIpad) {return true;}
		if(self.bodyO.hasClass("full-editor")) {
			self.toNormal(true);
		} else {
			self.toEditor(true);
		}
		return false;
	}
} 


function initSlimScroll() {
	if(Mobile.isMobile()) {
		return;
	}
	$("#notebook").slimScroll({
	    height: "100%", // $("#leftNotebook").height()+"px"
	});
	$("#noteItemList").slimScroll({
	    height: "100%", // ($("#leftNotebook").height()-42)+"px"
	});
	/*
	$("#wmd-input").slimScroll({
	    height: "100%", // $("#wmd-input").height()+"px"
	});
	$("#wmd-input").css("width", "100%");
	*/
	
	$("#wmd-panel-preview").slimScroll({
	    height: "100%", // $("#wmd-panel-preview").height()+"px"
	});
	
	$("#wmd-panel-preview").css("width", "100%");
}

//-----------
// 初始化编辑器
function initEditor() {
	// editor
	// toolbar 下拉扩展, 也要resizeEditor
	var mceToobarEverHeight = 0;
	$("#moreBtn").click(function() {
		saveBookmark();
		var $editor = $('#editor');
		if($editor.hasClass('all-tool')) {
			$editor.removeClass('all-tool');
		} else {
			$editor.addClass('all-tool');
		}

		restoreBookmark();
	});


	
	// 刷新时保存 参考autosave插件
	window.onbeforeunload = function(e) {
    	Note.curChangedSaveIt();
	}
	
	// 全局ctrl + s
	$("body").on('keydown', Note.saveNote);
}

//-----------------------
// 导航
var random = 1;
function scrollTo(self, tagName, text) {
	var iframe = $("#editorContent"); // .contents();
	var target = iframe.find(tagName + ":contains(" + text + ")");
	random++;
	
	// 找到是第几个
	// 在nav是第几个
	var navs = $('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]');
//	alert('#leanoteNavContent [data-a="' + tagName + '-' + encodeURI(text) + '"]')
	var len = navs.size();
	for(var i = 0; i < len; ++i) {
		if(navs[i] == self) {
			break;
		}
	}
	
	if (target.size() >= i+1) {
		target = target.eq(i);
		// 之前插入, 防止多行定位不准
		// log(target.scrollTop());
		var top = iframe.scrollTop() - iframe.offset().top + target.offset().top; // 相对于iframe的位置
		// var nowTop = iframe.scrollTop();
		// log(nowTop);
		// log(top);
		// iframe.scrollTop(top);
		iframe.animate({scrollTop: top}, 300); // 有问题
		
		/*
		var d = 200; // 时间间隔
		for(var i = 0; i < d; i++) {
			setTimeout(
			(function(top) {
				return function() {
					iframe.scrollTop(top);
				}
			})(nowTop + 1.0*i*(top-nowTop)/d), i);
		}
		// 最后必然执行
		setTimeout(function() {
			iframe.scrollTop(top);
		}, d+5);
		*/
		return;
	}
}

//--------------
// 调用之
// $(function() {
	LEA.s3 = new Date();
	console.log('initing...');
	
	// 窗口缩放时
	$(window).resize(function() {
		Mobile.isMobile();
		resizeEditor();
	});
	
	// 初始化编辑器
	initEditor();

	// 左侧, folder 展开与关闭
	$(".folderHeader").click(function() {
		var body = $(this).next();
		var p = $(this).parent();
		if (!body.is(":hidden")) {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.hide();
			p.removeClass("opened").addClass("closed");
			$(this).find(".fa-angle-down").removeClass("fa-angle-down").addClass("fa-angle-right");
		} else {
			$(".folderNote").removeClass("opened").addClass("closed");
//					body.show();
			p.removeClass("closed").addClass("opened");
			$(this).find(".fa-angle-right").removeClass("fa-angle-right").addClass("fa-angle-down");
		}
	});
	
	// 导航隐藏与显示
	$(".leanoteNav h1").on("click", function(e) {
		var $leanoteNav = $(this).closest('.leanoteNav');
		if (!$leanoteNav.hasClass("unfolder")) {
			$leanoteNav.addClass("unfolder");
		} else {
			$leanoteNav.removeClass("unfolder");
		}
	});
	
	// 打开设置
	function openSetInfoDialog(whichTab) {
		showDialogRemote("/user/account", {tab: whichTab});
	}
	// 帐号设置
	$("#setInfo").click(function() {
		openSetInfoDialog(0);
	});
	// 邮箱验证
	$("#wrongEmail").click(function() {
		openSetInfoDialog(1);
	});
	
	$("#setAvatarMenu").click(function() {
		showDialog2("#avatarDialog", {title: "头像设置", postShow: function() {
		}});
	});
	$("#setTheme").click(function() {
		showDialog2("#setThemeDialog", {title: "主题设置", postShow: function() {
			if (!UserInfo.Theme) {
				UserInfo.Theme = "default";
			}
			$("#themeForm input[value='" + UserInfo.Theme + "']").attr("checked", true);
		}});
	});
	
	//---------
	// 主题
	$("#themeForm").on("click", "input", function(e) {
		var val = $(this).val();
		$("#themeLink").attr("href", "/css/theme/" + val + ".css");
		
		ajaxPost("/user/updateTheme", {theme: val}, function(re) {
			if(reIsOk(re)) {
				UserInfo.Theme = val
			}
		});
	});
	
	//-------------
	// 邮箱验证
	if(!UserInfo.Verified) {
//		$("#leanoteMsg").hide();
//		$("#verifyMsg").show();
	}
	
	// 禁止双击选中文字
	$("#notebook, #newMyNote, #myProfile, #topNav, #notesAndSort", "#leanoteNavTrigger").bind("selectstart", function(e) {
		e.preventDefault();
		return false;
	});
	
	// 左侧隐藏或展示
	function updateLeftIsMin(is) {
		ajaxGet("/user/updateLeftIsMin", {leftIsMin: is})
	}
	function minLeft(save) {
		$("#leftNotebook").width(30);
		$("#notebook").hide();
		// 左侧
		$("#noteAndEditor").css("left", 30)	
		$("#notebookSplitter").hide();
		
//		$("#leftSwitcher").removeClass("fa-angle-left").addClass("fa-angle-right");
		
		// logo
		$("#logo").hide();
		$("#leftSwitcher").hide();
		$("#leftSwitcher2").show();
		$("#leftNotebook .slimScrollDiv").hide();
		
		if(save) {
			updateLeftIsMin(true);
		}
	}
	
	function maxLeft(save) {
		$("#noteAndEditor").css("left", UserInfo.NotebookWidth);
		$("#leftNotebook").width(UserInfo.NotebookWidth);
		$("#notebook").show();
		$("#notebookSplitter").show();
		
//		$("#leftSwitcher").removeClass("fa-angle-right").addClass("fa-angle-left");
		
		$("#leftSwitcher2").hide();
		$("#logo").show();
		$("#leftSwitcher").show();
		$("#leftNotebook .slimScrollDiv").show();
		
		if(save) {
			updateLeftIsMin(false);
		}
	}
	
	$("#leftSwitcher2").on('click', function() {
		maxLeft(true);
	});
	$("#leftSwitcher").click('click', function() {
		if(Mobile.switchPage()) {
			minLeft(true);
		}
	});
	
	// 得到最大dropdown高度
	// 废弃
	function getMaxDropdownHeight(obj) {
		var offset = $(obj).offset();
		var maxHeight = $(document).height()-offset.top;
		maxHeight -= 70;
		if(maxHeight < 0) {
			maxHeight = 0;
		}	
		
		var preHeight = $(obj).find("ul").height();
		return preHeight < maxHeight ? preHeight : maxHeight;
	}
	
	// mini版
	// 点击展开
	$("#notebookMin div.minContainer").click(function() {
		var target = $(this).attr("target");
		maxLeft(true);
		if(target == "#notebookList") {
			if($("#myNotebooks").hasClass("closed")) {
				$("#myNotebooks .folderHeader").trigger("click");
			}
		} else if(target == "#tagNav") {
			if($("#myTag").hasClass("closed")) {
				$("#myTag .folderHeader").trigger("click");
			}
		} else {
			if($("#myShareNotebooks").hasClass("closed")) {
				$("#myShareNotebooks .folderHeader").trigger("click");
			}
		}
	});
	
	//------------------------
	// 界面设置, 左侧是否是隐藏的
	UserInfo.NotebookWidth = UserInfo.NotebookWidth || $("#notebook").width();
	UserInfo.NoteListWidth = UserInfo.NoteListWidth || $("#noteList").width();
	
	Resize.init();
	Resize.set3ColumnsWidth(UserInfo.NotebookWidth, UserInfo.NoteListWidth);
	Resize.setMdColumnWidth(UserInfo.MdEditorWidth);
	
	if (UserInfo.LeftIsMin) {
		minLeft(false);
	}
	
	// end
	// 开始时显示loading......
	// 隐藏mask
	$("#mainMask").html("");
	$("#mainMask").hide(100);
	
	// 4/25 防止dropdown太高
	// dropdown
	$('.dropdown').on('shown.bs.dropdown', function () {
		var $ul = $(this).find("ul");
		// $ul.css("max-height", getMaxDropdownHeight(this));
	});
	
	//--------
	// 编辑器帮助
	$("#tipsBtn").click(function() {
		showDialog2("#tipsDialog");
	});
	
	//--------
	// 建议
	$("#yourSuggestions").click(function() {
		showDialog2("#suggestionsDialog");
	});
	$("#suggestionBtn").click(function(e) {
		e.preventDefault();
		var suggestion = $.trim($("#suggestionTextarea").val());
		if(!suggestion) {
			$("#suggestionMsg").html("请输入您的建议, 谢谢!").show().addClass("alert-warning").removeClass("alert-success");
			$("#suggestionTextarea").focus();
			return;
		}
		$("#suggestionBtn").html("正在处理...").addClass("disabled");
		$("#suggestionMsg").html("正在处理...");
		$.post("/suggestion", {suggestion: suggestion}, function(ret) {
			$("#suggestionBtn").html("提交").removeClass("disabled");
			if(ret.Ok) {
				$("#suggestionMsg").html("谢谢反馈, 我们会第一时间处理, 祝您愉快!").addClass("alert-success").removeClass("alert-warning").show();
			} else {
				$("#suggestionMsg").html("出错了").show().addClass("alert-warning").removeClass("alert-success");
			}
		});
	});
	
	// 编辑器模式
	em.init();
	
	// 手机端?
	Mobile.init();
//});

//------------
// pjax
//------------
var Pjax = {
	init: function() {
		var me = this;
		// 当history改变时
		window.addEventListener('popstate', function(evt){
			var state = evt.state;
			if(!state) {
				return;
			}
			document.title = state.title || "Untitled";
			log("pop");
			me.changeNotebookAndNote(state.noteId);
		}, false);
		
		// ie9
		if(!history.pushState) {
			$(window).on("hashchange", function() {
				var noteId = getHash("noteId");;
				if(noteId) {
					me.changeNotebookAndNote(noteId);
				}
			});
		}
	},
	// pjax调用
	// popstate事件发生时, 转换到noteId下, 此时要转换notebookId
	changeNotebookAndNote: function(noteId) {
		var note = Note.getNote(noteId);
		if(!note) {
			return;
		}
		var isShare = note.Perm != undefined;
		
		var notebookId = note.NotebookId;
		// 如果是在当前notebook下, 就不要转换notebook了
		if(Notebook.curNotebookId == notebookId) {
			// 不push state
			Note.changeNoteForPjax(noteId, false);
			return;
		}
		
		// 自己的
		if(!isShare) {
			// 先切换到notebook下, 得到notes列表, 再changeNote
			Notebook.changeNotebook(notebookId, function(notes) {
				Note.renderNotes(notes);
				// 不push state
				Note.changeNoteForPjax(noteId, false, true);
			});
		// 共享笔记
		} else {
			Share.changeNotebook(note.UserId, notebookId, function(notes) {
				Note.renderNotes(notes);
				// 不push state
				Note.changeNoteForPjax(noteId, false, true);
			});
		}
	},
		
	// ajax后调用
	changeNote: function(noteInfo) {
		var me = this;
		log("push");
		var noteId = noteInfo.NoteId;
		var title = noteInfo.Title;
		var url = '/note/' + noteId;
		if(location.hash) {
			url += location.hash;
		}
		// 如果支持pushState
		if(history.pushState) {
			var state=({
				url: url,
				noteId: noteId,
				title: title,
			});
			history.pushState(state, title, url);
			document.title = title || 'Untitled';
		// 不支持, 则用hash
		} else {
			setHash("noteId", noteId);
		}
	}
};
$(function() {
	Pjax.init();
});

// note.html调用
// 实始化页面
function initPage() {
	// 不要用$(function() {}) 因为要等到<script>都加载了才执行
	// $(function() {
		Notebook.renderNotebooks(notebooks);
		Share.renderShareNotebooks(sharedUserInfos, shareNotebooks);
		
		// 如果初始打开的是共享的笔记
		// 那么定位到我的笔记
		if(curSharedNoteNotebookId) {
			Share.firstRenderShareNote(curSharedUserId, curSharedNoteNotebookId, curNoteId);
		// 初始打开的是我的笔记
		} else {
			Note.setNoteCache(noteContentJson);
			Note.renderNotes(notes);
			if(curNoteId) {
				// 指定某个note时才target notebook, /note定位到最新
				// ie10&+要setTimeout
				setTimeout(function() {
					Note.changeNoteForPjax(curNoteId, true, curNotebookId);
				});
				if(!curNotebookId) {
					Notebook.selectNotebook($(tt('#notebook [notebookId="?"]', Notebook.allNotebookId)));
				}
			}
		}

		// 指定笔记, 也要保存最新笔记
		if(latestNotes.length > 0) {
			for(var i = 0; i < latestNotes.length; ++i) {
				Note.addNoteCache(latestNotes[i]);
			}
		}
		
		Tag.renderTagNav(tagsJson);
		// init notebook后才调用
		initSlimScroll();
	// });
}
