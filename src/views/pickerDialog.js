import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { settings } from "../helpers/settings";
import { todayPlusDays } from "../helpers/utils";

const pad = n => n.toString().padStart(2, '0');
const toTimeValue = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

//Quick picks shown as chips above the input
function timeChoices() {
  return [30, 60, 120, 180].map(minutes => ({
    label: minutes < 60 ? `In ${minutes} min` : `In ${minutes / 60} hour${minutes > 60 ? 's' : ''}`,
    value: toTimeValue(new Date(Date.now() + minutes * 60 * 1000)),
  }));
}

function dateChoices() {
  var today = new Date();
  var daysUntilSaturday = ((6 - today.getDay() + 7) % 7) || 7;
  var nextMonth = todayPlusDays(0);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return [
    {label: 'This weekend', value: todayPlusDays(daysUntilSaturday).yyyyMMdd()},
    {label: 'In 2 weeks', value: todayPlusDays(14).yyyyMMdd()},
    {label: 'Next month', value: nextMonth.yyyyMMdd()},
    {label: 'In 3 months', value: todayPlusDays(91).yyyyMMdd()},
  ];
}

//Open the phone's own picker as soon as the input is tapped (rather than requiring a tap on the small picker icon)
const openNativePicker = (e) => {
  try {
    e.target.showPicker();
  }
  catch {} //Not supported in every browser - the input still works without it
};

//Bottom sheet for picking a custom time today ('time') or a day in the future ('date')
export function PickerDialog(props) {
  const dialogRef = useRef(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const isTime = props.type === 'time';
  const accent = isTime ? 'var(--success)' : 'var(--warning)';

  useEffect(() => {
    if (props.open) {
      //Start fresh each time the sheet opens
      var nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0);
      setTime(isTime ? toTimeValue(nextHour) : '');
      setDate('');
      dialogRef.current.showModal();
    }
    else if (dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [props.open, isTime]);

  var result = null;
  if (isTime ? time : date) {
    var [year, month, day] = (isTime ? new Date().yyyyMMdd() : date).split('-').map(Number);
    var [hour, minute] = time ? time.split(':').map(Number) : [0, 0];
    result = new Date(year, month - 1, day, hour, minute);
  }

  var timeText = result && time ? dayjs(result).format(settings?.time_format === 24 ? 'HH:mm' : 'h:mm A') : null;
  var resultDescription = !result ? 'No day picked yet' :
    isTime ? `Today at ${timeText}` :
    dayjs(result).format('dddd, MMM D') + (timeText ? ` at ${timeText}` : '');

  const onSubmit = () => {
    props.resultHandler({date: result, hasTime: !!time}); //An empty time means "no time" (even 00:00 counts as a time)
    props.onClose();
  };

  const choices = isTime ? timeChoices() : dateChoices();
  const selectedValue = isTime ? time : date;

  return (
    <dialog ref={dialogRef} className='sheet' style={{'--accent': accent}}
      onCancel={e => { e.preventDefault(); props.onClose(); }}
      onClick={e => { if (e.target === dialogRef.current) props.onClose(); /*Tapped the backdrop*/ }}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 20px 20px'}}>
        <div className='sheetHandle'/>
        <div>
          <h2 style={{fontSize: 22, fontWeight: 700}}>{isTime ? 'Pick a time' : 'Pick a day'}</h2>
          <p className='secondary small'>{isTime ? 'Schedule this task for later today' : 'Push this task out to a future day'}</p>
        </div>

        <div className='chips'>
          {choices.map(c =>
            <button key={c.label} type='button' className={`chip${c.value === selectedValue ? ' selected' : ''}`}
              onClick={() => isTime ? setTime(c.value) : setDate(c.value)}>
              {c.label}
            </button>
          )}
        </div>

        {isTime ?
          <input type='time' className='pickerInput' value={time} onChange={e => setTime(e.target.value)} onClick={openNativePicker}/> :
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <input type='date' className='pickerInput' value={date} min={todayPlusDays(1).yyyyMMdd()}
              onChange={e => setDate(e.target.value)} onClick={openNativePicker}/>
            <label style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <span className='secondary small' style={{flexShrink: 0}}>Time (optional)</span>
              <input type='time' className='pickerInput' style={{fontSize: 16, padding: '8px 12px', minWidth: 0}} value={time}
                onChange={e => setTime(e.target.value)} onClick={openNativePicker}/>
            </label>
          </div>
        }

        <p style={{textAlign: 'center', fontWeight: 600, color: result ? accent : 'var(--text-secondary)'}}>
          {resultDescription}
        </p>

        <div style={{display: 'flex', gap: 8}}>
          <button type='button' className='textButton' style={{flex: 1, color: 'var(--text-secondary)'}} onClick={props.onClose}>Cancel</button>
          <button type='button' className='primaryButton' style={{flex: 2, backgroundColor: accent}} disabled={!result} onClick={onSubmit}>
            Schedule
          </button>
        </div>
      </div>
    </dialog>
  );
};
