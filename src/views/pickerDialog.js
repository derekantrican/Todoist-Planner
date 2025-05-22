import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { TimePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { settings } from "../helpers/settings";

export function PickerDialog(props) {
  const [result, setResult] = useState(null);

  const onSubmit = () => {
      props.resultHandler(result);
      props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xl">
      <DialogContent>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {props.type === 'time' ?
              <TimePicker ampm={settings?.time_format === 12} defaultValue={dayjs(new Date())} onChange={e => setResult(e.toDate())}/> :
              <DateTimePicker ampm={settings?.time_format === 12} defaultValue={dayjs(new Date())} onChange={e => setResult(e.toDate())}/>
            }
          </LocalizationProvider>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmit}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};