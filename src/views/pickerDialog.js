import { useState } from "react";
import { todayWithTime } from "../helpers/utils";
import { Button, Dialog, DialogActions, DialogContent, Input } from "@mui/material";

export function PickerDialog(props) {
  const [result, setResult] = useState(null);

  const onSubmit = () => {
      props.resultHandler(result);
      props.onClose();
  };

  const setTimeResult = e => {
    const valParts = e.target.value.split(':');
    setResult(todayWithTime(valParts[0], valParts[1]));
  };

  const setDateResult = e => {
    const dateParts = e.target.value.split('-');
    setResult(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]));
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xl">
      <DialogContent>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          {/*Todo: timepicker & datetimepicker should be changed to the MUI implementations so we can easily change 24hr vs 12hr time based on settings.time_format */}
          {props.type === 'time' ?
            <Input style={{fontSize: '2rem'}} type="time" defaultValue="12:00" //Using noon as a default
              onChange={e => setTimeResult(e)}/> :
            <Input style={{fontSize: '2rem'}} type="date" defaultValue={new Date().yyyyMMdd()} //Using today as a default
              onChange={e => setDateResult(e)}/>
          }
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmit}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};