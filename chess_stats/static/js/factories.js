angular.module('ChessStats.factories', []).factory('StatsFetcher', function($http) {
  function StatsFetcher(username, color, successCallback) {
    this.username = username;
    this.color = color;
    this.successCallback = successCallback;
  }

  StatsFetcher.prototype.fetchStatsForMoves = function(moves) {
    $http({
      'method': 'GET',
      'url': '/get_stats',
      'params': {
        'moves': _.reduce(moves, function(uciString, move) {
          return uciString.concat(move.uci);
        }, ''),
        'username': this.username,
        'color': this.color
      }
    }).success(this.successCallback);
  }
  return StatsFetcher;
}).factory('HistoryRequestor', function($http) {

  function HistoryRequestor(username, port) {
    this.username = username;
    this.gameHandlers = [];
    this.webSocket = null;
    this.port = port;
  }
  
  HistoryRequestor.prototype = {
    requestRefreshGames: function() {
      that = this;
      this.webSocket = new WebSocket(
        "ws://{0}:{1}/fetch_games/".format(document.domain, this.port)
      );
      this.webSocket.onopen = function() {
        this.send(JSON.stringify({
          "type": "GET_GAMES",
          "username": that.username
        }));
      }
      var boundHandleGame = this.handleGame.bind(this);
      this.webSocket.onmessage = function(messageEvent) {
        var message = JSON.parse(messageEvent.data)
        boundHandleGame(message.games);
      }.bind(this);
    },
    requestExistingGames: function() {
      $http({
        'method': 'GET',
        'url': '/get_game_history/' + this.username,
      }).success(function(gameHistory) {
        _.each(gameHistory, function(game) {
          this.handleGame(game)
        }, this);
      }.bind(this));
    },
    addGameHandler: function(handler) {
      this.gameHandlers.push(handler);
    },
    handleGame: function(game) {
      _.each(this.gameHandlers, function(handler) {
        handler(game);
      });
    },
      
  }
  return HistoryRequestor;
}).factory('AnalysisClient', function() {
  function AnalysisClient(port) {
    this.port = port;
    this.messageHandlers = [];
    this.webSocket = new WebSocket(
      "ws://{0}:{1}/analysis/".format(document.domain, this.port)
    );
    this.webSocket.onmessage = this.handleMessage.bind(this);
  }
  AnalysisClient.prototype = {
    setPosition: function(uciMoves) {
      this.sendAsJSON({
        type: 'SET_POSITION',
        uci_moves: uciMoves
      });
    },
    startAnalysis: function() {
      this.sendAsJSON({type: 'DO_ANALYSIS'});
    },
    sendAsJSON: function(obj) {
      this.webSocket.send(JSON.stringify(obj));
    },
    addMessageHandler: function(handler) {
      this.messageHandlers.push(handler);
    },
    handleMessage: function(messageEvent) {
      console.log("handling message");
      var message = JSON.parse(messageEvent.data);
      _.each(this.messageHandlers, function(handler) {
        handler(message);
      });
    }
  }
  return AnalysisClient;
}).factory('State', function() {
  return {
    username: null,
    port: "3030"
  }
}).factory('requestGame', function($http) {
  return function(chessDotComID) {
    var json;
    $.ajax({
      method: 'GET',
      url: '/game/{0}'.format(chessDotComID),
      success: function(data) {json = data},
      async: false
    })
    return JSON.parse(json);
  }
}).factory('goToUsername', function($location) {
  return function(username) {
    $location.path("/" + username + "/game_history")
  }
});
