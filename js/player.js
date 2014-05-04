(function($){
    $.fn.playlist = function(method){
        var el = this;
        var settings = el.data("settings");
        
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
            return $("<div>").audioTrack({src: src, name: name});
        };
        
        var setupList = function(){
           for(var i = 0; i < settings.tracks.length; i++){
             settings.tracks[i] = createTrack(settings.tracks[i].src, settings.tracks[i].name);
               el.append(settings.tracks[i]);
            }
        };
        
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
        
        var trackSelected = function(event, src, name){
            methods.setCurrent(src);
        };
        
        var methods = {
          init: function(options){
              settings = $.extend(settings, options);
              setupList();
              el.on("track::selected", trackSelected);
              saveSettings();
          },
            next: function(){
                //Cyclical!
                var nextIdx = settings.current + 1;
                if(nextIdx >= settings.tracks.length){
                  nextIdx = 0;   
                }
                return nextIdx;
            },
            prev: function(){
                //Cyclical!
                var prevIdx = settings.current - 1;
                if(prevIdx < 0){
                    prevIdx = settings.tracks.length - 1;
                }
                return prevIdx;
            },
            setCurrent: function(src){
              methods.setCurrentIndex(getTrackIndex(src));
            },
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
})(jQuery);

(function($){
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
})(jQuery);
    
    (function($){
    $.fn.audioPlayer = function(method){
       var el = this;
        var tracks= [];
        var current = -1;
        var settings = el.data("settings");
        
        if(settings == undefined){
            settings = $.extend({
                autoPlay: false,
                tracks: []
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
            var controls = getControls();
            var playlist = getPlaylist();
            el.append(nowPlaying);
            el.append(controls);
            el.append(playlist);
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
            var p = $("<audio>").attr("controls",true);
            c.append(p);
            return c;
        };
        
        var togglePlaylist = function(){
            var pl = el.find(".audio-playlist");
          if(pl.is(":hidden")){
                pl.show(100);
             } else{
                 pl.hide(100);
             }
        };
        
        var getPlaylist = function(){
            var c = $("<div>").addClass("audio-playlist-container");
            var tools = $("<div>").addClass("audio-playlist-tools").click(togglePlaylist);
            var l = $("<div>").addClass("audio-playlist");
            
            l.playlist({ tracks: settings.tracks });
            
            return c.append(tools).append(l);
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
              el.on("playlist::track-selected", trackSelected);
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