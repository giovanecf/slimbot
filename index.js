import express from "express";
import fs from "fs";
import {
  getMultipleTickerPrice,
  getAccountInfo,
  newOrder,
} from "./service/binance_api.js";

const app = express();
const port = 7000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let MAIN_LOOP_INTERVAL = null;
let SCHEDUALER_LOOP_INTERVAL = null;

let IS_FIRST_CYCLE = true;
const ORDER_PERCENT = 0.0005;
const COINS_SYMBOL = ["BTCUSDT", "ETHUSDT", "BNBUSDT"];
const BOTS = [
  {
    id: 1,
    coin_pair: "BTCUSDT",
    coin_open_price: 0,
    amount_crypto: 0,
    amount_money: 30,
    buy_order_percent: ORDER_PERCENT,
    sell_order_percent: ORDER_PERCENT,
    buy_order_price: 0,
    sell_order_price: 0,
    has_buy: false,
    has_sell: false,
    bought_counter: 0,
    sell_counter: 0,
    trade_counter: 0,
  },
  {
    id: 2,
    coin_pair: "ETHUSDT",
    coin_open_price: 0,
    amount_crypto: 0,
    amount_money: 20,
    buy_order_percent: ORDER_PERCENT,
    sell_order_percent: ORDER_PERCENT,
    buy_order_price: 0,
    sell_order_price: 0,
    has_buy: false,
    has_sell: false,
    bought_counter: 0,
    sell_counter: 0,
    trade_counter: 0,
  },
  {
    id: 3,
    coin_pair: "BNBUSDT",
    coin_open_price: 0,
    amount_crypto: 0,
    amount_money: 20,
    buy_order_percent: ORDER_PERCENT,
    sell_order_percent: ORDER_PERCENT,
    buy_order_price: 0,
    sell_order_price: 0,
    has_buy: false,
    has_sell: false,
    bought_counter: 0,
    sell_counter: 0,
    trade_counter: 0,
  },
];

function readWriteSync(text, rewrite = false, file = "./logs.txt") {
  var data = fs.readFileSync(file, "utf-8");
  var newValue = "";

  if (rewrite) {
    newValue = text;
  } else {
    if (data.length > 0) newValue = data + "\n" + "[" + new Date() + "]" + text;
    else newValue = text;
  }

  fs.writeFileSync(file, newValue, "utf-8");

  //console.log("Log saved!");
}

function getGmtTime() {
  const datetime = new Date();

  const hours_not_parsed =
    datetime.getHours() + datetime.getTimezoneOffset() / 60;

  const hours =
    hours_not_parsed < 24 ? hours_not_parsed : hours_not_parsed - 24;
  const minutes = datetime.getMinutes();
  const seconds = datetime.getSeconds();

  return { hours, minutes, seconds };
}

function checkSchedualer() {
  const { hours, minutes, seconds } = getGmtTime();

  //console.log("It's", hours, minutes, seconds);

  if (hours == 0 && minutes == 0 && seconds == 0) {
    console.log(
      "\n\n\n" + "NOVO DIA!\n",
      hours,
      ":",
      minutes,
      ":",
      seconds,
      "\n\n\n"
    );
    //daylyFunc();
  }

  if (minutes == 0 && seconds == 0) {
    console.log(
      "\n\n\n" + "NOVO HORA!\n",
      hours,
      ":",
      minutes,
      ":",
      seconds,
      "\n\n\n"
    );
    //hourlyFunc();
    newCycle();
  }
}

function calcNewOrderPrices(coins) {
  BOTS.forEach((bot) => {
    const coin = coins.find((coin) => coin.symbol === bot.coin_pair);

    const buy =
      parseFloat(coin.price) - parseFloat(coin.price) * bot.buy_order_percent;
    const sell =
      parseFloat(coin.price) + parseFloat(coin.price) * bot.sell_order_percent;

    bot.buy_order_price = buy;
    bot.sell_order_price = sell;
  });
}

function rebootCycleConfigs(coins) {
  calcNewOrderPrices(coins);
  BOTS.forEach((bot) => {
    if (bot.has_buy && bot.has_sell) bot.trade_counter;
    bot.has_buy = false;
    bot.has_sell = false;
  });
}

function newCycle() {
  console.log("NEW CYCLE", new Date());
  getMultipleTickerPrice(COINS_SYMBOL)
    .then((response) => {
      rebootCycleConfigs(response.data);
    })
    .catch((error) => console.log(error));
  console.log(BOTS);
  readWriteSync(JSON.stringify(BOTS));
}

function deal(coins) {
  BOTS.forEach((bot) => {
    const coin = coins.find((coin) => coin.symbol === bot.coin_pair);
    const price = parseFloat(coin.price);

    if (coin && price > 0) {
      //HERE I BUY: CHECK BUY PRICE AND IF I HAVE MONEY TO BUY IT

      if (
        price <= bot.buy_order_price &&
        bot.amount_money > 0 &&
        !bot.has_buy
      ) {
        let current_among_crypto = bot.amount_money / price;
        bot.amount_money -= bot.amount_money;
        bot.amount_crypto += current_among_crypto;
        bot.has_buy = true;
        bot.bought_counter++;

        readWriteSync("BOUGHT" + " - " + price + " - " + bot.coin_pair);
        console.log("BOUGHT", price, bot);
      }

      //HERE I SELL: CHECK PRICE TO SELL AND IF I HAVE CRIPTO TO SELL IT
      if (
        price >= bot.sell_order_price &&
        bot.amount_crypto > 0 &&
        !bot.has_sell
      ) {
        let current_among_money = bot.amount_crypto * price;
        bot.amount_crypto -= bot.amount_crypto;
        bot.amount_money += current_among_money;
        bot.has_sell = true;
        bot.sell_counter++;

        readWriteSync("SOLD" + " - " + price + " - " + bot.coin_pair);
        console.log("SOLD", price, bot);
      }
    } else {
      //readWriteSync("logs.txt", "PRICE EQUAL OR UNDER ZERO", false);
      readWriteSync("PRICE EQUAL OR UNDER ZERO" + price);
    }
  });
}

function coinsPriceHandler(coins) {
  /*
  [
    { symbol: 'BTCUSDT', price: '16827.47000000' },
    { symbol: 'ETHUSDT', price: '1252.97000000' },
    { symbol: 'BNBUSDT', price: '257.90000000' }
  ]
  */

  if (IS_FIRST_CYCLE) {
    calcNewOrderPrices(coins);
    IS_FIRST_CYCLE = false;
    console.log(BOTS);
  }

  deal(coins);
}

function tradeLoop() {
  getMultipleTickerPrice(COINS_SYMBOL)
    .then((response) => {
      coinsPriceHandler(response.data);
    })
    .catch((error) => console.log(error));
}

MAIN_LOOP_INTERVAL = setInterval(tradeLoop, 1000);
SCHEDUALER_LOOP_INTERVAL = setInterval(checkSchedualer, 1000);

app.get("/", (req, res) => {
  let clock = new Date(Date.now());

  let time =
    clock.getHours() + ":" + clock.getMinutes() + ":" + clock.getSeconds();

  getMultipleTickerPrice(COINS_SYMBOL)
    .then((response) => {
      res.json({
        time,
        prices: response.data,
        BOTS,
      });
    })
    .catch((error) => console.log(error));
});

app.listen(port, () => {
  console.log(`API on port http://127.0.0.1:${port}`);
});
