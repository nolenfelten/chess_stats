'use strict';

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function GameBrowseCtrl($scope) {
    var gameLoader = {
        games: [],
        socket: new io.Socket(),
        user: ""
    }

    gameLoader.init = function (user) {
        gameLoader.user = user
        gameLoader.socket.connect();
        gameLoader.socket.on(
            'message',
            function (game_data) {
                console.log(game_data)
                gameLoader.games.push(JSON.parse(game_data))
                $scope.$apply()
            }
        )
    }

    gameLoader.buildChessDotComGameURL = function (id) {
        return "http://www.chess.com/livechess/game?id={0}".format(id)
    }

    $scope.gameLoader = gameLoader
}

function MoveStatsCtrl($scope, $http) {
	var moveControl = {
		moves: [],
		movePairs: [],
		moveStatsList: [],
		username: "",
        refreshLock: false,
        isWhite: true
	}

	moveControl.refreshMoveStatsList = function() {
        var self = this
		$http(
			{
				'method': 'GET',
				'url': '/chess_stats/get_stats',
				'params': {
					'moves': this.moves,
					'username': this.username,
                    'color': this.isWhite? 'white' : 'black'
				}
			}
		).success(
			function(newValue) {
				moveControl.moveStatsList = newValue;
                self.refreshLock = false
			}
		);
		this.movePairs = this.getMovePairs()
	}

	moveControl.addMove = function(move) {
        if(this.refreshLock) {
            return
        }
        this.refreshLock = true
		this.moves.push(move);
		this.refreshMoveStatsList();
	}

    moveControl.setColor = function(isWhite) {
        if(this.refreshLock) {
            return
        }
        this.refreshLock = true
        this.moves = []
        this.isWhite = isWhite
        this.refreshMoveStatsList();
    }

	moveControl.setUsername = function(username) {
		this.username = username;
		this.moves = [];
		this.refreshMoveStatsList();
	}

	moveControl.removeLastNMoves = function(numMovesToRemove) {
        if(this.refreshLock) {
            return
        }
        this.refreshLock = true
		this.moves = this.moves.slice(0, numMovesToRemove*-1);
		this.refreshMoveStatsList();
	}

	moveControl.truncateMovesTo = function(lastIndex) {
		if(lastIndex >= this.moves.length) return
        if(this.refreshLock) {
            return
        }
        this.refreshLock = true
		this.moves = this.moves.slice(0, lastIndex);
		this.refreshMoveStatsList();
	}

	moveControl.getMovePairs = function() {
		var movePairs = []
		for(var i = 0; i < this.moves.length - 1; i += 2) {
			movePairs.push(
				{
					'index': i,
					'whiteMove': this.moves[i],
					'blackMove': this.moves[i+1],
				}
			);
		}
		if(this.moves.length & 0x1 == 1) {			
			movePairs.push(
				{
					'index': this.moves.length - 1,
					'whiteMove': this.moves[this.moves.length - 1],
					'blackMove': "..."
				}
			);
		} else {
			movePairs.push(
				{
					'index': this.moves.length,
					'whiteMove': "...",
					'blackMove': ""
				}
			);
		};
		return movePairs
	}

	$scope.moveControl = moveControl
	$scope.init = function(username) {
        moveControl.username = username;
        moveControl.refreshMoveStatsList()
    }
}
