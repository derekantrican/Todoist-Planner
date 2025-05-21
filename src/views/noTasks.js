import { Typography } from "@mui/material";

export function NoTasksView() {
  return (
    <div style={{}}>
      {/*Todo: adjust styling*/}
      <Typography>
        No Tasks were found (if you were expecting tasks, you might want to check the filter in settings)
      </Typography>
    </div>
  )
}