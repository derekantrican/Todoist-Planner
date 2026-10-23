import { alpha, IconButton, Typography, useTheme } from "@mui/material";

//A round, tinted button with a caption underneath. Shows either a bootstrap icon or short text (e.g. an hour like "10")
export function ActionButton(props) {
  const color = useTheme().palette[props.color].main;
  const diameter = props.small ? 48 : 60;

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: diameter + 10}}>
      <IconButton onClick={props.onClick} disabled={!props.enabled}
        sx={{
          width: diameter,
          height: diameter,
          color: color,
          bgcolor: alpha(color, 0.14),
          '&:hover': {bgcolor: alpha(color, 0.24)},
          '&.Mui-disabled': {color: color, opacity: 0.4},
        }}>
        {props.icon ?
          <i style={{fontSize: props.small ? 20 : 24}} className={`bi bi-${props.icon}`}/> :
          <span style={{fontSize: 18, fontWeight: 700}}>{props.innerText}</span>
        }
      </IconButton>
      <Typography variant='caption' sx={{fontWeight: 600, textAlign: 'center', lineHeight: 1.2}}>{props.text}</Typography>
    </div>
  );
}
