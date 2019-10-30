// Зависимости
var express = require('express');
var http = require('http');
// var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

const {
    Sub_Zero,
    Scorpion
} = require('./lib/player');
const scorpionAtlas = require('./lib/img/scorpionAtlas')
const sub_zeroAtlas = require('./lib/img/scorpionAtlas')

let timerStop = false;
let name = '';
let src = '';
let spr = {};
let player;
let width = 0;
let height = 0;
let groundY = 0
let animeSpeed = 1;
let PLAYERS = [];
let playersPrev = [];

app.set('port', 5000);
app.use(express.static('client/'));

// Маршруты
app.get('/', function (request, response) {
    response.sendFile(__dirname, '/client/index.html');
});
let player1 = '',
    player2 = '';
// Обработчик веб-сокетов
io.on('connection', function (socket) {
    console.log(`Connected: ${socket.id}`);

    socket.on('canvasSize', data => {
        width = data.width;
        height = data.height;
        groundY = height - (height * 0.09);
    })
    let idx, p;

    socket.on('choice', data => {
        // console.log(data);

        let view, x;

        if (PLAYERS.length == 2) return;

        if (data == '') return

        if (socket.id == player1) {
            view = 1;
            x = 427;
        } else if (socket.id == player2) {
            view = -1;
            x = 773;
        }
        if (data == 'Scorpion') {
            name = 'Scorpion';
            src = '../img/scorpionAtlas.png';
            spr = scorpionAtlas;
            player = new Scorpion(x, 199, view, socket, name, src, spr)
        } else if (data == 'Sub-Zero') {
            name = "Sub-Zero"
            src = './img/sub_zeroAtlas.png';
            spr = sub_zeroAtlas;
            player = new Sub_Zero(x, 199, view, socket, name, src, spr)
        }
        idx = PLAYERS.push(player);
        p = PLAYERS[--idx];
    })

    socket.on('hover', data => {
        gameStop = false;
        timerStop = false;
        if (PLAYERS.length == 2) {
            playersPrev = []
            return;
        }
        let view, x;
        if (player1 == '') {
            player1 = socket.id;
        } else if (socket.id != player1) {
            player2 = socket.id
        }

        if (data.decr == "del") {
            if (playersPrev.length == 1) {
                playersPrev.splice(playersPrev[0], 1)
                data.id = ""
            } else {
                for (let i = 0; i < playersPrev.length; i++) {

                    if (socket.id == playersPrev[i].id) {

                        if (i == 0) playersPrev.shift()
                        else if (i == 1) playersPrev.pop()
                        data.id = ''
                    }
                }
            }
        }

        if (data.id == '') return

        if (socket.id == player1) {
            view = 1;
            x = 20;
        } else if (socket.id == player2) {
            view = -1;
            x = 530;
        }
        if (data.id == 'Scorpion') {
            name = 'Scorpion';
            src = '../img/scorpionAtlas.png';
            spr = scorpionAtlas;
            let p = {
                id: socket.id,
                view: view,
                spr: spr['idle'],
                name: name,
                y: 335,
                x: x,
                frameCount: 0,
                index: 0,
                state: "idle"
            }
            playersPrev.push(p)
        } else if (data.id == 'Sub-Zero') {
            name = "Sub-Zero"
            src = './img/sub_zeroAtlas.png';
            spr = sub_zeroAtlas;
            let p = {
                id: socket.id,
                view: view,
                spr: spr['idle'],
                name: name,
                y: 335,
                x: x,
                frameCount: 0,
                index: 0,
            }
            playersPrev.push(p)
        }
    })

    socket.on('timer', data => {
        if (data) timerStop = true;
    })

    socket.on('key', data => {
        // if(PLAYERS.length==0)return
        if (PLAYERS.length < 2) return
        p.keys[data.keyCode] = !!data.state;
        (data.state) ? p.keyDown(data.keyCode): p.keyUp(data.keyCode)
    })

    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
        if (socket.id == player1) player1 = ''
        if (socket.id == player2) player2 = ''
        for (let i = 0; i < PLAYERS.length; i++) {
            if (PLAYERS[i].id === socket.id) {
                PLAYERS.splice(i, 1);
                break;
            }
        }
    });
});

setInterval(loop, 1000 / 60);

function Collision(player, anotherPlayer) {
    if (player.state == 'walk') {
        if ((player.dir === -1 && player.x <= 0) || (player.dir === 1 && player.x >= width)) return;

        if (player !== anotherPlayer) {
            if (player.dir == 1 && player.view == 1) {
                if (player.x + player.width >= anotherPlayer.x - anotherPlayer.width) return
            } else if (player.dir == -1 && player.view == -1) {
                if (player.x - player.width <= anotherPlayer.x + anotherPlayer.width) return
            }
        }
        player.x += player.dir * player.speed;
    } else {

        if (player.view == 1) {
            if (player.x + player.width >= anotherPlayer.x - anotherPlayer.width) {
                if (player.state == "highPunch" || player.state == "highKick") {
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "headHit"
                } else if (player.state == "middlePunch" || player.state == "middleKick") {
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "bodyHit"
                } else if (player.state == 'uppercut') {
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "falling1"
                } else if(player.state == 'roundHouse'){
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "headHit"
                } else if(player.state == 'footSweep'){
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "falling2"
                } else if(player.state == 'upwardKick'){
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "bodyHit"
                }
            }
        } else if (player.view == -1) {
            if (player.x - player.width <= anotherPlayer.x + anotherPlayer.width) {
                if (player.state == "highPunch" || player.state == "highKick") {
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "headHit"
                } else if (player.state == "middlePunch" || player.state == "middleKick") {
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "bodyHit"
                } else if (player.state == 'uppercut') {
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "falling1"
                } else if(player.state == 'roundHouse'){
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "headHit"
                } else if(player.state == 'footSweep'){
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "falling2"
                } else if(player.state == 'upwardKick'){
                    anotherPlayer.hit = true;
                    if (anotherPlayer.state == "block") return
                    anotherPlayer.state = "bodyHit"
                }
            }
        }
    }
}
let gameStop = false

function loop() {
    sendPrev()
    if (gameStop) return;
    sendData();
}

function sendData() {
    if (PLAYERS.length == 0) return
    let players = [];
    for (let i = 0; i < PLAYERS.length; i++) {
        let player = PLAYERS[i];
        let anotherPlayer;
        anotherPlayer = PLAYERS[(i + 1) % PLAYERS.length];
        Collision(player, anotherPlayer)
        if (player.state !== player.lastState) {
            player.index = 0;
            player.frameCount = 0;
            player.lastState = player.state;
        }
        checkAnimeSpeed(player.state)

        if (player.frameCount > player.spr[player.state].length * animeSpeed) {
            player.frameCount = 0;
            if (player.state == "idle") {
                player.index = (player.index + 1) % spr[player.state].length;
            } else if (player.state == "walk") {
                if (player.dir == -1 && player.view == 1) {
                    if (player.index == 0) player.index = spr[player.state].length
                    player.index--
                } else if (player.dir == 1 && player.view == -1) {
                    if (player.index == 0) player.index = spr[player.state].length
                    player.index--
                } else {
                    player.index = (player.index + 1) % spr[player.state].length;
                }
            } else if ((player.state == "sitDown") && (player.index + 1 == spr[player.state].length)) {
                player.index = player.index
            }
            // else if(player.state == "jump"){

            // }
            // else if(player.state == "jumpForward"){

            // }
            // else if(player.state == "jumpKick"){

            // }
            // else if(player.state == "jumpKickForward"){

            // }
            // else if(player.state == "jumpPunch"){

            // }
            // //////////////////////////
            // else if(player.state == "hit"){

            // }
            else if ((player.state == "headHit")) {

                if (player.index + 1 == spr[player.state].length) {

                    if (anotherPlayer.state == 'highPunch') {
                        player.hp -=2;
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    }
                    else if (anotherPlayer.state == 'highKick') {
                        player.hp -= 3;
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    } 
                    else if (anotherPlayer.lastState == 'roundHouse') {
                        player.hp -= 5;
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    }
                    else if (anotherPlayer.keys[anotherPlayer.key.LP]) {
                        player.index = (player.index + 1) % spr[player.state].length;
                    } else {
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    }
                } else player.index = (player.index + 1) % spr[player.state].length;
                player.hit = false;
            } else if (player.state == "bodyHit") {
                if (player.index + 1 == spr[player.state].length) {
                    if (anotherPlayer.state == 'middlePunch') {
                        player.hp -=2;
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    }
                    else if (anotherPlayer.state == 'middleKick') {
                        player.hp -= 3;
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    } else if (anotherPlayer.keys[anotherPlayer.key.LP]) {
                        player.index = (player.index + 1) % spr[player.state].length;
                    } else {
                        player.hit = false;
                        player.state = "idle"
                        player.index = 0;
                    }
                } else player.index = (player.index + 1) % spr[player.state].length;
                player.hit = false;
            }
            // else if(player.state == "lowHit"){

            // }
            // //////////////////////
            else if ((player.state == "block") && (player.index + 1 == spr[player.state].length)) {
                if (player.hit) {
                    player.index = 1;
                } else {
                    player.index = player.index;
                }
            } else if ((player.state == "lowBlock") && (player.index + 1 == spr[player.state].length)) {
                if (player.hit) {
                    player.index = 1;
                } else {
                    player.index = player.index;
                }
            }
            // ///////////////////////
            else if (player.state == "highPunch") {
                if (player.index + 1 == 4) {
                    if (player.keys[player.key.HP]) {
                        player.index = (player.index + 1) % spr[player.state].length;
                    } else {
                        player.state = "idle"
                        player.block = false;
                    }
                } else player.index = (player.index + 1) % spr[player.state].length;
            } else if (player.state == "middlePunch") {
                if (player.index + 1 == 4) {
                    if (player.keys[player.key.LP]) {
                        player.index = (player.index + 1) % spr[player.state].length;
                    } else {
                        player.state = "idle"
                        player.block = false;
                    }
                } else player.index = (player.index + 1) % spr[player.state].length;
            } else if ((player.state == "highKick") && (player.index + 1 == spr[player.state].length)) {
                player.block = false;
                player.state = "idle"
            } else if ((player.state == "middleKick") && (player.index + 1 == spr[player.state].length)) {
                player.block = false;
                player.state = "idle"
            }
            // //////////////////
            else if (player.state == "falling1") {
                if (anotherPlayer.lastState == 'uppercut'|| anotherPlayer.State == 'uppercut'){
                    player.hp -= 5;
                    player.hit = false;
                    // player.state = "idle"
                    player.index = 0;
                } 
                if (player.index + 1 == spr[player.state].length) {
                    if (player.hp > 0) {
                        setTimeout(() => {
                            player.state = 'idle'
                        }, 1000);
                    } else {
                        player.index = player.index;
                    }
                } else {
                    player.index = (player.index + 1) % spr[player.state].length;
                }
            }
            else if(player.state == "falling2"){
                if (anotherPlayer.lastState == 'footSweep' || anotherPlayer.State == 'footSweep'){
                    player.hp -= 2;
                    player.hit = false;
                    // player.state = "idle"
                    player.index = 0;
                } 
                if (player.index + 1 == spr[player.state].length) {
                    setTimeout(() => {
                        player.state = 'idle'
                    }, 500);
                }else {
                    player.index = (player.index + 1) % spr[player.state].length;
                }
            }
            // else if(player.state == "flight"){

            // }
            // else if(player.state == "throwing"){

            // }
            // else if(player.state == "gettingUp"){

            // }
            // else if(player.state == "harpoon"){

            // }
            // else if(player.state == "harpoonPull"){

            // }
            // else if(player.state == "harpoonShot"){

            // }
            else if ((player.state == "roundHouse") && (player.index + 1 == spr[player.state].length)) {
                player.block = false;
                player.state = "idle"
            } else if ((player.state == "footSweep") && (player.index + 1 == spr[player.state].length)) {
                player.block = false;
                player.state = "idle"
            }
            // else if(player.state == "specialKick"){

            // }
            // else if(player.state == "specialPunch"){

            // }
            // else if(player.state == "turn"){

            // }
            else if ((player.state == "uppercut") && (player.index + 1 == spr[player.state].length)) {
                player.block = false;
                if (!player.keys[player.key.DOWN]) {
                    player.state = "idle"
                } else {
                    player.state = "sitDown"
                    player.index = 0;
                }
            } else if ((player.state == "upwardKick") && (player.index + 1 == spr[player.state].length)) {
                player.block = false;
                if (!player.keys[player.key.DOWN]) {
                    player.state = "idle"
                } else {
                    player.state = "sitDown"
                    player.index = 0;
                }
            } else if ((player.state == "victory") && (player.index + 1 == spr[player.state].length)) {
                player.index = player.index;
            }
            // else if(reverse){
            //     player.index--
            //     if(player.index<=0){
            //         player.state = "idle"
            //         reverse=false;
            //         player.index = 0
            //     }                    
            // }
            else {
                player.index = (player.index + 1) % spr[player.state].length;
            }
            // p.index = (p.index + 1) % p.spr[p.state].length;
        }
        let fp = player.frameParametr = player.spr[player.state][player.index].frame;
        player.width = fp.w * 1.5;
        player.height = fp.h * 1.5;

        if (PLAYERS.length > 1) {
            let player = PLAYERS[0];
            let anotherPlayer = PLAYERS[1];
            if (player.view == 1) {
                if (player.x + (player.width / 2) > anotherPlayer.x - (anotherPlayer.width / 2)) {
                    if (player.view !== -1 && anotherPlayer.view !== 1) {
                        player.x = player.x + player.width;
                        anotherPlayer.x = anotherPlayer.x - anotherPlayer.width;
                    }
                    player.view = -1
                    anotherPlayer.view = 1;
                } else {
                    anotherPlayer.view = -1
                }
            } else {
                if (player.x - (player.width / 2) < anotherPlayer.x + (anotherPlayer.width / 2)) {
                    if (player.view !== 1 && anotherPlayer.view !== -1) {
                        player.x = player.x - player.width;
                        anotherPlayer.x = anotherPlayer.x + anotherPlayer.width;
                    }
                    player.view = 1
                    anotherPlayer.view = -1;
                } else {
                    anotherPlayer.view = 1
                }
            }
        }
        player.y = groundY - player.height;
        players.push(player.toObject());
        player.frameCount++;
        if (player.hp <= 0) {
            player.state = 'falling1'
            anotherPlayer.state = 'victory'
            if (player.state == 'falling1' && player.index + 1 == spr[player.state].length) {
                gameStop = true;
            }
        } else {
            if (timerStop) {
                if (player.hp > anotherPlayer.hp) {
                    player.state = 'victory'
                    anotherPlayer.state = 'falling1'
                    if (anotherPlayer.state == 'falling1' && anotherPlayer.index + 1 == spr[anotherPlayer.state].length) {
                        gameStop = true;
                    }
                } else if (player.hp < anotherPlayer.hp) {
                    player.state = 'falling1'
                    anotherPlayer.state = 'victory'
                    if (player.state == 'falling1' && player.index + 1 == spr[player.state].length) {
                        gameStop = true;
                    }
                } else {
                    player.state = 'falling1'
                    anotherPlayer.state = 'falling1'
                    if ((player.state == 'falling1' && player.index + 1 == spr[player.state].length) &&
                        (anotherPlayer.state == 'falling1' && anotherPlayer.index + 1 == spr[anotherPlayer.state].length)) {
                        gameStop = true;
                    }
                }
            }
        }
    }
    io.emit('players', players);
}

function sendPrev() {

    for (let i = 0; i < playersPrev.length; i++) {
        let p = playersPrev[i];

        if (p.frameCount > p.spr.length) {
            p.frameCount = 0;
            p.index = (p.index + 1) % p.spr.length;
        }
        p.frameCount++;;
    }
    io.emit('playersPrev', playersPrev);
}

function checkAnimeSpeed(state) {
    if (state == "highPunch") animeSpeed = 0.5;
    else if (state == "middlePunch") animeSpeed = 0.5;
    else if (state == "highKick") animeSpeed = 1;
    else if (state == "middleKick") animeSpeed = 1;
    else if (state == "uppercut") animeSpeed = 0.8;
    else if (state == "upwardKick") animeSpeed = 2;
    else if (state == "headHit") animeSpeed = 1;
    else if (state == "block") animeSpeed = 1;
    else animeSpeed = 1;
}

// Запуск сервера
server.listen(5000, function () {
    console.log('Запускаю сервер на порте 5000');
});