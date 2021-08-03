
let win;


//verify if logged api backend communication

const startgamebutton = document.getElementById("start-game");
const usernameLabel = document.getElementById('user');
const moneyLabel = document.getElementById('money');
const body = document.getElementById("bdy");


const getUserInfo = async ()=>{
    const result = await fetch('/api/bj', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: localStorage.getItem('token')
        })
    }).then((res)=>res.json());
    if(result.status==='error')
        body.innerHTML='<h1 style="color: bisque; font-size: 8rem;">Please log in</h1>';
    else{
        usernameLabel.innerText = result.username;
        moneyLabel.innerText =  result.money;
        document.getElementById('crtBal').innerText = result.money;
    }
}
getUserInfo();



//modal code

const openModalButtons = document.querySelectorAll('[data-modal-target]');
const closeModalButtons = document.querySelectorAll('[data-close-button]');
const overlay = document.getElementById('overlay');

function closeModal(modal){
    if(modal==null) return;
    modal.classList.remove('active');
    overlay.classList.remove('active');
}

function openModal(modal){
    if(modal==null) return;
    modal.classList.add('active');
    overlay.classList.add('active');
}

openModalButtons.forEach((button)=>{
    button.addEventListener('click',()=>{
        const modal = document.querySelector(button.dataset.modalTarget);
        openModal(modal);
    })
})

closeModalButtons.forEach((button)=>{
    button.addEventListener('click',()=>{
        const modal = button.closest('.modal');
        closeModal(modal);
    })
})
overlay.addEventListener('click',()=>{
    const modals =  document.querySelectorAll('.modal.active')
    modals.forEach((modal)=>{
        closeModal(modal);
    })
})


//bet code backend communication

let moneyToWin;

const betForm = document.getElementById("bet");
betForm.addEventListener('submit',async (event)=>{
    event.preventDefault();
    const result = await fetch('/api/betData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            moneyToBet:document.getElementById('moneyToBet').value,
            token:localStorage.getItem('token')
        })
    }).then((res)=>res.json());
    if(result.status === 'error')
        alert(result.error);
    else{
        moneyToWin = result.moneyToWin;
        let newMoney = result.newMoney;
        moneyLabel.innerText = newMoney;
        alert(`${moneyToWin} ron are on the table`);
        startGame();
        let modal = document.getElementById('modal1');
        closeModal(modal);
    }
})

//leaderboard


const lb = document.getElementById('leaderboard');
lb.addEventListener('click',async (event)=>{
    event.preventDefault();
    const userArray = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((res)=>res.json());
    document.getElementById('leaderboard-modal').innerHTML = ''; 
    for(let i=0;i<userArray.length;++i){
        let userDiv = document.createElement('div');
        userDiv.innerHTML = `<h3>${i+1}. ${userArray[i].username}</h3><h3>${userArray[i].money} Ron</h3>`;
        userDiv.classList.add('single-user');
        if(userArray[i].username == usernameLabel.innerText)
            userDiv.classList.add("logged-user");
        document.getElementById('leaderboard-modal').appendChild(userDiv); 
    }
});

//getmoney
const getMoneyButton = document.getElementById('get-money');
getMoneyButton.addEventListener('click',async(event)=>{
    event.preventDefault();
    const result = await fetch('/api/getmoney', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token:localStorage.getItem('token')
        })
    }).then((res)=>res.json());
    if(result.status=='error')
        alert(result.error);
    else{
        moneyLabel.innerText = '5';
        document.getElementById('crtBal').innerText = '5';
        alert('Money updated');
    }
})

//back button log out

document.getElementById('backlink').addEventListener('click',()=>{
    localStorage.removeItem('token');
});

//all-in

document.getElementById('all-in').addEventListener('click',async (event)=>{
    event.preventDefault();
    const result = await fetch('/api/betData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            moneyToBet:parseInt(moneyLabel.innerText),
            token:localStorage.getItem('token')
        })
    }).then((res)=>res.json());
    if(result.status === 'error')
        alert(result.error);
    else{
        moneyToWin = result.moneyToWin;
        let newMoney = result.newMoney;
        moneyLabel.innerText = newMoney;
        alert(`${moneyToWin} ron are on the table`);
        startGame();
        let modal = document.getElementById('modal1');
        closeModal(modal);
    }
});

//game script

let numbers=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let symbols=['C','D','H','S'];
let Deck=[];
let cardNumber,currentScore,numberOfAces,noOfCards;
let currentCards=document.getElementById("cards");
let numberLabel=document.getElementById("availableCards");
let scoreLabel=document.getElementById("score");
let playAgain=document.getElementById("play-again");
let gameTable=document.getElementById("table");
let botTable=document.getElementById("bot-game");
function Card(number,symbol){
    this.number=number;
    this.symbol=symbol;
    this.id='./public/photos/PNG/'+number+symbol+'.png';
    if(this.number==='A')
        this.value=11;
    else {
        let a=parseInt(this.number);
        if(a) this.value=a;
        else this.value=10;
    }
}
let bot = {};
let botCards = [];
function createDeck(){
    let i,j;
    i=Deck.length;
    while(i--)
        Deck.pop();
    for(i=0;i<13;i++)
        for(j=0;j<4;j++)
            Deck.push(new Card(numbers[i],symbols[j]));
}
function shuffleDeck(){
    let i,j,aux;
    for(i=Deck.length-1;i>0;i--)
    {
        j=Math.floor(Math.random()*i);
        aux=Deck[j];
        Deck[j]=Deck[i];
        Deck[i]=aux;
    }
}
function hold(){
    while(bot.haveToDraw)
        botDrawCard();
    playAgain.style.display="block";
    let x=document.getElementsByClassName("hiddenButtons");
    for(let i=0;i<2;i++)
        x[i].style.display="none";
    let resultt=document.createElement("h2");
    gameTable.appendChild(resultt);
    resultt.id="finishLabel";
    botTable.innerHTML = '';
    for(let i=0;i<botCards.length;++i){
        let x = document.createElement('img');
        x.src = botCards[i].id;
        botTable.appendChild(x);
    }
    if(currentScore<=21){
        if(currentScore===bot.currentScore){
            if(noOfCards === bot.noOfCards){
                resultt.innerText = "Tie!";
                win = 0.5;
            }
            else if(noOfCards > bot.noOfCards){
                resultt.innerText = 'You lost!';
                win = 0;
            }
            else{
                resultt.innerText = "You won!";
                win = 1;
            }
        }
        else if(currentScore<bot.currentScore){
            if(bot.currentScore>21){
                resultt.innerText = 'You won!';
                win = 1;
            }
            else{
                resultt.innerText = "You lost!";
                win = 0;
            }
        }
        else{
            resultt.innerText = "You won!";
            win = 1;
        }
    }
    else{
        resultt.innerText = "Maybe next time!";
        win = 0;
    }
    if(win == 1 && currentScore == 21)
        win = 2;
    if(win == 0.5 && currentScore == 21)
        win = 1;
    async function updateMoney(){
        moneyLabel.innerText = document.getElementById('crtBal').innerText = parseInt(moneyLabel.innerText) + win*moneyToWin;
        const result = await fetch('/api/moneyupdate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                moneyToUpdate:parseInt(moneyLabel.innerText),
                token:localStorage.getItem('token')
            })
        }).then((res)=>res.json());
        if(result.status!=='ok')
            alert(result.error);
        else setTimeout(()=>{alert(`You won ${win*moneyToWin}`)},1000);
    }
    updateMoney();
}

function botDrawCard(){
    if(bot.haveToDraw){
        bot.noOfCards++;
        let drawnCard = document.createElement('img');
        drawnCard.src = './public/photos/PNG/blue_back.png';
        botTable.appendChild(drawnCard);
        bot.currentScore+=Deck[cardNumber-1].value;
        botCards.push(Deck[cardNumber-1]);
        if(Deck[cardNumber-1].number==='A')
            bot.numberOfAces++;
        cardNumber--;
        numberLabel.innerText=cardNumber;
        if(bot.currentScore>21){
            if(bot.numberOfAces){
                bot.numberOfAces--;
                bot.currentScore-=10;
                if(bot.currentScore>17)
                    bot.haveToDraw = 0;
            }
            else
                bot.haveToDraw = 0;
        }
        else if(bot.currentScore >=20)
            bot.haveToDraw = 0;
        else if(bot.currentScore>=16){
            if(bot.numberOfAces){
                bot.numberOfAces--;
                bot.currentScore-=10;
            }
            else
                bot.haveToDraw = 0;
        }
    }
}
function drawCard(){
    if(noOfCards>=2)
        botDrawCard();
    let drawnCard=document.createElement("img");
    currentScore+=Deck[cardNumber-1].value;
    drawnCard.src=Deck[cardNumber-1].id;
    noOfCards++;
    if(Deck[cardNumber-1].number==='A')
        numberOfAces++;
    cardNumber--;
    numberLabel.innerText=cardNumber;
    scoreLabel.innerText=currentScore;
    currentCards.appendChild(drawnCard);
    if(currentScore>=21){
        if(numberOfAces&&currentScore>21){
            numberOfAces--;
            currentScore-=10;
            scoreLabel.innerText=currentScore;
            if(currentScore===21)
                hold();
        }
        else
            hold();
    }
}
function botFirstCard(){
    bot.firstCard = new Card;
    bot.firstCard = Deck[cardNumber-1];
    let newCard = document.createElement("img");
    newCard.src = bot.firstCard.id;
    if(Deck[cardNumber-1].number==='A')
            bot.numberOfAces++;
    cardNumber--;
    bot.currentScore = bot.firstCard.value;
    numberLabel.innerText=cardNumber;
    bot.haveToDraw = 1;
    bot.noOfCards = 1;
    botTable.appendChild(newCard);
    botCards.push(bot.firstCard);
}
function startGame(){
    let permission = document.getElementById("finishLabel");
    if(permission)
        permission.remove();
    createDeck();
    shuffleDeck();
    while(botCards.length)
        botCards.pop();
    currentScore=0;
    cardNumber=52;
    numberOfAces=0;
    noOfCards = 0;
    bot.numberOfAces=0;
    numberLabel.innerText=cardNumber;
    scoreLabel.innerText=currentScore;
    currentCards.innerHTML="";
    botTable.innerHTML='';
    let newButtons=document.getElementsByClassName("hiddenButtons")
    for(let i=0;i<=1;++i)
        newButtons[i].style.display="inline-block";
    let startButton=document.getElementById("start-game");
    startButton.style.display="none";
    playAgain.style.display="none";
    bot.haveToDraw = 0;
    botFirstCard();
    botDrawCard();
    drawCard();
    drawCard();
}





