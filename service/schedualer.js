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

export default function checkSchedualer(daylyFunc, hourlyFunc) {
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
    daylyFunc();
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
    hourlyFunc();
  }
}
