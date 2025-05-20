import { Button, Input, Typography } from '@mui/material';
import React from 'react';

function SettingsRow(props) {
  //Todo: this could look better. Maybe a groupbox-type view?
  //Todo: need to set value
  //Todo: need to handle updating value in settings object
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 10}}>
      <Typography>{props.displayName}</Typography>
      <Input sx={{flexGrow: 1}} onChange={props.onChange}/>
    </div>
  )
}

// Settings view:
// - Ability to change the filter query (default: 'today | overdue') for what tasks to use in this app
// - Default day of the week for "next week" reschedules
// - (maybe) Whether the "Today" times should be 24 hr or 12 hr time
// - (maybe) ability to customize the time options for "today" reschedules
// - (optional) default labels to apply for "today" tasks and "other" (not today) tasks

export function SettingsView() {
  const saveSettings = () => {
    //Todo: update values in local storage (and refresh page?)
  }

  return (
    <React.Fragment>
      <div style={{width: 'calc(100% - 30px)', height: '100%', display: 'flex', flexDirection: 'column', padding: 15}}>
        <Typography variant='h4' sx={{alignSelf: 'center'}}>Settings</Typography>
        <SettingsRow displayName='Todoist API Key' onChange={e => console.log(e.target.value)}/>{/*Todo: this should be an "auto todoist" button that follows the auth flow: https://developer.todoist.com/guides/#authorization*/}
        <SettingsRow displayName='Task filter'/>
        <SettingsRow displayName='First day of week'/>{/*Todo: this should be a dropdown*/}{/*Todo: maybe we can get this from the todoist user settings*/}
        <SettingsRow displayName='Time format'/>{/*Todo: this should be a toggle switch*/}
        <SettingsRow displayName='"Today" label to apply'/>
        <SettingsRow displayName='"Tomorrow" label to apply'/>
        <SettingsRow displayName='"Other" label to apply'/>
        <Button variant='contained' sx={{marginTop: 'auto'}} onClick={saveSettings}>Save</Button>
        <a style={{marginTop: 5, alignSelf: 'end'}} href='https://ko-fi.com/E1E5RZJY' target='_blank' rel='noreferrer'>
          <img height='36' style={{border: 0, height: 36}} src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' />
        </a>
      </div>
    </React.Fragment>
  );
}