/**
	OpenSequenceDiagrams.js

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var Sequence = (function() {
	//Templating system
	
	var template = (function() {
		//Undefined behaviour when using two times the same key in a template '::key [...] ::key' (so don't do that)
		//User input must be at the last position to avoid injection
		var templates = {
			text: '<text x="::x" y="::y">::text</text>',
			centeredText: '<text x="::x" y="::y" style="text-anchor:middle">::text</text>',
			rect: '<rect x="::x" y="::y" width="::width" height="::height" ry="::ry" style="fill: ::fill;"></rect>',
			strokeRect: '<rect x="::x" y="::y" width="::width" height="::height" ry="::ry" style="fill: ::fill;stroke:black;stroke-width:2;"></rect>',
			gradient: '<linearGradient id="::id" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:rgb(200, 200, 200);stop-opacity:1"></stop><stop offset="100%" style="stop-color:rgb(100,100,100);stop-opacity:1"></stop></linearGradient>',
			line: '<line x1="::x1" y1="::y1" x2="::x2" y2="::y2" style="stroke:black;stroke-width:2"></line>',
			dottedLine: '<line x1="::x1" y1="::y1" x2="::x2" y2="::y2" style="stroke:black;stroke-width:2" stroke-dasharray="10,5"></line>',
			triangle: '<polygon points="::x1,::y1 ::x2,::y2 ::x3,::y3" style="fill: ::fill;stroke:black;stroke-width:1px"></polygon>',
			document: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="::width" height="::height"><defs>::defs</defs>::svg</svg>',
			translate: '<g transform="translate(::x,::y)">::child</g>'
		};
		var regexp = /::[a-zA-Z0-9]+/g;
	
		function getTemplate(values) {
			if(values._hide) return '';
			else if(values._text) return values._text;
			var source = templates[values._name]; //_name is the template name
			var m = source.match(regexp);
			for(var i in m) {
				var k = m[i].substr(2); //key to look up
				if(typeof values[k] === 'object') {
					source = source.replace(
						m[i],
						getTemplates(values[k])
					);
				} else {
					source = source.replace(
						m[i],
						typeof values[k] == 'string' ? filter(values[k]) : (typeof values[k] == 'number' ? values[k] : '')
					); //Filter text
				}
			}
			return source;
		}
		
		function getTemplates(values) {
			if(Object.prototype.toString.call(values) === '[object Array]') {
				var result = '';
				for(var i=0; i<values.length; i++) {
					result += getTemplate(values[i]);
				}
				return result;
			} else {
				return getTemplate(values);
			}
		}
		
		return getTemplates;
	})();

	//Constants -------------------------------------------------------------------

	var partSize = 125; //Participant width
	var interPart = 25; //Horizontal interval between 2 participants

	//SVG functions ---------------------------------------------------------------

	function drawTriangle(x, y, isToTheRight, isOpen) {
		return template({
			_name: 'translate',
			x: x,
			y: y,
			child: {
				_name: 'triangle',
				x1: (isToTheRight ? -15 : 15),
				y1: -5,
				x2: 0,
				y2: 0,
				x3: (isToTheRight ? -15 : 15),
				y3: +5,
				fill: (isOpen ? 'white' : 'black')
			}
		});
	}

	function actor(x, y, height, text) {
		return template({
			_name: 'translate',
			x: x,
			y: y,
			child: [{
					_name: 'line',
					x1: partSize/2,
					y1: text.length * 20 + 10,
					x2: partSize/2,
					y2: height
				}, {
					_text: rectWithText(0, 0, text, true)
				}, {
					_text: rectWithText(0, height, text, true)
				}
			]
		});
	}

	function rectWithText(x, y, text, gradient) {
		var end = text.length * 20 + 10;
		var definition = {
			_name: 'translate',
			x: x,
			y: y,
			child: [
				{
					_name: 'strokeRect',
					x: 0,
					y: 0,
					width: partSize,
					height: end,
					ry: 5,
					fill: (gradient ? 'url(#grad1)' : 'white')
				}
			]
		};
		for(var i in text) {
			definition.child.push({
				_name: 'centeredText',
				x: partSize/2,
				y: i*20+20,
				text: text[i]
			});
		}
		return template(definition);
	}

	function specialRectangle(x, y, w, h, type, comment) {
		return template({
			_name: 'translate',
			x: x,
			y: y,
			child: [{
				_name: 'rect',
				x: 0,
				y: 0,
				width: 70,
				height: 30,
				ry: 0,
				fill: 'white'
			}, {
				_name: 'strokeRect',
				x: 0,
				y: 0,
				width: w,
				height: h,
				ry: 0,
				fill: 'none'
			}, {
				_name: 'line',
				x1: 0,
				y1: 30,
				x2: 60,
				y2: 30
			}, {
				_name: 'line',
				x1: 60,
				y1: 30,
				x2: 70,
				y2: 20
			}, {
				_name: 'line',
				x1: 70,
				y1: 20,
				x2: 70,
				y2: 0
			}, {
				_name:'centeredText',
				x: 30,
				y: 20,
				text: type
			}, {
				_name: 'text',
				_hide: (comment == ''),
				x: 90,
				y: 20,
				text: '['+comment+']'
			}]
		});
	}

	function arrow(x, y, width, text, isToTheRight, isDotted, isToSelf, isDoubleArrow, isOpen) {
		var r = '<g transform="translate('+x+','+y+')">';
		var lineY = 7+(text.length-1)*20;
		if(isToSelf) {
			r+= template([{
				_name: (isDotted ? 'dottedLine' : 'line'),
				x1: 0,
				y1: lineY,
				x2: 30,
				y2: lineY
			}, {
				_name: (isDotted ? 'dottedLine' : 'line'),
				x1: 30,
				y1: lineY,
				x2: 30,
				y2: lineY+20
			}, {
				_name: (isDotted ? 'dottedLine' : 'line'),
				x1: 30,
				y1: lineY+20,
				x2: 0,
				y2: lineY+20
			}]);
			r+= drawTriangle(0, lineY+20, false, false);
		} else {
			r+= template({
				_name: (isDotted ? 'dottedLine' : 'line'),
				x1: 0,
				y1: lineY,
				x2: (partSize+interPart)*width,
				y2: lineY
			});
			if(isDoubleArrow) {
				r+= drawTriangle((partSize+interPart)*width, lineY, true, isOpen);
				r+= drawTriangle(0, lineY, false, isOpen);
			} else {
				r+= drawTriangle((isToTheRight ? (partSize+interPart)*width : 0), lineY, isToTheRight, isOpen);
			}
		}
		for(var i in text) {
			r+= template({
				_name: 'centeredText',
				x: (partSize+interPart)*width/2,
				y: i*20,
				text: text[i]
			});
		}
		r+='</g>';
		return r;
	}


	//Model -----------------------------------------------------------------------

	function filter(text) {
		return text.replace(/</g, "&lt;");
	}

	//Participant

	function Participant(name, text) {
		this.name = name;
		if(text == undefined) {
			this.text = name.split("\\n");
		} else {
			this.text = text.split("\\n");
		}
		this.height = this.text.length*20+10+30;
		this.position = 0;
	
		this.getSVG = function(height) {
			return actor((partSize+interPart)*this.position+5, 5, height, this.text);
		}
	}

	//Signal

	function Signal(participant1, participant2, text, isDotted, isDoubleArrow, isOpen) {
		this.participant1 = participant1;
		this.participant2 = participant2;
		this.text = text.split("\\n");
		this.isDotted = isDotted;
		this.height = this.text.length*20+10;
		if(participant1.name == participant2.name) {
			this.height += 20;
		}
	
		this.getHeight = function() {
			return this.height;
		}
	
		this.getSVG = function(position, width) {
			var minPosition = Math.min(this.participant1.position,
					this.participant2.position);
			return arrow(minPosition*(partSize+interPart)+5+partSize/2,
					position+10,
					Math.abs(this.participant1.position
						- this.participant2.position),
					this.text,
					minPosition == this.participant1.position,
					this.isDotted,
					participant1.name == participant2.name,
					isDoubleArrow,
					isOpen);
		}
	}

	//Else clause

	function Else(condition, parent) {
		this.parent = parent;   // We will get the depth from there.
		this.text = condition;  // A list of string defining the condition.
		this.height = 30;
	}

	Else.prototype.getHeight = function() {
		return this.height;
	}

	Else.prototype.getSVG = function(position, width) {
		var left = 10*(this.parent.getDepth()+2);
		return template([{
				_name: 'dottedLine',
				x1: left,
				y1: position,
				x2: left + width - left*2,
				y2: position
			}, {
				_name: 'text',
				x: left + 90,
				y: position + 20,
				text: '[' + this.text + ']'
			}]);
	}

	//State

	function State(participant, text) {
		this.participant = participant;
		this.text = text.split("\\n");
		this.height = this.text.length*20+15;
	
		this.getHeight = function() {
			return this.height;
		}
	
		this.getSVG = function(position, width) {
			return rectWithText(
					this.participant.position*(partSize+interPart)+5,
					position,
					this.text,
					false);
		}
	}

	//Container

	function Container(parent) {
		this.children = [];
		this.height = 0;
		this.parent = parent;
		this.depth = 0;
		if(parent != null) {
			this.depth = parent.getDepth()+1;
		}
	}

	Container.prototype.getDepth = function() {
		return this.depth;
	}

	Container.prototype.getParent = function() {
		return this.parent;
	}

	Container.prototype.addSignal = function(signal) {
		this.children.push(signal);
	}

	Container.prototype.getHeight = function() {
		var height = this.height;
		for(var i in this.children) {
			height += this.children[i].getHeight();
		}
		return height;
	}

	Container.prototype.getSVG = function(position, width) {
		var svg = "";
		for(var i in this.children) {
			svg += this.children[i].getSVG(position, width);
			position += this.children[i].getHeight();
		}
		return svg;
	}

	//Parallel container

	function ParallelContainer(parent) {
		Container.call(this, parent);
	}

	ParallelContainer.prototype = new Container();

	ParallelContainer.prototype.getHeight = function() {
		for(var i in this.children) {
			if(this.children[i].getHeight() > this.height) {
				this.height = this.children[i].getHeight();
			}
		}
		return this.height;
	}

	ParallelContainer.prototype.getSVG = function(position, width) {
		var svg = "";
		for(var i in this.children) {
			svg += this.children[i].getSVG(position + this.height - this.children[i].getHeight());
		}
		return svg;
	}

	//Loop container

	function SimpleContainer(parent, type, times) {
		Container.call(this, parent);
		this.height = 60;
		this.times = times;
		this.type = type;
	}

	SimpleContainer.prototype = new Container();

	SimpleContainer.prototype.getHeight = function() {
		var height = this.height;
		for(var i in this.children) {
			height += this.children[i].getHeight();
		}
		return height;
	}

	SimpleContainer.prototype.getSVG = function(position, width) {
		var svg = "";
		svg += specialRectangle(10*(this.getDepth()+1),
				position,
				width-((this.getDepth()+1)*2*10),
				this.getHeight()-10,
				this.type,
				(this.times == "" ? "" : this.times));
		position += 50;
		for(var i in this.children) {
			svg += this.children[i].getSVG(position, width);
			position += this.children[i].getHeight();
		}
		return svg;
	}

	//Alt container

	function AltContainer(parent, type, cond) {
		SimpleContainer.call(this, parent, type, "");
		this.condition = cond;
	}

	AltContainer.prototype = new SimpleContainer();

	AltContainer.prototype.getSVG = function(position, width) {
		var svg = "";
		svg += specialRectangle(10*(this.getDepth()+1),
				position,
				width-((this.getDepth()+1)*2*10),
				this.getHeight()-10,
				this.type,
				this.condition);
		position += 50;
		for(var i in this.children) {
			svg += this.children[i].getSVG(position, width);
			position += this.children[i].getHeight();
		}
		return svg;
	}

	//Schema

	function Schema() {
		this.participants = [];
		this.signals = new Container(null);
		this.patterns = [
			['^[ \t]*participant[ ]*"([^"]*)"[ ]*as[ ]*"?([^"]*)"?$',
				2,
				function(res) {
					this.addParticipant(new Participant(res[2], res[1]));
				}],
			['^[ \t]*participant[ ]*"?([^"]*)"?$',
				1,
				function(res) {
					this.addParticipant(new Participant(res[1]));
				}],
			['^[ \t]*parallel[ ]*{[ ]*$',
				0,
				function(res) {
					var p = new ParallelContainer(this.signals);
					this.addSignal(p);
					this.signals = p;
				}],
			['^[ \t]*}[ ]*$',
				0,
				function(res) {
					if(!(this.signals instanceof ParallelContainer)) {
						return true; //Error
					} else {
						this.signals = this.signals.getParent();
					}
				}],
			['^[ \t]*opt[ ]*$',
				0,
				function(res) {
					var p = new SimpleContainer(this.signals, "opt", "");
					this.addSignal(p);
					this.signals = p;
				}],
			['^[ \t]*loop[ ]*(\.+)$',
				1,
				function(res) {
					var p = new SimpleContainer(this.signals, "loop", res[1]);
					this.addSignal(p);
					this.signals = p;
				}],
			['[ \t]*alt[ ]*(.+)[ ]*$',
				1,
				function(res) {
					var p = new AltContainer(this.signals, "alt", res[1]);
					this.addSignal(p);
					this.signals = p;
				}],
			['[ \t]*else[ ]*(.+)[ ]*$',
				1,
				function(res) {
					if(!(this.signals instanceof AltContainer)) { res[0]=null; }
					else { this.addSignal(new Else(res[1], this.signals.getParent())); }
				}],
			['^[ \t]*end[ ]*$',
				0,
				function(res) {
					if(!(this.signals instanceof SimpleContainer)) {
						return true; //Error
					} else {
						this.signals = this.signals.getParent();
					}
				}],
			['^[ \t]*autonumber[ ]*([0-9]+)[ ]*$',
				1,
				function(res) {
					this.autonumber = res[1];
				}],
			['^[ \t]*autonumber[ ]*off[ ]*$',
				0,
				function(res) {
					this.autonumber = null;
				}],
			['^[ \t]*state[ ]*over[ ]*([^: ]*)[ ]*:[ ]*(.*)$',
				2,
				function(res) {
					this.addParticipant(new Participant(res[1]));
					this.addSignal(new State(this.getParticipant(res[1]), res[2]));
				}],
			['^[ \t]*([^- <]*)[ ]*(<)?(-)?->(>)?[ ]*([^: ]*)[ ]*:[ ]*(.*)$',
				6,
				function(res) {
					this.addParticipant(new Participant(res[1]));
					this.addParticipant(new Participant(res[5]));
					this.addSignal(new Signal(
						this.getParticipant(res[1]),
						this.getParticipant(res[5]),
						res[6],
						res[3] == '-',
						res[2] == '<',
						res[4] == '>' //open
					));
				}],
			['^#\.*$', 0, function(res) {}], //Comment
			['^[ \t]*$', 0, function(res) {}] //Blank line
		];
		this.autonumber = null;
		for(var i in this.patterns) {
			this.patterns[i][0] = new RegExp(this.patterns[i][0]);
		}
	
		this.addParticipant = function(participant) {
			found = false;
			for(var i in this.participants) {
				if(this.participants[i].name === participant.name) {
					found = true;
					break;
				}
			}
			if(!found) {
				this.participants.push(participant);
			}
		}
	
		this.addSignal = function(signal) {
			if(this.autonumber != null
					&& signal.text != undefined
					&& !(signal instanceof State)) {
				signal.text[0] = "["+this.autonumber+"] " + signal.text[0];
				this.autonumber++;
			}
			if(this.parallel != null) {
				this.parallel.addSignal(signal);
			} else {
				this.signals.addSignal(signal);
			}
		}
	
		this.getParticipant = function(name) {
			for(var i in this.participants) {
				if(this.participants[i].name === name) {
					return this.participants[i];
				}
			}
			return null;
		}
	
		this.parseLines = function(lines) {
			var retour = "";
			var tab = lines.split("\n");
			for(var i in tab) {
				var found = this.parseLine(tab[i]);
				if(!found) {
					retour += 'E: line ' + (parseInt(i)+1) + '<br/>';
				}
			}
			if(this.signals.getParent() != null) {
				retour += 'E: missing closing \'end\' tag before the end of the code<br/>';
			}
			return retour;
		}
	
		this.parseLine = function(line) {
			for(var i in this.patterns) {
				var res = this.patterns[i][0].exec(line);
				if(res != null && res.length-1 == this.patterns[i][1]) {
					var error = this.patterns[i][2].call(this, res);
					if(!error) return true;
				}
			}
			return false;
		}
	
		this.getSVG = function() {
			var svg = '';
		
			//Calculate the height
			var heightParticipants = 0;
			for(var i in this.participants) {
				if(this.participants[i].height > heightParticipants) {
					heightParticipants = this.participants[i].height;
				}
			}
			var height = heightParticipants;
			height += this.signals.getHeight();
		
			var width = (this.participants.length * (partSize+interPart)) - interPart + 10;
		
			for(var i in this.participants) {
				this.participants[i].position = i;
				svg += this.participants[i].getSVG(height);
			}
			height += heightParticipants;
			svg += this.signals.getSVG(heightParticipants, width);
			
			if(!svg) return 'Nothing to draw yet.';
		
			return template({
				_name: 'document',
				width: width,
				height: height+10,
				defs: {
					_name: 'gradient',
					id: 'grad1'
				},
				svg: {
					_text: svg
				}
			});
			
		}
	}
	
	//Public API
	
	var parse = function(text, destinationId) {
		console.time('parseTime');
		var _schema = new Schema();
		var _errors = _schema.parseLines(text);
		document.getElementById(destinationId).innerHTML = _schema.getSVG();
		console.timeEnd('parseTime');
		return _errors;
	};
	
	var api = {parse: parse};
	if(typeof module != 'undefined') module.exports = api;
	return api;
})();
