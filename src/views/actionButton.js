import { Button, IconButton, Typography } from "@mui/material";

export function ActionButton(props) {
  return (
    <div style={{margin: props.margin ?? '5px', display: 'flex', flexDirection: 'column'}}>
      <IconButton color={props.color} onClick={props.onClick} disabled={!props.enabled}>
        <i style={{fontSize: props.size ?? 60}} className={`bi bi-${props.icon}`}/>
      </IconButton>
      <Typography sx={{textAlign: 'center'}}>{props.text}</Typography>
    </div>
  );
}

export function TextActionButton(props) {
  return (
    <div style={{margin: props.margin ?? '5px 10px', display: 'flex', flexDirection: 'column'}}>
      <Button sx={{fontSize: props.size ?? 60, padding: 0, lineHeight: 1.4, minWidth: 0}} color={props.color} onClick={props.onClick} disabled={!props.enabled}>
        {props.innerText}
      </Button>
      <Typography sx={{textAlign: 'center'}}>{props.text}</Typography>
    </div>
  );
}