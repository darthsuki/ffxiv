$("#passage button").click(function() {
  $("#passage button").addClass('#passage button clicked');
});

Config.saves.id = "ffxiv-seven-minutes-in-heaven";

// Do not type on previously visited passages
Config.macros.typeVisitedPassages = false;

// Change the default skip key to Control (CTRL)
Config.macros.typeSkipKey = " ";

// fontSize: Increase or decrease passage font size by "value" pixels.
window.fontSize = function(value) {
	$("#passages").css("font-size", (parseInt($("#passages").css("font-size")) + value) + "px");
};


Config.saves.autosave = true;
Config.saves.autoload = "";
/* No saving on passages tagged with "nosave". */
config.saves.isAllowed = function () {
	if (tags().contains("nosave")) {
		return false;
	}
	return true;
};

predisplay['set-return-variable'] = function () {
	if (!tags().includes('menu')) {
		State.variables['return'] = passage();
	}
};

window.getInv = function() {
  return state.active.variables.inventory;
}

macros.initInv = {
  handler: function(place, macroName, params, parser) {
    state.active.variables.inventory = [];
  }
};

macros.addToInv = {
  handler: function(place, macroName, params, parser) {
    if (params.length == 0) {
      throwError(place, "<<" + macroName + ">>: no parameters given");
      return;
    }
    if (state.active.variables.inventory.indexOf(params[0]) == -1) {
      state.active.variables.inventory.push(params[0]);
    }
  }
};


macros.removeFromInv = {
  handler: function(place, macroName, params, parser) {
    if (params.length == 0) {
      throwError(place, "<<" + macroName + ">>: no parameters given");
      return;
    }
    var index = state.active.variables.inventory.indexOf(params[0]);
    if (index != -1) {
      state.active.variables.inventory.splice(index, 1);
    }
  }
};

macros.inv = {
  handler: function(place, macroName, params, parser) {
    if (state.active.variables.inventory.length == 0) {
      new Wikifier(place, 'nothing');
    } else {
      new Wikifier(place, state.active.variables.inventory.join(','));
    }
  }
};

macros.invWithLinks = {
  handler: function(place, macroName, params, parser) {
    if (state.active.variables.inventory.length == 0) {
      new Wikifier(place, 'nothing');
    } else {
      new Wikifier(place, '[[' + state.active.variables.inventory.join(']]<br>[[') + ']]');
    }
  }
};



// volume slider, by chapel; for sugarcube 2
// version 1.1 - modified by HiEv for SugarCube v2.28.0+
// For custom CSS for slider use: http://danielstern.ca/range.css/#/

// create namespace
setup.vol = {};

// options object
setup.vol.options = {
	current	 : 5,
	rangeMax : 10,
	step	 : 1
};

setup.vol.last = setup.vol.options.current;
setup.vol.start = setup.vol.last / setup.vol.options.rangeMax;

postdisplay['volume-task'] = function (taskName) {
	delete postdisplay[taskName];
	SimpleAudio.volume(setup.vol.start);
};

!function () {
	$(document).on('input', 'input[name=volume]', function() {
		// grab new volume from input
		var volRef		= setup.vol.options;
		var change		= $('input[name=volume]').val();
		var newVol		= change / volRef.rangeMax;
		volRef.current	= newVol.toFixed(2);
		// change volume; set slider position
		SimpleAudio.volume(newVol);
		setup.vol.last = change;
	});
}();  // jshint ignore:line

Macro.add('volume', {
	handler : function () {
		// set up variables
		var $wrapper  = $(document.createElement('span'));
		var $slider   = $(document.createElement('input'));
		var className = 'macro-' + this.name;
		var volRef    = setup.vol.options;
		// create range input
		$slider
			.attr({
				id    : 'volume-control',
				type  : 'range',
				name  : 'volume',
				min   : '0',
				max   : volRef.rangeMax,
				step  : volRef.step,
				value : setup.vol.last
			}).css('max-width', '154px');
		// class '.macro-volume' and id '#volume-control' for styling
		// output
		$wrapper
			.append($slider)
			.addClass(className)
			.appendTo(this.output);
	}
});


Config.saves.onLoad = function () {
	postrender['restore-audio'] = function (_, taskName) {
		delete postrender[taskName];
		new Wikifier(null, Story.get('AudioLoad').text);
	};
};





(function () {
    // notify.js, by chapel; for sugarcube 2
    // version 1.1.1
    // requires notify.css / notify.min.css

    var DEFAULT_TIME = 2000; // default notification time (in MS)

    var isCssTime = /\d+m?s$/;

    $(document.body).append("<div id='notify'></div>");
    $(document).on(':notify', function (ev) {
        if (ev.message && typeof ev.message === 'string') {
            // trim message
            ev.message.trim();
            // classes
            if (ev.class) {
                if (typeof ev.class === 'string') {
                    ev.class = 'open macro-notify ' + ev.class;
                } else if (Array.isArray(ev.class)) {
                    ev.class = 'open macro-notify ' + ev.class.join(' ');
                } else {
                    ev.class = 'open macro-notify';
                }
            } else {
                ev.class = 'open macro-notify';
            }

            // delay
            if (ev.delay) {
                if (typeof ev.delay !== 'number') {
                    ev.delay = Number(ev.delay);
                }
                if (Number.isNaN(ev.delay)) {
                    ev.delay = DEFAULT_TIME;
                }
            } else {
                ev.delay = DEFAULT_TIME;
            }

            $('#notify')
                .empty()
                .wiki(ev.message)
                .addClass(ev.class);

            setTimeout(function () {
                $('#notify').removeClass();
            }, ev.delay);
        }
    });

    function notify (message, time, classes) {
        if (typeof message !== 'string') {
            return;
        }

        if (typeof time !== 'number') {
            time = false;
        }

        $(document).trigger({
            type    : ':notify',
            message : message,
            delay   : time,
            class   : classes || ''
        });
    }

    // <<notify delay 'classes'>> message <</notify>>
    Macro.add('notify', {
           tags : null,
        handler : function () {

            // set up
            var msg     = this.payload[0].contents,
                time    = false,
                classes = false, i;

            // arguments
            if (this.args.length > 0) {
                var cssTime = isCssTime.test(this.args[0]);
                if (typeof this.args[0] === 'number' || cssTime) {
                    time    = cssTime ? Util.fromCssTime(this.args[0]) : this.args[0];
                    classes = (this.args.length > 1) ? this.args.slice(1).flatten() : false;
                } else {
                    classes = this.args.flatten().join(' ');
                }
            }

            // fire event
            notify(msg, time, classes);

        }
    });

    setup.notify = notify;
}());
