import { CircularProgress, Typography } from "@mui/material";

export function LoadingView() {
  return (
    <div style={{margin: 'auto'}}>
      <CircularProgress size="10rem" sx={{}}/>
      <Typography sx={{marginTop: 10}}>Getting your tasks...</Typography>
    </div>
  );
}