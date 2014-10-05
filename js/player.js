(function($){

    /*
      Playlist plugin - controls all playlist functionality and triggers
      events based on user interaction

      This plugin must be provided with a container element at the very least. If the container
      is an empty element, then a default UI will be generated and used. Alternatively,
      the following elements must be present within the container element in order to function:

      .audio-playlist-tools - Container for the playlist tools
        .audio-playlist-prev - Previous button
        .audio-playlist-next - Next button
      .audio-playlist - Container for the list of tracks itself. This should be a HTML list element.
    */
    $.fn.playlist = function(method){
        var el = this;
        var settings = el.data("settings");
        var playlist;

        if(settings == undefined){
            settings = $.extend({
               current: -1,
               tracks: []
            }, {});
        }

        var saveSettings = function(){
            el.data("settings", settings);
        };

        var createTrack = function(src, name, artist){
            return $("<li>").audioTrack({src: src, name: name, artist: artist});
        };

        /**
          Check whether tools container exists - and if not, create it.

          Tools container will not be created if settings contains BOTH prevButton and nextButton
        **/
        var getToolsContainer = function(){
          var tools;
          if((!settings.prevButton && !settings.nextButton) || (settings.prevButton == undefined || settings.nextButton == undefined || settings.prevButton == null || settings.nextButton == null)){
            var tC = el.find(".audio-playlist-tools");
            var tools;
            if(tC.length == 0){
              tools = $("<ul>").addClass("audio-playlist-tools").addClass("clearfix");
              el.append(tools);
            } else{
              tools = $(tC.get(0));
            }
          }

          getPrevButton(tools);
          getNextButton(tools);
        };

        /**
          Check whether next button exists already, and if not, create it.

          This will be overridden if an element is passed into settings called 'nextButton'
        **/
        var getNextButton = function(tools){
          var next;

          if(tools != undefined && tools != null && (!settings.nextButton || settings.nextButton == undefined || settings.nextButton == null)){
            var nB = tools.find(".audio-playlist-next");
            if(nB.length == 0){
              next = $("<li>").addClass("audio-playlist-next").html("Next &raquo;");
              tools.append(next);
            } else{
              next = $(nB.get(0));
            }
          } else{
            next = settings.nextButton
          }
          next.click(methods.next);
          next.addClass("audio-playlist-tool");
          return next;
        };

        /**
          Check whether prev button exists, and if not, create it.
          This will be overridden if an element is passed into settings called 'prevButton'
        **/
        var getPrevButton = function(tools){
          var prev;
          if(tools != undefined && tools != null && (!settings.prevButton || settings.prevButton == undefined || settings.prevButton == null)){ //Assume a jQuery object suffices
            var pB = tools.find(".audio-playlist-prev");
            if(pB.length == 0){
              prev = $("<li>").addClass("audio-playlist-prev").html("&laquo; Prev");
              tools.append(prev);
            } else{
              prev = $(pB.get(0));
            }
          } else{
            prev = settings.prevButton;
          }

          prev.click(methods.previous);
          prev.addClass("audio-playlist-tool");
          return prev;
        };

        /**
          Check whether playlist exists, and if not, create it.
          This will be overridden if an element is passed into settings called 'listContainer'
        **/
        var getList = function(){
          var list = $("<ol>").addClass("audio-playlist");
          if(!settings.listContainer || settings.listContainer == undefined || settings.listContainer == null){
            el.append(list);
            settings.listContainer = el;
            return list;
          } else{
            settings.listContainer.append(list);
            return list;
          }
        };

        /**
          Initialise the user interface and set the playlist var
        **/
        var initUI = function(){
            el.addClass("audio-playlist-container");
            getToolsContainer();
            playlist = getList();
        };

        /**
          Set up the playlist based on the tracks in the settings object
        **/
        var setupList = function(){
           for(var i = 0; i < settings.tracks.length; i++){
             settings.tracks[i] = createTrack(settings.tracks[i].src, settings.tracks[i].name, settings.tracks[i].artist);
               playlist.append(settings.tracks[i]);
            }
        };

        /**
          Retrieve the index of the track with the given src
        **/
        var getTrackIndex = function(src){
            var idx = -1;
            for(var i = 0; i < settings.tracks.length; i++){
                if(settings.tracks[i].audioTrack("src") == src){
                    idx = i;
                    break;
                }
            }
            return idx;
        };

        /**
          Handle the track selected event
        **/
        var trackSelected = function(event, src, name){
            methods.setCurrent(src);
        };

        var methods = {
          init: function(options){
              settings = $.extend(settings, options);
              initUI();
              setupList();
              saveSettings();
              settings.listContainer.on("track::selected", trackSelected);
          },
          /**
            Start playing the next track in the playlist.
            This function is cyclical - if the next index is out of bounds, the index is reset to 0.
          **/
          next: function(){
              //Cyclical!
              var nextIdx = settings.current + 1;
              if(nextIdx >= settings.tracks.length){
                nextIdx = 0;
              }
              methods.setCurrentIndex(nextIdx);
           },
          /**
            Start playing the previous track in the playlist.
            This function is cyclical - if the next index is out of bounds, the index is reset to settings.tracks.length - 1
          **/
          previous: function(){
              //Cyclical!
              var prevIdx = settings.current - 1;
              if(prevIdx < 0){
                  prevIdx = settings.tracks.length - 1;
              }
              methods.setCurrentIndex(prevIdx);
          },
          /**
            Set the current track. The track must already exist - you cannot add a new track via this method.
          **/
          setCurrent: function(src){
              methods.setCurrentIndex(getTrackIndex(src));
          },
          /**
            Set the current track index.
          **/
          setCurrentIndex: function(idx){
              if(idx >= 0 && idx < settings.tracks.length){
                  settings.current = idx;
                  var t = settings.tracks[settings.current];
                  saveSettings();
                  for(var i = 0; i < settings.tracks.length; i++){
                      if(i != settings.current){
                          settings.tracks[i].audioTrack("deselect");
                      } else{
                          settings.tracks[i].audioTrack("select");
                      }
                  }
                  el.trigger("playlist::track-selected", [t.audioTrack("src"), t.audioTrack("name"), t.audioTrack("artist")]);
              } else{
                  throw "IDX must be a valid track index.";
              }
          },
          getCurrentIndex: function(){
            return settings.current;
          }
        };

        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.playlist' );
        }

    };

    /**
      jQuery plugin representing a single audio track.
    **/
    $.fn.audioTrack = function(method){
      var el = this;
      var settings = el.data("settings");

        if(settings == undefined){
            $.extend({
                name: undefined,
                artist: undefined,
                src: undefined
            }, {});
        }

      var fileNameWithExtension = /[^\\/]+\.[^\\/]+$/;
      var fileNameNoExtension = /([^\/]+)(?=\.\w+$)/;
      var setTrack = function(src){
          if(!settings.name || settings.name == undefined){
            settings.name = (src.match(fileNameNoExtension) || []).pop();
          }
          el.text(settings.name);
      };

        var saveSettings = function(){
            el.data("settings", settings);
        };

      var methods = {
          init: function(options){
              el.addClass("audio-track");
              settings = $.extend(settings, options);
              setTrack(settings.src, settings.name);
              saveSettings();
              el.click(function(){
                 el.trigger("track::selected", [settings.src, settings.name, settings.artist]);
              });
              return el;
          },
          src: function(src){
              if(src){
                  settings.src = src;
                  setTrack(settings.src);
                  saveSettings();
              }
            return settings.src;
          },
          name: function(){
            return settings.name;
          },
          artist: function(){
            return settings.artist;
          },
          /** May end up moving the select and deselect functions out of here **/
          select: function(){
            el.addClass("selected-track");
          },
          deselect: function(){
           el.removeClass("selected-track");
          }
        };

        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.audioTrack' );
        }
    };

    /**
      Plugin to handle a play / pause button. By default, this presents a single button which flips between states.
    **/
    $.fn.playPauseButton = function(method){
      var el = this;
      var settings = el.data("settings");

      if(settings == undefined){
          settings = $.extend({
            player: null,
            playText: "&#9658;",
            pauseText: "||"
          });
      }

      var togglePlayback = function(){
        if(settings.playerRaw.paused){
          settings.playerRaw.play();
          el.trigger("playpause:play");
        } else{
          settings.playerRaw.pause();
          el.trigger("playpause:pause");
        }
        setupButton();

        //Fire toggle event
        el.trigger("playpause:toggled");
      };

      var setupButton = function(){
        if(settings.button == undefined || settings.button == null){
            //Add button
            settings.button = $("<span>").addClass("toggle-button");
            settings.player.on("play", setupButton);
            settings.player.on("pause", setupButton);
            el.append(settings.button);
        }

        if(settings.playerRaw.paused){
          settings.button.removeClass("playing");
          settings.button.addClass("paused");
          settings.button.html(settings.playText);
        } else{
          settings.button.removeClass("paused");
          settings.button.addClass("playing");
          settings.button.html(settings.pauseText);
        }
      };

      var methods = {
        init: function(options){
          if(options.player == undefined || options.player == null){
            throw "You must specify the HTML5 audio player element.";
          } else{
            el.addClass("audio-player-playback-toggle");
            settings = $.extend(settings, options);
            settings.playerRaw = settings.player.get(0);
            setupButton();

            el.click(togglePlayback);
          }
          return el;
        }
      };

      if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof method === 'object' || ! method ) {
          // Default to "init"
          return methods.init.apply( this, arguments );
      } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.playPauseButton' );
      }
    };

    /**
      See http://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss
    **/
    String.prototype.toHHMMSS = function () {
      var sec_num = parseInt(this, 10); // don't forget the second param
      var hours   = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
      var seconds = sec_num - (hours * 3600) - (minutes * 60);

      if (hours   < 10) {hours   = "0"+hours;}
      if (minutes < 10) {minutes = "0"+minutes;}
      if (seconds < 10) {seconds = "0"+seconds;}
      var time    = hours+':'+minutes+':'+seconds;
      return time;
    };

    /**
      Plugin to handle a volume controller
    **/
    $.fn.audioVolume = function(method){
      var el = this;
      var settings = el.data("settings");
      var updater;
      var performUpdate = false;

      var setVolumeDisplay = function(){
        settings.volumeBar.css("width", (settings.playerRaw.volume / 1 * 100) + "%");
      };

      var setupBody = function(){
        if(settings.volumeBar == undefined || settings.volumeBar == null){
          settings.volumeBar = $("<div>").addClass("audio-player-volume-bar");
          el.append(settings.volumeBar);
        }
        setVolumeDisplay();
      };

      var setVolumeFromMouse = function(e){
        var posX = e.offsetX;
        var pc = posX / el.width();

        setVolume(pc);
        settings.setVolumeDisplay();
      };

      var setVolume = function(volume){
        settings.playerRaw.volume = volume;
      };

      var methods = {
        init: function(options){
          if(options.player == undefined || options.player == null){
            throw "You must specify the HTML5 audio player element.";
          } else{
            el.addClass("audio-player-volume");
            settings = $.extend(settings, options);
            settings.playerRaw = settings.player.get(0);
            el.click(setVolumeFromMouse);
            setupBody();
          }
          return el;
        }
      };

      if(settings == undefined){
        settings = $.extend({
          player: null,
          setVolumeDisplay: setVolumeDisplay
        }, {});
      }

      if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof method === 'object' || ! method ) {
          // Default to "init"
          return methods.init.apply( this, arguments );
      } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.audioVolume' );
      }

    };

    /**
      Plugin to handle the playback timer / counter
    **/
    $.fn.audioCounter = function(method){
      var el = this;
      var updater;
      var performUpdate = false;
      var counter;

      var settings = el.data("settings");

      var updateProgress = function(force){
        if(force || performUpdate){
          setBody();
        }
      };

      var onPlay = function(){
        performUpdate = true;
        updateProgress();
      };

      var onPause = function(){
        performUpdate = false;
      };

      var setBody = function(){
        if(counter == undefined || counter == null){
          counter = $("<span>").addClass("audio-counter-time");
          el.append(counter);
        }
        counter.text(settings.playerRaw.currentTime.toString().toHHMMSS());
      };

      var methods = {
        init: function(options){
          if(options.player == undefined || options.player == null){
            throw "You must specify the HTML5 audio player element.";
          } else{
            el.addClass("audio-counter");
            settings = $.extend(settings, options);
            settings.playerRaw = settings.player.get(0);
            settings.player.on("play", onPlay);
            settings.player.on("pause", onPause);
            updater = setInterval(settings.updateProgress, 100);
            performUpdate = true;

            el.data("settings", settings);
          }
          return el;
        },
        updateProgress: function(){
            settings.updateProgress();
        }
      };

      if(settings == undefined){
        settings = $.extend({
          player: null,
          updateProgress: updateProgress
        }, {});
      }

      if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof method === 'object' || ! method ) {
          // Default to "init"
          return methods.init.apply( this, arguments );
      } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.audioCounter' );
      }
    };

    /** Simple plugin to handle the audio scrubber **/
    $.fn.audioScrubber = function(method){
      var el = this;

      var settings = el.data("settings");

      var updater = null;
      var updateInterval = 5; //Scrubber update interval in seconds
      var performUpdate = false;

      /** Calculate progress and update scrubber **/
      var updateProgress = function(force){
        if(force || performUpdate){
          if(settings.progressBar == null){
            settings.progressBar = $("<div>").addClass("audio-scrubber-progress").css("width", "0%");
            settings.counter = $("<div>").audioCounter({ player: settings.player });
            el.append(settings.progressBar);
            el.append(settings.counter);
          }

          var max = settings.playerRaw.duration;
          var cur = settings.playerRaw.currentTime;
          var pcComplete = (cur / max) * 100;

          settings.progressBar.css("width", pcComplete + "%");
        }
      };

      var setPositionFromMouse = function(e){
        var posX = e.offsetX;
        var pc = posX / el.width();
        seekTo(Math.floor(pc * settings.playerRaw.duration));
        settings.updateProgress(true);
      };

      var seekTo = function(time){
        var preseekTime = settings.playerRaw.currentTime;
        settings.playerRaw.currentTime = time;
        el.trigger("audioscrubber:seek", [preseekTime, settings.playerRaw.currentTime]); //Send the time pre-seek, and post-seek
      };

      var onPlay = function(){
        performUpdate = true;
        updateProgress();
      };

      var onPause = function(){
        performUpdate = false;
      };

      var methods = {
        init: function(options){
          if(options.player == undefined || options.player == null){
            throw "You must specify the HTML5 audio player element.";
          } else{
            el.addClass("audio-scrubber");
            settings = $.extend(settings, options);
            settings.playerRaw = settings.player.get(0);
            settings.player.on("play", onPlay);
            settings.player.on("pause", onPause);
            updater = setInterval(updateProgress, 1000);
            performUpdate = true;

            el.click(setPositionFromMouse);
            el.data("settings", settings);
          }
          return el;
        },
        updateProgress: function(){
            settings.updateProgress();
        }
      };

      if(settings == undefined){
        settings = $.extend({
          player: null,
          progressBar: null,
          updateProgress: updateProgress
        }, {});
      }

      if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof method === 'object' || ! method ) {
          // Default to "init"
          return methods.init.apply( this, arguments );
      } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.audioScrubber' );
      }
    };

    /**
      jQuery plugin for the player itself
    **/
    $.fn.audioPlayer = function(method){
       var el = this;
        var tracks= [];
        var current = -1;
        var player;
        var playlist;
        var settings = el.data("settings");
        var playPause;
        var scrubber;
        var volume;

        if(settings == undefined){
            settings = $.extend({
                autoPlay: false,
                tracks: [],
                controls: false,
                listContainer: null,
                nextButton: null,
                prevButton: null
            }, {});
        }

        var saveSettings = function(){
            el.data("settings", settings);
        };

        var play = function(src, name, artist){
            setTrack(src);
            setNowPlaying(artist, name);
            getPlayer().get(0).play();
        };

        var getPlayer = function(){
            return el.find("audio");
        };

        var setTrack = function(src){
            var p = getPlayer();
            p.get(0).pause();
            p.attr("src", src);
        };

        var setBody = function(){
            el.empty();
            var nowPlaying = getNowPlaying();
            el.append(nowPlaying);

            var controls = getControls();
            el.append(controls);

            var playlistContainer = getPlaylist();
            playlist = playlistContainer;
            playlist.on("playlist::track-selected", trackSelected);
            //el.append(playlistContainer);
        };

        var getNowPlaying = function(){
          var n = $("<div>").addClass("audio-player-now-playing");
          return n;
        };

        var setNowPlaying = function(artist, trackName){
          var p = el.find(".audio-player-now-playing");
          if(artist){
            p.text(artist + " - " + trackName);
          } else{
            p.text(trackName);
          }
        };

        var playClicked = function(){
          if(playlist){
            if(playlist.playlist("getCurrentIndex") < 0){
              playlist.playlist("next");
            }
          }
        };

        var pauseClicked = function(){

        };

        var playPauseToggled = function(){

        };

        var seek = function(){

        };

        var getControls = function(){
            var c = $("<div>").addClass("audio-controls clearfix");
            player = $("<audio>");

            if(settings.controls){
              player.attr("controls", true);
            } else{
              //Generate custom controls
              playPause = $("<div>").playPauseButton({player: player});
              c.append(playPause);
              playPause.on("playpause:play", playClicked);
              playPause.on("playpause:pause", pauseClicked);
              playPause.on("playpause:toggle", playPauseToggled);

              scrubber = $("<div>").audioScrubber({ player: player});
              scrubber.on("audioscrubber:seek", seek);
              c.append(scrubber);

              volume = $("<div>").audioVolume({player: player});
              c.append(volume);
            }

            player.on("ended", nextTrack);
            c.append(player);
            return c;
        };

        var nextTrack = function(){
            playlist.playlist("next");
        };

        var previousTrack = function(){
            playlist.playlist("previous");
        };

        var togglePlaylist = function(){
          if(playlist.is(":hidden")){
            playlist.show(100);
          } else{
              playlist.hide(100);
          }
        };

        var getPlaylist = function(){
          var c;
          if(settings.listContainer && settings.listContainer != undefined && settings.listContainer != null && settings.listContainer.length > 0){
            c = settings.listContainer;
          } else{
            c = $("<div>");
            el.append(c);
          }
          //Call playlist on container
          c.playlist({ tracks: settings.tracks, listContainer: settings.listContainer, nextButton: settings.nextButton, prevButton: settings.prevButton });
          return c;
        };


        var createTrack = function(src, name, artist){
            return $("<div>").audioTrack({src: src, name: name, artist: artist});
        };

        var trackSelected = function(event, src, name, artist){
            play(src, name, artist);
        };

        var methods = {
          init: function(options){
              el.addClass("audio-player");
              settings = $.extend(settings, options);
              saveSettings();
              setBody();

              if(settings.autoPlay){
                play(0);
              }
              return el;
          }
        };

        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.audioPlayer' );
        }
    };
})(jQuery);
