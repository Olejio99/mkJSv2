let socket = io();
let height, width, canvas, ctx;
canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
let players = null;
let playersPrev = null;
let atlases = [];
let choice = document.getElementById('choice');
let qwerty = document.getElementById('gamePage');
let gameStart = false;
let count = false;
let length = 10;
let frameCount = 9;
let frameCount2 = 9;
let timerStop = false;
let timerId;

loadAtlas("Scorpion", '../img/scorpionAtlas.png')
loadAtlas("Sub-Zero", '../img/sub_zeroAtlas.png')
loadAtlas("timer", '../img/timer.png')

function start() {
    $('.startPage').css('display', 'none')
    $('.menuPage').css('display', 'inherit')
}

function menu() {
    $('.menuPage').css('display', 'none')
    $('#choice').css('display', 'inherit')
    canvas.width = width = $('#choice').width();
    canvas.height = height = $('#choice').height();
    choice.appendChild(canvas);
}

function choices(event) {
    if (playersPrev.length > 1) {
        if (playersPrev[0].name == playersPrev[1].name) return
    }
    let p = $(event).attr('class')

    if ($(event).attr('class') == 'choicePress1') {
        $(event).css('border', '4px solid red')
        if (players == null) {
            $(`.${p} p`).text(1)
        } else {
            $(`.${p} p`).text(2)
        }
        $(".choicePress1").css('pointer-events', 'none')
        $(".choicePress2").css('pointer-events', 'none')

        socket.emit('hover', {
            id: $('.choicePress1').attr('id'),
            decr: 'add'
        })
    } else if ($(event).attr('class') == 'choicePress2') {
        $(event).css('border', '4px solid red')
        if (players == null) {
            $(`.${p} p`).text(1)
        } else {
            $(`.${p} p`).text(2)
        }
        $(".choicePress1").css('pointer-events', 'none')
        $(".choicePress2").css('pointer-events', 'none')
        socket.emit('hover', {
            id: $('.choicePress2').attr('id'),
            decr: 'add'
        })
    }
    socket.emit('choice', $(event).attr('id'))
}

function lastFunc() {
    choice.removeChild(canvas)
    $('#choice').css('display', 'none')
    $('.predGamePage').css('display', 'inherit')
    $('.firstPlayer').css('backgroundImage', `url(img/${players[0].name}.png)`)
    $('.secondPlayer').css('backgroundImage', `url(img/${players[1].name}.png)`)
    setTimeout(() => {
        $('.predGamePage').css('display', 'none')
        $('#gamePage').css('display', 'inherit')
        starter();
    }, 8000);
    count = true;
}

$(".choicePress1").hover(() => {
    socket.emit('hover', {
        id: $('.choicePress1').attr('id'),
        decr: 'add'
    })
}, () => {
    socket.emit('hover', {
        id: $('.choicePress1').attr('id'),
        decr: 'del'
    })
})
$(".choicePress2").hover(() => {
    socket.emit('hover', {
        id: $('.choicePress2').attr('id'),
        decr: 'add'
    })
}, () => {
    socket.emit('hover', {
        id: $('.choicePress2').attr('id'),
        decr: 'del'
    })
})

function starter() {
    canvas.width = width = $('#gamePage').width();
    canvas.height = height = $('#gamePage').height();
    qwerty.appendChild(canvas);
    socket.emit('canvasSize', {
        width: width,
        height: height
    })
    gameStart = true;
    timerId = setInterval(() => {
        if (timerStop) return
        frameCount--;
        if (frameCount == -1) {
            frameCount2--;
        }
    }, 2000);
    loop();
}

socket.on('players', data => {
    players = data;
    if (gameStart) show()
    else if (players.length == 2 && !count) lastFunc()
});

socket.on('playersPrev', data => {
    playersPrev = data;
    if (playersPrev.length == 0) {
        if (!gameStart) ctx.clearRect(0, 0, width, height)
        return
    }
    chooseDraw()
});

function chooseDraw() {
    ctx.clearRect(0, 0, width, height);
    if (playersPrev == null) return;
    for (let i = 0; i < playersPrev.length; i++) {
        let p = playersPrev[i];

        let a = p.spr[p.index].frame;
        this.w = a.w * 1.2;
        this.h = a.h * 1.2;
        p.y = 335 - this.h;
        if (p.view === -1) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(atlases[p.name], a.x, a.y, a.w, a.h, -p.x, p.y, this.w, this.h);
            ctx.restore();
        } else {
            ctx.drawImage(atlases[p.name], a.x, a.y, a.w, a.h, p.x, p.y, this.w, this.h);
        }
    }
}

function show() {

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < players.length; i++) {
        let p = players[i];

        if (p.view == 1) {
            $(`.player1_panel .score-value`).css('width', `${p.hp}%`)
            $('.player1_panel .score-value .playerName').css('backgroundImage', `url(img/${p.name}Name.png)`)
        }
        if (p.view == -1) {
            $(`.player2_panel .score-value`).css('width', `${p.hp}%`)
            $('.player2_panel .score-value .playerName').css('backgroundImage', `url(img/${p.name}Name.png)`)

        }
        if (p.state == 'victory') {
            $(`.win`).css('backgroundImage', `url(img/${p.name}Win.gif`)
            timerStop = true;
        } else if (players[0].state == 'falling1' && players[1].state == 'falling1') {
            $(`.win`).css('backgroundImage', `url(img/gameover.gif`)
        }

        if (p.view === -1) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(atlases[p.name], p.fp.x, p.fp.y, p.fp.w, p.fp.h, -p.x, p.y, p.w, p.h);
            ctx.restore();
        } else {
            ctx.drawImage(atlases[p.name], p.fp.x, p.fp.y, p.fp.w, p.fp.h, p.x, p.y, p.w, p.h);
        }
    }
}

function loadAtlas(master, atlas) {
    let img = new Image();
    img.src = atlas;
    atlases[master] = img;
}

function keyDown(event) {
    socket.emit('key', {
        keyCode: event.keyCode,
        state: true
    });
}

function keyUp(event) {
    socket.emit('key', {
        keyCode: event.keyCode,
        state: false
    });
}

document.body.addEventListener('keydown', keyDown);
document.body.addEventListener('keyup', keyUp);

function drawTimer() {

    if (frameCount == -1) {
        frameCount = length - 1
    }
    if (frameCount2 == -1) {
        frameCount2 = length - 1
    }
    let a = timer[frameCount].frame
    let b = timer[frameCount2].frame
    ctx.drawImage(atlases['timer'], b.x, b.y, b.w, b.h, width / 2 - 15, 30, b.w * 2, b.h * 2);
    ctx.drawImage(atlases['timer'], a.x, a.y, a.w, a.h, width / 2 + 15, 30, a.w * 2, a.h * 2);
    if (frameCount == 0 && frameCount2 == 0) {
        socket.emit('timer', true)
        clearInterval(timerId)
    }
}

function loop() {
    drawTimer();

    requestAnimationFrame(() => {
        loop();
    });
}