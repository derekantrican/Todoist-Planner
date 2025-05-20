import { useEffect } from "react";
import { Typography } from "@mui/material";

export function FinalMessage() {
  const messageLines = [
    "TODAY",
    "IS THE",
    "DAY!",
  ];

  useEffect(() => {
    (function() {
      var items = Array.from(document.getElementById('final-message').children);
      items.forEach((e, i) => setTimeout(() => e.style.visibility = 'visible', 500 * i));
    })();
  }, []);

  return (
    <div id="final-message" style={{marginTop: 'auto', marginBottom: 'auto'}}>
      {messageLines.map(line =>
        <Typography key={line} style={{visibility: 'hidden'}} variant="h3" sx={{color: 'deepskyblue'}}>{line}</Typography>
      )}
    </div>
  )
}