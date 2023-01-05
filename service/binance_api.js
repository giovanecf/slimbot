import { config } from "dotenv-safe";
import { encode } from "querystring";
import { createHmac } from "crypto";
import axios from "axios";

config();

const BASE_API_URL = "https://api.binance.com/";
const ACCOUNT_URL_BASE = "api/v3/account";
const ORDER_URL_BASE = "api/v3/order";

const TICKER_URL_BASE = "api/v3/ticker/price";

const apiKey = process.env.API_KEY; //"DGGYgObaAkg1Uia3vcMWhbSKid6P4cFTncTGVbxrFlHCbae8Ku7TtfsWqg9dF9ks";
const apiSecret = process.env.SECRET_KEY; //"H7apSut4o7F0imKeQhbiOwpUB8IcTdhRe2jX9IEi6IDwy6xDM3I2A48poQkZTBiz"

function publicCall(path, data, data_parsed = false, method = "GET") {
  let parsed_data = data;

  if (!data_parsed) parsed_data = encode({ ...data });

  return axios({
    method,
    url: `${BASE_API_URL}${path}?${parsed_data}`,
  });
}

function getPrivateCall(path, data, data_parsed = false, method = "GET") {
  const timestamp = Date.now();

  let parsed_data = data;

  const signature = createHmac("sha256", apiSecret)
    .update(`${encode({ ...data, timestamp })}`)
    .digest("hex");

  if (!data_parsed)
    parsed_data = `${encode({ ...data, timestamp, signature })}`;

  return axios({
    method,
    url: `${BASE_API_URL}${path}?${parsed_data}`,
    headers: { "X-MBX-APIKEY": apiKey },
  });
}

export function getMultipleTickerPrice(symbols) {
  const data = `symbols=[${symbols.map((item) => `"${item}"`).toString()}]`;

  return publicCall(TICKER_URL_BASE, data, true); //api.get(TICKER_URL_BASE + "?" + data);
}

export function getTickerPrice(symbol) {
  return publicCall(TICKER_URL_BASE, { symbol }); //api(TICKER_URL_BASE + "?" + data);
}

export function getAccountInfo(data = {}) {
  return getPrivateCall(ACCOUNT_URL_BASE, data);
}

export function newOrder(
  symbol,
  quantity,
  side,
  price = null,
  type = "MARKET"
) {
  const data = {
    symbol,
    side,
    type: "MARKET",
    quantity,
  };

  if (price) data["price"] = price;
  if (type === "LIMIT") data["timeInForce"] = "GTC";
  console.log("\n\n\n\n\n\n\n\ndata antes de enviar", data);

  return getPrivateCall(ORDER_URL_BASE, data, false, "POST");
}
