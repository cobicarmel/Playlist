'use strict';

var Playlist = function(userSettings){

	var settings = {},
		elements = {},
		playList = {},
		variables = {},
		self = this;

	var init = function(){

		initSettings();

		initElements();

		attachEvents();

		initVariables();

		initPlaylist();

		adjustArrowsView();
	};

	var adjustArrowsView = function(){

		var directions = ['prev', 'next'];

		directions.forEach(function(direction){

			var $arrow = elements.arrows['$' + direction],
				checkHave = 'have' + direction.capitalize(),
				operation = self[checkHave]() || settings.allowLoop ? 'remove' : 'add';

			$arrow[operation + 'Class'](settings.classes.disabled);
		});
	};

	var adjustActiveView = function(e){

		var operation = e.type == 'canplay' ? 'remove' : 'add';

		elements.$play[operation + 'Class'](settings.classes.loading);
	};

	var adjustPlayView = function(){

		var operation = elements.$video[0].paused ? 'remove' : 'add';

		elements.$play[operation + 'Class'](settings.classes.playing);
	};

	var attachEvents = function(){

		elements.$play.on('click', self.togglePlay);

		elements.arrows.$next.on('click', self.next);

		elements.arrows.$prev.on('click', self.prev);

		elements.$video.on({
			click: self.togglePlay,
			'playing pause emptied': adjustPlayView,
			'startload canplay' : adjustActiveView,
			ended: function(){

				var haveNext = self.haveNext();

				if(settings.autoPlay){

					next();

					prepareVideo();

					if(haveNext)
						playVideo();
				}
			}
		});
	};

	var changeUIState = function(isActive){

		var operation = (isActive ? 'remove' : 'add') + 'Class';

		var classAttaching = function(object){

			$.each(object, function(){

				if(! (this instanceof $))
					return classAttaching(this);

				this[operation](settings.classes.inactive);
			});
		};

		classAttaching(elements);
	};

	var getDefaultElements = function(){

		var selectors = settings.selectors;

		return {
			$video: $(selectors.video),
			arrows: {
				$prev: $(selectors.arrows.prev),
				$next: $(selectors.arrows.next)
			},
			$play: $(selectors.play)
		};
	};

	var getDefaultSettings = function(){

		return {
			allowLoop: true,
			autoPlay: true,
			selectors: {
				video: '#video',
				arrows: {
					prev: '.prev',
					next: '.next'
				},
				play: '.play',
				playlist: {}
			},
			classes: {
				playing: 'playing',
				disabled: 'disabled',
				inactive: 'inactive',
				loading: 'loading'
			}
		};
	};

	var initElements = function(){

		elements = getDefaultElements();
	};

	var initPlaylist = function(){

		self.setPosterVideo(settings.posterVideo);

		prepareVideo();

		$.each(settings.playlist, function(key, value){

			self.addVideo(key, value);
		});
	};

	var initSettings = function(){

		var defaultSettings = getDefaultSettings();

		$.extend(true, settings, defaultSettings, userSettings);
	};

	var initVariables = function(){

		variables.playlistIterator = 0;

		variables.hashMap = [];

		variables.isActive = true;
	};

	var next = function(){

		if(self.haveNext())
			variables.playlistIterator++;
		else variables.playlistIterator = 0;
	};

	var playVideo = function(){

		var video = elements.$video[0];

		video.play();
	};

	var prepareVideo = function(){

		elements.$video.attr('src', self.getCurrentVideo());

		adjustArrowsView();
	};

	var prev = function(){

		if(self.havePrev())
			variables.playlistIterator--;
		else if(settings.allowLoop)
			variables.playlistIterator = self.getPlaylistLength() - 1;
	};

	var setIterator = function(key){

		var videoIndex = variables.hashMap.indexOf(+key);

		if(!~videoIndex)
			return false;

		variables.playlistIterator = videoIndex;

		return true;
	};

	this.addVideo = function(key, src){

		var haveVideo = self.haveVideo();

		key = +key; // Converting to number

		var i = variables.hashMap.length;

		if(!i)
			variables.hashMap.push(key);
		else {

			do {
				i--
			}
			while(variables.hashMap[i] > key);

			if(i < 0)
				variables.hashMap.unshift(key);
			else if(variables.hashMap[i] < key)
				variables.hashMap.splice(i + 1, 0, key);
		}

		playList[key] = src;

		adjustArrowsView();

		if(! haveVideo) // Maybe currently poster video is appears
			prepareVideo();
	};

	this.deactivate = function(){

		variables.isActive = false;

		changeUIState(false);
	};

	this.activate = function(){

		variables.isActive = true;

		changeUIState(true);
	};

	this.getCurrentVideo = function(){

		if(! self.haveVideo())
			return variables.posterVideo;

		var key = variables.hashMap[variables.playlistIterator];

		return playList[key];
	};

	this.getElements = function(element){

		if(element)
			return elements[element];

		return elements;
	};

	this.getPlaylist = function(){

		return Object.create(playList);
	};

	this.getPlaylistLength = function(){

		return variables.hashMap.length;
	};

	this.getSettings = function(setting){

		if(setting)
			return settings[setting];

		return settings;
	};

	this.getVariables = function(variable){

		if(variable)
			return variables[variable];

		return variables;
	};

	this.goToVideo = function(key, play){

		if(! setIterator(key))
			return;

		prepareVideo();

		if(play)
			playVideo();
	};

	this.haveNext = function(){

		return variables.playlistIterator + 1 < self.getPlaylistLength();
	};

	this.havePrev = function(){

		return variables.playlistIterator > 0;
	};

	this.haveVideo = function(){

		return variables.playlistIterator < self.getPlaylistLength();
	};

	this.next = function(keepCurrentState){

		next();

		if(keepCurrentState === undefined)
			keepCurrentState = true;

		self.play(keepCurrentState);
	};

	this.prev = function(keepCurrentState){

		prev();

		if(keepCurrentState === undefined)
			keepCurrentState = true;

		self.play(keepCurrentState);
	};

	this.play = function(keepCurrentState){

		var video = elements.$video[0],
			isPaused = video.paused;

		prepareVideo();

		if((!keepCurrentState) || !isPaused)
			playVideo();
	};

	this.removeVideo = function(key){

		var videoPosition = variables.hashMap.indexOf(key);

		if(!~videoPosition)
			return;

		variables.hashMap.splice(videoPosition, 1);

		delete playList[key];

		adjustArrowsView();

		prepareVideo();
	};

	this.setPosterVideo = function(src){

		variables.posterVideo = src;
	};

	this.stop = function(){

		var video = elements.$video[0];

		video.pause();
	};

	this.togglePlay = function(){

		if(elements.$video[0].paused)
			self.play();
		else
			self.stop();
	};

	init();
};