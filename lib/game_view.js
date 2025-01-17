const Game = require('./game');

const GameView = function(ctx, canvasSize) {
  this.ctx = ctx;
  this.canvasSize = canvasSize;
  this.game = new Game({
    canvasSize: this.canvasSize,
    ctx: this.ctx,
    gameView: this
  });
  this.defender = this.game.defender;
  this.isPaused = false;

  this.rightPressed = false;
  this.leftPressed = false;
  this.spacePressed = false;

  this.isMuted = false;
  this.isPre = true;

  this.killScoreList = []

  this.addKeyListeners();
  this.addJoyStick();

};

GameView.prototype.toggleAudio = function() {
  this.isMuted = this.isMuted ? false : true;
};

GameView.prototype.pre = function() {

  this.interval = setInterval(() => {

    if (this.isPre && this.game.blockInfo.new_data) {
      this.addLivesText(this.ctx);
      this.addScoreText(this.ctx);
      this.addLevelText(this.ctx);
      this.isPre = false;
    }
  }, 100);
}
GameView.prototype.start = function() {
  this.interval = setInterval(() => {
    if (!this.isPaused) {
      this.game.draw(this.ctx);
      this.addLivesText(this.ctx);
      this.addScoreText(this.ctx);
      this.addLevelText(this.ctx);
      this.moveDefender();
      this.game.moveInvaders();
      this.game.addUfo();
      this.addKillScoreText(this.ctx);


      this.game.step();
    }
  }, 10);

  //check for now blocks
  this.interval = setInterval(() => {
        this.game.blockInfo.fetchData();
    }, 10000);

  // Animate enemy sprites
  this.toggle = setInterval(() => {
    if (!this.isPaused) this.game.toggleInvaders();
  }, 500);
};

GameView.prototype.stop = function() {
  clearInterval(this.interval);
  clearInterval(this.toggle);

  this.interval     = null;
  this.toggle       = null;
  this.rightPressed = false;
  this.leftPressed  = false;
  this.spacePressed = false;
  this.isPaused     = false;
  this.defender     = this.game.defender;

  this.game = new Game({
    canvasSize: this.canvasSize,
    gameView:   this,
    ctx:        this.ctx
  });
};

GameView.prototype.restart = function() {
  this.stop();
  this.start();
};

GameView.prototype.welcome = function() {
  this.ctx.fillStyle = '#000';
  this.ctx.fillRect(0, 0, this.game.DIM_X, this.game.DIM_Y);
};

GameView.prototype.pause = function() {
  this.isPaused = true;
};

GameView.prototype.resume = function() {
  this.isPaused = false;
};

GameView.prototype.gameOver = function() {
  this.stop();

  document.getElementById('menu-container').className='hide';

  setTimeout(() => {
    this.ctx.clearRect(0, 0, this.DIM_X, this.DIM_Y);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.game.DIM_X, this.game.DIM_Y);
    let gameOverImage  = document.getElementById('game-over'),
        playGameButton = document.getElementById('play-game');
    playGameButton.className = '';
    gameOverImage.className = '';
  }, 600);

};

GameView.KEY_BINDS = {
  'left': [-2, 0],
  'right': [2, 0]
};

GameView.prototype.addLivesText = function(ctx) {
  let x = this.game.DIM_X * .87, y = this.game.DIM_Y * .05;

  ctx.font = "23px Bungee Inline";
  ctx.fillText(`LIVES: ${this.game.defenderLives}`, x, y);
};

GameView.prototype.addMenu = function(ctx) {
  let x = this.game.DIM_X * .5, y = this.game.DIM_Y * .1;
};

GameView.prototype.addScoreText = function(ctx) {
  let x = this.game.DIM_X * .01, y = this.game.DIM_Y * .05;
  // ctx.find = "20px Georgia";
    ctx.font = "32px Bungee Inline";
    this.ctx.fillStyle = '#ffff6d';
    ctx.fillText(`FEES: ${this.game.score.toFixed(6)} BTC`, x, y + 4);
    ctx.font = "23px Bungee Inline";
    this.ctx.fillStyle = '#fff';

  this.game.ctx.fillStyle = "#2f2"
  this.killScoreList.forEach(([score, x, y]) => {
    this.game.ctx.fillText("+" + score.toFixed(6), x, y)
  })
  this.game.ctx.fillStyle = "#fff"

};
GameView.prototype.addKillScoreText = function(ctx) {
  this.game.ctx.fillStyle = "#2f2"
  this.killScoreList.forEach(([score, x, y]) => {
    this.game.ctx.fillText("+" + score.toFixed(6), x, y)
  })
  this.game.ctx.fillStyle = "#fff"

};
GameView.prototype.addLevelText = function(ctx) {
  let x = this.game.DIM_X * .01, y = this.game.DIM_Y * .95;
  ctx.fillText(`BLOCK HEIGHT: ${this.game.blockInfo.options.height}`, x, y);
    if (this.game.blockInfo.options.block_weight < 0.3)
        this.ctx.fillStyle = '#f21';
    else if (this.game.blockInfo.options.block_weight < 0.8)
        this.ctx.fillStyle = '#ffce12';
    else
        this.ctx.fillStyle = '#2f1';
    ctx.fillRect(x, y + 10, 300 * this.game.blockInfo.options.block_weight, 100)
    this.ctx.fillStyle = '#fff';
    ctx.fillText(`${(this.game.blockInfo.options.block_weight * 4000).toFixed(3)} KWU`, x + 10 +300 * this.game.blockInfo.options.block_weight, y + 27);
    ctx.fillText(`${this.game.blockInfo.options.transactions} Txs`, x + 210 + 300 * this.game.blockInfo.options.block_weight, y + 27);
  ctx.textAlign = "end";
  ctx.fillText(`${timeDifference(Date.now(), this.game.blockInfo.options.timestamp * 1000)} `, 900 - 10, y + 27);
  ctx.textAlign = "start";


}

GameView.prototype.bindKeyHandlers = function() {
  const defender = this.defender;

  Object.keys(GameView.KEY_BINDS).forEach(k => {
    let offset = GameView.KEY_BINDS[k];
    key(k, function() { defender.power(offset); });
  });

  key('space', function() { defender.fireBullet(); });
};

GameView.prototype.addKeyListeners = function() {
  document.addEventListener('keydown', this.handleKeyDown.bind(this), false);
  document.addEventListener('keyup', this.handleKeyUp.bind(this), false);
};

GameView.prototype.addJoyStick = function() {
  window.addEventListener('gamepadconnected', this.handleJoyStick.bind(this));
};

GameView.prototype.handleJoyStick = function(e) {
  console.log();

  this.interval = setInterval(() => {
    if (!this.isPaused) {
      if (navigator.getGamepads()[0].axes[0] === -1) {
        this.leftPressed = true;
      } else if (navigator.getGamepads()[0].axes[0] === 1) {
        this.rightPressed = true;
      }
      if (navigator.getGamepads()[0].buttons[3]["pressed"]) {
        this.spacePressed = true;
      }

      if (navigator.getGamepads()[0].axes[0] === 0) {
        this.leftPressed = false;
        this.rightPressed = false;
      }
      if (!navigator.getGamepads()[0].buttons[3]["pressed"]) {
        this.spacePressed = false;
      }
    }
  }, 10);
};


GameView.prototype.handleKeyDown = function(e) {
  if (e.keyCode === 37) {
    this.leftPressed = true;
  } else if (e.keyCode === 39) {
    this.rightPressed = true;
  }

  if (e.keyCode === 32) {
    this.spacePressed = true;
  }
};

GameView.prototype.handleKeyUp = function(e) {
  if (e.keyCode === 37) {
    this.leftPressed = false;
  } else if (e.keyCode === 39) {
    this.rightPressed = false;
  }

  if (e.keyCode === 32) {
    this.spacePressed = false;
  }
};

GameView.prototype.moveDefender = function() {

  if (this.leftPressed) {
    this.defender.power([-3,0]);
  } else if (this.rightPressed) {
    this.defender.power([3,0]);
  }

  if (this.spacePressed) {
    this.defender.fireBullet();
  }
};

function timeDifference(current, previous) {

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed/1000) + ' seconds ago';
  }

  else if (elapsed < msPerHour) {
    return Math.round(elapsed/msPerMinute) + ' minutes ago';
  }

  else if (elapsed < msPerDay ) {
    return Math.round(elapsed/msPerHour ) + ' hours ago';
  }

  else if (elapsed < msPerMonth) {
    return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';
  }

  else if (elapsed < msPerYear) {
    return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';
  }

  else {
    return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';
  }
}

module.exports = GameView;
