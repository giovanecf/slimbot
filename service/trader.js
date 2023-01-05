import { response } from "express";
import {
  getMultipleTickerPrice,
  getAccountInfo,
  newOrder,
} from "./binance_api.js";

export function tradeLoop() {
  getMultipleTickerPrice(["BTCUSDT", "ETHUSDT", "BNBUSDT"])
    .then((response) => {
      coinPriceHandler(response);
    })
    .catch((error) => console.log(error));
}
