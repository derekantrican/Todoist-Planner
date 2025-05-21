import { useEffect, useRef, useState } from "react";
import { Typography } from "@mui/material";
import { randomInt } from "../helpers/utils";

export function FinalMessage() {
  const messages = [
    ["TODAY", "IS THE", "DAY!"],
    ["YOU", "GOT", "THIS!"],
    ["NOTHING", "CAN", "STOP", "YOU!"],
  ];

  const ref = useRef(null);
  const [chosenMessage] = useState(() => messages[randomInt(0, messages.length - 1)]);

  useEffect(() => {
    Array.from(ref.current.children).forEach((e, i) => {
      setTimeout(() => {
        e.style.visibility = 'visible';
      }, 500 * i);
    });
  }, []);

  return (
    <div ref={ref} id="final-message" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      {chosenMessage.map((line, index) => (
        <Typography key={index} style={{ visibility: 'hidden' }} variant="h3" sx={{ color: 'deepskyblue' }}>
          {line}
        </Typography>
      ))}
    </div>
  );
}