import { useEffect, useRef, useState } from "react";
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
        <h3 key={index} style={{ visibility: 'hidden', color: 'deepskyblue', fontSize: 48, fontWeight: 400, lineHeight: 1.167 }}>
          {line}
        </h3>
      ))}
    </div>
  );
}