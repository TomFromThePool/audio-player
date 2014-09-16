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

        var createTrack = function(src, name){
            return $("<li>").audioTrack({src: src, name: name});
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
             settings.tracks[i] = createTrack(settings.tracks[i].src, settings.tracks[i].name);
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
                  el.trigger("playlist::track-selected", [t.audioTrack("src"), t.audioTrack("name")]);
              } else{
                  throw "IDX must be a valid track index.";
              }
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
                 el.trigger("track::selected", [settings.src, settings.name]);
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
      jQuery plugin for the player itself
    **/
    $.fn.audioPlayer = function(method){
       var el = this;
        var tracks= [];
        var current = -1;
        var player;
        var playlist;
        var settings = el.data("settings");

        if(settings == undefined){
            settings = $.extend({
                autoPlay: false,
                tracks: [],
                controls: true,
                listContainer: null
            }, {});
        }

        var saveSettings = function(){
            el.data("settings", settings);
        };

        var play = function(src, name){
            setTrack(src);
            setNowPlaying(name);
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

        var setNowPlaying = function(trackName){
            el.find(".audio-player-now-playing").text(trackName);
        };

        var getControls = function(){
            var c = $("<div>").addClass("audio-controls");
            player = $("<audio>");

            if(settings.controls){
              player.attr("controls", true);
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


        var createTrack = function(src, name){
            return $("<div>").audioTrack({src: src, name: name});
        };

        var trackSelected = function(event, src, name){
            play(src, name);
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
